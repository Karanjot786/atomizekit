// Pure scoring functions over raw GeoRun events. No I/O — see ../score.ts.
import { test } from "node:test";
import assert from "node:assert/strict";
import { citationShare, mentionShare, byEngine } from "../score.ts";
import type { GeoRun } from "../types.ts";

function run(overrides: Partial<GeoRun>): GeoRun {
  return {
    promptId: "p1",
    prompt: "best resume builder for job seekers",
    engine: "perplexity",
    runIdx: 0,
    citedUrls: [],
    answerText: "",
    mention: false,
    citation: false,
    ts: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

test("citationShare: k of N cited runs → k/N", () => {
  const runs: GeoRun[] = [
    run({ runIdx: 0, citation: true }),
    run({ runIdx: 1, citation: true }),
    run({ runIdx: 2, citation: false }),
    run({ runIdx: 3, citation: false }),
  ];
  assert.equal(citationShare("p1", runs), 0.5);
});

test("citationShare: 0 runs for prompt → 0, not NaN", () => {
  assert.equal(citationShare("missing", []), 0);
  const runs: GeoRun[] = [run({ promptId: "other", citation: true })];
  assert.equal(citationShare("p1", runs), 0);
});

test("mentionShare: k of N mentioned runs → k/N, independent of citation", () => {
  const runs: GeoRun[] = [
    run({ runIdx: 0, mention: true, citation: false }),
    run({ runIdx: 1, mention: true, citation: true }),
    run({ runIdx: 2, mention: false, citation: true }),
    run({ runIdx: 3, mention: false, citation: false }),
  ];
  // mentions: idx 0,1 → 2/4 = 0.5
  assert.equal(mentionShare("p1", runs), 0.5);
  // citations: idx 1,2 → 2/4 = 0.5 (different runs than the mentions)
  assert.equal(citationShare("p1", runs), 0.5);
});

test("mentionShare: 0 runs → 0, not NaN", () => {
  assert.equal(mentionShare("missing", []), 0);
});

test("cited-but-not-mentioned and mentioned-but-not-cited are both counted correctly", () => {
  const runs: GeoRun[] = [
    run({ runIdx: 0, mention: false, citation: true }), // cited, not mentioned
    run({ runIdx: 1, mention: true, citation: false }), // mentioned, not cited
  ];
  assert.equal(citationShare("p1", runs), 0.5);
  assert.equal(mentionShare("p1", runs), 0.5);
});

test("byEngine: per-engine citation/mention shares", () => {
  const runs: GeoRun[] = [
    run({ runIdx: 0, engine: "perplexity", citation: true, mention: true }),
    run({ runIdx: 1, engine: "perplexity", citation: false, mention: false }),
    run({ runIdx: 0, engine: "gemini", citation: true, mention: false }),
  ];
  const result = byEngine("p1", runs);
  assert.equal(result.perplexity.citationShare, 0.5);
  assert.equal(result.perplexity.mentionShare, 0.5);
  assert.equal(result.gemini.citationShare, 1);
  assert.equal(result.gemini.mentionShare, 0);
});

test("byEngine: engine with no runs is simply absent", () => {
  const result = byEngine("nope", []);
  assert.deepEqual(result, {});
});
