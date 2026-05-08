import { SYNTHETIC_WATERMARK } from "./constants.js";

export function buildReport({ summary, scenario, expectedFindings, actualFindings, score }) {
  return {
    watermark: SYNTHETIC_WATERMARK,
    generatedAt: new Date(0).toISOString(),
    summary,
    scenario,
    expectedFindings,
    actualFindings,
    score,
    safety: "Synthetic sample only. Do not load production ledgers into ledgerpet unless you intentionally create and watermark your own safe fixture."
  };
}

export function renderMarkdown(report) {
  const expected = report.expectedFindings.map((finding) => `- ${finding.type} (${finding.severity}): ${finding.hint}`).join("\n");
  const actual = report.actualFindings.map((finding) => `- ${finding.type} (${finding.severity}): ${finding.message}`).join("\n");
  return `# Ledgerpet Report\n\n` +
    `> ${report.watermark}\n\n` +
    `Scenario: **${report.scenario}**\n\n` +
    `Fixture: ${report.summary.fixture} (${report.summary.vendors} vendors, ${report.summary.invoices} invoices, ${report.summary.payments} payments)\n\n` +
    `## Score\n\n` +
    `- Score: ${report.score.score}/100\n` +
    `- Precision: ${report.score.precision}\n` +
    `- Recall: ${report.score.recall}\n` +
    `- Missed types: ${report.score.missedTypes.join(", ") || "none"}\n` +
    `- Extra types: ${report.score.extraTypes.join(", ") || "none"}\n\n` +
    `## Expected Findings\n\n${expected || "- none"}\n\n` +
    `## Detected Findings\n\n${actual || "- none"}\n\n` +
    `## Safety\n\n${report.safety}\n`;
}
