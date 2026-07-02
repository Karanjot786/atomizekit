import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const SKILL_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const CONTRACT_KEYS = [
  "name",
  "domain",
  "canonicalPattern",
  "blogDir",
  "distributionDir",
  "audience",
  "voice",
  "author",
  "colors",
  "fonts",
  "logo",
  "eyebrow",
  "platforms",
  "features",
];

const COLOR_KEYS = ["bg", "text", "primary", "accent"];
const FONT_KEYS = ["display", "body", "displayFile", "bodyFile"];

test("brand.template.json parses as valid JSON", () => {
  const p = path.join(SKILL_ROOT, "brand", "brand.template.json");
  assert.ok(existsSync(p), "brand/brand.template.json must exist");
  const raw = readFileSync(p, "utf-8");
  assert.doesNotThrow(() => JSON.parse(raw));
});

test("brand.template.json has every contract key", () => {
  const p = path.join(SKILL_ROOT, "brand", "brand.template.json");
  const data = JSON.parse(readFileSync(p, "utf-8"));
  for (const key of CONTRACT_KEYS) {
    assert.ok(Object.hasOwn(data, key), `missing contract key: ${key}`);
  }
  for (const key of COLOR_KEYS) {
    assert.ok(Object.hasOwn(data.colors, key), `missing colors.${key}`);
  }
  for (const key of FONT_KEYS) {
    assert.ok(Object.hasOwn(data.fonts, key), `missing fonts.${key}`);
  }
});

test("brand.template.json carries an _instructions key telling the user to run /setup", () => {
  const p = path.join(SKILL_ROOT, "brand", "brand.template.json");
  const data = JSON.parse(readFileSync(p, "utf-8"));
  assert.ok(Object.hasOwn(data, "_instructions"));
  assert.match(data._instructions, /\/setup/);
});

test("loadBrand() exits 1 with a helpful message when brand/brand.json is absent", () => {
  const brandJsonPath = path.join(SKILL_ROOT, "brand", "brand.json");
  assert.ok(!existsSync(brandJsonPath), "this test requires brand/brand.json to be absent (it is gitignored)");

  const libPath = path.join(SKILL_ROOT, "scripts", "lib_brand.mjs");
  const result = spawnSync(
    process.execPath,
    ["-e", `import(${JSON.stringify(pathToFileURL(libPath).href)}).then(m => m.loadBrand())`],
    { encoding: "utf-8" }
  );

  assert.equal(result.status, 1, `expected exit code 1, got ${result.status}; stderr: ${result.stderr}`);
  assert.match(result.stderr, /run the skill's \/setup first/);
});
