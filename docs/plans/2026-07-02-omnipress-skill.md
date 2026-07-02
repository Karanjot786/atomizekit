# Omnipress — open-source content-engine skill — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Package the GenZCareer content system (blog writer → 7-platform atomizer → image/video renderers → GEO tracker) as ONE brand-agnostic, keyless, open-source agent skill at `~/Desktop/omnipress` that interviews the user about their brand on first run and pre-fills answers by analyzing the host codebase.

**Architecture:** A single skill repo (SKILL.md router at root, per the skills.sh convention). All brand specifics live in ONE file, `brand/brand.json`, written by a `/setup` interview command; every script and template reads tokens from it (scripts load it directly; HTML video templates receive tokens through hyperframes `--variables-file`). Sources are ported from three existing skills (genz-omni-distribute, genz-seo-engine, genz-content) + the genz-distributor GEO lib, then de-branded.

**Tech Stack:** Node 22.15+ (takumi-js, gsap vendored), Python 3 (atomize), hyperframes CLI via npx (Chrome+FFmpeg), node:test. No AI API keys, no platform keys (Pexels optional).

## Global Constraints

- Keyless: no ANTHROPIC/OpenAI/platform API key anywhere. `PEXELS_API_KEY` optional-only.
- Every brand-specific value (name, domain, colors, fonts, logo, author, feature map, blog dir) comes from `brand/brand.json` — grep for hardcoded "genzcareer|GenZCareer|Karanjot|2dd4bf" must return ZERO hits outside docs/plans/ and the demo fixture.
- SKILL.md under 200 lines (create-skill progressive disclosure); heavy docs go in `references/`.
- Scripts must fail LOUD with a "run /setup first" message when brand.json is missing.
- Draft-only contract preserved: nothing publishes or posts; the user posts manually.
- Bundled fonts must be OFL-licensed (Geist + Inter are OFL — bundling legal); note licenses in `brand/fonts/LICENSES.txt`.
- License: MIT (adjust in Task 7 if the research agent's finding differs).
- Repo layout / install commands in README: adopt the research agent's findings (SKILL.md at repo root assumed; `npx skills add <owner>/omnipress` + manual clone instructions).

## Source → Destination map (used by Tasks 2–5)

| Source (absolute) | Dest (repo-relative) | Generalization |
|---|---|---|
| genz-distributor/.claude/skills/genz-omni-distribute/scripts/media_helpers.mjs | scripts/media_helpers.mjs | none (already generic) |
| …/scripts/render_cards.mjs | scripts/render_cards.mjs | brand tokens + paths from brand.json |
| …/scripts/check_render.mjs | scripts/check_render.mjs | fixture slug → `demo` |
| …/scripts/render_short.mjs | scripts/render_short.mjs | brand vars passed into template |
| …/scripts/render_reel.mjs | scripts/render_reel.mjs | brand vars + domain trim from brand.json |
| …/scripts/atomize.py | scripts/atomize.py | --domain default + canonical pattern from brand.json |
| …/templates/card.jsx | templates/card.jsx | colors/fonts/name via function args (renderer passes brand) |
| …/templates/video/ | templates/video/ | CSS tokens + brand name/eyebrow read from vars with fallbacks |
| …/templates/shorts/ | templates/shorts/ | same; "GenZCareer" hook label → brand.name |
| …/commands/playbook.md | references/playbook.md | Brand-weave table → "read features[] from brand.json" |
| …/commands/geo.md | references/geo-writing.md | de-brand examples |
| …/commands/visuals.md | commands/visuals.md | paths + brand refs updated |
| …/commands/atomize.md | commands/atomize.md | de-brand |
| genz/.claude/skills/genz-seo-engine/write-article.md + SKILL.md | commands/write.md | blogDir/domain/audience from brand.json; keep GEO structure rules |
| ~/.claude/skills/genz-content/SKILL.md | SKILL.md flow section | paths become brand.json-driven; topic discovery generic |
| genz-distributor/lib/geo/*.ts + scripts/measure.ts | scripts/geo/ | data paths → host `data/geo/`; prompts seeded by /setup |
| genz-distributor tests/geo/*.test.ts (score+gap+measure) | scripts/geo/tests/ | trim to smoke set |

## brand.json contract (all consumers use exactly these keys)

```json
{
  "name": "Acme Careers",
  "domain": "acme.example",
  "canonicalPattern": "https://acme.example/blog/{slug}",
  "blogDir": "content/blog",
  "distributionDir": "content/distribution",
  "audience": "junior developers",
  "voice": "specific tactics, not encouragement",
  "author": "Jane Rivera",
  "colors": { "bg": "#0A0A0B", "text": "#FAFAFA", "primary": "#2DD4BF", "accent": "#34D399" },
  "fonts": { "display": "Geist", "body": "Inter", "displayFile": "brand/fonts/Geist-Bold.otf", "bodyFile": "brand/fonts/InterVariable.ttf" },
  "logo": "brand/logo.svg",
  "eyebrow": "Acme Data",
  "platforms": ["x", "reddit", "linkedin", "instagram", "youtube", "medium", "substack"],
  "features": [ { "match": "resume/ATS advice", "name": "Acme's free resume checker" } ]
}
```

---

### Task 1: Repo seed + brand config contract

**Files:**
- Create: `brand/brand.template.json` (the contract above, with a `"_instructions"` key: "run /setup — do not fill by hand")
- Create: `brand/fonts/` (copy Geist-Bold.otf + InterVariable.ttf from genz-distributor/.claude/skills/genz-omni-distribute/brand/fonts/) + `brand/fonts/LICENSES.txt` (both OFL, one line each + link)
- Create: `brand/logo.svg` — a neutral placeholder (simple 64×64 rounded square, `#2DD4BF` circle on `#0A0A0B`; hand-write the ~6-line SVG)
- Create: `.gitignore` (`node_modules/`, `content/`, `data/`, `brand/brand.json`, `templates/*/vo.wav`, `templates/*/assets/`, `.env*`) — note: brand.json is the USER'S config, gitignored so forks don't leak brands; template stays tracked
- Create: `LICENSE` (MIT, copyright "Karanjot Singh")
- Create: `scripts/lib_brand.mjs`:

```js
// Single brand loader used by every .mjs script.
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
export const SKILL_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export function loadBrand() {
  const p = path.join(SKILL_ROOT, "brand", "brand.json");
  if (!existsSync(p)) {
    console.error("no brand/brand.json — run the skill's /setup first (it interviews you and writes it)");
    process.exit(1);
  }
  return JSON.parse(readFileSync(p, "utf-8"));
}
```

- Test: `scripts/tests/brand.test.mjs` — parse template JSON, assert every contract key above exists; assert loadBrand exits 1 when brand.json absent (spawn node -e).

**Steps:** write test → fail → create files → pass → `git add -A && git commit -m "feat: seed omnipress — brand contract, fonts, loader"`.

### Task 2: Image pipeline (cards) — port + de-brand

**Files:** per the map: `scripts/{media_helpers,render_cards,check_render}.mjs`, `templates/card.jsx`. Demo fixture lives at `brand/demo-post.json` (tracked; content/ is gitignored) and check_render copies it into place.

**Interfaces:** `render_cards.mjs <slug>` reads `loadBrand()` for colors/fonts/logo/name; `card.jsx` exports `renderCard(data, format, brand)` (brand = loaded json). Consumes Task 1 `loadBrand`.

**Generalization spec (exact):** in card.jsx replace every literal `#0A0A0B→brand.colors.bg`, `#FAFAFA→brand.colors.text`, `#2DD4BF→brand.colors.primary`, `#34D399→brand.colors.accent`, `"GenZCareer"→brand.name`, `"genzcareer.in"→brand.domain`, font file paths→`brand.fonts.*File` resolved from SKILL_ROOT. render_cards: slug dir = `<cwd>/{brand.distributionDir}/<slug>` (host repo cwd).

**Steps:** copy files → apply spec → check_render self-provisions (if brand.json missing, copy template→brand.json, mark temp, delete after) → `node scripts/check_render.mjs` asserts 4 PNGs exact dims → sanitize grep (`grep -ri "genzcareer" scripts templates` empty) → commit.

### Task 3: Video pipeline (reel + short) — port + de-brand

**Files:** `templates/video/`, `templates/shorts/` (vendored gsap; @font-face paths → `../../brand/fonts/…`), `scripts/{render_reel,render_short}.mjs`.

**Interfaces:** builders add `brand: { name, eyebrow, domain, colors }` to the vars JSON. Templates: add `:root{--bg:#0A0A0B;--text:#FAFAFA;--primary:#2DD4BF;--accent:#34D399}` and swap CSS literals to var() ; inline script sets the custom properties from `v.brand?.colors` when present and reads `v.brand?.name ?? "Brand"` / eyebrow / domain.

**Steps:** copy → CSS literals→vars → builders load brand + pass vars + resolve logo/fonts from SKILL_ROOT → `npx hyperframes lint templates/video && npx hyperframes lint templates/shorts` → 0 errors (live render doctor-gated; README notes) → sanitize grep → commit.

### Task 4: Writing layer — write / atomize / playbook

**Files:** `commands/write.md` (from genz-seo-engine SKILL.md + write-article.md — keep the GEO article-structure rules, drop GenZCareer keyword lists; target `{brand.blogDir}/<slug>.mdx`; draft-only rule verbatim), `commands/atomize.md`, `scripts/atomize.py` (read `<skill>/brand/brand.json`: domain/canonicalPattern/platforms; scaffold only brand.platforms; keep parent-dir blog search + --blog-dir), `references/playbook.md` (port research-backed playbook; weave table → "map advice to the matching brand.json features[] entry; none matches = no weave"; keep AI-tell + interlink sections verbatim), `references/geo-writing.md`.

**Test:** create `/tmp/fake-blog/demo.mdx` with title front matter → `python3 scripts/atomize.py --slug demo --blog-dir /tmp/fake-blog` → asserts files for exactly brand.platforms, canonical matches canonicalPattern. Commit.

### Task 5: GEO measurement loop

**Files:** `scripts/geo/{types,store,score,gap}.ts`, `scripts/geo/providers/{_stub,perplexity,gemini,gsc}.ts`, `scripts/geo/measure.ts`, `scripts/geo/tests/{score,gap,measure}.test.ts` (ported, trimmed).

**Generalization:** data dir = `<cwd>/data/geo/`; `prompts.json` seeded by /setup (Task 6); measure prints "run /setup to seed prompts" if missing. Keep mention≠citation, deterministic stubs, fail-loud-on-real-key exactly as-is.

**Test:** `node --test "scripts/geo/tests/*.test.ts"` green. Commit.

### Task 6: /setup — interview + codebase analysis (the differentiator)

**Files:** `commands/setup.md` — an agent recipe containing:

1. **Codebase analysis** (only when cwd is a project): framework from package.json; blog dir via glob `content/{blog,posts}`, `posts/`, `_posts/`, `src/content/`; colors via grep `--primary|--brand|theme.colors` in globals.css/tailwind config; logo via `public/*logo*.{svg,png}`; site name/domain from metadata/config/git remote/CNAME; author names from blog front matter. Prefill a draft brand.json.
2. **Interview** (AskUserQuestion, ≤4/round): R1 confirm name+domain+blogDir (prefilled); R2 voice (3 archetypes + custom) + audience + author; R3 features for the weave map ("features a post could point to — or none"); R4 platforms multiSelect + colors confirm + logo/font paths.
3. **Write** `brand/brand.json` + readable `brand/BRAND.md`; copy user logo/fonts in when provided.
4. **Seed** host `data/geo/prompts.json`: 5-8 prompts from features+audience, value/winnability 0.6/0.5 defaults + "hand-tune" note.
5. **Validate:** run `node scripts/check_render.mjs`; tell the user to eyeball the 4 PNGs.
6. Rule: NEVER invent brand facts — non-detected values must come from user answers.

**Test (GREEN, subagent):** fresh agent given only setup.md + a toy project → valid brand.json (schema-checked) with no invented values. Commit.

### Task 7: SKILL.md router + README + sanitize + release check

**Files:** `SKILL.md` (<200 lines): frontmatter (name `omnipress`; description "Use when the user wants to create and distribute brand content — blog + platform posts + images + video — or set up a keyless content engine for their brand/codebase…"); FIRST-RUN RULE (no brand/brand.json → commands/setup.md first); pipeline (topic research [last30days if installed, else WebSearch] → write → atomize → fill post.json stat/scenes → visuals → report drafts; measure via scripts/geo/measure.ts on cron); command table; prerequisites (Node 22.15+, FFmpeg 7+, Chrome; optional `pip install kokoro-onnx soundfile` for VO; optional PEXELS_API_KEY); draft-only contract. `README.md`: what/why, install commands (per research), 60-second quickstart, credits (takumi, hyperframes, gsap, geo-aeo-tracker), MIT badge.
- Sanitize sweep: `grep -riE "genzcareer|karanjot|genz-distributor|/Users/ksd" . | grep -v docs/plans | grep -v LICENSE` → empty; fix hits.
- Final GREEN test: fresh subagent reads ONLY SKILL.md → prompt "set me up and make content about X" → must answer: setup first (no brand.json), then the flow with correct script paths.
- Commit. Pushing to GitHub = ASK USER first (outward-facing).

## Self-review (done)
- Spec coverage: interview ✅(T6), codebase analysis ✅(T6), all skills+subskills ✅(T2-5 map incl. seo-engine + genz-content), Desktop ✅, open-source ✅(T1 license, T7 README/sanitize).
- No placeholders: generalization specs are exact token maps; new code shown (lib_brand); ports name exact sources.
- Type consistency: brand.json contract stated once; every task references those keys.
