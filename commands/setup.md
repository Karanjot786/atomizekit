# /setup — brand interview + codebase analysis

Produces `brand.json` — the single file every other command and script reads
(`scripts/lib_brand.mjs`, `scripts/atomize.py`, the video/card renderers).
Run this before `/write`, `/atomize`, or `/visuals`. Nothing else in this
skill will work without it.

**Rule 0 (non-negotiable): NEVER invent brand facts.** Anything you can
detect from the host codebase, detect it and show it back to the user for
confirmation. Anything you cannot detect, ASK — do not guess, do not fill a
plausible-sounding placeholder. Every value that ends up in `brand.json` must
trace to either a codebase artifact you actually read or an explicit user
answer.

## Step 1 — Codebase analysis (skip only if cwd is not a project)

"cwd is a project" = the current working directory has a `package.json`
**or** a `.git` directory. If neither exists, skip straight to Step 2 with
nothing prefilled — every answer comes from the interview.

Otherwise, run each probe below and keep whatever it finds as a **draft**
value (label it "detected" when you show it to the user in Step 2 — never
present a detected value as if the user already confirmed it):

- **Framework** — read `package.json` `dependencies`/`devDependencies` for
  `next`, `astro`, `gatsby`, `@sveltejs/kit`, `nuxt`, `remix`, `vite`,
  `hugo`/`jekyll` config files. Used only to sanity-check the other probes
  (e.g. Next.js → `app/` or `pages/` conventions), not stored in `brand.json`.
- **`blogDir`** — glob, in this order, and take the first that exists and
  contains at least one `.md`/`.mdx` file: `content/blog`, `content/posts`,
  `posts`, `_posts`, `src/content`. If more than one matches, prefer the one
  with content and ask the user to confirm in R1 rather than guessing between
  two real candidates.
- **`colors`** — grep for `--primary`, `--brand`, `theme.colors` (and its
  common neighbors `--accent`, `--background`, `--foreground`) in
  `app/globals.css`, `styles/globals.css`, `tailwind.config.{js,ts,mjs}`. Pull
  literal hex/oklch values next to those tokens. Map what you find to the
  contract's `colors.bg`/`colors.text`/`colors.primary`/`colors.accent` —
  only map a token you're confident about; leave the rest blank for R4 rather
  than guessing which detected color is "accent" vs "primary".
- **`logo`** — glob `public/*logo*.{svg,png}` (case-insensitive). Take the
  first hit as a draft candidate; if none, leave blank for R4.
- **Site name / domain** — check, in order: `package.json` `name`, any
  `metadata.title`/`metadata.metadataBase` or `site.name`/`siteUrl` in a
  `next.config.*`, `astro.config.*`, or `site.config.*`, then `git remote -v`
  (parse the repo slug), then a `public/CNAME` file (custom-domain hosting).
  First real match wins; note which source it came from so R1 can say
  "detected from public/CNAME: acme.example".
- **`author`** — grep front matter (`author:`) across the files found in
  `blogDir`. Collect the distinct names seen; if there's exactly one, prefill
  it; if there are several, prefill nothing and let R2 ask.

Write everything found into an in-memory draft (do not write brand.json yet)
so Step 2 can show "detected: X — keep it?" instead of a blank form.

## Step 2 — Interview (AskUserQuestion, max 4 questions per round)

Ask in four short rounds. Each round is a single AskUserQuestion call with at
most 4 questions. Pre-fill option text with detected values where you have
them; every question still needs an explicit answer/confirmation from the
user — do not silently accept a detected value without the user picking it.

**R1 — identity (≤4 questions):**
1. Name — prefill with the detected site name if any, else free text.
2. Domain — prefill with the detected domain if any, else free text.
3. `blogDir` — prefill with the detected path if any (options: the detected
   path, "different path" → free text, or "I don't have a blog yet" →
   default to `content/blog`).
4. `canonicalPattern` — derive a default from the just-confirmed domain as
   `https://<domain>/blog/{slug}` and show it for confirm/edit (some sites
   publish under `/posts/{slug}`, `/articles/{slug}`, etc. — this is a
   derived suggestion, not a detection, so it still needs an explicit
   confirm). This is a required contract key; do not skip it even though
   the plan's interview summary only names name/domain/blogDir for R1 — a
   pattern derived from an answer the user just gave in the same round is
   not "inventing a fact".

**R2 — voice, audience, author, eyebrow (≤4 questions):**
1. Voice — offer 3 archetypes plus "custom": (a) "specific tactics, not
   encouragement" (direct, tactical, no cheerleading), (b) "warm expert"
   (encouraging but concrete, explains the why), (c) "contrarian analyst"
   (challenges conventional advice, leads with data). "Custom" → free text
   for the user's own one-line voice description.
2. Audience — free text (e.g. "junior developers", "first-time founders").
   No safe default; always ask.
3. Author — prefill with the detected front-matter name if exactly one was
   found; otherwise free text, or "no byline yet" → leave blank and tell the
   user `references/playbook.md`'s "visible author" rule will need one before
   publishing.
4. Eyebrow (short tag line under the brand name on cards/video, e.g. "Acme
   Data") — free text, no detection source exists for this.

**R3 — features / weave map (≤4 questions, iterate if there are more than
3-4 real features):**
1. "What are 2-5 things on your site a blog post could plausibly point a
   reader to? (a free tool, a calculator, a checklist, a signup page — or
   none)." Free text, one feature per line, each as `<situation the post is
   about> -> <the feature's name>` (this maps directly to the contract's
   `features[].match` / `features[].name`). If the user has no such feature,
   record `features: []` — do not invent one. Never weave a feature that
   wasn't named here; `references/playbook.md` and `commands/atomize.md`
   both enforce "no match = no weave", so an empty list is a legitimate,
   final answer, not something to fill later.

**R4 — platforms, colors, assets (≤4 questions):**
1. Platforms — multiSelect from the contract's full list (`x`, `reddit`,
   `linkedin`, `instagram`, `youtube`, `medium`, `substack`). Default
   selection = none pre-checked; the user picks what they actually post to.
2. Colors confirm — show the detected `bg`/`text`/`primary`/`accent` (or
   "none detected") and ask the user to confirm or override each; any color
   not detected AND not answered here falls back to the neutral template
   default (`brand.template.json`'s values) — say so explicitly so the user
   knows an unconfirmed color isn't "their brand", it's the placeholder.
3. Logo path — if Step 1 found a candidate, confirm it; else ask for a path
   (relative to the host repo cwd) or "use the placeholder" (keeps
   `brand/logo.svg` as shipped).
4. Font files — ask if the user has their own display/body font files to
   bundle (path relative to cwd, or "use the bundled Geist + Inter"). Most
   users will say "use the bundled fonts" — that's a legitimate answer, not
   a skipped question.

## Step 3 — Write brand.json + BRAND.md

Determine the config location using the SAME "cwd is a project" check from
Step 1:

- **cwd is a project** → write to `<cwd>/.claude/atomizekit.config.json`
  (create the `.claude/` dir if needed) and the readable companion to
  `<cwd>/.claude/BRAND.md`.
- **cwd is not a project** → write to `<skill>/brand/brand.json` and the
  companion to `<skill>/brand/BRAND.md`. (`<skill>` = the directory this
  `commands/setup.md` file lives in, one level up from `commands/`.)

The JSON MUST contain exactly the keys in `brand/brand.template.json` (no
more, no fewer) — every value is either a Step-1 detection the user
confirmed, or a Step-2 answer. Values the user explicitly deferred to the
placeholder (e.g. "use the bundled fonts", "use the placeholder" logo, an
unconfirmed color) get the corresponding `brand.template.json` value, not a
made-up one.

One key is never asked or detected: `distributionDir`. It is the skill's
own scaffold-output convention (where `atomize.py`/the renderers write
drafts under the host repo), not a fact about the brand, so it always takes
the `brand.template.json` default (`content/distribution`) verbatim —
call this out in `BRAND.md` so the user knows it's a skill convention they
can hand-edit later if `content/distribution` collides with something in
their repo, not a detected-or-answered brand fact.

`BRAND.md` is a short human-readable mirror of the same data — headings for
Identity, Voice & Audience, Colors, Fonts, Features/Weave map, Platforms —
so the user can review their setup without reading JSON. Not consumed by any
script; documentation only.

**Copying assets:** if the user supplied a logo or font file path in R4,
copy the file(s) into `<skill>/brand/` regardless of where `brand.json`/the
config lives — every renderer resolves `brand.logo` and `brand.fonts.*File`
relative to `SKILL_ROOT`, per the Task 2 generalization spec. **One skill
install can serve multiple projects/brands** (that's the whole point of the
cwd-config resolution order), so never overwrite the shared default
filenames (`brand/logo.svg`, `brand/fonts/Geist-Bold.otf`,
`brand/fonts/InterVariable.ttf`) with a project's real asset — a second
project's `/setup` run would silently clobber the first project's logo/font.
Instead, derive a project-scoped filename from the confirmed domain (slugify
it: lowercase, `.` and non-alnum → `-`) and copy there:
`brand/logo-<domain-slug>.<ext>`, `brand/fonts/<domain-slug>-<original
filename>`. Then point the written config's `logo` / `fonts.displayFile` /
`fonts.bodyFile` at that project-scoped `brand/...` path — not the shared
default. If the user kept the placeholder/bundled defaults, do not copy
anything — the config just points at the existing `brand/logo.svg` /
`brand/fonts/Geist-Bold.otf` / `brand/fonts/InterVariable.ttf` shipped with
the skill.

## Step 4 — Seed `data/geo/prompts.json`

Write `<cwd>/data/geo/prompts.json` (host repo cwd, not the skill dir — same
convention as `scripts/geo/measure.ts`'s `DEFAULT_PROMPTS_FILE`). Create
`data/geo/` if it doesn't exist.

Generate 5-8 prompts by combining the R3 features and the R2 audience into
realistic natural-language questions that audience would actually ask an AI
answer engine (Perplexity/ChatGPT/Gemini-style phrasing, not SEO keywords —
e.g. for audience "junior developers" and feature "resume/ATS advice ->
Acme's free resume checker": "why do junior developer resumes get rejected
by ATS software"). If R3 came back with `features: []`, generate prompts
from the audience + voice alone (general problem-space questions that
audience has).

Each entry follows the `PromptMeta` shape exactly:

```json
{ "id": "kebab-case-slug", "prompt": "the natural-language question", "ourUrl": "https://<brand.domain>/", "value": 0.6, "winnability": 0.5 }
```

- `id` — kebab-case, unique, derived from the prompt text.
- `ourUrl` — the brand's homepage (`https://<brand.domain>/`) as a
  placeholder, since no specific article exists yet to point to. Note this in
  a top-level comment-equivalent (see below) so the user knows to update it
  once they publish the post that actually answers each prompt.
- `value` / `winnability` — default every entry to `0.6` / `0.5` (per the
  plan's fixed defaults). These are deliberately generic starting weights.

Because JSON has no comments, prepend the hand-tune note as the file's
README pointer instead: after writing `prompts.json`, also write or append
one line to `BRAND.md` under a "GEO prompts" heading: "Seeded
`data/geo/prompts.json` with N starter prompts at value=0.6/winnability=0.5
— hand-tune these two numbers per prompt (and `ourUrl` once you have a real
post for it) as you learn what's actually winnable."

## Step 5 — Validate

Run `node <skill>/scripts/check_render.mjs` from the host repo cwd (so the
distribution fixture lands in the host's `content/distribution/demo/`, same
as any other render). It self-provisions from `brand.template.json` only if
no config was found at all — if Step 3 wrote one, this run exercises the
REAL brand config end-to-end (colors, fonts, logo). Confirm it prints
`check_render.mjs: all 4 cards OK` and exits 0. Tell the user the 4 PNGs are
at `content/distribution/demo/media/{feed,story,thumb,banner}.png` and to
eyeball them for their real colors/fonts/logo before trusting the pipeline
for a real post. If it fails, do not mark setup complete — report the
failure and stop; `brand.json`/the config is still wrong.

## Step 6 — Done

Tell the user: brand config written (path from Step 3), `BRAND.md` for a
human-readable review, `data/geo/prompts.json` seeded, cards validated. Next
step is `commands/write.md` to draft a first post, or `commands/atomize.md`
if a post already exists.
