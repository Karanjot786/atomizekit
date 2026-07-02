// Pure scoring over raw GeoRun events. No I/O here — reads/writes belong in
// store.ts. LLM answers are stochastic, so we score fractionally over N runs
// rather than treating a single run as ground truth.
import type { GeoEngine, GeoRun } from "./types.ts";

function runsForPrompt(promptId: string, runs: GeoRun[]): GeoRun[] {
  return runs.filter((r) => r.promptId === promptId);
}

function share(runs: GeoRun[], pick: (r: GeoRun) => boolean): number {
  if (runs.length === 0) return 0;
  const hits = runs.filter(pick).length;
  return hits / runs.length;
}

/** Fraction of `promptId`'s runs where citation === true. 0 runs → 0. */
export function citationShare(promptId: string, runs: GeoRun[]): number {
  return share(runsForPrompt(promptId, runs), (r) => r.citation);
}

/** Fraction of `promptId`'s runs where mention === true. 0 runs → 0. */
export function mentionShare(promptId: string, runs: GeoRun[]): number {
  return share(runsForPrompt(promptId, runs), (r) => r.mention);
}

export interface EngineShare {
  citationShare: number;
  mentionShare: number;
}

/** Per-engine citation/mention shares for a prompt. Engines with no runs are absent. */
export function byEngine(promptId: string, runs: GeoRun[]): Partial<Record<GeoEngine, EngineShare>> {
  const promptRuns = runsForPrompt(promptId, runs);
  const engines = new Set(promptRuns.map((r) => r.engine));
  const result: Partial<Record<GeoEngine, EngineShare>> = {};
  for (const engine of engines) {
    const engineRuns = promptRuns.filter((r) => r.engine === engine);
    result[engine] = {
      citationShare: share(engineRuns, (r) => r.citation),
      mentionShare: share(engineRuns, (r) => r.mention),
    };
  }
  return result;
}
