import assert from "node:assert/strict";
import test from "node:test";
import { parseCsv, toCsv } from "../src/index.js";

test("parseCsv handles quoted commas", () => {
  const rows = parseCsv('id,name\n1,"Acme, Inc"\n', "demo.csv");
  assert.deepEqual(rows, [{ id: "1", name: "Acme, Inc" }]);
});

test("parseCsv handles escaped quotes and multiline quoted fields", () => {
  const rows = parseCsv('id,name,notes\n1,"Acme ""North""","first line\nsecond line"\n', "demo.csv");
  assert.deepEqual(rows, [{ id: "1", name: 'Acme "North"', notes: "first line\nsecond line" }]);
});

test("parseCsv rejects quotes in unquoted fields", () => {
  assert.throws(
    () => parseCsv('id,name\n1,Ac"me\n', "probe.csv"),
    (error) => error.code === "CSV_QUOTE" && error.message.includes("probe.csv:2")
  );
});

test("parseCsv rejects characters after a closing quote", () => {
  assert.throws(
    () => parseCsv('id,name\n1,"Acme"tail\n', "probe.csv"),
    (error) => error.code === "CSV_QUOTE" && error.message.includes("probe.csv:2")
  );
});

test("parseCsv rejects blank and duplicate headers", () => {
  assert.throws(
    () => parseCsv("id,id\n1,2\n", "duplicate.csv"),
    (error) => error.code === "CSV_HEADER" && error.message.includes('duplicate header "id"')
  );
  assert.throws(
    () => parseCsv("id,\n1,2\n", "blank.csv"),
    (error) => error.code === "CSV_HEADER" && error.message.includes("blank header")
  );
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
    (error) => error.code === "CSV_QUOTE" && error.message === 'csv:2 has an unclosed quote: 1,"Acme\nHoldings',
  );
});

test("toCsv quotes unsafe values", () => {
  assert.equal(toCsv([{ id: 1, name: "Acme, Inc" }]), 'id,name\n1,"Acme, Inc"\n');
});

test("parseCsv accepts CR-only record separators", () => {
  assert.deepEqual(parseCsv("id,note\r1,value\r2,next", "classic-mac.csv"), [
    { id: "1", note: "value" },
    { id: "2", note: "next" },
  ]);
});

test("parseCsv preserves unquoted field edge whitespace", () => {
  assert.deepEqual(parseCsv("id,note\n 1 ,  keep me  \n", "spaces.csv"), [
    { id: " 1 ", note: "  keep me  " },
  ]);
});

test("toCsv round trips unquoted field edge whitespace", () => {
  const rows = [{ id: " 1", note: "tail   " }];
  assert.deepEqual(parseCsv(toCsv(rows)), rows);
});

test("parseCsv preserves CR and LF inside quoted multiline fields", () => {
  assert.deepEqual(parseCsv('id,note\r1,"first\rsecond\nthird\r\nfourth"\r', "multiline.csv"), [
    { id: "1", note: "first\rsecond\nthird\r\nfourth" },
  ]);
});

test("toCsv quotes and round trips fields containing CR", () => {
  const rows = [{ id: "1", note: "first\rsecond" }];
  assert.deepEqual(parseCsv(toCsv(rows)), rows);
});
