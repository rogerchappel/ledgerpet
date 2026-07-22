import assert from "node:assert/strict";
import test from "node:test";
import { loadFixture, generateScenario, detectAnomalies } from "../src/index.js";
import { detectDuplicateInvoices } from "../src/detectors.js";

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

test("detectDuplicateInvoices is independent of invoice order", () => {
  const invoiceA = { invoice_id: "A", vendor_id: "VEN-1", amount: 100, category: "supplies", due_date: "2026-01-01" };
  const invoiceB = { invoice_id: "B", vendor_id: "VEN-1", amount: 100, category: "supplies", due_date: "2026-01-20" };
  const invoiceC = { invoice_id: "C", vendor_id: "VEN-1", amount: 100, category: "supplies", due_date: "2026-01-02" };

  for (const invoices of [[invoiceA, invoiceB, invoiceC], [invoiceC, invoiceB, invoiceA]]) {
    const findings = detectDuplicateInvoices({ invoices });
    assert.deepEqual(findings.map((finding) => finding.evidence.toSorted()), [["A", "C"]]);
  }
});
