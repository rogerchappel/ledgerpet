import assert from "node:assert/strict";
import test from "node:test";
import { parseCsv, toCsv } from "../src/index.js";

test("parseCsv handles quoted commas", () => {
  const rows = parseCsv('id,name\n1,"Acme, Inc"\n', "demo.csv");
  assert.deepEqual(rows, [{ id: "1", name: "Acme, Inc" }]);
});

test("toCsv quotes unsafe values", () => {
  assert.equal(toCsv([{ id: 1, name: "Acme, Inc" }]), 'id,name\n1,"Acme, Inc"\n');
});
