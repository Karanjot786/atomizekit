# /visuals — on-brand social assets for a distribution slug

Keyless, headless, offline. Renders YOUR design + real footage — never AI-generated
imagery (2026 slop penalties are severe). Two halves: **images** (takumi) and
**video** (hyperframes). Both read brand tokens from your config
(`<cwd>/.claude/atomizekit.config.json`, or the skill's `brand/brand.json`) — run
`/setup` first if neither exists.

Run from your project root. Input is a slug folder under
`<distributionDir>/<slug>/` produced by `/atomize`, plus its `post.json`
(fields: `headline`, `stat`, `statLabel`, `url`, `eyebrow` — one REAL stat from the
blog, never invented).

## One-time setup
```bash
npm install                       # takumi-js + gsap (in the skill's package.json)
npx hyperframes doctor --json     # must show FFmpeg 7+, FFprobe, Chrome green
```
`hyperframes doctor` may flag Docker (only for `hyperframes lambda` batch renders)
and Kokoro/Whisper (only for the voiceover layer below) — neither blocks images.

## Images — 4 platform cards (takumi, ms per card, no browser)
```bash
node <skill>/scripts/render_cards.mjs <slug>
```
→ `<distributionDir>/<slug>/media/{feed,story,thumb,banner}.png`
(1080×1350, 1080×1920, 1280×720, 1584×396). Fails loud on a missing brand font.

## Reel — the voiced stat card (IG)
The animated data card: headline in, hero stat counts up, over a stock b-roll bed
with one VO line (Kokoro). ~8-12s.
```bash
node <skill>/scripts/render_reel.mjs <slug> [--voice af_heart] [--quality draft|standard|high]
```
→ `media/reel.mp4` (1080×1920, video+audio, ffprobe-verified). Reads `post.json`:
`headline/stat/statLabel/url` (required), `reelVoText` (spoken line, default =
headline + stat + statLabel), `reelQuery` (b-roll search, default = hook scene's
`stockQuery`). The leading number of `stat` drives the count-up, suffix preserved.

Preview live while editing: `npx hyperframes preview <skill>/templates/video`

## Voiced Short — the YouTube/Reels video (Kokoro VO + kinetic-text scenes)
Local Kokoro-82M reads the script; each scene's text is the on-screen caption
(kinetic type — **no Whisper/transcription needed**). No API key. One-time dep:
`pip install kokoro-onnx soundfile`.

1. Fill `<distributionDir>/<slug>/post.json` with `scenes[]` — 5–7 entries of
   `{ "kind": "hook"|"context"|"body"|"cta", "text": "...", "voText": "...", "stockQuery": "..." }`,
   derived from the YouTube variant's script. Short `\n`-broken lines, ≤ ~12 words/line.
   The `cta` scene carries the brand weave (see `references/playbook.md`).
   - `voText` (optional) = the SPOKEN line. Punctuation drives Kokoro's prosody —
     commas, ellipses, questions = pauses + emotion. Write numbers as words
     ("forty-three percent"). Falls back to `text`.
   - `stockQuery` (optional) = b-roll search for the scene's real-footage bed
     (dark-overlaid, Ken Burns). String or ARRAY of alternates, most specific
     first. Write CONCRETE objects/actions ("hands typing keyboard", "frustrated
     laptop") — never scene narratives ("stressed person facing rejection" returns
     nothing). Keyless source: Openverse CC0, relevance-scored — a scene with no
     RELEVANT match keeps the brand-glow look (wrong image is worse than none). Set
     a free `PEXELS_API_KEY` (pexels.com/api, 2-min signup) to unlock portrait
     stock VIDEOS + far better people/emotion shots. Fetch happens at build; render
     stays local.
2. ```bash
   node <skill>/scripts/render_short.mjs <slug> [--voice af_nova] [--quality draft|standard|high]
   ```
   → TTS per scene → concat VO → renders `templates/shorts/` → `media/short.mp4`
   (portrait 1080×1920, video+audio, duration = VO length, verified by ffprobe).
Voices: `npx hyperframes tts --list` (af_heart default in the reel builder). Body
scenes auto-label "Fix N of M"; numbers/percents auto-highlight in the accent color.
Prefer real screen-recordings as a visual bed when demoing product UI.

## How brand assets reach the render
The builders sync your logo + fonts (from the skill's `brand/`) into the composition
dir at build time, because hyperframes serves each composition dir as its own web
root (relative `../../brand/` paths 404). So a bare `git clone` + immediate
`hyperframes lint` shows missing-asset warnings until `/setup` or a first render has
synced them once — expected, not a defect.

## Anti-slop rules (non-negotiable)
- Render YOUR HTML/design + real footage. Never AI-generated images/video.
- One real stat per asset, pulled from the canonical blog — the citable moat.
- Distinct composition per format, not one layout stretched.
- Fonts/logo local; no network at render time.

## Where this fits in the pipeline
`/atomize` (platform variants) → **`/visuals`** (PNGs + reel + short) → you post.
