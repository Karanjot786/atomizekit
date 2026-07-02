// Keyless local event store: raw GeoRun events appended as JSONL. No DB —
// this is the append-only source of truth that score.ts/gap.ts derive from.
import { existsSync, mkdirSync, readFileSync, appendFileSync } from "node:fs";
import path from "node:path";
import type { GeoRun } from "./types.ts";

// Data lives in the HOST project's cwd (the repo the skill is invoked from),
// not inside the skill directory — every install gets its own data/geo/.
export const DEFAULT_RUNS_FILE = path.resolve(process.cwd(), "data/geo/runs.jsonl");

/** Append events to the JSONL store, creating the containing directory if needed. */
export function appendRuns(runs: GeoRun[], file: string = DEFAULT_RUNS_FILE): void {
  if (runs.length === 0) return;
  mkdirSync(path.dirname(file), { recursive: true });
  const lines = runs.map((run) => JSON.stringify(run)).join("\n") + "\n";
  appendFileSync(file, lines, "utf8");
}

/** Read all events from the JSONL store. Missing file → empty array. */
export function readRuns(file: string = DEFAULT_RUNS_FILE): GeoRun[] {
  if (!existsSync(file)) return [];
  const content = readFileSync(file, "utf8");
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line) as GeoRun);
}
