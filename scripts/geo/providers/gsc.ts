// Google Search Console AI-impressions provider adapter.
// Real call (Phase-real, needs GSC service-account creds): Search Console API
// searchAnalytics.query with the AI-impressions report, filtered to our
// site's pages — page-level ground truth for impressions (no clicks/queries
// yet), used to fill in citation/mention signal GSC can see.
import type { GeoRun } from "../types.ts";
import { deterministicStub } from "./_stub.ts";

type CheckResult = Pick<GeoRun, "engine" | "citedUrls" | "answerText" | "mention" | "citation">;

export async function check(prompt: string): Promise<CheckResult> {
  const hasCreds = Boolean(process.env.GSC_CLIENT_EMAIL && process.env.GSC_PRIVATE_KEY);
  if (!hasCreds) {
    // STUB — real GSC AI-impressions report call goes here (searchAnalytics.query)
    return deterministicStub(prompt, "gsc");
  }
  // Real call not implemented — keyless constraint (see brief).
  throw new Error("gsc: GSC credentials are set but the real provider call is not implemented yet");
}
