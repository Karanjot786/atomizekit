// Perplexity Sonar provider adapter.
// Real call (Phase-real, needs PERPLEXITY_API_KEY): POST https://api.perplexity.ai/chat/completions
// with a Sonar model, then read citation URLs from response.search_results[].url
// and check answerText for our brand/URL to derive mention/citation.
import type { GeoRun } from "../types.ts";
import { deterministicStub } from "./_stub.ts";

type CheckResult = Pick<GeoRun, "engine" | "citedUrls" | "answerText" | "mention" | "citation">;

export async function check(prompt: string): Promise<CheckResult> {
  if (!process.env.PERPLEXITY_API_KEY) {
    // STUB — real Perplexity Sonar call goes here (search_results[].url)
    return deterministicStub(prompt, "perplexity");
  }
  // Real call not implemented — keyless constraint (see brief).
  throw new Error("perplexity: PERPLEXITY_API_KEY is set but the real provider call is not implemented yet");
}
