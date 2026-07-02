# Playbook — per-platform voice rules

One blog post, N native shapes — one per entry in `brand.json` `platforms[]`. Every variant links back to the canonical blog URL (`brand.canonicalPattern` with `{slug}` substituted, e.g. `https://acme.example/blog/<slug>`). Voice comes from `brand.voice`: specific tactics, not encouragement, is the default posture — "Your resume failed ATS because of a two-column layout" is a post; "believe in yourself" is not.

Rules below were rebuilt 2026-07 from platform-verified research. Numbers from
agency studies are directional, not platform-official — trust the direction,
hedge the digits.

## X (Twitter)
- Two modes, avoid the middle: (a) **short hit** — contrarian one-liner / hypocrisy expose / paradox, ~70-100 chars, `<=15` words; (b) **thread** — 4-7 tweets for authority topics (~35% higher per-tweet engagement). Never a 200-char mush.
- No hashtags, no emojis. Plain text reads confident.
- Write for REPOSTS and replies, not likes — signal order is roughly reposts > replies > bookmarks > likes. A line someone would screenshot or quote beats a line someone nods at.
- Canonical link goes in a REPLY to your own post, never the main tweet — in-body external links get near-zero reach for non-Premium accounts; the reply workaround still functions (2026).
- Post the reply within the first 30-60 min; visibility halves roughly every 6 hours.
- Templates: `Every [authority] says [X] until [proof they don't].` / `You need [A] to get [B]. You need [B] to get [A]. how does that work?` / `[common behavior] is not [what they think it is].`

## Reddit
- Native text post. Be a person, not a brand. **Comment-first beats post-first** for anything brand-adjacent: answering an existing question is the lowest-risk, highest-trust placement. Subreddits' sanctioned weekly threads (e.g. Feedback Friday) are the safest standalone slots.
- Title = the whole pitch: specific numbers/timeframes/outcomes ("200 rejections -> 5 interviews in a week: what I changed"), never generic ("Tips for your resume").
- Body 100-300 words, scannable: 2-3 sentence paragraphs, bullets, bold key lines. First-person specificity ("I've screened resumes for 6 years") earns trust; "5 tips" listicle framing reads SEO-farmed.
- The old 9:1 rule is retired — Reddit scores ACCOUNTS (Contributor Quality Score): overall behavior pattern, account age (30d+ before anything promotional), genuine participation. In practice ~95:5 participation:promo.
- No link-drop. Link only if it genuinely completes the answer AND the sub allows it; the post must work with the link deleted. Follow each sub's flair/format rules exactly — AutoModerator removes before a human ever sees.
- Timing is a real lever: 9am-12pm EST posts massively outperform late-night (same content).

## LinkedIn
- 1,300-1,900 characters (~150-300 words). Under ~500 chars or over ~3,000 underperforms. "Keep it short" is 2022 advice.
- Hook in the first 1-2 lines — before the "…see more" fold — a number, bold claim, or contrarian line, ~8 words per line.
- Hard line break every 1-2 sentences. Dwell time is the dominant ranking signal; walls of text kill it.
- Post from the PERSONAL profile (founder voice), not the company page — personal reach is ~5-10x. Page reshares are secondary amplification only.
- One real data point from the blog — that's the credibility. Canonical link inline is acceptable (the "link in first comment" trick is disputed in 2026 — don't rely on it either way).
- 3-5 niche hashtags at the end (search matching only, no reach boost). Never bait phrasing ("comment YES", "tag someone") — explicitly demoted since the 2025 authenticity update.
- For reach-oriented pieces, a native document/PDF carousel (the 4 image cards work) multiplies engagement vs text; use plain text when the goal is comments.

## Instagram
- Caption 150-220 words. Hook must land inside the first ~125 characters (pre-truncation). No greeting, no emoji string — a stat or claim.
- Write the caption like on-page SEO: natural keywords someone would search in real sentences. IG search AND Google now index public captions.
- 3-5 niche hashtags max, at the end. Hashtag walls are dead and read as spam.
- Carousel = save-engineering: 8-10 slides, 30-50 words per slide, one idea per slide, cover slide opens a curiosity gap; put the checklist/template ON the slides (saves are the ranking currency: saves/sends ~3x likes).
- Every image gets descriptive keyword alt text (<125 chars) — ranking signal in-app + Google.
- "Link in bio" needs a reason: e.g. "Free checker — link in bio", never bare "link in bio".
- Never engagement-bait; never repost watermarked/cross-posted media (60-70% reach cut, repeat = excluded from recommendations).

## YouTube
- The voiced Short IS the YouTube asset (`render_short.mjs`): hook in the first 3 seconds, first-frame text <7 words high-contrast, one insight per scene, CTA scene carries the brand weave.
- Script format in the file: `[0-3s hook] / [body] / [CTA + link mention]`. Canonical link in the description.

## Medium
- Full republish with the canonical set to the blog (Import Story or canonical field). Canonical republish is explicitly allowed AND Boost-eligible — the risk of skipping the canonical is on OUR site's rankings, not a Medium penalty.
- **Submit to an active niche publication in the brand's category** — publication editors are now the main Boost pathway (the public nomination program closed May 2026). Self-publish only as fallback.
- Literal, non-clickbait title + plain-sentence subtitle — curators reject vague/sensational titles.
- 3-5 tags, mixed competition (a broad one + niche ones). Structure for read-through (subheads, short paragraphs) — completion ratio drives distribution.
- **AI policy (hard constraint):** undisclosed majority-AI writing is capped to network-only and can NEVER be paywalled. Ours is AI-drafted -> keep Medium posts FREE (no Partner Program), human-edit for first-hand voice, and ground in a real scenario. First-hand credibility is also what curators score.

## Substack
- **Long-form wins here** — 800-1,800 words. Top newsletters average ~2x the platform's typical length; the "keep emails short" rule is wrong on Substack. Expand the blog's core argument into a real letter, don't excerpt it.
- Subject line under ~50 characters, key detail first (mobile truncates). But optimize for replies/clicks/restacks, not open rate (privacy features broke open tracking).
- First-person, NAMED voice — signed by a person (`{brand.author}`), never "the [brand] team". The parasocial writer-reader bond is the whole platform.
- One personal opening line, the full value in the email, then the read-the-full-guide CTA to the blog. Best work stays free; free content is the ad for everything else.
- Growth note (posting behavior, not this file's copy): daily Notes are the #1 discovery channel now — a 1-line insight from each post makes a good Note.

## AI-tell avoidance (ALL platforms — load-bearing for this system)
Claude drafts every variant, and platforms now detect "AI slop": LinkedIn runs a
classifier (self-reported ~94%) that suppresses generic posts; Reddit mods flag
patterns; IG demotes unoriginal content. The tells to strip in EVERY draft:
- Em-dash overuse, "rule of three" everywhere, negative parallelisms ("It's not X, it's Y" more than once), hedged generic language, uniform paragraph rhythm.
- No content with nothing first-hand: every variant needs one concrete, specific detail (a real number, a named scenario) that generic AI text wouldn't have.
- Vary structure between variants and between posts. Same-shaped posts across a feed = pattern = suppression.
- The `humanizer` skill's checklist applies — when a draft reads templated, rewrite it before it ships.

## The interlink rule (all platforms)
The blog is the one canonical source, backed by the brand's own first-party data. Every variant points to it. That single consistent entity — same claim, same source, many surfaces — is what AI answer engines cite (AEO/GEO). Drop the canonical link and the reach earns the site nothing.

## Brand weave (all platforms EXCEPT Reddit)

Every variant may name exactly ONE brand feature — by name — as the natural
"here's how to act on this" step. Passive integration: the product is the
tool that executes the advice, never the subject of the post.

Map the post's advice to the closest entry in `brand.json` `features[]`
(each entry is `{ "match": "<topic this covers>", "name": "<feature to name>" }`).
**If nothing in `features[]` matches the post's advice, skip the weave
entirely** — never invent a feature or force a mismatched one in.

Rules:
- Exactly one mention per variant, in the CTA or the last value line. Never two.
- Value-first phrasing: "check yours free with [feature name]" — never
  "[brand] is the best…". If cutting the mention wouldn't weaken the reader's
  next step, the phrasing is wrong; rewrite until the feature IS the next step.
- The video CTA scene (post.json scenes[], kind "cta") carries the same weave.
- **Reddit: never.** Participation only — brand promo gets buried and distrusted.
- Medium is a full republish; the brand lives in the blog body already. No extra plug.
