import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { loadFixture, summarizeFixture } from "./fixtures.js";
import { generateScenario } from "./scenarios.js";
import { detectAnomalies } from "./detectors.js";
import { scoreFindings } from "./scoring.js";
import { buildReport, renderMarkdown } from "./report.js";

export async function runInspection({ fixtureDir, scenario = "duplicate-invoice", outputDir = "out/ledgerpet", format = "json" }) {
  const base = await loadFixture(fixtureDir);
  const generated = generateScenario(base, scenario);
  const actualFindings = detectAnomalies(generated.fixture);
  const score = scoreFindings(generated.expectedFindings, actualFindings);
  const summary = summarizeFixture(generated.fixture);
  const report = buildReport({ summary, scenario, expectedFindings: generated.expectedFindings, actualFindings, score });
  await mkdir(outputDir, { recursive: true });
  await writeFile(join(outputDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
  if (format === "markdown" || format === "md") {
    await writeFile(join(outputDir, "report.md"), renderMarkdown(report));
  }
  return report;
}
