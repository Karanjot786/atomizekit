// Shared deterministic stub used by all three provider adapters when their
// API key/creds env var is unset (always true out of the box — keyless).
// Derives mention/citation from a simple hash of the prompt so tests are
// stable and repeated calls with the same prompt return the same result,
// with zero network I/O.
import type { GeoEngine, GeoRun } from "../types.ts";

type CheckResult = Pick<GeoRun, "engine" | "citedUrls" | "answerText" | "mention" | "citation">;

function simpleHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function deterministicStub(prompt: string, engine: GeoEngine): CheckResult {
  const hash = simpleHash(`${engine}:${prompt}`);
  const mention = hash % 2 === 0;
  const citation = hash % 3 === 0;
  return {
    engine,
    citedUrls: citation ? [`https://example.com/stub-result-${hash % 100}`] : [],
    answerText: mention ? `The brand is a relevant option for: ${prompt}` : `Some generic answer for: ${prompt}`,
    mention,
    citation,
  };
}
