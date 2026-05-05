import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

import { runCases } from "./runner";
import { printReport } from "./report";
import type { EvalCase } from "./types";

// Pricing aproximado (a 2026-01) — actualizar si OpenAI cambia tarifas.
const PRICING = {
  "gpt-4o-mini": { input: 0.15 / 1_000_000, output: 0.6 / 1_000_000 },
  "gpt-4o": { input: 2.5 / 1_000_000, output: 10 / 1_000_000 },
} as const;

function priceOf(modelEnv: string | undefined, defaultModel: keyof typeof PRICING) {
  const model = (modelEnv ?? defaultModel) as keyof typeof PRICING;
  return PRICING[model] ?? PRICING[defaultModel];
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const CASES_DIR = join(__dirname, "cases");

function loadCases(): EvalCase[] {
  const files = readdirSync(CASES_DIR).filter((f) => f.endsWith(".json"));
  const cases: EvalCase[] = [];
  for (const file of files) {
    const content = readFileSync(join(CASES_DIR, file), "utf-8");
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      cases.push(...parsed);
    } else {
      cases.push(parsed);
    }
  }
  return cases;
}

async function main(): Promise<void> {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY no está seteada. Verificá .env.local.");
    process.exit(1);
  }

  const cases = loadCases();
  console.log(`Corriendo ${cases.length} casos...`);

  const start = Date.now();
  const outcome = await runCases(cases);
  const durationMs = Date.now() - start;

  const botPrice = priceOf(process.env.OPENAI_MODEL, "gpt-4o-mini");
  const judgePrice = priceOf(process.env.JUDGE_MODEL, "gpt-4o");
  // Bot: ~1300 in + ~80 out por caso (estimado, no medimos los reales)
  const botInputTokensApprox = cases.length * 1300;
  const botOutputTokensApprox = cases.length * 80;
  const approxCostUsd =
    botInputTokensApprox * botPrice.input +
    botOutputTokensApprox * botPrice.output +
    outcome.judgeInputTokens * judgePrice.input +
    outcome.judgeOutputTokens * judgePrice.output;

  printReport({
    results: outcome.results,
    durationMs,
    approxCostUsd,
  });

  const failedCount = outcome.results.filter((r) => !r.passed).length;
  process.exit(failedCount > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("Error fatal en el eval:", error);
  process.exit(1);
});
