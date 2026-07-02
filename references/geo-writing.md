# GEO writing — AEO/GEO rules (why this skill exists)

AI engines cite, they don't rank. Citations are the new clicks. Being everywhere is not vanity — external mentions are trust signals AI weighs, and the canonical blog is the source it quotes. This is the ruleset that makes the content citable. Sources: [krillinai/GEO](https://github.com/krillinai/GEO), [AirOps AEO guide](https://www.airops.com/blog/aeo-answer-engine-optimization).

## Content structure (the blog + Medium/Substack long-form)
- **Open with a self-contained answer, 40-60 words.** It must stand alone if an AI lifts only that paragraph. Then the proof, then the next question a reader would ask.
- **Sequential headings H2 > H3 > H4.** Measured 2.8x citation lift over unstructured pages.
- Paragraphs 2-4 sentences. Bullets for steps, constraints, options.
- **Topical depth:** answer the adjacent questions too, not one thin page. Cluster around the entity the brand serves (e.g. "resume ATS scoring" for a careers brand, "checkout conversion" for an e-commerce brand — whatever the brand's actual category is).

## What earns a citation
- **First-party data.** Whatever unique dataset or stats the brand owns (usage numbers, benchmark scores, demand data — see `brand.json` for what the brand tracks). AI has no reason to cite content it can already generate — original numbers are the moat.
- **Freshness.** 83% of AI citations come from pages updated within 12 months. Re-touch and re-date evergreen posts.
- **Visible author + credentials.** Real byline (`brand.author`), real expertise on the page.
- No thin pages restating common knowledge.

## Schema (on the canonical blog — `commands/write.md` adds it)
- FAQPage (only for a visible Q&A section), HowTo (step content), Article, Organization + Person/Author.
- **Schema must mirror visible content.** No hidden or implied markup — that breaks trust signals.

## Entity consistency (why every variant links canonical)
- Same brand name (`brand.name`), same claims, same canonical URL (built from `brand.canonicalPattern`, e.g. `https://acme.example/blog/<slug>`) on every platform in `brand.platforms`. That consistency is what associates the brand with the right concepts in the model.
- Multi-platform presence (Reddit, YouTube, LinkedIn, Medium) = the external mentions AI treats as authority. Distribution feeds GEO; it is not separate from it.

## Crawlability
- Allow AI crawlers in `robots.txt`: GPTBot, PerplexityBot, Google-Extended, ClaudeBot. If they can't read the page, it can't be cited.
- Keep the blog in the XML sitemap so AI discovery finds fresh posts.

## Measurement
- **Test on Perplexity first** — it shows citations inline, the fastest feedback loop. Then ChatGPT + Google AI Overviews.
- Track: citation share vs named competitors, question-coverage % (how many prompts you answer clearly), entity association (brand tied to the right concepts).
- Citation shifts appear ~4-8 weeks after structural improvements on pages that already have authority.

## The one-line rule
Publish original, dated, well-structured data on the canonical blog; mirror the entity everywhere with a link back. Volume without the citable source earns nothing.
