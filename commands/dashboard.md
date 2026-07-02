# /dashboard — local review console

See every drafted slug — image cards, reel, short, and all platform variants — in
one brand-themed page before you post by hand. atomizekit is draft-only and keyless,
so this is a **review** surface, not an approval gate: nothing ships from here.

```bash
node <skill>/scripts/dashboard.mjs [--port 4600]
```
Run it from your **project root** (cwd) so it finds `<distributionDir>/`. Open the
printed `http://localhost:<port>`.

## What it shows
- One card per slug: headline, path, media thumbnails (click to open full size; reels
  and shorts hover-play), and every platform variant as an expandable row (summary
  excerpt → click to read the full draft).
- Themed from your `brand.json` (name, colors, fonts) — it looks like your brand.

## The one action
Each written variant has a **mark posted** button. Clicking it flips `posted:` in
that variant's `.md` front matter (true/false) so you can track what you've already
posted. That's the only write it makes; it never posts anything anywhere.

## Notes
- Zero dependencies (Node's built-in `http`/`fs`) — no framework, no build.
- Needs `brand.json` (run `/setup` first) and at least one slug under
  `<distributionDir>/`.
- Media (PNG/MP4) is served by the same local server; path access is basename-guarded
  to the distribution dir.
