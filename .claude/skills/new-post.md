---
name: new-post
description: Create a new blog post for the Hexo static site blog with interactive wizard
trigger: When the user wants to create a new blog post, write a new article, or start drafting content for the blog
---

# New Post Skill

Create a new blog post for the Hexo static site blog with a guided interactive workflow.

## Prerequisites

Before starting, confirm the user wants to create a new post. If they provide a title immediately, begin from Step 1.

## Workflow

### Step 1: Collect Post Title

Ask the user for the post title. Accept Chinese or English.

```
What's the title of the new post?
```

Record the title exactly as provided.

### Step 2: Generate Kebab-Case Slug

Convert the title into a lowercase kebab-case filename slug. **All existing posts use English-only slugs** — never use Chinese characters in filenames.

Slug generation rules:

1. **Strip leading date prefix** if present (e.g., `2026-01-06-` from `2026-01-06-leetcode-linked-list-cycle-ii`).
2. **For English titles:** Convert to lowercase, replace spaces/punctuation with hyphens, collapse multiple hyphens, strip leading/trailing hyphens.
3. **For Chinese titles:** Use pinyin or a brief English summary as the slug. Ask the user if they have a preferred slug. If not, suggest one based on the title meaning.
4. **For mixed titles:** Discard Chinese characters, use the Latin portion converted to lowercase kebab-case.

Slug examples:

- `"What I Learned From a Recent PR"` -> `what-i-learned-from-a-recent-pr`
- `"数学方法推导 leetcode 142 之环形链表 II"` -> `math-methods-leetcode-142-linked-list-cycle`
- `"有限身躯照彻无限深蓝——读海明威《老人与海》"` -> `reading-the-old-man-and-the-sea`

Then check for uniqueness (relative to `source/_posts/`):

```bash
ls source/_posts/*-{slug}.md 2>/dev/null
```

If a file with that slug already exists, append `-1`, `-2`, etc. until unique.

Construct the full filename: `{date}-{slug}.md` where `{date}` is today's date in `YYYY-MM-DD` format.

### Step 3: Select Category

Discover existing categories from posts:

```bash
grep -h '^categories:' source/_posts/*.md | sed 's/^categories: *//' | sort -u
```

Present the existing categories as a numbered list. Allow the user to:

- Pick an existing category by number
- Type a new category name
- Leave blank for `other`

Common categories from existing posts: `js`, `css`, `html`, `webcomponents`, `bug`, `performance`, `engineering`, `读书`, `other`.

### Step 4: Add Tags (Optional)

Ask if the user wants to add tags. Tags are rarely used, so this is optional. If provided, join multiple tags with commas. If not, leave tags empty in frontmatter.

### Step 5: Create the Post File

First, generate the post using Hexo:

```bash
npx hexo new post "title"
```

Hexo uses `new_post_name: :title.md` from `_config.yml`, so the generated filename will be based on the title (possibly with Chinese characters or special characters). **You must rename it to the slug you decided on in Step 2.**

For example, if the title is `读 《红楼梦脂评汇校本》` and the slug is `red-chamber-manuscript-criticism`:

```bash
mv "source/_posts/读-《红楼梦脂评汇校本》.md" "source/_posts/{date}-{slug}.md"
```

Then, modify the frontmatter to add `layout: post` and `categories:` (the scaffold does not include these).

Read the generated file, then use the Edit tool to transform the frontmatter:

**Target frontmatter format:**

```yaml
---
layout: post
title: "{title}"
date: {today} {HH}:{mm}:{ss} +0800
categories: {category}
tags:
---
```

Key rules:

- `layout: post` goes first (before title)
- `title:` uses double quotes around the title value
- `date:` uses format `YYYY-MM-DD HH:mm:ss +0800` — use current time or `00:00:00` as default
- `categories:` is a single value (no YAML array brackets)
- `tags:` stays empty if none provided
- Prettier rules: no semicolons, 100-char width, 2-space indentation

### Step 6: Create Image Directory

Create the image directory for the post:

```bash
mkdir -p source/images/{slug}/
```

Confirm creation to the user.

### Step 7: Add Image Placeholders (Optional)

Ask if the user wants image placeholder comments in the post body. If yes, insert after the frontmatter separator:

```markdown
<!-- Image placeholder: <img src="/images/{slug}/{filename}" /> -->
```

For book review posts that include the WeChat QR code, suggest adding:

```markdown
> <font size=1>本文整理自"莺见"微信公众号：<img src="/images/wx/wx.png" width="300" /></font>
```

### Step 8: Open File for Editing

Open the created post file in the workspace editor so the user can start writing immediately.

### Step 9: Build Verification (Optional)

Offer to run a quick build to verify the post integrates cleanly:

```bash
npm run build
```

If the build succeeds, confirm the post is ready. If it fails, report the error and help debug.

## Edge Cases

- **Duplicate slug:** Always check before creating. Append `-1`, `-2`, etc.
- **Special characters in title:** Handle em-dashes `——`, brackets `《》`, colons, etc. by converting to hyphens or removing.
- **Empty title:** Re-prompt the user.
- **Hexo not installed:** Run `npm install` first.
- **Build fails:** Report the error clearly. Common issues: malformed YAML frontmatter, unclosed HTML tags.

## Quick Reference

| Item             | Value                       |
| ---------------- | --------------------------- |
| Posts directory  | `source/_posts/`            |
| Images directory | `source/images/{slug}/`     |
| WeChat QR code   | `/images/wx/wx.png`         |
| Permalink        | `:year/:month/:day/:title/` |
| Timezone         | `+0800` (Asia/Shanghai)     |
| Hexo command     | `npx hexo new post "title"` |
| Build command    | `npm run build`             |
