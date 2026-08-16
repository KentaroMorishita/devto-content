# devto-content

English article sources published to [DEV Community](https://dev.to/).

## Workflow

```text
draft
  ↓
Pull Request
  ↓
main
  ↓
GitHub Actions
  ↓
DEV.to API
```

`main` is the publish source of truth. Write and review articles on `draft`, then merge them into `main`.

## Zenn correspondence

DEV.to articles are English counterparts of the existing Zenn articles.

- Keep a 1:1 correspondence between Zenn and DEV.to articles.
- Use the same article filename/slug when practical so the two repositories are easy to compare.
- Copy the Zenn publication date/time into `date`.
- The English article may adjust its title, introduction, examples, and phrasing for an international audience rather than being a literal translation.

## Articles

Put Markdown files under `articles/`.

```md
---
title: "Why Seseragi Has No return"
published: false
date: "2026-08-16T00:00:00+09:00"
tags: seseragi, programming, webdev
description: "An example description"
series:
main_image:
canonical_url:
---

Article body goes here.
```

Supported front matter:

- `title` — required
- `published` — `false` keeps the article as a DEV.to draft; `true` publishes it
- `date` — publication date/time copied from the corresponding Zenn article; use an ISO 8601 string
- `tags` — comma-separated, up to 4 tags
- `description`
- `series`
- `main_image`
- `canonical_url`
- `devto_id` — optional escape hatch for manually binding a file to an existing DEV.to article

The publisher forwards `date` through Forem article front matter so historical Zenn articles can preserve their original publication timing where DEV.to accepts it. Verify the first backdated publication before bulk publishing older articles.

## DEV.to API key

Create a repository Actions secret named:

```text
DEVTO_API_KEY
```

The workflow only uses the secret on pushes to `main` or manual workflow dispatches. Pull-request workflows do not receive or use the DEV.to API key.

If the secret is not configured yet, the workflow safely skips publishing.

## Publish state

`.devto-state.json` maps each source file to its DEV.to article ID and source hash. It is updated automatically by GitHub Actions so subsequent edits update the existing article instead of creating duplicates.

Do not edit it manually unless recovering a broken mapping.
