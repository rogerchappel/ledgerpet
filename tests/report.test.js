import assert from "node:assert/strict";
import test from "node:test";
import { buildReport, renderMarkdown, SYNTHETIC_WATERMARK } from "../src/index.js";

test("renderMarkdown includes watermark and score", () => {
  const report = buildReport({
    summary: { fixture: "demo", vendors: 1, invoices: 1, payments: 1 },
    scenario: "ghost-payment",
    expectedFindings: [{ type: "unmatched_payment", severity: "critical", hint: "missing invoice" }],
    actualFindings: [{ type: "unmatched_payment", severity: "critical", message: "missing invoice" }],
    score: { score: 100, precision: 1, recall: 1, missedTypes: [], extraTypes: [] }
  });
  const markdown = renderMarkdown(report);
  assert.ok(markdown.includes(SYNTHETIC_WATERMARK));
  assert.ok(markdown.includes("Score: 100/100"));
});
