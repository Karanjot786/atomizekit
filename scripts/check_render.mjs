#!/usr/bin/env node
// check_render.mjs — ponytail: smallest thing that fails if render breaks.
//
// If brand/brand.json is missing (fresh clone, /setup not run yet), this
// self-provisions a temporary one from brand.template.json so the render
// pipeline itself can still be smoke-tested — and deletes it afterward.
// Seeds the neutral demo fixture (brand/demo-post.json), re-renders it,
// and asserts the 4 PNGs exist at the exact required dimensions.
// Exit 1 on any failure.
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync, unlinkSync, mkdirSync, copyFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = path.resolve(__dirname, "..");
const SLUG = "demo";

const EXPECTED = {
  "feed.png": [1080, 1350],
  "story.png": [1080, 1920],
  "thumb.png": [1280, 720],
  "banner.png": [1584, 396],
};

function readPngDimensions(filePath) {
  const buf = readFileSync(filePath);
  // PNG: 8-byte signature, then IHDR chunk: 4-byte length, 4-byte "IHDR",
  // then 4-byte width + 4-byte height (big-endian).
  if (buf.length < 33 || buf.toString("ascii", 12, 16) !== "IHDR") {
    throw new Error(`${filePath} does not look like a valid PNG`);
  }
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return [width, height];
}

const brandPath = path.join(SKILL_ROOT, "brand", "brand.json");
const templatePath = path.join(SKILL_ROOT, "brand", "brand.template.json");
const demoFixturePath = path.join(SKILL_ROOT, "brand", "demo-post.json");

let tempBrand = false;
if (!existsSync(brandPath)) {
  copyFileSync(templatePath, brandPath);
  tempBrand = true;
  console.log("no brand/brand.json — self-provisioning from brand.template.json for this check (removed after)");
}

let failed = false;
try {
  const brand = JSON.parse(readFileSync(brandPath, "utf-8"));
  const slugDir = path.join(process.cwd(), brand.distributionDir, SLUG);
  mkdirSync(slugDir, { recursive: true });
  copyFileSync(demoFixturePath, path.join(slugDir, "post.json"));

  console.log(`re-rendering fixture "${SLUG}"...`);
  execFileSync(process.execPath, [path.join(__dirname, "render_cards.mjs"), SLUG], {
    cwd: process.cwd(),
    stdio: "inherit",
  });

  const mediaDir = path.join(slugDir, "media");
  for (const [file, [expectedW, expectedH]] of Object.entries(EXPECTED)) {
    const filePath = path.join(mediaDir, file);
    try {
      const [w, h] = readPngDimensions(filePath);
      if (w !== expectedW || h !== expectedH) {
        console.error(`FAIL  ${file}: expected ${expectedW}x${expectedH}, got ${w}x${h}`);
        failed = true;
      } else {
        console.log(`OK    ${file}: ${w}x${h}`);
      }
    } catch (err) {
      console.error(`FAIL  ${file}: ${err.message}`);
      failed = true;
    }
  }
} finally {
  if (tempBrand && existsSync(brandPath)) {
    unlinkSync(brandPath);
  }
}

if (failed) {
  console.error("check_render.mjs: FAILED");
  process.exit(1);
}
console.log("check_render.mjs: all 4 cards OK");
