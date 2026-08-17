import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import { loadFixture, normalizeFixture, summarizeFixture, SYNTHETIC_WATERMARK } from "../src/index.js";

test("loadFixture normalizes sample data and keeps watermark", async () => {
  const fixture = await loadFixture("fixtures/sample");
  const summary = summarizeFixture(fixture);
  assert.equal(summary.watermark, SYNTHETIC_WATERMARK);
  assert.equal(summary.vendors, 3);
  assert.equal(summary.invoices, 4);
  assert.equal(summary.payments, 3);
});

test("loadFixture refuses unwatermarked metadata", async () => {
  const dir = await mkdtemp(join(tmpdir(), "ledgerpet-bad-"));
  await writeFile(join(dir, "metadata.json"), JSON.stringify({ name: "bad" }));
  await writeFile(join(dir, "vendors.json"), "[]");
  await writeFile(join(dir, "invoices.csv"), "invoice_id,vendor_id,issued_at,due_date,amount,category\n");
  await writeFile(join(dir, "payments.csv"), "payment_id,invoice_id,vendor_id,paid_at,amount,method\n");
  await assert.rejects(() => loadFixture(dir), /missing the ledgerpet synthetic watermark/);
});

test("loadFixture identifies non-finite invoice and payment amounts", async () => {
  for (const [file, header, row, expectedRow] of [
    ["invoices.csv", "invoice_id,vendor_id,issued_at,due_date,amount,category", "INV-1,VEN-1,2026-01-01,2026-01-02,not-a-number,test", 2],
    ["payments.csv", "payment_id,invoice_id,vendor_id,paid_at,amount,method", "PAY-1,INV-1,VEN-1,2026-01-02,Infinity,wire", 2]
  ]) {
    const dir = await makeFixture();
    await writeFile(join(dir, file), `${header}\n${row}\n`);
    await assert.rejects(
      () => loadFixture(dir),
      (error) => error.name === "LedgerpetError" &&
        error.code === "INVALID_FIXTURE_AMOUNT" &&
        error.message === `${join(dir, file)}:${expectedRow} field amount must be a finite number`
    );
  }
});

test("normalizeFixture accepts decimal and zero amounts", () => {
  const fixture = normalizeFixture({
    metadata: { name: "test" },
    vendors: [],
    invoices: [{ invoice_id: "INV-1", vendor_id: "VEN-1", issued_at: "2026-01-01", due_date: "2026-01-02", amount: "12.50", category: "test" }],
    payments: [{ payment_id: "PAY-1", invoice_id: "INV-1", vendor_id: "VEN-1", paid_at: "2026-01-02", amount: "0", method: "ach" }]
  });
  assert.equal(fixture.invoices[0].amount, 12.5);
  assert.equal(fixture.payments[0].amount, 0);
});

test("loadFixture rejects invalid and impossible calendar dates with row diagnostics", async () => {
  for (const [file, header, row, field] of [
    ["invoices.csv", "invoice_id,vendor_id,issued_at,due_date,amount,category", "INV-1,VEN-1,2026-02-30,2026-03-10,1,test", "issued_at"],
    ["invoices.csv", "invoice_id,vendor_id,issued_at,due_date,amount,category", "INV-1,VEN-1,2026-02-01,tomorrow,1,test", "due_date"],
    ["payments.csv", "payment_id,invoice_id,vendor_id,paid_at,amount,method", "PAY-1,INV-1,VEN-1,2026-13-01,1,wire", "paid_at"]
  ]) {
    const dir = await makeFixture();
    await writeFile(join(dir, file), `${header}\n${row}\n`);
    await assert.rejects(() => loadFixture(dir), (error) =>
      error.code === "INVALID_FIXTURE_SCHEMA" &&
      error.message === `${join(dir, file)}:2 field ${field} must be a valid calendar date in YYYY-MM-DD format`
    );
  }
});

test("normalizeFixture rejects missing collections and wrong-shaped required fields", () => {
  assert.throws(
    () => normalizeFixture({ metadata: { name: "test" }, vendors: {}, invoices: [], payments: [] }),
    (error) => error.code === "INVALID_FIXTURE_SCHEMA" && error.message === "fixture field vendors must be an array"
  );
  assert.throws(
    () => normalizeFixture({ metadata: { name: "test" }, vendors: [{ vendor_id: "VEN-1" }], invoices: [], payments: [] }),
    (error) => error.code === "INVALID_FIXTURE_SCHEMA" && error.message === "vendors:1 field name must be a non-empty string"
  );
});

test("normalizeFixture rejects unsupported payment methods", () => {
  assert.throws(
    () => normalizeFixture({
      metadata: { name: "test" },
      vendors: [],
      invoices: [],
      payments: [{ payment_id: "PAY-1", invoice_id: "INV-1", vendor_id: "VEN-1", paid_at: "2026-01-02", amount: 1, method: "card" }]
    }),
    (error) => error.code === "INVALID_FIXTURE_SCHEMA" && error.message === "payments:2 field method must be one of: ach, wire, instant"
  );
});

async function makeFixture() {
  const dir = await mkdtemp(join(tmpdir(), "ledgerpet-amount-"));
  await writeFile(join(dir, "metadata.json"), JSON.stringify({ name: "test", watermark: SYNTHETIC_WATERMARK }));
  await writeFile(join(dir, "vendors.json"), "[]");
  await writeFile(join(dir, "invoices.csv"), "invoice_id,vendor_id,issued_at,due_date,amount,category\n");
  await writeFile(join(dir, "payments.csv"), "payment_id,invoice_id,vendor_id,paid_at,amount,method\n");
  return dir;
}
