// Shared media helpers: shell runner + relevance-scored stock fetch + brand asset sync.
// Used by render_short.mjs (voiced Short) and render_reel.mjs (stat reel).
import { spawnSync } from "node:child_process";
import { writeFileSync, copyFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";

export const run = (cmd, cmdArgs, opts = {}) => {
  const r = spawnSync(cmd, cmdArgs, { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"], ...opts });
  if (r.status !== 0) {
    console.error(`${cmd} ${cmdArgs.slice(0, 3).join(" ")}... failed:\n${r.stderr || r.stdout}`);
    process.exit(1);
  }
  return r.stdout;
};

// hyperframes serves each composition dir (templates/video, templates/shorts) as
// its own web root, so templates can't reach up to ../../brand/... for the logo
// or fonts (Studio preview + `hyperframes lint` both flag/404 that traversal).
// Builders copy the brand's logo + fonts INTO the template dir before every
// render instead — a working file synced from brand.json, exactly like ./vo.wav.
// Destination filenames are fixed to what the template's CSS/<img> literally
// references (fonts/<basename>, ./<logo-basename>), so a brand can swap the
// FILE at that brand.json path without editing any template markup.
export function copyBrandAssets(skillRoot, brand, templateDir) {
  const fontsDir = path.join(templateDir, "fonts");
  mkdirSync(fontsDir, { recursive: true });
  const pairs = [
    [path.join(skillRoot, brand.fonts.displayFile), path.join(fontsDir, path.basename(brand.fonts.displayFile))],
    [path.join(skillRoot, brand.fonts.bodyFile), path.join(fontsDir, path.basename(brand.fonts.bodyFile))],
    [path.join(skillRoot, brand.logo), path.join(templateDir, path.basename(brand.logo))],
  ];
  for (const [src, dest] of pairs) {
    if (!existsSync(src)) {
      console.error(`missing required brand asset: ${src}`);
      process.exit(1);
    }
    copyFileSync(src, dest);
  }
}

// Stock b-roll per scene (real footage, never AI-generated). Network happens HERE
// (the build step); the hyperframes render itself stays offline on cached assets.
// Pexels (free key, portrait videos + photos, no attribution) when PEXELS_API_KEY
// is set; keyless fallback = Openverse CC0 images (public domain, no attribution).
const STOPWORDS = new Set(["a", "an", "the", "of", "on", "in", "with", "and", "person", "young"]);
const tokens = (s) => s.toLowerCase().split(/[^a-z]+/).filter((t) => t.length > 2 && !STOPWORDS.has(t));

// query: string | string[] of alternates, most specific first. Openverse CC0 is a
// small literal-matching corpus — a WRONG image is worse than none, so results are
// relevance-scored (query-token overlap with title+tags) and rejected below a
// floor; the scene then keeps the brand-glow look instead.
export async function fetchStock(query, sceneDur, outBase) {
  const queries = Array.isArray(query) ? query : [query];
  const key = process.env.PEXELS_API_KEY;
  try {
    if (key) {
      // Pexels search relevance is trustworthy — first hit per query wins.
      for (const q of queries) {
        const vres = await fetch(
          `https://api.pexels.com/videos/search?query=${encodeURIComponent(q)}&orientation=portrait&per_page=5`,
          { headers: { Authorization: key } },
        ).then((r) => r.json());
        const vid = (vres.videos || []).find((v) => v.duration >= sceneDur);
        if (vid) {
          const file = vid.video_files
            .filter((f) => f.height >= 1000 && f.width < f.height)
            .sort((a, b) => a.height - b.height)[0] || vid.video_files[0];
          const out = `${outBase}.mp4`;
          writeFileSync(out, Buffer.from(await (await fetch(file.link)).arrayBuffer()));
          return { path: out, type: "video", query: q };
        }
        const pres = await fetch(
          `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&orientation=portrait&per_page=3`,
          { headers: { Authorization: key } },
        ).then((r) => r.json());
        const photo = (pres.photos || [])[0];
        if (photo) {
          const out = `${outBase}.jpg`;
          writeFileSync(out, Buffer.from(await (await fetch(photo.src.large2x || photo.src.large)).arrayBuffer()));
          return { path: out, type: "image", query: q };
        }
      }
    }
    // Keyless: Openverse CC0 images, relevance-scored. Never take-first blindly.
    for (const q of queries) {
      const qTokens = tokens(q);
      if (qTokens.length === 0) continue;
      const ores = await fetch(
        `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&license=cc0&page_size=20`,
      ).then((r) => r.json());
      const floor = Math.min(2, qTokens.length); // >=2 token hits (or all, for 1-token queries)
      let best = null;
      for (const r of ores.results || []) {
        if (!r.url) continue;
        const hay = new Set(tokens(`${r.title || ""} ${(r.tags || []).map((t) => t.name).join(" ")}`));
        const score = qTokens.filter((t) => hay.has(t)).length;
        if (score >= floor && (!best || score > best.score)) best = { r, score };
      }
      if (best) {
        const out = `${outBase}.jpg`;
        writeFileSync(out, Buffer.from(await (await fetch(best.r.url)).arrayBuffer()));
        return { path: out, type: "image", query: q };
      }
    }
    console.warn(`no RELEVANT stock for [${queries.join(" | ")}] — scene keeps the brand-glow look`);
  } catch (e) {
    console.warn(`stock fetch failed for "${queries[0]}": ${e.message} — scene renders without b-roll`);
  }
  return null; // no bg: scene falls back to the brand glow look
}
