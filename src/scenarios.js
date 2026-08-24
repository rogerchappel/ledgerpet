import { SCENARIOS } from "./constants.js";
import { LedgerpetError } from "./errors.js";
import { validateFixture } from "./fixtures.js";

const SCENARIO_REQUIREMENTS = {
  "duplicate-invoice": { collection: "invoices", entity: "invoice" },
  "vendor-bank-swap": { collection: "vendors", entity: "vendor" }
};

export function listScenarios() {
  return [...SCENARIOS];
}

export function generateScenario(fixture, scenario = "duplicate-invoice") {
  if (!SCENARIOS.includes(scenario)) {
    throw new LedgerpetError(`Unknown scenario '${scenario}'. Try one of: ${SCENARIOS.join(", ")}`, "UNKNOWN_SCENARIO");
  }
  validateFixture(fixture);
  requireScenarioSeed(fixture, scenario);
  const clone = structuredClone(fixture);
  const findings = [];
  if (scenario === "duplicate-invoice") duplicateInvoice(clone, findings);
  if (scenario === "ghost-payment") ghostPayment(clone, findings);
  if (scenario === "vendor-bank-swap") vendorBankSwap(clone, findings);
  if (scenario === "weekend-rush") weekendRush(clone, findings);
  if (scenario === "round-dollar-split") roundDollarSplit(clone, findings);
  clone.metadata = { ...clone.metadata, scenario, generatedBy: "ledgerpet", synthetic: true };
  return { fixture: clone, expectedFindings: findings };
}

function requireScenarioSeed(fixture, scenario) {
  const requirement = SCENARIO_REQUIREMENTS[scenario];
  if (requirement && fixture[requirement.collection].length === 0) {
    throw new LedgerpetError(
      `Scenario '${scenario}' requires at least one ${requirement.entity} in the fixture`,
      "SCENARIO_FIXTURE_REQUIREMENT"
    );
  }
}

function duplicateInvoice(fixture, findings) {
  const invoice = fixture.invoices.find((row) => row.invoice_id === "INV-1003") ?? fixture.invoices[0];
  const duplicateId = uniqueId(fixture.invoices, "invoice_id", `${invoice.invoice_id}-DUP`);
  const duplicate = { ...invoice, invoice_id: duplicateId, due_date: shiftDate(invoice.due_date, 2), note: "Injected duplicate invoice" };
  fixture.invoices.push(duplicate);
  findings.push({ id: "ANOM-DUP-001", type: "duplicate_invoice", severity: "high", evidence: [invoice.invoice_id, duplicate.invoice_id], hint: "Same vendor, amount, and near-identical due date." });
}

function ghostPayment(fixture, findings) {
  fixture.payments.push({ payment_id: "PAY-GHOST-9001", invoice_id: "INV-NOT-FOUND", vendor_id: "VEN-404", paid_at: "2026-02-13", amount: 4242.42, method: "wire", synthetic: true });
  findings.push({ id: "ANOM-GHOST-001", type: "unmatched_payment", severity: "critical", evidence: ["PAY-GHOST-9001", "INV-NOT-FOUND"], hint: "Payment references a missing invoice and unknown vendor." });
}

function vendorBankSwap(fixture, findings) {
  const vendor = fixture.vendors.find((row) => row.vendor_id === "VEN-ACME") ?? fixture.vendors[0];
  vendor.bank_account_last4 = "7788";
  vendor.bank_changed_at = "2026-02-09";
  findings.push({ id: "ANOM-BANK-001", type: "vendor_bank_change", severity: "high", evidence: [vendor.vendor_id, "7788"], hint: "Bank account changed shortly before payment run." });
}

function weekendRush(fixture, findings) {
  if (!fixture.vendors.some((vendor) => vendor.vendor_id === "VEN-NOVA")) {
    fixture.vendors.push({
      vendor_id: "VEN-NOVA",
      name: "Nova Facilities Lab",
      category: "facilities",
      bank_account_last4: "2048",
      synthetic: true
    });
  }
  let invoice = fixture.invoices.find((row) => row.invoice_id === "INV-1004" && row.vendor_id === "VEN-NOVA");
  if (!invoice) {
    const invoiceId = uniqueId(fixture.invoices, "invoice_id", "INV-1004");
    fixture.invoices.push({
      invoice_id: invoiceId,
      vendor_id: "VEN-NOVA",
      issued_at: "2026-02-08",
      due_date: "2026-02-22",
      amount: 9750,
      category: "facilities",
      synthetic: true
    });
    invoice = fixture.invoices.at(-1);
  }
  const paymentId = uniqueId(fixture.payments, "payment_id", "PAY-WEEKEND-7001");
  fixture.payments.push({ payment_id: paymentId, invoice_id: invoice.invoice_id, vendor_id: invoice.vendor_id, paid_at: "2026-02-15", amount: 9800, method: "instant", synthetic: true });
  findings.push({ id: "ANOM-WEEKEND-001", type: "weekend_rush_payment", severity: "medium", evidence: [paymentId, "2026-02-15"], hint: "Unusual weekend instant payment." });
}

function roundDollarSplit(fixture, findings) {
  let vendor = fixture.vendors.find((row) => row.vendor_id === "VEN-ORBIT");
  if (!vendor) {
    vendor = { vendor_id: "VEN-ORBIT", name: "Orbit Consulting Lab", category: "consulting", bank_account_last4: "3141", synthetic: true };
    fixture.vendors.push(vendor);
  }
  const firstId = uniqueId(fixture.invoices, "invoice_id", "INV-SPLIT-1");
  fixture.invoices.push({ invoice_id: firstId, vendor_id: vendor.vendor_id, issued_at: "2026-02-10", due_date: "2026-02-20", amount: 5000, category: "consulting", synthetic: true });
  const secondId = uniqueId(fixture.invoices, "invoice_id", "INV-SPLIT-2");
  fixture.invoices.push({ invoice_id: secondId, vendor_id: vendor.vendor_id, issued_at: "2026-02-10", due_date: "2026-02-20", amount: 5000, category: "consulting", synthetic: true });
  findings.push({ id: "ANOM-SPLIT-001", type: "split_round_amount", severity: "medium", evidence: [firstId, secondId], hint: "Two same-day round-dollar invoices may be a split approval pattern." });
}

function uniqueId(rows, field, preferred) {
  const existing = new Set(rows.map((row) => row[field]));
  if (!existing.has(preferred)) return preferred;
  let suffix = 2;
  while (existing.has(`${preferred}-${suffix}`)) suffix += 1;
  return `${preferred}-${suffix}`;
}

function shiftDate(date, days) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
