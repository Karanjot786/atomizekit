// Core data model for the keyless GEO (Generative Engine Optimization) tracker.
// Store raw events, derive everything else (see score.ts, gap.ts). Mirrors the
// data-model idea from danishashko/geo-aeo-tracker, ported as plain types —
// no Next.js/SaaS scaffolding.

/** Which AI answer engine produced this run. */
export type GeoEngine = "perplexity" | "gemini" | "gsc";

/**
 * One raw observation: we asked `prompt` to `engine` and recorded what came back.
 * `mention` and `citation` are two INDEPENDENT booleans — never collapse them:
 *   - mention  = our brand/name appears anywhere in answerText
 *   - citation = one of our URLs appears in citedUrls
 * A run can be cited-but-not-mentioned (link dropped with no brand text) or
 * mentioned-but-not-cited (brand name used, no link back). Both happen.
 */
export interface GeoRun {
  promptId: string;
  prompt: string;
  engine: GeoEngine;
  runIdx: number;
  citedUrls: string[];
  answerText: string;
  mention: boolean;
  citation: boolean;
  ts: string;
}

/** Static metadata about a tracked prompt, used to weight the gap queue. */
export interface PromptMeta {
  id: string;
  prompt: string;
  ourUrl: string;
  /** 0-1 commercial intent: how much a citation here is worth. */
  value: number;
  /** 0-1: how realistic it is we can win a citation for this prompt. */
  winnability: number;
}
