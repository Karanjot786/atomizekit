# atomizekit

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A keyless content engine for Claude Code. One topic becomes a canonical blog post,
native drafts for seven platforms, on-brand image cards, a voiced short-form video,
and a data reel — plus AI-citation tracking that tells you what to write next. No AI
or platform API keys. Nothing auto-posts: it produces reviewed drafts, and a human
posts each one.

It works for **any** brand: on first run it reads your codebase, interviews you, and
writes a single config file. Every renderer and template then draws from that config.

## What you get

- **Blog** — one GEO-structured, data-backed post (the canonical source everything links to).
- **7 platform drafts** — X, LinkedIn, Reddit, Instagram, YouTube, Medium, Substack — each in that platform's native voice, from a 2026-researched playbook, each linking the blog and weaving in one of your product features (never Reddit).
- **Image cards** — 4 exact-size PNGs (feed, story, YouTube thumb, LinkedIn banner) rendered in-process with takumi, carrying one real stat.
- **Voiced short + reel** — kinetic-text video with local Kokoro voiceover and real stock-footage beds (hyperframes). No AI-generated imagery.
- **GEO loop** — tracks which of your pages AI answer engines cite, ranks the gaps, and feeds the next topic back to the top.

## Install

```bash
# Recommended — Claude Code discovers skills here natively
git clone https://github.com/<owner>/atomizekit ~/.claude/skills/atomizekit

# or project-local (committed with your repo)
git clone https://github.com/<owner>/atomizekit .claude/skills/atomizekit

# then, from the skill dir, install the render deps
cd ~/.claude/skills/atomizekit && npm install
```

Also installable via the skills.sh registry:

```bash
npx skills add <owner>/atomizekit
```

> Note: an open Claude Code issue (anthropics/claude-code#53950) can leave
> `npx skills add` installs in a directory the Skill tool doesn't scan. If the skill
> doesn't show up, use the manual `git clone` into `~/.claude/skills/` above.

## 60-second quickstart

1. Open Claude Code in your project.
2. Say **"set up atomizekit for my brand."** It analyzes your codebase (framework,
   blog folder, color tokens, logo, site name), asks a few questions it couldn't
   answer, and writes `.claude/atomizekit.config.json`.
3. Say **"make content about `<your topic>`"** (or just "make content" to pick from
   researched / citation-gap topics). Out comes the blog, 7 drafts, image cards, and
   video — all as reviewable files.
4. Review, then post each draft yourself.

## Prerequisites

- Node ≥ 22.15, Python 3.
- FFmpeg 7+ and Chrome for video (`npx hyperframes doctor --json` to check).
- Optional: `pip install kokoro-onnx soundfile` (voiced renders), a free
  `PEXELS_API_KEY` (stock video beds; Openverse CC0 images are the keyless fallback).

## Third-party tools invoked

atomizekit calls these CLIs as separate processes you install — it does not vendor
their source (gsap is the one vendored file, standard license):

- [takumi-js](https://github.com/kane50613/takumi) — in-process JSX→PNG (MIT)
- [hyperframes](https://github.com/heygen-com/hyperframes) — HTML→MP4 + local Kokoro TTS (Apache-2.0)
- [GSAP](https://gsap.com) — timeline animation, vendored into the video templates
- GEO tracker design inspired by geo-aeo-tracker (MIT)

## License

MIT © 2026 Karanjot Singh
