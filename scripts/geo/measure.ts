// GEO "measure" runner — closes the content loop. Reads data/geo/prompts.json
// (seeded by /setup from your brand), calls each provider stub N times per
// prompt, appends the resulting GeoRun events to the JSONL store, then
// computes the gap queue and writes it to data/geo/next-topics.json — the
// ranked list of prompts you're measurably NOT cited for yet. The write step
// reads that file to suggest what to write next, closing the loop.
//
// Keyless, offline, deterministic: all three provider adapters
// (scripts/geo/providers/{perplexity,gemini,gsc}.ts) fall back to a
// hash-derived stub when their API key/creds env var is unset (always true
// out of the box). Set PERPLEXITY_API_KEY / GEMINI_API_KEY /
// (GSC_CLIENT_EMAIL + GSC_PRIVATE_KEY) to flip a provider to a real call once
// that's implemented — see the "Real call" comment at the top of each
// provider file.
//
// Run: node scripts/geo/measure.ts [--runs N] [--prompts <file>] [--out <file>]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { appendRuns, readRuns } from "./store.ts";
import { citationShare } from "./score.ts";
import { gapQueue } from "./gap.ts";
import type { GeoEngine, GeoRun, PromptMeta } from "./types.ts";
import { check as checkPerplexity } from "./providers/perplexity.ts";
import { check as checkGemini } from "./providers/gemini.ts";
import { check as checkGsc } from "./providers/gsc.ts";

// Data lives in the HOST project's cwd (the repo the skill is invoked from),
// not inside the skill directory — every install gets its own data/geo/.
export const DEFAULT_PROMPTS_FILE = path.resolve(process.cwd(), "data/geo/prompts.json");
export const DEFAULT_NEXT_TOPICS_FILE = path.resolve(process.cwd(), "data/geo/next-topics.json");

const PROVIDERS: { engine: GeoEngine; check: (prompt: string) => Promise<Omit<GeoRun, "promptId" | "prompt" | "runIdx" | "ts">> }[] = [
  { engine: "perplexity", check: checkPerplexity },
  { engine: "gemini", check: checkGemini },
  { engine: "gsc", check: checkGsc },
];

/** Read the seed prompt list. Fails loud if the file is missing — no fabricated prompts. */
export function readPrompts(file: string = DEFAULT_PROMPTS_FILE): PromptMeta[] {
  if (!existsSync(file)) {
    console.error("no data/geo/prompts.json — run the skill's /setup first (it seeds prompts from your brand)");
    process.exit(1);
  }
  return JSON.parse(readFileSync(file, "utf8")) as PromptMeta[];
}

/**
 * Run every prompt against every provider `runsPerPrompt` times and build the
 * resulting GeoRun events. Pure w.r.t. I/O — caller decides whether/where to
 * persist them (appendRuns) and does not touch the filesystem itself beyond
 * what the (stubbed, network-free) provider `check()` calls do.
 */
export async function collectRuns(prompts: PromptMeta[], runsPerPrompt: number): Promise<GeoRun[]> {
  const runs: GeoRun[] = [];
  const ts = new Date().toISOString();
  for (const prompt of prompts) {
    for (const { engine, check } of PROVIDERS) {
      for (let runIdx = 0; runIdx < runsPerPrompt; runIdx++) {
        const result = await check(prompt.prompt);
        runs.push({
          promptId: prompt.id,
          prompt: prompt.prompt,
          engine,
          runIdx,
          citedUrls: result.citedUrls,
          answerText: result.answerText,
          mention: result.mention,
          citation: result.citation,
          ts,
        });
      }
    }
  }
  return runs;
}

/** Write the ranked next-topic queue to disk, creating the directory if needed. */
export function writeNextTopics(entries: ReturnType<typeof gapQueue>, file: string = DEFAULT_NEXT_TOPICS_FILE): void {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(entries, null, 2) + "\n", "utf8");
}

export interface MeasureOptions {
  promptsFile?: string;
  runsFile?: string;
  nextTopicsFile?: string;
  runsPerPrompt?: number;
}

export interface MeasureResult {
  prompts: PromptMeta[];
  newRuns: GeoRun[];
  allRuns: GeoRun[];
  queue: ReturnType<typeof gapQueue>;
}

/** The full measure pass: read prompts, hit providers, persist, rank. */
export async function runMeasure(options: MeasureOptions = {}): Promise<MeasureResult> {
  const runsPerPrompt = options.runsPerPrompt ?? 3;
  const prompts = readPrompts(options.promptsFile);
  const newRuns = await collectRuns(prompts, runsPerPrompt);
  appendRuns(newRuns, options.runsFile);
  const allRuns = readRuns(options.runsFile);
  const queue = gapQueue(prompts, allRuns);
  writeNextTopics(queue, options.nextTopicsFile);
  return { prompts, newRuns, allRuns, queue };
}

function parseArgs(argv: string[]): MeasureOptions {
  const options: MeasureOptions = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--runs") options.runsPerPrompt = Number(argv[++i]);
    else if (arg === "--prompts") options.promptsFile = argv[++i];
    else if (arg === "--out") options.nextTopicsFile = argv[++i];
  }
  return options;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const { prompts, allRuns, queue } = await runMeasure(options);

  console.log(`measure: ran ${prompts.length} prompts x 3 providers x ${options.runsPerPrompt ?? 3} runs`);
  console.log("\nPer-prompt citation share:");
  for (const prompt of prompts) {
    const share = citationShare(prompt.id, allRuns);
    console.log(`  ${prompt.id.padEnd(36)} ${(share * 100).toFixed(0)}%`);
  }

  console.log("\nTop 3 next topics (highest gap x value x winnability):");
  for (const entry of queue.slice(0, 3)) {
    console.log(`  [${entry.gapScore.toFixed(3)}] ${entry.prompt} (citationShare=${(entry.citationShare * 100).toFixed(0)}%)`);
  }
  console.log(`\nWrote ${queue.length} ranked topics to ${options.nextTopicsFile ?? DEFAULT_NEXT_TOPICS_FILE}`);
}

// Only run when executed directly (`node scripts/geo/measure.ts`), not on import.
const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
