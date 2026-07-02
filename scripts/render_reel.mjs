#!/usr/bin/env node
// Stat-reel renderer (IG): the animated data card, now with VO + stock b-roll bed.
// post.json -> one Kokoro TTS line -> fetchStock bed -> hyperframes render
// (templates/video) -> media/reel.mp4. Keyless, local. ~8-10s.
// Usage: node scripts/render_reel.mjs <slug> [--voice af_heart] [--quality draft|standard|high]
// ponytail: templates/video is the working dir (vo.wav/fonts/logo.svg/assets) — sequential renders only.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { run, fetchStock, copyBrandAssets } from "./media_helpers.mjs";
import { loadBrand, SKILL_ROOT } from "./lib_brand.mjs";
import path from "node:path";
import os from "node:os";

const TEMPLATE = path.join(SKILL_ROOT, "templates", "video");
try { process.loadEnvFile(path.join(process.cwd(), ".env")); } catch { /* no .env in the host project — env vars only */ }

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--"));
const flag = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const voice = flag("voice", "af_heart");
const quality = flag("quality", "draft");
if (!slug) { console.error("usage: node scripts/render_reel.mjs <slug> [--voice af_heart] [--quality draft]"); process.exit(1); }

const brand = loadBrand();

// Slug dir lives in the HOST project's cwd, not next to the skill (see render_cards.mjs).
const slugDir = path.join(process.cwd(), brand.distributionDir, slug);
const postPath = path.join(slugDir, "post.json");
if (!existsSync(postPath)) { console.error(`no post.json at ${postPath} — run atomize.py first`); process.exit(1); }
const post = JSON.parse(readFileSync(postPath, "utf-8"));
for (const k of ["headline", "stat", "statLabel", "url"]) {
  if (!post[k]) { console.error(`post.json missing "${k}" — fill it with a real value first`); process.exit(1); }
}

// Sync the brand's logo + fonts into the template working dir (hyperframes serves
// the composition dir as its own web root — see the note atop templates/video/index.html).
copyBrandAssets(SKILL_ROOT, brand, TEMPLATE);

const tmp = path.join(os.tmpdir(), `reel-${slug}-${process.pid}`);
mkdirSync(tmp, { recursive: true });

// 1) One VO line. post.reelVoText overrides; default speaks the data claim.
const voText = (post.reelVoText ||
  `${post.headline}. ${post.stat} ${post.statLabel}. See the full breakdown on ${brand.domain}.`)
  .replace(/\n/g, " ").replace(/\s+/g, " ").trim();
const wav = path.join(TEMPLATE, "vo.wav");
const out = run("npx", ["--yes", "hyperframes", "tts", voText, "-v", voice, "-s", "0.95", "-o", wav, "--json"]);
const voDur = JSON.parse(out.trim().split("\n").pop()).durationSeconds;
console.log(`reel VO: ${voDur.toFixed(1)}s`);
const totalDur = +Math.max(6, voDur + 0.6).toFixed(2);

// 2) B-roll bed. post.reelQuery, else the hook scene's stockQuery, else none.
const q = post.reelQuery || (post.scenes && post.scenes[0] && post.scenes[0].stockQuery);
const vars = {
  headline: post.headline, stat: post.stat, statLabel: post.statLabel,
  url: post.url, eyebrow: post.eyebrow, voDur,
  brand: { name: brand.name, eyebrow: brand.eyebrow, domain: brand.domain, colors: brand.colors },
};
if (q) {
  const assetsDir = path.join(TEMPLATE, "assets");
  mkdirSync(assetsDir, { recursive: true });
  const got = await fetchStock(q, totalDur, path.join(assetsDir, "reel_bg"));
  if (got) {
    vars.bg = `./assets/${path.basename(got.path)}`;
    vars.bgType = got.type;
    console.log(`reel b-roll: ${got.type} (matched "${got.query}")`);
  }
}

// 3) Render (patch template duration — runtime reads the raw attribute).
const varsFile = path.join(tmp, "vars.json");
writeFileSync(varsFile, JSON.stringify(vars));
mkdirSync(path.join(slugDir, "media"), { recursive: true });
const outMp4 = path.join(slugDir, "media", "reel.mp4");
const htmlPath = path.join(TEMPLATE, "index.html");
const originalHtml = readFileSync(htmlPath, "utf-8");
// Static-inject media at the markers — hyperframes only registers media present in raw HTML.
const bedHtml = vars.bg
  ? `<div class="bed">${vars.bgType === "video"
      ? `<video class="clip" src="${vars.bg}" data-start="0" data-duration="${totalDur}" data-volume="0" muted></video>`
      : `<img id="bedimg" src="${vars.bg}" alt="" />`}</div><div class="shade"></div>`
  : "";
const voHtml = `<audio class="clip" src="./vo.wav" data-start="0" data-duration="${totalDur}" data-volume="1"></audio>`;
writeFileSync(htmlPath, originalHtml
  .replace(/data-duration="[\d.]+"/g, `data-duration="${totalDur}"`)
  .replace("<!--BED-->", bedHtml + voHtml)); // both INSIDE #root — clips outside the composition are ignored
console.log(`rendering reel, ${totalDur}s ...`);
try {
  run("npx", ["--yes", "hyperframes", "render", TEMPLATE, "-o", outMp4, "--variables-file", varsFile, "-q", quality, "--quiet"], { cwd: process.cwd() });
} finally {
  writeFileSync(htmlPath, originalHtml);
}

// 4) Verify
const probe = run("ffprobe", ["-v", "error", "-show_entries", "stream=codec_type,duration", "-of", "json", outMp4]);
const streams = JSON.parse(probe).streams || [];
const hasVideo = streams.some((s) => s.codec_type === "video");
const hasAudio = streams.some((s) => s.codec_type === "audio");
const vidDur = parseFloat(streams.find((s) => s.codec_type === "video")?.duration || "0");
if (!hasVideo || !hasAudio || Math.abs(vidDur - totalDur) > 2) {
  console.error(`verify FAILED: video=${hasVideo} audio=${hasAudio} dur=${vidDur} (want ~${totalDur})`);
  process.exit(1);
}
console.log(`OK ${outMp4} — voiced reel, ${vidDur.toFixed(1)}s, video+audio`);
