# Contributing

Thanks for looking. atomizekit is a Claude Code skill: a `SKILL.md` router plus glue
scripts. It stays keyless and draft-only by design — please keep both properties in
any change.

## Setup

```bash
git clone https://github.com/Karanjot786/atomizekit
cd atomizekit && npm install
npm test        # runs the node:test suites + renders four demo cards
```

You need Node 22.15+ and Python 3. Video work also needs FFmpeg 7+ and Chrome
(`npx hyperframes doctor --json`).

## Ground rules

- **Keyless.** No AI or platform API key becomes required. `PEXELS_API_KEY` stays
  optional, with a keyless fallback.
- **Draft-only.** Nothing in this repo posts or publishes. The human posts.
- **Brand-agnostic.** No brand's name, color, or copy is hardcoded — everything reads
  from `brand.json` / the host config.
- `npm test` must pass. If you change render or scoring logic, add or update a test.

## Pull requests

Keep them focused. Describe what changed and why. Green CI is required.
