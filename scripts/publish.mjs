import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const API_BASE = "https://dev.to/api";
const ARTICLES_DIR = "articles";
const STATE_PATH = ".devto-state.json";
const API_KEY = process.env.DEVTO_API_KEY;

if (!API_KEY) {
  throw new Error("DEVTO_API_KEY is required");
}

const files = await findMarkdownFiles(ARTICLES_DIR);
const state = await readState();
let stateChanged = false;

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
  const articleId = metadata.devto_id ?? previous?.id;
  const article = toApiArticle(metadata, body);

  const result = articleId
    ? await request(`/articles/${articleId}`, "PUT", { article })
    : await request("/articles", "POST", { article });

  state[relativePath] = {
    id: result.id,
    url: result.url ?? previous?.url ?? null,
    hash,
    published: metadata.published,
    synced_at: new Date().toISOString(),
  };

  stateChanged = true;
  console.log(`${articleId ? "update" : "create"} ${relativePath} -> ${result.url ?? `DEV.to #${result.id}`}`);
}

if (stateChanged) {
  await writeFile(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

async function findMarkdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const found = [];

  for (const entry of entries) {
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

async function request(endpoint, method, body) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      "api-key": API_KEY,
      Accept: "application/vnd.forem.api-v1+json",
      "Content-Type": "application/json",
      "User-Agent": "KentaroMorishita/devto-content GitHub Actions",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`${method} ${endpoint} failed (${response.status}): ${details}`);
  }

  return response.json();
}
