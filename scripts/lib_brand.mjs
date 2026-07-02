// Single brand loader used by every .mjs script.
//
// Config resolution order (host-project config wins so one skill install can
// serve multiple projects/brands):
//   1. <cwd>/.claude/atomizekit.config.json — the host project's own config,
//      written by /setup when cwd is a project.
//   2. <skill>/brand/brand.json — the skill-dir fallback, written by /setup
//      when cwd is NOT a project (e.g. the skill was set up standalone).
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
export const SKILL_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export function loadBrand() {
  const cwdConfigPath = path.join(process.cwd(), ".claude", "atomizekit.config.json");
  if (existsSync(cwdConfigPath)) {
    return JSON.parse(readFileSync(cwdConfigPath, "utf-8"));
  }
  const skillBrandPath = path.join(SKILL_ROOT, "brand", "brand.json");
  if (existsSync(skillBrandPath)) {
    return JSON.parse(readFileSync(skillBrandPath, "utf-8"));
  }
  console.error(
    "no <cwd>/.claude/atomizekit.config.json and no <skill>/brand/brand.json — run the skill's /setup first (it interviews you and writes one)"
  );
  process.exit(1);
}
