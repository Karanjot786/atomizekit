#!/usr/bin/env node
// Voiced Shorts renderer: post.json scenes[] -> Kokoro TTS per scene -> concat VO
// -> hyperframes render (templates/shorts) -> media/short.mp4. Keyless, local.
// Scene text doubles as the on-screen caption, so no Whisper/transcription step.
// Usage: node scripts/render_short.mjs <slug> [--voice af_nova] [--quality draft|standard|high]
// ponytail: templates/shorts/vo.wav (+fonts/logo.svg) is a shared working file — one render at a time.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { run, fetchStock, copyBrandAssets } from "./media_helpers.mjs";
import { loadBrand, SKILL_ROOT } from "./lib_brand.mjs";
import path from "node:path";
import os from "node:os";

const TEMPLATE = path.join(SKILL_ROOT, "templates", "shorts");
try { process.loadEnvFile(path.join(process.cwd(), ".env")); } catch { /* no .env in the host project — env vars only */ }

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--"));
const flag = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
};
const voice = flag("voice", "af_heart"); // warmest Kokoro default; --voice to override
const quality = flag("quality", "draft");

if (!slug) {
  console.error("usage: node scripts/render_short.mjs <slug> [--voice af_nova] [--quality draft]");
  process.exit(1);
}

const brand = loadBrand();

// Slug dir lives in the HOST project's cwd, not next to the skill (see render_cards.mjs).
const slugDir = path.join(process.cwd(), brand.distributionDir, slug);
const postPath = path.join(slugDir, "post.json");
if (!existsSync(postPath)) {
  console.error(`no post.json at ${postPath} — run atomize.py first`);
  process.exit(1);
}
const post = JSON.parse(readFileSync(postPath, "utf-8"));
const scenes = post.scenes;
if (!Array.isArray(scenes) || scenes.length < 2) {
  console.error(
    `post.json has no scenes[] (need >=2 of {text, kind?}) — fill it from the YouTube script (see commands/visuals.md)`,
  );
  process.exit(1);
}

// Sync the brand's logo + fonts into the template working dir (hyperframes serves
// the composition dir as its own web root — see the note atop templates/shorts/index.html).
copyBrandAssets(SKILL_ROOT, brand, TEMPLATE);

// 1) TTS per scene. scene.voText (spoken line, punctuation drives Kokoro's
// prosody — commas/ellipses/questions = emotion) falls back to the screen text.
// Per-kind pacing: hooks land slower, CTAs slightly urgent.
const SPEED = { hook: 0.92, context: 0.97, body: 1.0, cta: 0.96 };
const tmp = path.join(os.tmpdir(), `short-${slug}-${process.pid}`);
mkdirSync(tmp, { recursive: true });
const GAP = 0.35; // breathing room between scenes, seconds
let cursor = 0;
const timed = [];
const wavs = [];
for (let i = 0; i < scenes.length; i++) {
  const s = scenes[i];
  const voText = (s.voText || s.text).replace(/\n/g, " ").replace(/[→]/g, " ").replace(/\s+/g, " ").trim();
  const speed = String(SPEED[s.kind || "body"] || 1.0);
  const wav = path.join(tmp, `scene_${i}.wav`);
  const out = run("npx", ["--yes", "hyperframes", "tts", voText, "-v", voice, "-s", speed, "-o", wav, "--json"]);
  const dur = JSON.parse(out.trim().split("\n").pop()).durationSeconds;
  timed.push({ ...s, start: +cursor.toFixed(2), dur: +(dur + GAP).toFixed(2) });
  wavs.push(wav);
  cursor += dur + GAP;
  console.log(`scene ${i + 1}/${scenes.length} voiced: ${dur.toFixed(1)}s`);
}
const totalDur = +cursor.toFixed(2);

// 1b) Stock b-roll per scene (scene.stockQuery, optional). Cached into the
// template's assets/ dir (gitignored working files) so the render stays local.
const assetsDir = path.join(TEMPLATE, "assets");
mkdirSync(assetsDir, { recursive: true });
for (let i = 0; i < timed.length; i++) {
  const q = timed[i].stockQuery;
  if (!q) continue;
  const got = await fetchStock(q, timed[i].dur, path.join(assetsDir, `scene_${i}`));
  if (got) {
    timed[i].bg = `./assets/${path.basename(got.path)}`;
    timed[i].bgType = got.type;
    console.log(`scene ${i + 1} b-roll: ${got.type} (matched "${got.query}")`);
  }
}

// 2) Concat VO with silence gaps -> templates/shorts/vo.wav
const listFile = path.join(tmp, "concat.txt");
const silence = path.join(tmp, "gap.wav");
run("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", String(GAP), silence]);
writeFileSync(listFile, wavs.map((w) => `file '${w}'\nfile '${silence}'`).join("\n"));
run("ffmpeg", ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", listFile, path.join(TEMPLATE, "vo.wav")]);

// 3) Render. The runtime reads data-duration from the raw HTML before our inline
// script runs, so patch the template's duration in place and restore it after.
// ponytail: template dir is the working copy (vo.wav/fonts/logo.svg live there too) — sequential renders only.
const varsFile = path.join(tmp, "vars.json");
writeFileSync(varsFile, JSON.stringify({
  scenes: timed, totalDur, url: post.url, headline: post.headline,
  brand: { name: brand.name, eyebrow: brand.eyebrow, domain: brand.domain, colors: brand.colors },
}));
mkdirSync(path.join(slugDir, "media"), { recursive: true });
const outMp4 = path.join(slugDir, "media", "short.mp4");
const htmlPath = path.join(TEMPLATE, "index.html");
const originalHtml = readFileSync(htmlPath, "utf-8");
// Static-inject b-roll beds at the marker — hyperframes registers media (video/audio)
// from RAW html only; text scenes stay JS-injected (they aren't media clips).
const bedsHtml = timed
  .filter((s) => s.bg)
  .map((s) =>
    `<div class="clip bedwrap" data-start="${s.start}" data-duration="${s.dur}" data-track-index="0">` +
    (s.bgType === "video"
      ? `<video class="clip" src="${s.bg}" data-start="${s.start}" data-duration="${s.dur}" data-volume="0" muted></video>`
      : `<img src="${s.bg}" alt="" />`) +
    `<div class="shade"></div></div>`,
  )
  .join("\n      ");
writeFileSync(htmlPath, originalHtml
  .replace(/data-duration="45"/g, `data-duration="${totalDur}"`)
  .replace("<!--BEDS-->", bedsHtml + "<!--BEDS-->"));
console.log(`rendering ${timed.length} scenes, ${totalDur}s ...`);
try {
  run("npx", ["--yes", "hyperframes", "render", TEMPLATE, "-o", outMp4, "--variables-file", varsFile, "-q", quality, "--quiet"], { cwd: process.cwd() });
} finally {
  writeFileSync(htmlPath, originalHtml);
}

// 4) Verify: video + audio streams, duration ~= totalDur
const probe = run("ffprobe", ["-v", "error", "-show_entries", "stream=codec_type,duration", "-of", "json", outMp4]);
const streams = JSON.parse(probe).streams || [];
const hasVideo = streams.some((s) => s.codec_type === "video");
const hasAudio = streams.some((s) => s.codec_type === "audio");
const vidDur = parseFloat(streams.find((s) => s.codec_type === "video")?.duration || "0");
if (!hasVideo || !hasAudio || Math.abs(vidDur - totalDur) > 2) {
  console.error(`verify FAILED: video=${hasVideo} audio=${hasAudio} dur=${vidDur} (want ~${totalDur})`);
  process.exit(1);
}
console.log(`OK ${outMp4} — voiced short, ${vidDur.toFixed(1)}s, video+audio`);
