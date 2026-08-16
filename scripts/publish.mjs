import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const API_BASE = "https://dev.to/api";
const ARTICLES_DIR = "articles";
const STATE_PATH = ".devto-state.json";
const API_KEY = process.env.DEVTO_API_KEY;
const MAX_RATE_LIMIT_RETRIES = 20;
const DEFAULT_RATE_LIMIT_WAIT_MS = 31_000;

if (!API_KEY) {
  throw new Error("DEVTO_API_KEY is required");
}

const files = await findMarkdownFiles(ARTICLES_DIR);
const state = await readState();
const remoteArticles = await request("/articles/me/all?per_page=1000", "GET");
const remoteByArticleKey = new Map(
  remoteArticles.map((article) => [articleKey(article.title, article.description), article]),
);

for (const file of files) {
  const source = await readFile(file, "utf8");
  const relativePath = file.split(path.sep).join("/");
  const hash = createHash("sha256").update(source).digest("hex");
  const previous = state[relativePath];

  if (previous?.hash === hash) {
    console.log(`skip   ${relativePath}`);
    continue;
  }

  const { metadata, body } = parseArticle(source, relativePath);
  const key = articleKey(metadata.title, metadata.description);
  const recovered = metadata.devto_id == null && previous?.id == null
    ? remoteByArticleKey.get(key)
    : null;
  const articleId = metadata.devto_id ?? previous?.id ?? recovered?.id;
  const article = toApiArticle(metadata, body);

  if (recovered) {
    console.log(`recover ${relativePath} -> ${recovered.url ?? `DEV.to #${recovered.id}`}`);
  }

  const result = articleId
    ? await request(`/articles/${articleId}`, "PUT", { article })
    : await request("/articles", "POST", { article });

  remoteByArticleKey.set(key, result);

  state[relativePath] = {
    id: result.id,
    url: result.url ?? previous?.url ?? recovered?.url ?? null,
    hash,
    published: metadata.published,
    zenn_published_at: metadata.zenn_published_at ?? previous?.zenn_published_at ?? null,
    synced_at: new Date().toISOString(),
  };

  await writeState(state);
  console.log(`${articleId ? "update" : "create"} ${relativePath} -> ${result.url ?? `DEV.to #${result.id}`}`);
}

async function findMarkdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const found = [];

  for (const entry of entries) {
    if (entry.name.startsWith("_")) continue;

    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      found.push(...(await findMarkdownFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".md")) {
      found.push(fullPath);
    }
  }

  return found.sort();
}

async function readState() {
  try {
    return JSON.parse(await readFile(STATE_PATH, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return {};
    throw error;
  }
}

async function writeState(state) {
  await writeFile(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function articleKey(title, description) {
  return `${title ?? ""}\u0000${description ?? ""}`;
}

function parseArticle(source, file) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);

  if (!match) {
    throw new Error(`${file}: YAML-style front matter is required`);
  }

  const metadata = {};

  for (const rawLine of match[1].split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separator = line.indexOf(":");
    if (separator === -1) {
      throw new Error(`${file}: invalid front matter line: ${rawLine}`);
    }

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    metadata[key] = parseScalar(value);
  }

  if (!metadata.title || typeof metadata.title !== "string") {
    throw new Error(`${file}: title is required`);
  }

  metadata.published = metadata.published ?? false;
  if (typeof metadata.published !== "boolean") {
    throw new Error(`${file}: published must be true or false`);
  }

  metadata.tags = parseTags(metadata.tags);
  if (metadata.tags.length > 4) {
    throw new Error(`${file}: DEV.to supports at most 4 tags`);
  }

  if (metadata.devto_id != null && !Number.isInteger(metadata.devto_id)) {
    throw new Error(`${file}: devto_id must be an integer`);
  }

  if (metadata.zenn_published_at != null && typeof metadata.zenn_published_at !== "string") {
    throw new Error(`${file}: zenn_published_at must be an ISO 8601 date/time string`);
  }

  return {
    metadata,
    body: source.slice(match[0].length),
  };
}

function parseScalar(value) {
  if (value === "" || value === "null" || value === "~") return null;
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^-?\d+$/.test(value)) return Number(value);

  if (value.startsWith('"') && value.endsWith('"')) {
    return JSON.parse(value);
  }

  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replaceAll("''", "'");
  }

  return value;
}

function parseTags(value) {
  if (value == null || value === "") return [];
  if (typeof value !== "string") {
    throw new Error("tags must be a comma-separated string");
  }

  const normalized = value.startsWith("[") && value.endsWith("]")
    ? value.slice(1, -1)
    : value;

  return normalized
    .split(",")
    .map((tag) => tag.trim().replace(/^['\"]|['\"]$/g, ""))
    .filter(Boolean);
}

function toApiArticle(metadata, body) {
  const article = {
    title: metadata.title,
    body_markdown: body,
    published: metadata.published,
    tags: metadata.tags.join(","),
  };

  for (const key of ["description", "series", "main_image", "canonical_url"]) {
    if (metadata[key] != null && metadata[key] !== "") {
      article[key] = metadata[key];
    }
  }

  return article;
}

async function request(endpoint, method, body = null, attempt = 0) {
  const headers = {
    "api-key": API_KEY,
    Accept: "application/vnd.forem.api-v1+json",
    "User-Agent": "KentaroMorishita/devto-content GitHub Actions",
  };

  if (body != null) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    ...(body == null ? {} : { body: JSON.stringify(body) }),
  });

  if (response.status === 429 && attempt < MAX_RATE_LIMIT_RETRIES) {
    const details = await response.text();
    const waitMs = rateLimitWaitMs(response);
    console.warn(
      `${method} ${endpoint} rate-limited (429); retrying in ${Math.ceil(waitMs / 1000)}s${details ? `: ${details}` : ""}`,
    );
    await sleep(waitMs);
    return request(endpoint, method, body, attempt + 1);
  }

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`${method} ${endpoint} failed (${response.status}): ${details}`);
  }

  return response.json();
}

function rateLimitWaitMs(response) {
  const retryAfter = response.headers.get("retry-after");

  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) {
      return Math.max(1_000, seconds * 1_000 + 1_000);
    }

    const retryAt = Date.parse(retryAfter);
    if (!Number.isNaN(retryAt)) {
      return Math.max(1_000, retryAt - Date.now() + 1_000);
    }
  }

  const reset = Number(response.headers.get("x-ratelimit-reset"));
  if (Number.isFinite(reset) && reset > 0) {
    const resetAt = reset > 1_000_000_000_000 ? reset : reset * 1_000;
    return Math.max(1_000, resetAt - Date.now() + 1_000);
  }

  return DEFAULT_RATE_LIMIT_WAIT_MS;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
