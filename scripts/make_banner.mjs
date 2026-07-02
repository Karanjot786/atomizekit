#!/usr/bin/env node
// Render atomizekit's own repo banner with atomizekit's own engine (takumi).
// Self-contained: hardcodes the skill's identity (this is the skill's banner, not
// brand-agnostic output) and uses the bundled OFL fonts. Output: assets/banner.png.
// Usage: node scripts/make_banner.mjs
// ponytail: no new dep — reuse the card renderer's takumi path.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Renderer } from "takumi-js/node";
import { fromJsx } from "takumi-js/helpers/jsx";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const W = 1584, H = 396;
const TEAL = "#2DD4BF", EMERALD = "#34D399", BG = "#0A0A0B", TEXT = "#FAFAFA", DIM = "#9a9aa2";

// minimal hyperscript (same shape as templates/card.jsx)
const h = (type, props, ...kids) => ({ type, props: { ...props, children: kids.flat(Infinity).filter(Boolean) } });

const banner = h("div", {
  style: { width: W, height: H, display: "flex", background: BG, color: TEXT, fontFamily: "Inter", overflow: "hidden" },
},
  h("div", { style: { width: 12, height: H, background: TEAL } }), // left accent bar
  h("div", {
    style: { display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 100px", flexGrow: 1 },
  },
    h("div", { style: { fontSize: 26, letterSpacing: 5, color: EMERALD, fontWeight: 500 } }, "CLAUDE CODE SKILL · KEYLESS · DRAFT-ONLY"),
    h("div", { style: { display: "flex", fontFamily: "Geist", fontWeight: 700, fontSize: 140, letterSpacing: -5, lineHeight: 1, marginTop: 16 } },
      h("span", null, "atomizekit"),
      h("span", { style: { color: TEAL } }, "."),
    ),
    h("div", { style: { width: 120, height: 6, background: TEAL, borderRadius: 3, marginTop: 28, marginBottom: 26 } }),
    h("div", { style: { fontSize: 31, color: DIM, maxWidth: 1180, lineHeight: 1.35 } },
      "One idea becomes a blog, 7 platform drafts, image cards, and voiced video. You review, you post."),
  ),
);

const renderer = new Renderer({
  fonts: [
    { name: "Geist", data: await readFile(path.join(ROOT, "brand/fonts/Geist-Bold.otf")), weight: 700 },
    { name: "Inter", data: await readFile(path.join(ROOT, "brand/fonts/InterVariable.ttf")), weight: 500 },
  ],
  loadDefaultFonts: false,
});

const { node, stylesheets } = await fromJsx(banner);
const png = await renderer.render(node, { width: W, height: H, format: "png", stylesheets });
await mkdir(path.join(ROOT, "assets"), { recursive: true });
const out = path.join(ROOT, "assets", "banner.png");
await writeFile(out, png);
console.log(`banner ${W}x${H}, ${png.length} bytes -> ${path.relative(process.cwd(), out)}`);
