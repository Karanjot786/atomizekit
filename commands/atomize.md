# /atomize

Turn one blog post into native drafts for every platform in `brand.json`, all pointing at the canonical blog URL.

Process:
1. Confirm the blog exists: `{brand.blogDir}/<slug>.mdx` in the host repo (cwd). None? Write it with `commands/write.md` first — it is the canonical source.
2. Scaffold: `python3 scripts/atomize.py --slug <slug>`. Fails loud with "run /setup first" if `brand/brand.json` is missing. Creates `{brand.distributionDir}/<slug>/{<platform>...,index}.md` (one file per entry in `brand.platforms`) plus `post.json`, and prints the canonical URL (`brand.canonicalPattern` with `{slug}` substituted).
3. For each file, write the variant natively (see `references/playbook.md`):
   - Pull ONE insight or real stat from the blog per platform. Not the blog intro copied N times.
   - Match the platform's voice and format (the file header carries the rule).
   - Put the canonical link where that platform wants it (X: reply; Reddit: only if it fits and the sub allows; LinkedIn: inline; Instagram: link in bio; YouTube: description).
   - Weave in a brand feature only where `references/playbook.md` says to, using `brand.json` `features[]` — never invent one.
4. Leave `posted: false`. Do NOT post — this skill has no credentials. Tell the user the drafts are ready and posting is their call.
5. `index.md` is the tracker: platform → file → posted. The user flips `no`/`false` to posted after posting each one manually.
