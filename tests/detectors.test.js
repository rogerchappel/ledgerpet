import assert from "node:assert/strict";
import test from "node:test";
import { loadFixture, generateScenario, detectAnomalies } from "../src/index.js";

test("detectAnomalies finds ghost payment scenario", async () => {
  const base = await loadFixture("fixtures/sample");
  const { fixture } = generateScenario(base, "ghost-payment");
  const findings = detectAnomalies(fixture);
  assert.ok(findings.some((finding) => finding.type === "unmatched_payment"));
});

test("detectAnomalies finds vendor bank changes", async () => {
  const base = await loadFixture("fixtures/sample");
  const { fixture } = generateScenario(base, "vendor-bank-swap");
  const findings = detectAnomalies(fixture);
  assert.ok(findings.some((finding) => finding.type === "vendor_bank_change"));
});
