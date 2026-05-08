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
