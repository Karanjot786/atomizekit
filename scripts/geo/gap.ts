// Pure gap-queue ranking. No I/O here — reads/writes belong in store.ts.
//
// This ranked list IS the next-topic queue that feeds the "write" step of the
// content loop: machine measures citation gaps → produces this queue → the
// user (or an agent session) picks the top prompt(s) and writes content to
// close the gap → content gets published → loop repeats.
import { citationShare } from "./score.ts";
import type { GeoRun, PromptMeta } from "./types.ts";

export interface GapEntry {
  id: string;
  prompt: string;
  gapScore: number;
  citationShare: number;
}

/**
 * Rank prompts by how big an opportunity they represent:
 *   gapScore = gapSize * value * winnability
 *   gapSize  = 1 - citationShare(prompt.id, runs)   (big gap = we're NOT cited yet)
 * Descending by gapScore; ties preserve input order (stable sort).
 */
export function gapQueue(prompts: PromptMeta[], runs: GeoRun[]): GapEntry[] {
  const entries: GapEntry[] = prompts.map((prompt) => {
    const share = citationShare(prompt.id, runs);
    const gapSize = 1 - share;
    return {
      id: prompt.id,
      prompt: prompt.prompt,
      gapScore: gapSize * prompt.value * prompt.winnability,
      citationShare: share,
    };
  });

  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => b.entry.gapScore - a.entry.gapScore || a.index - b.index)
    .map(({ entry }) => entry);
}
