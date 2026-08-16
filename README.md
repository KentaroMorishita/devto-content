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

## Articles

Put Markdown files under `articles/`.

```md
---
title: "Why Seseragi Has No return"
published: false
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
- `tags` — comma-separated, up to 4 tags
- `description`
- `series`
- `main_image`
- `canonical_url`
- `devto_id` — optional escape hatch for manually binding a file to an existing DEV.to article

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
