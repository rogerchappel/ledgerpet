export function detectAnomalies(fixture) {
  return [
    ...detectDuplicateInvoices(fixture),
    ...detectUnmatchedPayments(fixture),
    ...detectVendorBankChanges(fixture),
    ...detectWeekendRushPayments(fixture),
    ...detectRoundDollarSplits(fixture)
  ];
}

export function detectDuplicateInvoices(fixture) {
  const seen = new Map();
  const findings = [];
  for (const invoice of fixture.invoices) {
    const key = `${invoice.vendor_id}:${invoice.amount}:${invoice.category}`;
    const prior = seen.get(key);
    if (prior && Math.abs(daysBetween(prior.due_date, invoice.due_date)) <= 7) {
      findings.push({ id: `FIND-DUP-${findings.length + 1}`, type: "duplicate_invoice", severity: "high", evidence: [prior.invoice_id, invoice.invoice_id], message: "Possible duplicate invoice: same vendor, amount, category, and close due dates." });
    }
    seen.set(key, invoice);
  }
  return findings;
}

export function detectUnmatchedPayments(fixture) {
  const invoiceIds = new Set(fixture.invoices.map((invoice) => invoice.invoice_id));
  const vendorIds = new Set(fixture.vendors.map((vendor) => vendor.vendor_id));
  return fixture.payments
    .filter((payment) => !invoiceIds.has(payment.invoice_id) || !vendorIds.has(payment.vendor_id))
    .map((payment, index) => ({ id: `FIND-GHOST-${index + 1}`, type: "unmatched_payment", severity: "critical", evidence: [payment.payment_id, payment.invoice_id, payment.vendor_id], message: "Payment references an invoice or vendor not present in the ledger fixture." }));
}

export function detectVendorBankChanges(fixture) {
  return fixture.vendors
    .filter((vendor) => vendor.bank_changed_at)
    .map((vendor, index) => ({ id: `FIND-BANK-${index + 1}`, type: "vendor_bank_change", severity: "high", evidence: [vendor.vendor_id, vendor.bank_account_last4], message: "Vendor bank details changed inside the fixture window." }));
}

export function detectWeekendRushPayments(fixture) {
  return fixture.payments
    .filter((payment) => isWeekend(payment.paid_at) && ["instant", "wire"].includes(payment.method))
    .map((payment, index) => ({ id: `FIND-WEEKEND-${index + 1}`, type: "weekend_rush_payment", severity: "medium", evidence: [payment.payment_id, payment.paid_at], message: "Fast payment landed on a weekend." }));
}

export function detectRoundDollarSplits(fixture) {
  const groups = new Map();
  for (const invoice of fixture.invoices) {
    if (invoice.amount % 1000 !== 0) continue;
    const key = `${invoice.vendor_id}:${invoice.issued_at}:${invoice.amount}:${invoice.category}`;
    groups.set(key, [...(groups.get(key) ?? []), invoice]);
  }
  return [...groups.values()]
    .filter((rows) => rows.length > 1)
    .map((rows, index) => ({ id: `FIND-SPLIT-${index + 1}`, type: "split_round_amount", severity: "medium", evidence: rows.map((row) => row.invoice_id), message: "Repeated same-day round-dollar invoices look like a split approval pattern." }));
}

function isWeekend(date) {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
}

function daysBetween(a, b) {
  const left = new Date(`${a}T00:00:00Z`).getTime();
  const right = new Date(`${b}T00:00:00Z`).getTime();
  return (right - left) / 86_400_000;
}
