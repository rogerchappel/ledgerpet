import assert from "node:assert/strict";
import test from "node:test";
import { parseCsv, toCsv } from "../src/index.js";

test("parseCsv handles quoted commas", () => {
  const rows = parseCsv('id,name\n1,"Acme, Inc"\n', "demo.csv");
  assert.deepEqual(rows, [{ id: "1", name: "Acme, Inc" }]);
});

test("parseCsv handles multiline quoted fields", () => {
  const rows = parseCsv('id,name\n1,"Acme\nHoldings"\n', "demo.csv");
  assert.deepEqual(rows, [{ id: "1", name: "Acme\nHoldings" }]);
});

test("CSV serialization round-trips multiline quoted fields", () => {
  const rows = [{ id: "1", name: "Acme\nHoldings" }];
  assert.deepEqual(parseCsv(toCsv(rows)), rows);
});

test("parseCsv handles escaped quotes adjacent to multiline content", () => {
  const rows = parseCsv('id,name\n1,"Acme ""North""\nHoldings"\n');
  assert.deepEqual(rows, [{ id: "1", name: 'Acme "North"\nHoldings' }]);
});

test("parseCsv handles CRLF record separators", () => {
  const rows = parseCsv('id,name\r\n1,"Acme\r\nHoldings"\r\n');
  assert.deepEqual(rows, [{ id: "1", name: "Acme\r\nHoldings" }]);
});

test("parseCsv reports unterminated multiline records", () => {
  assert.throws(
    () => parseCsv('id,name\n1,"Acme\nHoldings\n'),
    (error) => error.code === "CSV_QUOTE" && error.message === 'Unclosed quote in CSV line: 1,"Acme\nHoldings',
  );
});

test("toCsv quotes unsafe values", () => {
  assert.equal(toCsv([{ id: 1, name: "Acme, Inc" }]), 'id,name\n1,"Acme, Inc"\n');
});
