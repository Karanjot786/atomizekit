// Single brand loader used by every .mjs script.
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
export const SKILL_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export function loadBrand() {
  const p = path.join(SKILL_ROOT, "brand", "brand.json");
  if (!existsSync(p)) {
    console.error("no brand/brand.json — run the skill's /setup first (it interviews you and writes it)");
    process.exit(1);
  }
  return JSON.parse(readFileSync(p, "utf-8"));
}
