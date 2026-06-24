---
name: agnes-video
description: Generate videos with the Agnes Video v2.0 model and embed them into blog posts
trigger: When the user wants to generate a video with Agnes (text-to-video, image-to-video, multi-image video, or keyframe animation)
---

# Agnes Video Skill

Generate videos with **Agnes Video v2.0** (`agnes-video-v2.0`) and embed them into blog posts as `<video>` tags. Videos are saved under `source/images/<slug>/` so they can be referenced from a blog post.

## Prerequisites

- `curl`, `jq`, and `ffmpeg` (or `ffprobe`) must be available (standard on macOS via `brew install ffmpeg`).
- `AGNES_API_KEY` must be set in the environment.

Check it up front:

```bash
[ -n "$AGNES_API_KEY" ] || echo "AGNES_API_KEY is not set"
command -v curl >/dev/null || echo "curl not found"
command -v jq >/dev/null || echo "jq not found"
command -v ffmpeg >/dev/null || echo "ffmpeg not found"
```

If unset, ask the user to `export AGNES_API_KEY=...` in their shell. **Never** echo the key, log it, or write it to disk.

## Workflow

### Step 1: Pick mode

Ask the user:

```text
Video generation mode?
1) Text-to-Video — generate from a text prompt
2) Image-to-Video — animate a single image
3) Multi-Image Video — generate from multiple reference images
4) Keyframe Animation — smooth transition between keyframes
(1/2/3/4, default 1)
```

For **Image-to-Video**, ask for one input image.

For **Multi-Image Video** or **Keyframe Animation**, ask for two or more input images. Collect into a JSON array.

**Important: Image input format differs between Text-to-Video and Image-to-Video:**

- **Text-to-Video**: No image needed.
- **Image-to-Video / Multi-Image / Keyframe**: The API **does NOT accept Data URIs** (`data:image/png;base64,...`) — it will reject them with `Invalid image: Incorrect padding`. Instead, pass the **raw base64 string** (without the `data:image/...;base64,` prefix) directly as the `image` field. For multiple images, pass an array of raw base64 strings.

  To convert a local file to the required format:

  ```bash
  RAW_B64=$(base64 -i "$LOCAL_FILE" | tr -d '\n')
  # Use $RAW_B64 directly in the JSON payload, NOT as "data:image/png;base64,$RAW_B64"
  ```

### Step 2: Collect prompt

Accept Chinese or English. Recommended prompt structure for **Text-to-Video**:

```text
[Subject] + [Action] + [Scene] + [Camera Movement] + [Lighting] + [Style]
```

Example:

```text
A young astronaut walking across a red desert planet, dust blowing in the wind,
slow cinematic tracking shot, dramatic sunset lighting, realistic sci-fi style
```

For **Image-to-Video**, describe **what should move** and **what should stay stable**:

```text
Animate the character with subtle breathing motion, hair moving gently in the wind,
background lights flickering softly, while keeping the face and outfit consistent
```

For **Multi-Image Video**, describe the **relationship between images** and **transition style**:

```text
Use the first image as the starting scene and the second image as the target scene.
Create a smooth transformation with consistent lighting, natural motion, and cinematic pacing
```

For **Keyframe Animation**, describe the **transition relationship** between keyframes:

```text
Create a smooth transition from the first keyframe to the second keyframe,
maintaining character identity, consistent camera angle, and natural motion between scenes
```

### Step 3: Pick parameters

**Aspect ratio** (defaults to 16:9 landscape):

| Ratio | Preset (W×H)   | Typical use                                  |
| ----- | -------------- | -------------------------------------------- |
| 16:9  | `width: 1152`  | Horizontal video, demos, YouTube             |
|       | `height: 768`  |                                              |
| 9:16  | `width: 576`   | Vertical short-form, TikTok / Reels / Shorts |
|       | `height: 1024` |                                              |
| 1:1   | `width: 768`   | Square, social feeds                         |
|       | `height: 768`  |                                              |
| 4:3   | `width: 1024`  | Traditional horizontal                       |
|       | `height: 768`  |                                              |
| 3:4   | `width: 576`   | Portrait presentation                        |
|       | `height: 768`  |                                              |

**Duration** (via `num_frames` and `frame_rate`):

| Target duration | `num_frames` | `frame_rate` |
| --------------- | ------------ | ------------ |
| ~3 seconds      | 81           | 24           |
| ~5 seconds      | 121          | 24           |
| ~10 seconds     | 241          | 24           |
| ~18 seconds     | 441          | 24           |

Constraints:

- `num_frames` ≤ 441 and must satisfy `8n + 1` (e.g., 81, 121, 161, 241, 441). Reject values like 80, 100, 200.
- `frame_rate` range: 1–60. Default: 24.
- Formula: `seconds = num_frames / frame_rate`

Default: `num_frames: 121`, `frame_rate: 24` (~5 seconds), `width: 1152`, `height: 768`.

Accept user overrides. If user provides a `num_frames` that violates `8n+1`, round to the nearest valid value and inform them.

Optional parameters to offer:

- `seed` — for reproducible results
- `negative_prompt` — to avoid unwanted content
- `num_inference_steps` — quality vs speed tradeoff

### Step 4: Pick save target (inferred, then confirmed)

The skill saves the video under `source/images/<slug>/<filename>.mp4`. Infer `<slug>` in this order — **stop at first hit**:

1. **IDE active selection / open file** — if the conversation context points at `source/_posts/YYYY-MM-DD-<slug>.md`, extract `<slug>`.
2. **Recently-touched post in this turn** — if a `source/_posts/...md` file was Read/Edited/Written earlier.
3. **Most recently modified post on disk** — fallback:
   ```bash
   ls -t source/_posts/*.md | head -1
   ```
   Strip `YYYY-MM-DD-` prefix and `.md` suffix.
4. **No post found** — ask the user for a slug directly.

Default filename:

- A kebab-case slug derived from the first 4–5 ASCII words of the prompt, e.g. `"A young astronaut walking across..."` → `young-astronaut-walking.mp4`.
- If the prompt is non-Latin or too short, use `agnes-video-$(date +%s).mp4`.
- Always `.mp4`.

**Always confirm with the user before proceeding.** Show the full inferred path:

```text
Save to source/images/<slug>/<filename>.mp4?
(Press enter to accept, or type a different path.)
```

Store the confirmed path in `$OUT_PATH`. `mkdir -p` the parent directory.

### Step 5: Build and send the creation request

Build the JSON safely with `jq -n`:

```bash
# For Text-to-Video
jq -n \
  --arg model "agnes-video-v2.0" \
  --arg prompt "$PROMPT" \
  --argjson width "$WIDTH" \
  --argjson height "$HEIGHT" \
  --argjson num_frames "$NUM_FRAMES" \
  --argjson frame_rate "$FRAME_RATE" \
  '{
    model: $model,
    prompt: $prompt,
    width: $width,
    height: $height,
    num_frames: $num_frames,
    frame_rate: $frame_rate
  }' > /tmp/agnes-video-payload.json

# For Image-to-Video (add image field — raw base64, NOT data URI)
# $IMAGE_B64 should be the raw base64 string from: base64 -i "$LOCAL_FILE" | tr -d '\n'
jq -n \
  --arg model "agnes-video-v2.0" \
  --arg prompt "$PROMPT" \
  --argjson width "$WIDTH" \
  --argjson height "$HEIGHT" \
  --argjson num_frames "$NUM_FRAMES" \
  --argjson frame_rate "$FRAME_RATE" \
  --arg image "$IMAGE_B64" \
  '{
    model: $model,
    prompt: $prompt,
    image: $image,
    width: $width,
    height: $height,
    num_frames: $num_frames,
    frame_rate: $frame_rate
  }' > /tmp/agnes-video-payload.json

# For Multi-Image Video or Keyframe Animation (use extra_body)
# $IMAGES_JSON should be a JSON array of raw base64 strings (NOT data URIs)
# e.g. '["raw_b64_1", "raw_b64_2"]'
jq -n \
  --arg model "agnes-video-v2.0" \
  --arg prompt "$PROMPT" \
  --argjson width "$WIDTH" \
  --argjson height "$HEIGHT" \
  --argjson num_frames "$NUM_FRAMES" \
  --argjson frame_rate "$FRAME_RATE" \
  --argjson images "$IMAGES_JSON" \
  --arg mode "${MODE:-ti2vid}" \
  '{
    model: $model,
    prompt: $prompt,
    width: $width,
    height: $height,
    num_frames: $num_frames,
    frame_rate: $frame_rate,
    extra_body: {
      image: $images,
      mode: $mode
    }
  }' > /tmp/agnes-video-payload.json

# Optional fields (add if user specified):
#   --argjson seed "$SEED" + ."seed" = $seed
#   --arg neg "$NEGATIVE_PROMPT" + ."negative_prompt" = $neg
#   --argjson steps "$STEPS" + ."num_inference_steps" = $steps
```

Send the creation request:

```bash
curl --max-time 120 -sS \
  -X POST https://apihub.agnes-ai.com/v1/videos \
  -H "Authorization: Bearer $AGNES_API_KEY" \
  -H "Content-Type: application/json" \
  -d @/tmp/agnes-video-payload.json \
  > /tmp/agnes-video-response.json
```

Parse the response:

```bash
TASK_ID=$(jq -r '.task_id // .id // empty' /tmp/agnes-video-response.json)
VIDEO_ID=$(jq -r '.video_id // empty' /tmp/agnes-video-response.json)

if [ -z "$TASK_ID" ] || [ -z "$VIDEO_ID" ]; then
  echo "Failed to create video task:"
  jq . /tmp/agnes-video-response.json
  exit 1
fi
```

### Step 6: Poll for completion

Poll every **10 seconds** using the task_id endpoint (recommended). Max wait: **10 minutes** (60 polls).

```bash
ELAPSED=0
MAX_WAIT=600
INTERVAL=10
STATUS=""

while [ $ELAPSED -lt $MAX_WAIT ]; do
  sleep $INTERVAL
  ELAPSED=$((ELAPSED + INTERVAL))

  RESPONSE=$(curl -sS --max-time 30 \
    "https://apihub.agnes-ai.com/v1/videos/$TASK_ID" \
    -H "Authorization: Bearer $AGNES_API_KEY" 2>/dev/null)

  STATUS=$(echo "$RESPONSE" | jq -r '.status // empty')
  PROGRESS=$(echo "$RESPONSE" | jq -r '.progress // 0')

  echo "[$ELAPSED$s] Status: $STATUS (progress: ${PROGRESS}%)"

  case "$STATUS" in
    completed)
      echo "Video generation completed!"
      break
      ;;
    failed)
      ERROR=$(echo "$RESPONSE" | jq -r '.error // "Unknown error"')
      echo "Video generation failed: $ERROR"
      echo "$RESPONSE"
      exit 1
      ;;
    queued|in_progress)
      # Continue polling
      ;;
    *)
      echo "Unexpected status: $STATUS"
      echo "$RESPONSE"
      exit 1
      ;;
  esac
done

if [ "$STATUS" != "completed" ]; then
  echo "Video generation timed out after ${MAX_WAIT}s"
  exit 1
fi
```

Extract the download URL:

```bash
VIDEO_URL=$(echo "$RESPONSE" | jq -r '.remixed_from_video_id // empty')
if [ -z "$VIDEO_URL" ]; then
  echo "Task completed but no video URL found in response:"
  jq . <<< "$RESPONSE"
  exit 1
fi
```

### Step 7: Download the video

Download the MP4 from the returned URL:

```bash
curl -fSL --max-time 300 -o "$OUT_PATH" "$VIDEO_URL"

# Validate the downloaded file is a real MP4 (check ftyp magic bytes)
HEADER=$(xxd -l 12 -p "$OUT_PATH" 2>/dev/null)
if [[ "$HEADER" != "0000002066747970"* ]] && [[ "$HEADER" != "0000001866747970"* ]]; then
  echo "Warning: downloaded file may not be a valid MP4 (header: $HEADER)"
  echo "File size: $(du -h "$OUT_PATH" | cut -f1)"
fi

FILE_SIZE=$(du -k "$OUT_PATH" | cut -f1)
if [ "$FILE_SIZE" -gt 51200 ]; then
  echo "Warning: video file is large (${FILE_SIZE}KB > 50MB). Consider reducing duration."
fi
```

Clean up temp files:

```bash
rm -f /tmp/agnes-video-payload.json /tmp/agnes-video-response.json
```

Print a one-line summary: file size and duration.

### Step 8: Auto-embed into the post

If a post file was inferred in Step 4 (or the user supplied one), **insert a `<video>` tag** into it automatically.

The blog uses inline HTML for media. Insert a `<video>` tag with `autoplay muted loop` (silent autoplay for ambient background video) and a `width` attribute:

```html
<video autoplay muted loop playsinline width="600" style="max-width:100%;border-radius:8px;">
  <source src="/images/<slug>/<filename>.mp4" type="video/mp4" />
</video>
```

**Width default — pick by aspect ratio:**

| Orientation           | Default `width` |
| --------------------- | --------------- |
| Landscape (16:9, 4:3) | `640`           |
| Square (1:1)          | `500`           |
| Portrait (9:16, 3:4)  | `360`           |

The NexT content column is roughly 700 px wide on desktop. Videos wider than 640px risk edge-to-edge sprawl.

**Alt text / caption:** ask the user for a short Chinese caption (1 line). If skipped, default to the prompt-derived slug with spaces.

**Insertion point:** same logic as the image skill:

1. **If IDE active selection** exists, insert immediately after line L_end.
2. **Otherwise**, ask the user: "After line N" or "At the end of the post".

Use the `Edit` tool to make the change. Wrap the `<video>` tag in blank lines above and below.

If a markdown linter flags `MD033/no-inline-html`, **ignore it** — the project consistently uses inline HTML for media.

### Step 9: Confirm

Print:

- Final video path (absolute and relative).
- File size.
- The line range where the `<video>` tag was inserted.
- Generation duration (elapsed time from Step 5 to Step 6 completion).

Offer to run `npm run build` to verify the post still builds. Don't run it without asking.

## Common pitfalls

1. **`num_frames` must be `8n + 1`**. Values like 80, 100, 200 will be rejected. Valid values: 81, 121, 161, 241, 441.
2. **Video generation is async**. The creation request returns immediately with `status: queued`. You must poll for completion — do not assume the video is ready.
3. **Polling timeout**. Generation can take 1–5+ minutes. Set generous timeouts (10 min max) and poll at 10-second intervals.
4. **Download the video locally**. The hosted URL (`remixed_from_video_id`) may expire. Always save a local copy.
5. **Validate the download**. Ensure the downloaded file is a real MP4 (check `ftyp` magic bytes), not an HTML error page.
6. **File size**. Videos can be 10–100+ MB. Warn if exceeding 50 MB.
7. **`extra_body` for multi-image/keyframes**. Image arrays and mode settings must be inside `extra_body`, not at the top level.
8. **Do NOT use Data URIs for image input**. The API rejects `data:image/png;base64,...` format with `Invalid image: Incorrect padding`. Use the raw base64 string instead (strip the `data:image/...;base64,` prefix).

## Reference: the four documented call shapes

### 1. Text-to-Video

```bash
curl -X POST https://apihub.agnes-ai.com/v1/videos \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "agnes-video-v2.0",
    "prompt": "A cinematic shot of a cat walking on the beach at sunset, soft ocean waves, warm golden lighting, realistic motion",
    "height": 768,
    "width": 1152,
    "num_frames": 121,
    "frame_rate": 24
  }'
```

### 2. Image-to-Video

```bash
curl -X POST https://apihub.agnes-ai.com/v1/videos \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "agnes-video-v2.0",
    "prompt": "The woman slowly turns around and looks back at the camera, natural facial expression, cinematic camera movement",
    "image": "https://example.com/image.png",
    "num_frames": 121,
    "frame_rate": 24
  }'
```

### 3. Multi-Image Video

```bash
curl -X POST https://apihub.agnes-ai.com/v1/videos \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "agnes-video-v2.0",
    "prompt": "Create a smooth transformation scene between the two reference images, cinematic lighting, consistent character identity, natural motion",
    "extra_body": {
      "image": [
        "https://example.com/image1.png",
        "https://example.com/image2.png"
      ]
    },
    "num_frames": 121,
    "frame_rate": 24
  }'
```

### 4. Keyframe Animation

```bash
curl -X POST https://apihub.agnes-ai.com/v1/videos \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "agnes-video-v2.0",
    "prompt": "Generate a smooth cinematic transition between the keyframes, maintaining visual consistency and natural camera movement",
    "extra_body": {
      "image": [
        "https://example.com/keyframe1.png",
        "https://example.com/keyframe2.png"
      ],
      "mode": "keyframes"
    },
    "num_frames": 121,
    "frame_rate": 24
  }'
```

## Polling endpoints

### Recommended: poll by task_id

```bash
curl "https://apihub.agnes-ai.com/v1/videos/{task_id}" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Alternative: poll by video_id

```bash
curl "https://apihub.agnes-ai.com/agnesapi?video_id={video_id}" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Response shape

### Creation response

```json
{
  "id": "task_YOUR_TASK_ID",
  "task_id": "task_YOUR_TASK_ID",
  "video_id": "video_YOUR_VIDEO_ID",
  "object": "video",
  "model": "agnes-video-v2.0",
  "status": "queued",
  "progress": 0,
  "created_at": 1780457477,
  "seconds": "10.0",
  "size": "1280x768"
}
```

### Completion response

```json
{
  "id": "task_YOUR_TASK_ID",
  "video_id": "video_YOUR_VIDEO_ID",
  "model": "agnes-video-v2.0",
  "object": "video",
  "status": "completed",
  "progress": 100,
  "seconds": "10.0",
  "size": "1280x768",
  "remixed_from_video_id": "https://platform-outputs.agnes-ai.space/videos/agnes-video-v2.0/2026/06/23/video_xxxxxx.mp4",
  "error": null
}
```

## Task states

| State         | Description                  |
| ------------- | ---------------------------- |
| `queued`      | Task is waiting in the queue |
| `in_progress` | Video is being generated     |
| `completed`   | Video generation succeeded   |
| `failed`      | Video generation failed      |

## Error codes

| Status Code | Description                    |
| ----------- | ------------------------------ |
| 400         | Bad request — check parameters |
| 401         | Unauthorized — check API Key   |
| 404         | Task or video not found        |
| 500         | Server error                   |
| 503         | Service busy — retry later     |

## Quick Reference

| Item             | Value                                                    |
| ---------------- | -------------------------------------------------------- |
| Create endpoint  | `POST https://apihub.agnes-ai.com/v1/videos`             |
| Poll by task_id  | `GET https://apihub.agnes-ai.com/v1/videos/{task_id}`    |
| Poll by video_id | `GET https://apihub.agnes-ai.com/agnesapi?video_id={id}` |
| Model            | `agnes-video-v2.0`                                       |
| Auth env var     | `AGNES_API_KEY`                                          |
| Default size     | `width: 1152, height: 768` (16:9)                        |
| Default duration | `num_frames: 121, frame_rate: 24` (~5 seconds)           |
| Default save dir | `source/images/<slug>/` (inferred, confirmed)            |
| Embed tag        | `<video autoplay muted loop playsinline width="600">`    |
| Poll interval    | 10 seconds                                               |
| Max wait         | 10 minutes (600 seconds)                                 |
| num_frames rule  | ≤ 441, must be `8n + 1` (81, 121, 161, 241, 441)         |
| Docs             | <https://agnes-ai.com/doc/agnes-video-v20>               |
