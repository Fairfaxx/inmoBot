import type { CaseResult } from "./types";

const COLORS = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
};

export function printReport(input: {
  results: CaseResult[];
  durationMs: number;
  approxCostUsd: number;
}): void {
  const { results, durationMs, approxCostUsd } = input;

  // Por-flow agregado
  const byFlow = new Map<string, { passed: number; total: number }>();
  for (const r of results) {
    const entry = byFlow.get(r.case.flow) ?? { passed: 0, total: 0 };
    entry.total += 1;
    if (r.passed) entry.passed += 1;
    byFlow.set(r.case.flow, entry);
  }

  console.log("");
  console.log(`${COLORS.bold}=== Resumen por flow ===${COLORS.reset}`);
  for (const [flow, entry] of [...byFlow.entries()].sort()) {
    const ok = entry.passed === entry.total;
    const color = ok ? COLORS.green : COLORS.red;
    const symbol = ok ? "✓" : "✗";
    console.log(
      `  ${color}${symbol}${COLORS.reset} ${flow.padEnd(36)} ${entry.passed}/${entry.total}`,
    );
  }

  // Detalle de fallos
  const failed = results.filter((r) => !r.passed);
  if (failed.length > 0) {
    console.log("");
    console.log(`${COLORS.bold}=== Fallos en detalle ===${COLORS.reset}`);
    for (const r of failed) {
      console.log("");
      console.log(
        `${COLORS.red}✗ ${r.case.id}${COLORS.reset} ${COLORS.dim}(${r.case.flow})${COLORS.reset}`,
      );
      console.log(`  ${COLORS.dim}${r.case.description}${COLORS.reset}`);
      console.log(`  ${COLORS.dim}lead:${COLORS.reset} ${r.case.userMessage}`);
      console.log(`  ${COLORS.dim}bot :${COLORS.reset} ${r.reply.content}`);
      console.log(`  ${COLORS.dim}stat:${COLORS.reset} ${r.reply.status}`);
      for (const a of r.assertionResults.filter((x) => !x.passed)) {
        console.log(
          `    ${COLORS.red}→${COLORS.reset} [${a.assertion.type}] ${a.reason}`,
        );
      }
    }
  }

  // Totales
  const passedCases = results.filter((r) => r.passed).length;
  const totalCases = results.length;
  const allOk = passedCases === totalCases;
  const totalColor = allOk ? COLORS.green : COLORS.yellow;
  console.log("");
  console.log(`${COLORS.bold}=== Total ===${COLORS.reset}`);
  console.log(
    `  ${totalColor}${passedCases}/${totalCases}${COLORS.reset} casos pasaron`,
  );
  console.log(
    `  ${COLORS.dim}duración: ${(durationMs / 1000).toFixed(1)}s · costo aprox: $${approxCostUsd.toFixed(4)} USD${COLORS.reset}`,
  );
  console.log("");
}
