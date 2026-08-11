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
    metadata: {},
    vendors: [],
    invoices: [{ amount: "12.50" }],
    payments: [{ amount: "0" }]
  });
  assert.equal(fixture.invoices[0].amount, 12.5);
  assert.equal(fixture.payments[0].amount, 0);
});

async function makeFixture() {
  const dir = await mkdtemp(join(tmpdir(), "ledgerpet-amount-"));
  await writeFile(join(dir, "metadata.json"), JSON.stringify({ name: "test", watermark: SYNTHETIC_WATERMARK }));
  await writeFile(join(dir, "vendors.json"), "[]");
  await writeFile(join(dir, "invoices.csv"), "invoice_id,vendor_id,issued_at,due_date,amount,category\n");
  await writeFile(join(dir, "payments.csv"), "payment_id,invoice_id,vendor_id,paid_at,amount,method\n");
  return dir;
}
