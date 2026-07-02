import { test } from "node:test";
import assert from "node:assert/strict";
import {
  readFileSync,
  readdirSync,
  existsSync,
  mkdtempSync,
  writeFileSync,
  copyFileSync,
  unlinkSync,
  rmSync,
} from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const SKILL_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const brandPath = path.join(SKILL_ROOT, "brand", "brand.json");
const templatePath = path.join(SKILL_ROOT, "brand", "brand.template.json");

test("atomize.py scaffolds exactly brand.platforms and a canonical URL built from canonicalPattern", () => {
  // check_render.mjs-style self-provisioning: if the user hasn't run /setup
  // yet, borrow the template brand for the duration of this test only.
  let tempBrand = false;
  if (!existsSync(brandPath)) {
    copyFileSync(templatePath, brandPath);
    tempBrand = true;
  }

  const fakeBlogDir = mkdtempSync(path.join(os.tmpdir(), "atomizekit-fake-blog-"));
  const tempCwd = mkdtempSync(path.join(os.tmpdir(), "atomizekit-cwd-"));

  try {
    const brand = JSON.parse(readFileSync(brandPath, "utf-8"));

    writeFileSync(path.join(fakeBlogDir, "demo.mdx"), "---\ntitle: Demo Post\n---\nbody");

    const result = spawnSync(
      "python3",
      [path.join(SKILL_ROOT, "scripts", "atomize.py"), "--slug", "demo", "--blog-dir", fakeBlogDir],
      { cwd: tempCwd, encoding: "utf-8" }
    );

    assert.equal(result.status, 0, `atomize.py exited ${result.status}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`);

    const outDir = path.join(tempCwd, brand.distributionDir, "demo");
    assert.ok(existsSync(outDir), `distribution dir ${outDir} was not created`);

    // exactly one .md per brand.platforms entry, plus index.md — no more, no less
    const mdFiles = readdirSync(outDir).filter((f) => f.endsWith(".md")).sort();
    const expectedMdFiles = [...brand.platforms.map((p) => `${p}.md`), "index.md"].sort();
    assert.deepEqual(mdFiles, expectedMdFiles);

    for (const plat of brand.platforms) {
      const content = readFileSync(path.join(outDir, `${plat}.md`), "utf-8");
      assert.match(content, /^platform:/);
      assert.match(content, /posted: false/);
    }

    const post = JSON.parse(readFileSync(path.join(outDir, "post.json"), "utf-8"));
    const expectedCanonical = brand.canonicalPattern.replace("{slug}", "demo");
    assert.equal(post.url, expectedCanonical, "post.json url must equal canonicalPattern with {slug} substituted");
    assert.equal(post.headline, "Demo Post");
    assert.equal(post.stat, "", "stat is left empty on purpose so renderers fail loud until a real number is filled in");
    assert.equal(post.eyebrow, brand.eyebrow);
  } finally {
    rmSync(fakeBlogDir, { recursive: true, force: true });
    rmSync(tempCwd, { recursive: true, force: true });
    if (tempBrand && existsSync(brandPath)) {
      unlinkSync(brandPath);
    }
  }
});

test("atomize.py fails loud with 'run /setup first' when brand/brand.json is missing", () => {
  assert.ok(!existsSync(brandPath), "this test requires brand/brand.json to be absent (it is gitignored)");

  const fakeBlogDir = mkdtempSync(path.join(os.tmpdir(), "atomizekit-fake-blog-"));
  const tempCwd = mkdtempSync(path.join(os.tmpdir(), "atomizekit-cwd-"));

  try {
    writeFileSync(path.join(fakeBlogDir, "demo.mdx"), "---\ntitle: Demo Post\n---\nbody");

    const result = spawnSync(
      "python3",
      [path.join(SKILL_ROOT, "scripts", "atomize.py"), "--slug", "demo", "--blog-dir", fakeBlogDir],
      { cwd: tempCwd, encoding: "utf-8" }
    );

    assert.notEqual(result.status, 0);
    assert.match(result.stdout + result.stderr, /run the skill's \/setup first/);
  } finally {
    rmSync(fakeBlogDir, { recursive: true, force: true });
    rmSync(tempCwd, { recursive: true, force: true });
  }
});
