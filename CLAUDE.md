# CLAUDE.md

This is a Hexo static blog site for Yanni4night, deployed to GitHub Pages.

## Key Commands

| Command            | Purpose                               |
| ------------------ | ------------------------------------- |
| `npm run build`    | Build static site into `_site/`       |
| `npm run server`   | Start local dev server (hot reload)   |
| `npm run clean`    | Remove generated files (`_site/`)     |
| `npm run deploy`   | Deploy to `gh-pages` branch via Git   |
| `npm test`         | Run smoke test (builds then verifies) |
| `npm run lint`     | ESLint + Prettier check               |
| `npm run lint:fix` | Auto-fix lint and formatting          |

## Architecture

- **SSG:** Hexo 7.x with NexT theme (scheme: Muse)
- **Config split:** `_config.yml` (Hexo site config) and `_config.next.yml` (theme config). The theme config is large and auto-generated — avoid modifying it unless you understand NexT theme internals.
- **Content:** All posts live in `source/_posts/`, named `YYYY-MM-DD-slug.md`. Images go in `source/images/`.
- **Scaffolds:** `scaffolds/post.md` is the template for new posts (`hexo new post "title"`).
- **Build output:** `_site/` — never edit this directory directly.
- **Language:** zh-CN (Chinese), timezone Asia/Shanghai.

## Post Frontmatter

```yaml
---
title: { { title } }
date: { { date } }
tags:
---
```

To create a new post: `npx hexo new post "your-title"` — this generates `source/_posts/YYYY-MM-DD-your-title.md` using the scaffold.

## CI/CD

- **Deploy:** Push to `master` triggers GitHub Actions to build and deploy to GitHub Pages (`gh-pages` branch). Managed by `.github/workflows/deploy.yml`.
- **PR CI:** Pull requests to `master` run lint and test. Managed by `.github/workflows/ci.yml`.
- **Dependabot:** Daily minor/patch updates (`.github/dependabot.yml`).

## Code Style

- **Prettier:** No semicolons, single quotes, trailing commas, 100 char width, 2-space indentation.
- **ESLint:** Flat config (`eslint.config.mjs`), recommended rules + Prettier integration.
- Both linters ignore `node_modules/`, `_site/`, `public/`, `.deploy*/`.

## Constraints

- Do not edit files inside `_site/` — it's build output that gets regenerated.
- The `_config.next.yml` theme config is managed by the NexT theme. Be cautious when modifying it.
- `_config.yml` has `skip_render` for specific posts — check before changing rendering behavior.
- Content is in Chinese (zh-CN); respect the language when editing posts or UI text.
- The site URL is `https://yanni4night.github.io` — links should use this as base.
