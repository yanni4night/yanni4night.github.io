---
name: agnes-image
description: Generate images with the Agnes Image 2.1 Flash model and save them into the blog's images directory
trigger: When the user wants to generate an image with Agnes (text-to-image or image-to-image), create a cover image for a post, or call the agnes-image-2.1-flash model
---

# Agnes Image Skill

Generate images with **Agnes Image 2.1 Flash** (`agnes-image-2.1-flash`) and save them under `source/images/<slug>/` so they can be referenced from a blog post.

Both **text-to-image** and **image-to-image** are supported through the same endpoint. Output is captured as Base64 and decoded to disk so the file survives even if the hosted URL expires.

## Prerequisites

- `curl`, `jq`, and `base64` must be available (standard on macOS).
- `AGNES_API_KEY` must be set in the environment.

Check it up front:

```bash
[ -n "$AGNES_API_KEY" ] || echo "AGNES_API_KEY is not set"
```

If unset, ask the user to `export AGNES_API_KEY=...` in their shell (or persist it via Claude Code's settings `env` block). **Never** echo the key, log it, or write it to disk.

## Workflow

### Step 1: Pick mode

Ask the user:

```text
Text-to-image or image-to-image? (t/i, default t)
```

For **image-to-image**, ask for one or more input images. Each input can be either:

- A public HTTPS URL (no auth, no cookies), or
- A local file path — convert it to a Data URI inline:

  ```bash
  ext="${path##*.}"
  case "$ext" in
    png)        mime=image/png ;;
    jpg|jpeg)   mime=image/jpeg ;;
    webp)       mime=image/webp ;;
    gif)        mime=image/gif ;;
    *)          mime=application/octet-stream ;;
  esac
  data_uri="data:${mime};base64,$(base64 -i "$path")"
  ```

Collect all inputs into a JSON array, e.g. `["https://example.com/a.png", "data:image/png;base64,..."]`.

### Step 2: Collect prompt

Accept Chinese or English. For **image-to-image**, remind the user to describe **what to change** and **what to preserve**, e.g.:

> Transform the scene into a rain-soaked cyberpunk night with neon reflections **while preserving the original composition and main subject layout.**

Recommended prompt structure for text-to-image:

```text
[Subject] + [Scene / Environment] + [Style] + [Lighting] + [Composition] + [Quality]
```

Example:

```text
A luminous floating city above a misty canyon at sunrise, cinematic realism,
wide-angle composition, rich architectural details, soft golden light, high visual density
```

### Step 3: Pick size

Default: `800x600`. Suggest:

- `800x600` (4:3, default)
- `1024x1024` (square)
- `1024x768` / `768x1024` (4:3)
- `1280x720` (16:9)
- `1536x1024` (3:2 landscape)

Accept any `WxH` the user types.

### Step 4: Pick save target (inferred, then confirmed)

The skill saves the image under `source/images/<slug>/<filename>`. Infer `<slug>` in this order — **stop at first hit**:

1. **IDE active selection / open file** — if the conversation context (e.g. `ide_selection`) points at `source/_posts/YYYY-MM-DD-<slug>.md`, extract `<slug>` from the filename (strip date prefix and `.md`).
2. **Recently-touched post in this turn** — if a `source/_posts/...md` file was Read/Edited/Written earlier in this conversation, use its slug.
3. **Most recently modified post on disk** — fallback:

   ```bash
   ls -t source/_posts/*.md | head -1
   ```

   Then strip the `YYYY-MM-DD-` prefix and `.md` suffix.

4. **No post found** — ask the user for a slug directly.

Default filename:

- A kebab-case slug derived from the first 4–5 ASCII words of the prompt, e.g. prompt `"A luminous floating city at sunrise"` → `luminous-floating-city.png`.
- If the prompt is non-Latin or too short, use `agnes-$(date +%s).png`.
- Always `.png` (the model returns PNG bytes).

**Always confirm with the user before writing**, even when inference succeeds. Show the full inferred path:

```text
Save to source/images/<slug>/<filename>.png?
(Press enter to accept, or type a different path.)
```

If the user provides a different path, use it verbatim (but warn if it's outside `source/images/`). `mkdir -p` the parent directory before writing. Store the confirmed path in `$OUT_PATH` for the rest of the workflow.

### Step 5: Build and send the request

Use `extra_body.response_format = "b64_json"` for both modes — this captures the image locally and avoids depending on the hosted URL.

Build the JSON safely with `jq -n` so prompts with quotes/newlines don't break shell escaping:

```bash
# IMAGES_JSON is the JSON literal "null" for text-to-image, or a JSON array for image-to-image
jq -n \
  --arg model "agnes-image-2.1-flash" \
  --arg prompt "$PROMPT" \
  --arg size "$SIZE" \
  --argjson images "$IMAGES_JSON" \
  '{
    model: $model,
    prompt: $prompt,
    size: $size,
    extra_body: (
      { response_format: "b64_json" }
      + (if $images == null then {} else { image: $images } end)
    )
  }' > /tmp/agnes-payload.json
```

Send it:

```bash
curl --max-time 360 -sS \
  -X POST https://apihub.agnes-ai.com/v1/images/generations \
  -H "Authorization: Bearer $AGNES_API_KEY" \
  -H "Content-Type: application/json" \
  -d @/tmp/agnes-payload.json \
  > /tmp/agnes-response.json
```

Decode and write the raw PNG. **Path conventions used by the rest of the workflow:**

- `$OUT_PATH` — the final path the user agreed to in Step 4, e.g. `source/images/<slug>/<name>.png`. The extension may change in Step 6 (`.webp` / `.jpg`).
- `$RAW_PATH` — the uncompressed PNG written here. Always set this to `${OUT_PATH%.*}.png` so Step 6 can find it.

```bash
RAW_PATH="${OUT_PATH%.*}.png"

err=$(jq -r '.error // empty' /tmp/agnes-response.json)
if [ -n "$err" ]; then
  echo "Agnes API error: $err"
  jq . /tmp/agnes-response.json
  exit 1
fi

jq -r '.data[0].b64_json' /tmp/agnes-response.json | base64 -d > "$RAW_PATH"
```

The model returns a PNG, typically 1–2 MB and oversized (e.g. 1152×864 even when `size` was `800x600` — `agnes-image-2.1-flash` treats `size` as an aspect-ratio hint, not a hard constraint). Write it to a temporary `<name>.png` first, then compress it in Step 6.

Clean up the temp payload and response files after a successful write (they may contain the prompt; the response contains the image).

### Step 6: Compress the image

The blog already standardizes on small post-image files (e.g. [book.webp](../../source/images/reading-guiyou-ben-stone-story/book.webp) at ~100 KB). Compress the raw PNG before keeping it.

**Tool choice — auto-detect, prefer in this order:**

1. `cwebp` (Google's WebP encoder) — best ratio, smallest files; matches the existing `.webp` convention in [source/images/](../../source/images/). Install via `brew install webp` if missing.
2. `magick` / `convert` (ImageMagick) — also writes WebP. Install via `brew install imagemagick`.
3. **macOS built-in `sips`** — always available, but on macOS 26 cannot write WebP. Falls back to **JPEG** at quality 85.

Detect what's available:

```bash
if command -v cwebp >/dev/null;        then COMPRESSOR=cwebp
elif command -v magick >/dev/null;     then COMPRESSOR=magick
elif command -v convert >/dev/null;    then COMPRESSOR=imagemagick
else                                        COMPRESSOR=sips
fi
echo "Using $COMPRESSOR"
```

**Target dimensions:** resize so the longer edge is **1024 px** (covers display on retina screens without bloating the repo). Skip resize if the source is already ≤ 1024 px.

**Per-tool commands** (`RAW_PATH` is the PNG from Step 5, `OUT_PATH` is the final compressed file):

```bash
# cwebp → .webp, quality 80
cwebp -q 80 -resize 1024 0 "$RAW_PATH" -o "${OUT_PATH%.*}.webp"

# magick → .webp, quality 80
magick "$RAW_PATH" -resize '1024x1024>' -quality 80 "${OUT_PATH%.*}.webp"

# sips → .jpg, quality 85 (fallback when no webp encoder)
sips --setProperty format jpeg \
     --setProperty formatOptions 85 \
     --resampleWidth 1024 \
     "$RAW_PATH" --out "${OUT_PATH%.*}.jpg" >/dev/null
```

After compression succeeds and the output file is nonzero, **delete the raw PNG**:

```bash
rm "$RAW_PATH"
```

Print a one-line summary: original size → compressed size, e.g. `1.6 MB → 287 KB (-82%)`.

The final `$OUT_PATH` extension may change from `.png` to `.webp` or `.jpg` depending on the tool — record the real path used and pass it to Step 7.

### Step 7: Auto-insert into the post

If a post file was inferred in Step 4 (or the user supplied one), **insert an `<img>` tag into it automatically** instead of just offering. The blog already uses inline HTML for images (see line 16 of [2026-06-23-reading-guiyou-ben-stone-story.md](../../source/_posts/2026-06-23-reading-guiyou-ben-stone-story.md)) — match that style **and always include a `width` attribute** so the image doesn't blow out the column:

```markdown
<img src="/images/<slug>/<filename>" alt="<alt-text>" width="400" />
```

**Width default — pick by orientation** (the raw PNG dimensions came from Step 5):

| Orientation                 | Default `width` | Examples in the repo                                                                                                                                              |
| --------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Landscape / square          | `500`           | —                                                                                                                                                                 |
| Portrait (taller than wide) | `400`           | matches [book.webp](../../source/images/reading-guiyou-ben-stone-story/book.webp) usage                                                                           |
| Inline icon / QR-code-sized | `200`–`300`     | [wx.png usage](../../source/_posts/2026-06-23-reading-guiyou-ben-stone-story.md#L10), [human-chair renou.jpg](../../source/_posts/2024-02-05-human-chair.md#L233) |

These are pixel hints, not hard limits — NexT's content column is roughly 700 px wide on desktop, so anything > 600 risks edge-to-edge sprawl. **Never omit `width`**: without it, large source PNGs (e.g. 864×1152 from Agnes) render at intrinsic size and dominate the page. The user surfaced this on 2026-06-23 — first version of the skill emitted a width-less `<img>` and the rendered image filled the entire column.

If the user has a strong preference, ask before applying — but ship a width by default.

**Alt text:** ask the user for a short Chinese caption (1 line). If they skip, default to the prompt-derived slug with spaces, e.g. `xifeng-reading-medical-book` → `Xifeng reading medical book`.

**Insertion point:**

1. **If the user has an active IDE selection** in the post (`ide_selection` lines L_start–L_end), insert the `<img>` tag on its own line **immediately after line L_end**, separated from neighboring content by a blank line above and below.
2. **Otherwise**, ask the user where to insert. Offer two quick choices:
   - "After line N" — they type a line number.
   - "At the end of the post" — appended before any trailing blank lines.

Use the `Edit` tool to make the change. The exact string to match comes from reading the file first; the new string adds the blank-line-padded `<img>` tag. Example for inserting after a paragraph:

```text
old: <paragraph text>\n\n<next paragraph>
new: <paragraph text>\n\n<img src="..." alt="..." width="400" />\n\n<next paragraph>
```

If a markdown linter flags `MD033/no-inline-html`, **ignore it** — the project consistently uses inline `<img>` tags for sizing/layout control.

### Step 8: Confirm

Print:

- Final image path (absolute and relative).
- Compression summary (raw size → final size).
- The line range where the `<img>` tag was inserted, e.g. "Inserted at [post.md:44](../../source/_posts/...md#L44)".

Offer to run `npm run build` to verify the post still builds. Don't run it without asking.

## Common pitfalls (from the API docs)

1. **`response_format` must be inside `extra_body`**, not at the top level.

   Wrong:

   ```json
   { "model": "agnes-image-2.1-flash", "prompt": "...", "response_format": "url" }
   ```

   Right:

   ```json
   { "model": "agnes-image-2.1-flash", "prompt": "...", "extra_body": { "response_format": "url" } }
   ```

2. **Do not send `tags: ["img2img"]`.** Image-to-image is implied by the presence of `extra_body.image`.

3. **Input image URLs must be public HTTPS.** No auth, no cookies, no private headers. If the image isn't public, send it as a Data URI instead.

4. **Generation can take 60–360 seconds.** Set `curl --max-time 360` (or higher); don't rely on the default short timeout.

## Reference: the four documented call shapes

### 1. Text-to-image → URL

```bash
curl https://apihub.agnes-ai.com/v1/images/generations \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "agnes-image-2.1-flash",
    "prompt": "A luminous floating city above a misty canyon at sunrise, cinematic realism",
    "size": "1024x768",
    "extra_body": { "response_format": "url" }
  }'
# Output URL: data[0].url
```

### 2. Text-to-image → Base64

```bash
curl https://apihub.agnes-ai.com/v1/images/generations \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "agnes-image-2.1-flash",
    "prompt": "A clean product photo of a glass cube on a white studio background",
    "size": "1024x768",
    "return_base64": true
  }'
# Output Base64: data[0].b64_json
```

### 3. Image-to-image (URL input → URL output)

```bash
curl https://apihub.agnes-ai.com/v1/images/generations \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "agnes-image-2.1-flash",
    "prompt": "Transform the scene into a rain-soaked cyberpunk night with neon reflections while preserving the original composition and main subject layout",
    "size": "1024x768",
    "extra_body": {
      "image": ["https://example.com/input.png"],
      "response_format": "url"
    }
  }'
```

### 4. Image-to-image (Data URI input → Base64 output)

```bash
curl https://apihub.agnes-ai.com/v1/images/generations \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "agnes-image-2.1-flash",
    "prompt": "Make the object matte black while preserving the original composition",
    "size": "1024x768",
    "extra_body": {
      "image": ["data:image/png;base64,BASE64_HERE"],
      "response_format": "b64_json"
    }
  }'
```

## Response shape

```json
{
  "created": 1780000000,
  "data": [
    {
      "url": "https://storage.googleapis.com/agnes-aigc/xxx.png",
      "b64_json": null,
      "revised_prompt": null
    }
  ]
}
```

- URL output: `data[0].url`
- Base64 output: `data[0].b64_json`

## Quick Reference

| Item             | Value                                                    |
| ---------------- | -------------------------------------------------------- |
| Endpoint         | `POST https://apihub.agnes-ai.com/v1/images/generations` |
| Model            | `agnes-image-2.1-flash`                                  |
| Auth env var     | `AGNES_API_KEY`                                          |
| Default size     | `800x600`                                                |
| Default save dir | `source/images/<slug>/` (inferred, confirmed)            |
| Compressor       | `cwebp` > `magick` > `sips` -> `.jpg` (auto-detect)      |
| Auto-insert      | Yes, at IDE selection end or user-specified line         |
| Default timeout  | 360s                                                     |
| URL output path  | `data[0].url`                                            |
| Base64 path      | `data[0].b64_json`                                       |
| Docs             | <https://agnes-ai.com/doc/agnes-image-21-flash>          |
