// Pure gap-queue ranking over PromptMeta + raw runs. No I/O — see ../gap.ts.
import { test } from "node:test";
import assert from "node:assert/strict";
import { gapQueue } from "../gap.ts";
import type { GeoRun, PromptMeta } from "../types.ts";

function run(overrides: Partial<GeoRun>): GeoRun {
  return {
    promptId: "p1",
    prompt: "prompt",
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

test("gapQueue: ranks a low-citation high-value prompt above a well-cited one", () => {
  const prompts: PromptMeta[] = [
    { id: "well-cited", prompt: "well cited prompt", ourUrl: "https://example.com/a", value: 0.9, winnability: 0.9 },
    { id: "low-citation", prompt: "low citation prompt", ourUrl: "https://example.com/b", value: 0.9, winnability: 0.9 },
  ];
  const runs: GeoRun[] = [
    run({ promptId: "well-cited", runIdx: 0, citation: true }),
    run({ promptId: "well-cited", runIdx: 1, citation: true }),
    run({ promptId: "well-cited", runIdx: 2, citation: true }),
    run({ promptId: "low-citation", runIdx: 0, citation: false }),
    run({ promptId: "low-citation", runIdx: 1, citation: false }),
    run({ promptId: "low-citation", runIdx: 2, citation: true }),
  ];
  const queue = gapQueue(prompts, runs);
  assert.equal(queue[0].id, "low-citation");
  assert.equal(queue[1].id, "well-cited");
  // gapScore = gapSize * value * winnability; gapSize = 1 - citationShare
  assert.ok(queue[0].gapScore > queue[1].gapScore);
});

test("gapQueue: gapScore formula matches gapSize * value * winnability", () => {
  const prompts: PromptMeta[] = [
    { id: "p1", prompt: "prompt one", ourUrl: "https://example.com/a", value: 0.5, winnability: 0.4 },
  ];
  const runs: GeoRun[] = [
    run({ promptId: "p1", runIdx: 0, citation: true }),
    run({ promptId: "p1", runIdx: 1, citation: false }),
  ];
  const queue = gapQueue(prompts, runs);
  // citationShare = 0.5, gapSize = 0.5, gapScore = 0.5 * 0.5 * 0.4 = 0.1
  assert.equal(queue[0].citationShare, 0.5);
  assert.ok(Math.abs(queue[0].gapScore - 0.1) < 1e-9);
});

test("gapQueue: prompt with zero runs has gapSize 1 (max gap)", () => {
  const prompts: PromptMeta[] = [
    { id: "never-run", prompt: "never run prompt", ourUrl: "https://example.com/a", value: 0.8, winnability: 0.5 },
  ];
  const queue = gapQueue(prompts, []);
  assert.equal(queue[0].citationShare, 0);
  assert.ok(Math.abs(queue[0].gapScore - 0.4) < 1e-9);
});

test("gapQueue: ties are stable (preserve input order)", () => {
  const prompts: PromptMeta[] = [
    { id: "a", prompt: "prompt a", ourUrl: "https://example.com/a", value: 0.5, winnability: 0.5 },
    { id: "b", prompt: "prompt b", ourUrl: "https://example.com/b", value: 0.5, winnability: 0.5 },
    { id: "c", prompt: "prompt c", ourUrl: "https://example.com/c", value: 0.5, winnability: 0.5 },
  ];
  const queue = gapQueue(prompts, []);
  assert.deepEqual(
    queue.map((q) => q.id),
    ["a", "b", "c"],
  );
});

test("gapQueue: returns id, prompt, gapScore, citationShare shape", () => {
  const prompts: PromptMeta[] = [
    { id: "p1", prompt: "the prompt text", ourUrl: "https://example.com/a", value: 1, winnability: 1 },
  ];
  const queue = gapQueue(prompts, []);
  assert.deepEqual(Object.keys(queue[0]).sort(), ["citationShare", "gapScore", "id", "prompt"].sort());
  assert.equal(queue[0].prompt, "the prompt text");
});
