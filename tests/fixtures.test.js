import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import { loadFixture, summarizeFixture, SYNTHETIC_WATERMARK } from "../src/index.js";

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
