import assert from "node:assert/strict";
import test from "node:test";
import { detectAnomalies, loadFixture, generateScenario, listScenarios, normalizeFixture, scoreFindings } from "../src/index.js";

test("all scenarios generate expected findings", async () => {
  const base = await loadFixture("fixtures/sample");
  for (const scenario of listScenarios()) {
    const generated = generateScenario(base, scenario);
    assert.equal(generated.fixture.metadata.scenario, scenario);
    assert.ok(generated.expectedFindings.length >= 1, scenario);
  }
});

test("unknown scenario fails loudly", async () => {
  const base = await loadFixture("fixtures/sample");
  assert.throws(() => generateScenario(base, "nope"), /Unknown scenario/);
});

test("duplicate-invoice requires a seed invoice", async () => {
  const base = await loadFixture("fixtures/sample");
  base.invoices = [];
  assert.throws(
    () => generateScenario(base, "duplicate-invoice"),
    (error) => error.name === "LedgerpetError" &&
      error.code === "SCENARIO_FIXTURE_REQUIREMENT" &&
      error.message === "Scenario 'duplicate-invoice' requires at least one invoice in the fixture"
  );
});

test("vendor-bank-swap requires a seed vendor", async () => {
  const base = await loadFixture("fixtures/sample");
  base.vendors = [];
  assert.throws(
    () => generateScenario(base, "vendor-bank-swap"),
    (error) => error.name === "LedgerpetError" &&
      error.code === "SCENARIO_FIXTURE_REQUIREMENT" &&
      error.message === "Scenario 'vendor-bank-swap' requires at least one vendor in the fixture"
  );
});

test("weekend-rush generates supporting rows for an empty fixture", () => {
  const base = {
    metadata: { name: "empty custom fixture", watermark: "SYNTHETIC DATA - NOT REAL FINANCIAL RECORDS" },
    vendors: [],
    invoices: [],
    payments: []
  };

  const generated = generateScenario(base, "weekend-rush");
  const actual = detectAnomalies(generated.fixture);
  const expectedTypes = generated.expectedFindings.map((finding) => finding.type);
  const actualTypes = actual.map((finding) => finding.type);

  assert.deepEqual(expectedTypes, ["weekend_rush_payment"]);
  assert.deepEqual(actualTypes, expectedTypes);
  assert.equal(actual.some((finding) => finding.type === "unmatched_payment"), false);
  assert.deepEqual(scoreFindings(generated.expectedFindings, actual), {
    score: 100,
    precision: 1,
    recall: 1,
    truePositives: 1,
    falsePositives: 0,
    missed: 0,
    matchedTypes: ["weekend_rush_payment"],
    missedTypes: [],
    extraTypes: []
  });
});

test("duplicate-invoice allocates a collision-free invoice identifier", async () => {
  const base = await loadFixture("fixtures/sample");
  const seed = base.invoices.find((row) => row.invoice_id === "INV-1003");
  base.invoices.push({ ...seed, invoice_id: "INV-1003-DUP" });
  const generated = generateScenario(base, "duplicate-invoice");
  assert.equal(generated.expectedFindings[0].evidence[1], "INV-1003-DUP-2");
  assert.doesNotThrow(() => normalizeFixture(generated.fixture));
});

test("weekend-rush preserves pre-existing identifier relationships", async () => {
  const base = await loadFixture("fixtures/sample");
  const nova = base.vendors.find((vendor) => vendor.vendor_id === "VEN-NOVA");
  assert.ok(nova);
  const reservedInvoice = base.invoices.find((invoice) => invoice.invoice_id === "INV-1004");
  reservedInvoice.vendor_id = base.vendors[0].vendor_id;
  base.payments.push({ payment_id: "PAY-WEEKEND-7001", invoice_id: base.invoices[0].invoice_id, vendor_id: base.invoices[0].vendor_id, paid_at: "2026-02-02", amount: 10, method: "ach" });
  const generated = generateScenario(base, "weekend-rush");
  assert.deepEqual(generated.expectedFindings[0].evidence, ["PAY-WEEKEND-7001-2", "2026-02-15"]);
  assert.doesNotThrow(() => normalizeFixture(generated.fixture));
});

test("round-dollar-split creates valid support rows for an empty fixture", () => {
  const base = { metadata: { name: "empty", watermark: "SYNTHETIC DATA - NOT REAL FINANCIAL RECORDS" }, vendors: [], invoices: [], payments: [] };
  const generated = generateScenario(base, "round-dollar-split");
  assert.equal(generated.fixture.vendors[0].vendor_id, "VEN-ORBIT");
  assert.doesNotThrow(() => normalizeFixture(generated.fixture));
});
