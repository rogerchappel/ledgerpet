import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseCsv } from "./csv.js";
import { assertSyntheticWatermark, LedgerpetError } from "./errors.js";

export async function loadFixture(dir) {
  const metadata = JSON.parse(await readFile(join(dir, "metadata.json"), "utf8"));
  assertSyntheticWatermark(metadata.watermark, `${dir}/metadata.json`);
  const vendors = JSON.parse(await readFile(join(dir, "vendors.json"), "utf8"));
  const invoices = parseCsv(await readFile(join(dir, "invoices.csv"), "utf8"), "invoices.csv");
  const payments = parseCsv(await readFile(join(dir, "payments.csv"), "utf8"), "payments.csv");
  return normalizeFixture({ metadata, vendors, invoices, payments }, {
    invoices: `${dir}/invoices.csv`,
    payments: `${dir}/payments.csv`
  });
}

export function normalizeFixture(fixture, sources = {}) {
  const vendors = fixture.vendors.map((vendor) => ({ ...vendor, synthetic: true }));
  const invoices = fixture.invoices.map((invoice, index) => ({
    ...invoice,
    amount: parseAmount(invoice.amount, sources.invoices ?? "invoices", index),
    synthetic: true
  }));
  const payments = fixture.payments.map((payment, index) => ({
    ...payment,
    amount: parseAmount(payment.amount, sources.payments ?? "payments", index),
    synthetic: true
  }));
  return { ...fixture, vendors, invoices, payments };
}

function parseAmount(value, source, index) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    throw new LedgerpetError(`${source}:${index + 2} field amount must be a finite number`, "INVALID_FIXTURE_AMOUNT");
  }
  return amount;
}

export function summarizeFixture(fixture) {
  const invoiceTotal = fixture.invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const paymentTotal = fixture.payments.reduce((sum, payment) => sum + payment.amount, 0);
  return {
    fixture: fixture.metadata.name,
    watermark: fixture.metadata.watermark,
    vendors: fixture.vendors.length,
    invoices: fixture.invoices.length,
    payments: fixture.payments.length,
    invoiceTotal,
    paymentTotal,
    currency: fixture.metadata.currency ?? "USD"
  };
}
