import assert from "node:assert/strict";
import test from "node:test";
import { scoreFindings } from "../src/index.js";

test("scoreFindings awards perfect type match", () => {
  const score = scoreFindings([{ type: "duplicate_invoice" }], [{ type: "duplicate_invoice" }]);
  assert.equal(score.score, 100);
  assert.equal(score.precision, 1);
  assert.equal(score.recall, 1);
});

test("scoreFindings reports missed and extra types", () => {
  const score = scoreFindings([{ type: "duplicate_invoice" }, { type: "unmatched_payment" }], [{ type: "vendor_bank_change" }]);
  assert.equal(score.score, 0);
  assert.deepEqual(score.extraTypes, ["vendor_bank_change"]);
  assert.deepEqual(score.missedTypes, ["duplicate_invoice", "unmatched_payment"]);
});
