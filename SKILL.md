---
name: atomizekit
description: Use when the user wants to create and distribute brand content — a blog post plus native posts for X, LinkedIn, Reddit, Instagram, YouTube, Medium, and Substack, with on-brand image cards and voiced short-form video — or wants to set up a keyless content engine for their brand or codebase, or get their content cited by AI answer engines (ChatGPT, Perplexity, Google AI). Triggers include "set up atomizekit", "make content about X", "turn this blog into posts", "atomize this article", "content for my brand", "AI SEO / GEO / get cited by AI".
license: MIT
metadata: {"requires":{"env":[]}}
---

# atomizekit — keyless brand content engine

One topic → one canonical blog post → native drafts for every platform + on-brand
image cards + a voiced short + a data reel → AI-citation tracking that tells you
what to write next. **Keyless** (no AI/platform API keys — you are the engine via
Claude Code). **Draft-only**: nothing publishes or posts; a human posts each piece.

## FIRST-RUN RULE (do this before anything else)

If there is no `<cwd>/.claude/atomizekit.config.json` AND no `brand/brand.json` in
this skill dir, the brand is not configured. **Run `commands/setup.md` first** — it
analyzes the host codebase, interviews the user, and writes the config. Do not
guess brand facts. Every script below fails loud with the same instruction if the
config is missing.

Throughout, `<skill>` = this skill's directory; run scripts from the user's project
root (cwd) so blog/distribution/data land in their repo.

## The pipeline (in order)

1. **Topic.** If the user gave one, use it. If not: pull the measured gap queue from
   `<cwd>/data/geo/next-topics.json` if it exists (what you're NOT cited for yet),
   and/or research trends (the `last30days` skill if installed, else `WebSearch`);
   cluster into 4–6 candidates and let the user pick (AskUserQuestion).
2. **Write the blog** — `commands/write.md` → a GEO-structured draft at
   `<blogDir>/<slug>.mdx`. Draft only; never set `status: published`.
3. **Atomize** — `python3 <skill>/scripts/atomize.py --slug <slug>` scaffolds the
   configured platforms under `<distributionDir>/<slug>/` + a `post.json`. Then
   write each variant natively per `references/playbook.md` (one insight per
   platform, canonical link in each, one woven feature except Reddit). Fill
   `post.json` `stat`/`statLabel` (one REAL number from the blog) and `scenes[]`
   (from the YouTube variant) for the video.
4. **Visuals** — `commands/visuals.md`:
   `node <skill>/scripts/render_cards.mjs <slug>` (4 PNGs),
   `node <skill>/scripts/render_reel.mjs <slug>` (voiced stat reel),
   `node <skill>/scripts/render_short.mjs <slug>` (voiced kinetic-text short).
5. **Report** every draft + media path. Remind: draft-only, the user posts each by
   hand. Do NOT commit/publish unless asked.
6. **Measure (own cadence)** — `node <skill>/scripts/geo/measure.ts` runs prompts ×
   N through the (stubbed, keyless) citation providers, writes
   `data/geo/next-topics.json` → back to step 1. Loop closed.

## Commands & references

| File | What |
|---|---|
| `commands/setup.md` | First-run: codebase analysis + brand interview → config |
| `commands/write.md` | GEO-structured blog draft |
| `commands/atomize.md` | Scaffold platform variants from the blog |
| `commands/visuals.md` | Render image cards + reel + voiced short |
| `references/playbook.md` | Per-platform voice rules (2026-researched) + brand weave + AI-tell avoidance |
| `references/geo-writing.md` | How content earns AI-answer citations (structure, schema, data) |

## Brand config

All brand specifics live in ONE file (`.claude/atomizekit.config.json` in the host
project, or `brand/brand.json` in the skill): name, domain, `canonicalPattern`,
`blogDir`, `distributionDir`, audience, voice, author, `colors`, `fonts`, `logo`,
`eyebrow`, `platforms`, and `features` (the advice→product map for the brand weave).
`brand/brand.template.json` is the annotated contract. `/setup` writes it; every
script reads it via `scripts/lib_brand.mjs` (host config wins, so one install serves
many projects).

## Prerequisites

- Node ≥ 22.15, Python 3 (always).
- FFmpeg 7+, Chrome (for any video render). Gate on `npx hyperframes doctor --json`.
- Optional: `pip install kokoro-onnx soundfile` for voiced renders (local Kokoro TTS
  — still no key). `PEXELS_API_KEY` (free) for stock VIDEO beds; without it, keyless
  Openverse CC0 images are the fallback.

## Honest limits

- Video needs a doctor-green hyperframes toolchain; images (takumi) need only Node.
- Posting is manual by design — no platform credentials here, ever. This keeps the
  system inside every platform's 2026 ToS (penalties attach to mass/undisclosed
  automation, not to human-reviewed native content).
- GEO citation providers are stubbed keyless; wiring real Perplexity/Gemini/GSC keys
  is optional and left to the user (the stubs are deterministic for testing).
- Test the skill after install: `npm install && npm test` (from `<skill>`) should be
  green and render 4 demo cards.
