// Gemini grounding provider adapter.
// Real call (Phase-real, needs GEMINI_API_KEY): Gemini generateContent with
// groundingConfig enabled; read citation URLs from
// response.candidates[0].groundingMetadata.groundingChunks[].web.uri and
// check answerText for our brand/URL to derive mention/citation.
import type { GeoRun } from "../types.ts";
import { deterministicStub } from "./_stub.ts";

type CheckResult = Pick<GeoRun, "engine" | "citedUrls" | "answerText" | "mention" | "citation">;

export async function check(prompt: string): Promise<CheckResult> {
  if (!process.env.GEMINI_API_KEY) {
    // STUB — real Gemini grounding call goes here (groundingMetadata.groundingChunks[].web.uri)
    return deterministicStub(prompt, "gemini");
  }
  // Real call not implemented — keyless constraint (see brief).
  throw new Error("gemini: GEMINI_API_KEY is set but the real provider call is not implemented yet");
}
