import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, unlinkSync, rmSync } from "node:fs";
import path from "node:path";
import os from "node:os";
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

test("loadBrand(): <cwd>/.claude/atomizekit.config.json wins over <skill>/brand/brand.json", () => {
  // Config resolution order (RESEARCH AMENDMENTS, 2026-07-02): the host
  // project's own <cwd>/.claude/atomizekit.config.json is checked FIRST, so
  // one skill install can serve multiple projects/brands; <skill>/brand/
  // brand.json is only the fallback for a standalone (non-project) setup.
  const skillBrandPath = path.join(SKILL_ROOT, "brand", "brand.json");
  const templatePath = path.join(SKILL_ROOT, "brand", "brand.template.json");
  assert.ok(!existsSync(skillBrandPath), "this test requires brand/brand.json to be absent (it is gitignored)");

  const template = JSON.parse(readFileSync(templatePath, "utf-8"));
  const { _instructions, ...contractOnly } = template;

  // Skill-dir fallback brand — should NOT win when a cwd config is present.
  writeFileSync(skillBrandPath, JSON.stringify({ ...contractOnly, name: "SKILL-DIR-FALLBACK-BRAND" }));

  const tempCwd = mkdtempSync(path.join(os.tmpdir(), "atomizekit-cwd-config-"));
  mkdirSync(path.join(tempCwd, ".claude"), { recursive: true });
  writeFileSync(
    path.join(tempCwd, ".claude", "atomizekit.config.json"),
    JSON.stringify({ ...contractOnly, name: "CWD-PROJECT-CONFIG-BRAND" })
  );

  const libPath = path.join(SKILL_ROOT, "scripts", "lib_brand.mjs");

  try {
    const result = spawnSync(
      process.execPath,
      ["-e", `import(${JSON.stringify(pathToFileURL(libPath).href)}).then(m => console.log(JSON.stringify(m.loadBrand())))`],
      { cwd: tempCwd, encoding: "utf-8" }
    );

    assert.equal(result.status, 0, `expected exit 0, got ${result.status}; stderr: ${result.stderr}`);
    const brand = JSON.parse(result.stdout.trim());
    assert.equal(
      brand.name,
      "CWD-PROJECT-CONFIG-BRAND",
      "cwd/.claude/atomizekit.config.json must win over the skill-dir brand.json fallback"
    );
  } finally {
    rmSync(tempCwd, { recursive: true, force: true });
    if (existsSync(skillBrandPath)) unlinkSync(skillBrandPath);
  }
});

test("loadBrand(): falls back to <skill>/brand/brand.json when no cwd config exists", () => {
  const skillBrandPath = path.join(SKILL_ROOT, "brand", "brand.json");
  const templatePath = path.join(SKILL_ROOT, "brand", "brand.template.json");
  assert.ok(!existsSync(skillBrandPath), "this test requires brand/brand.json to be absent (it is gitignored)");

  const template = JSON.parse(readFileSync(templatePath, "utf-8"));
  const { _instructions, ...contractOnly } = template;
  writeFileSync(skillBrandPath, JSON.stringify({ ...contractOnly, name: "SKILL-DIR-FALLBACK-BRAND" }));

  const tempCwd = mkdtempSync(path.join(os.tmpdir(), "atomizekit-no-cwd-config-"));
  const libPath = path.join(SKILL_ROOT, "scripts", "lib_brand.mjs");

  try {
    const result = spawnSync(
      process.execPath,
      ["-e", `import(${JSON.stringify(pathToFileURL(libPath).href)}).then(m => console.log(JSON.stringify(m.loadBrand())))`],
      { cwd: tempCwd, encoding: "utf-8" }
    );

    assert.equal(result.status, 0, `expected exit 0, got ${result.status}; stderr: ${result.stderr}`);
    const brand = JSON.parse(result.stdout.trim());
    assert.equal(brand.name, "SKILL-DIR-FALLBACK-BRAND");
  } finally {
    rmSync(tempCwd, { recursive: true, force: true });
    if (existsSync(skillBrandPath)) unlinkSync(skillBrandPath);
  }
});
