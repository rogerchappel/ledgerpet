import assert from "node:assert/strict";
import test from "node:test";
import { loadFixture, generateScenario, listScenarios } from "../src/index.js";

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
