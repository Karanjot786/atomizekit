// Measure runner smoke test. Uses a scratch tmpdir for prompts/runs/
// next-topics files so it never touches the host repo's real data/geo/*.
// Providers are the real (stubbed, keyless, deterministic) scripts/geo/providers
// adapters — no network, no key, same input always produces the same output.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { runMeasure } from "../measure.ts";
import type { PromptMeta } from "../types.ts";

function scratchDir(): string {
  return mkdtempSync(path.join(tmpdir(), "geo-measure-test-"));
}

function writePrompts(dir: string, prompts: PromptMeta[]): string {
  const file = path.join(dir, "prompts.json");
  writeFileSync(file, JSON.stringify(prompts), "utf8");
  return file;
}

test("runMeasure: writes a non-empty ranked next-topics.json", async () => {
  const dir = scratchDir();
  const prompts: PromptMeta[] = [
    { id: "a", prompt: "best resume builder for freshers", ourUrl: "https://example.com/resume-builder", value: 0.9, winnability: 0.6 },
    { id: "b", prompt: "job search strategy for new grads", ourUrl: "https://example.com/blog/smart-application-strategy", value: 0.8, winnability: 0.55 },
    { id: "c", prompt: "how to beat AI resume screeners", ourUrl: "https://example.com/blog/how-to-beat-ai-resume-screeners", value: 0.75, winnability: 0.65 },
  ];
  const promptsFile = writePrompts(dir, prompts);
  const runsFile = path.join(dir, "runs.jsonl");
  const nextTopicsFile = path.join(dir, "next-topics.json");

  const result = await runMeasure({ promptsFile, runsFile, nextTopicsFile, runsPerPrompt: 3 });

  assert.ok(existsSync(nextTopicsFile), "next-topics.json should be written");
  const written = JSON.parse(readFileSync(nextTopicsFile, "utf8"));
  assert.ok(Array.isArray(written));
  assert.ok(written.length > 0, "next-topics.json should be non-empty");
  assert.deepEqual(written, result.queue);

  rmSync(dir, { recursive: true, force: true });
});

test("runMeasure: is deterministic across repeated calls with the same prompts (stub providers)", async () => {
  const dir = scratchDir();
  const prompts: PromptMeta[] = [
    { id: "a", prompt: "best resume builder for freshers", ourUrl: "https://example.com/resume-builder", value: 0.9, winnability: 0.6 },
  ];
  const promptsFile = writePrompts(dir, prompts);

  const run1Dir = path.join(dir, "run1");
  const run2Dir = path.join(dir, "run2");
  const r1 = await runMeasure({
    promptsFile,
    runsFile: path.join(run1Dir, "runs.jsonl"),
    nextTopicsFile: path.join(run1Dir, "next-topics.json"),
    runsPerPrompt: 2,
  });
  const r2 = await runMeasure({
    promptsFile,
    runsFile: path.join(run2Dir, "runs.jsonl"),
    nextTopicsFile: path.join(run2Dir, "next-topics.json"),
    runsPerPrompt: 2,
  });

  assert.deepEqual(r1.queue, r2.queue);

  rmSync(dir, { recursive: true, force: true });
});
