# /write — Claude researches and writes a data-backed article

No AI key: Claude (this agent) is the writer and researcher. Free tooling
supplies the data — WebSearch/WebFetch for cited facts, and whatever
first-party dataset or numbers the brand owns.

## Process

1. Confirm the topic has real demand or a genuine news hook (search-console
   data, trend data, or a fresh headline you can ground the piece in — however
   the host project surfaces that). A topic with near-zero demand earns an
   internal link from an existing page, not a standalone article.
2. Research with WebSearch/WebFetch. Collect cited facts. Pull real first-party
   numbers (the brand's own data, benchmarks, or dataset) wherever a claim
   would otherwise be generic.
3. Write the article using the GEO (generative-engine-optimization) structure
   rules below — this is what makes the piece citable by AI answer engines,
   not just rankable in classic search. Full rationale in
   `references/geo-writing.md`.
4. Anti-slop gate: every claim is sourced or a real stat. No generated tips,
   no filler intro, no "in conclusion". Drop anything a generic AI could have
   written without the research step.
5. Save the article to `{brand.blogDir}/<slug>.mdx` in the HOST repo (cwd) as
   a **DRAFT** (`status: draft`). The user reviews and publishes it
   themselves. **Never set `status: published`** — that is the user's manual
   step, always. Tell the user the draft is ready for their review.

## Article-structure rules (GEO)

- **Self-contained opener, 40-60 words.** The first paragraph must stand
  alone as a complete answer if an AI system lifts only that paragraph —
  no "in this article we'll cover…" throat-clearing. State the answer, then
  the proof, then the next question a reader would ask.
- **Sequential heading hierarchy: H2 > H3 > H4.** Never skip a level. This
  structure alone measures a real citation lift over unstructured pages.
- Paragraphs 2-4 sentences. Bullets for steps, constraints, and options —
  not prose lists.
- **Topical depth.** Answer the adjacent questions too, not one thin page.
  Cluster the article around the entity it's about (the product category,
  the audience's core problem) instead of a single narrow query.
- **First-party data wins citations.** An AI system has no reason to cite
  content it could already generate itself — original numbers, from data
  the brand actually owns, are the moat. Prefer a real stat from the
  brand's own dataset/analytics over a generic claim, every time.
- **Freshness.** Most AI citations come from pages updated within the last
  12 months. Re-touch and re-date evergreen posts instead of only shipping
  new ones.
- **Visible author + credentials.** Real byline (`brand.author`), real
  expertise signal on the page.
- **Schema.** Add `FAQPage` (only if there's a genuinely visible Q&A
  section), `HowTo` (for step content), and `Article` structured data on
  the canonical blog page — and make sure it mirrors the visible content
  exactly. No hidden or implied markup; that breaks the trust signal it's
  meant to create.
- A specific, literal title (the query someone would actually search) and a
  150-160 character excerpt.

## Draft-only contract (non-negotiable)

This command drafts only; the user publishes. Save the file with
`status: draft`. Never set `status: published` — that is always a manual,
human step. Whatever reads the blog directory in the host project (a
markdown/MDX parser, a sitemap generator, etc.) should only surface the post
once the user flips that field themselves.
