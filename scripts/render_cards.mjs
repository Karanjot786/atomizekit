#!/usr/bin/env node
// render_cards.mjs — keyless, headless, offline PNG image-card renderer.
//
// Reads <cwd>/{brand.distributionDir}/<slug>/post.json (simple JSON with
// headline/stat/statLabel/url), builds ONE takumi Renderer, registers the
// brand fonts ONCE, then loops the 4 formats calling templates/card.jsx ->
// writes PNGs to <cwd>/{brand.distributionDir}/<slug>/media/.
//
// Usage: node scripts/render_cards.mjs <slug>
//
// No network at render time. Fonts + logo are resolved from brand.json
// paths relative to SKILL_ROOT (see scripts/lib_brand.mjs). Fails loud
// (non-zero exit) on any missing input — no silent tofu/fallback-font
// behavior, and no brand.json means "run /setup first" via loadBrand().
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { registerHooks } from "node:module";
import { Renderer } from "takumi-js/node";
import { fromJsx } from "takumi-js/helpers/jsx";
import { loadBrand, SKILL_ROOT } from "./lib_brand.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// templates/card.jsx has a `.jsx` extension (it's the design surface, per
// the brief) but contains zero actual JSX syntax — Node's ESM resolver
// just doesn't recognize `.jsx` as a loadable module type by default.
// Register a one-line hook that tells it to treat `.jsx` as ESM, then
// dynamic-import the template. No babel/esbuild/swc dependency.
registerHooks({
  load(url, context, nextLoad) {
    if (url.endsWith(".jsx")) return nextLoad(url, { ...context, format: "module" });
    return nextLoad(url, context);
  },
});
const cardTemplateUrl = pathToFileURL(path.join(__dirname, "..", "templates", "card.jsx"));
const { renderCard, FORMATS } = await import(cardTemplateUrl);

/** Parse the simple `key: value` front matter used by legacy index.md fixtures. */
function parseFrontMatter(text) {
  const match = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) {
    throw new Error("index.md has no --- front matter block");
  }
  const fm = {};
  for (const line of match[1].split("\n")) {
    if (!line.trim() || !line.includes(":")) continue;
    const idx = line.indexOf(":");
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    value = value.replace(/^["']|["']$/g, "");
    fm[key] = value;
  }
  return fm;
}

/** Slug dir lives in the HOST project's cwd, not next to the skill. */
async function loadFixture(slug, distributionDir) {
  const dir = path.join(process.cwd(), distributionDir, slug);
  const jsonPath = path.join(dir, "post.json");
  const indexPath = path.join(dir, "index.md");
  let data, src;
  if (existsSync(jsonPath)) {
    data = JSON.parse(await readFile(jsonPath, "utf-8"));
    src = jsonPath;
  } else if (existsSync(indexPath)) {
    data = parseFrontMatter(await readFile(indexPath, "utf-8"));
    src = indexPath;
  } else {
    throw new Error(`no post.json or index.md for slug '${slug}' in ${dir} — run atomize.py first`);
  }

  const required = ["headline", "stat", "statLabel", "url"];
  const missing = required.filter((k) => data[k] === undefined || data[k] === null || data[k] === "");
  if (missing.length > 0) {
    throw new Error(`${src} is missing required field(s): ${missing.join(", ")} (fill post.json with a real stat)`);
  }

  return {
    headline: String(data.headline),
    stat: String(data.stat),
    statLabel: String(data.statLabel),
    url: String(data.url),
    indexPath: src,
    dir,
  };
}

/** Fonts + logo are brand.json paths, resolved from SKILL_ROOT (the skill's own repo). */
async function loadBrandAssets(brand) {
  const fontPath = path.join(SKILL_ROOT, brand.fonts.displayFile);
  const bodyFontPath = path.join(SKILL_ROOT, brand.fonts.bodyFile);
  const logoPath = path.join(SKILL_ROOT, brand.logo);

  for (const p of [fontPath, bodyFontPath, logoPath]) {
    if (!existsSync(p)) {
      // Fail loud — no silent fallback to a system/default font.
      throw new Error(`missing required brand asset: ${p}`);
    }
  }

  const [displayFont, bodyFont, logo] = await Promise.all([
    readFile(fontPath),
    readFile(bodyFontPath),
    readFile(logoPath),
  ]);

  return { displayFont, bodyFont, logo };
}

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error("usage: node scripts/render_cards.mjs <slug>");
    process.exit(1);
  }

  const brand = loadBrand();
  const fixture = await loadFixture(slug, brand.distributionDir);
  const { displayFont, bodyFont, logo } = await loadBrandAssets(brand);

  // ONE renderer, fonts registered ONCE, reused across all 4 sizes.
  const renderer = new Renderer({
    fonts: [
      { name: brand.fonts.display, data: displayFont, weight: 700 },
      { name: brand.fonts.body, data: bodyFont, weight: 500 },
    ],
    loadDefaultFonts: false,
  });

  const data = {
    headline: fixture.headline,
    stat: fixture.stat,
    statLabel: fixture.statLabel,
    url: fixture.url,
    logo,
  };

  const mediaDir = path.join(fixture.dir, "media");
  await mkdir(mediaDir, { recursive: true });

  const written = [];
  for (const format of Object.keys(FORMATS)) {
    const { width, height } = FORMATS[format];
    const tree = renderCard(data, format, brand);
    const { node, stylesheets } = await fromJsx(tree);
    const png = await renderer.render(node, { width, height, format: "png", stylesheets });

    const outPath = path.join(mediaDir, `${format}.png`);
    await writeFile(outPath, png);
    written.push({ format, outPath, width, height, bytes: png.length });
  }

  console.log(`rendered ${written.length} cards for "${slug}":`);
  for (const w of written) {
    console.log(`  ${w.format}.png  ${w.width}x${w.height}  ${w.bytes} bytes  -> ${path.relative(process.cwd(), w.outPath)}`);
  }
}

main().catch((err) => {
  console.error("render_cards.mjs failed:", err.message);
  process.exit(1);
});
