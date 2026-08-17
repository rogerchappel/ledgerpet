import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseCsv } from "./csv.js";
import { assertSyntheticWatermark, LedgerpetError } from "./errors.js";

const PAYMENT_METHODS = new Set(["ach", "wire", "instant"]);

export async function loadFixture(dir) {
  const metadata = JSON.parse(await readFile(join(dir, "metadata.json"), "utf8"));
  assertSyntheticWatermark(metadata.watermark, `${dir}/metadata.json`);
  const vendors = JSON.parse(await readFile(join(dir, "vendors.json"), "utf8"));
  const invoices = parseCsv(await readFile(join(dir, "invoices.csv"), "utf8"), "invoices.csv");
  const payments = parseCsv(await readFile(join(dir, "payments.csv"), "utf8"), "payments.csv");
  return normalizeFixture({ metadata, vendors, invoices, payments }, {
    fixture: dir,
    vendors: `${dir}/vendors.json`,
    invoices: `${dir}/invoices.csv`,
    payments: `${dir}/payments.csv`
  });
}

export function normalizeFixture(fixture, sources = {}) {
  validateFixture(fixture, sources);
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

export function validateFixture(fixture, sources = {}) {
  const source = sources.fixture ?? "fixture";
  requireObject(fixture, source);
  requireObject(fixture.metadata, `${source}.metadata`);
  requireText(fixture.metadata, "name", `${source}.metadata`);
  requireCollection(fixture, "vendors", source);
  requireCollection(fixture, "invoices", source);
  requireCollection(fixture, "payments", source);

  fixture.vendors.forEach((row, index) => {
    const location = `${sources.vendors ?? "vendors"}:${index + 1}`;
    requireObject(row, location);
    for (const field of ["vendor_id", "name", "category", "bank_account_last4"]) requireText(row, field, location);
    if (row.bank_changed_at !== undefined && row.bank_changed_at !== "") requireDate(row, "bank_changed_at", location);
  });
  fixture.invoices.forEach((row, index) => {
    const location = `${sources.invoices ?? "invoices"}:${index + 2}`;
    requireObject(row, location);
    for (const field of ["invoice_id", "vendor_id", "category"]) requireText(row, field, location);
    requireDate(row, "issued_at", location);
    requireDate(row, "due_date", location);
  });
  fixture.payments.forEach((row, index) => {
    const location = `${sources.payments ?? "payments"}:${index + 2}`;
    requireObject(row, location);
    for (const field of ["payment_id", "invoice_id", "vendor_id"]) requireText(row, field, location);
    requireDate(row, "paid_at", location);
    requireText(row, "method", location);
    if (!PAYMENT_METHODS.has(row.method)) fail(`${location} field method must be one of: ach, wire, instant`);
  });
  return fixture;
}

function requireCollection(fixture, field, source) {
  if (!Array.isArray(fixture[field])) fail(`${source} field ${field} must be an array`);
}

function requireObject(value, location) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${location} must be an object`);
}

function requireText(row, field, location) {
  if (typeof row[field] !== "string" || row[field].trim() === "") fail(`${location} field ${field} must be a non-empty string`);
}

function requireDate(row, field, location) {
  const value = row[field];
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    fail(`${location} field ${field} must be a valid calendar date in YYYY-MM-DD format`);
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    fail(`${location} field ${field} must be a valid calendar date in YYYY-MM-DD format`);
  }
}

function fail(message) {
  throw new LedgerpetError(message, "INVALID_FIXTURE_SCHEMA");
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
