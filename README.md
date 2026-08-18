# ledgerpet

A tiny synthetic finance-ops anomaly trainer for testing agents without feeding them real ledgers.

ledgerpet turns fictional vendors, invoices, and payments into deterministic anomaly drills, then scores what an agent found. Think of it as a chew toy for finance agents: safe, local, and obvious when someone tries to bring real data to the dog park.

> Inspired by the public `finagotchi` idea signal noted in the PRD, but built as a fresh local-first OSS concept with its own implementation and scope.

## Why

Agent demos often need finance-like data. Real ledgers are sensitive; random CSVs are boring; hidden SaaS calls are a trust problem. ledgerpet gives you sample fixtures that are clearly watermarked as synthetic, scenario generators, and simple scoring so you can practice the workflow locally.

## Install

ledgerpet is not published to the npm registry. Install and run it from a
source checkout:

```sh
git clone https://github.com/rogerchappel/ledgerpet.git
cd ledgerpet
npm ci
node src/cli.js --help
```

No runtime dependencies are required.

Versioned GitHub releases may also include a `ledgerpet-<version>.tgz` package
asset. When one is available on the
[releases page](https://github.com/rogerchappel/ledgerpet/releases), download
that asset and install the local file (replace `<version>` with the release
version):

```sh
npm install ./ledgerpet-<version>.tgz
./node_modules/.bin/ledgerpet --help
```

Installing a downloaded tarball this way does not ask npm to resolve a
`ledgerpet` package from the registry.

## Quickstart

```sh
node src/cli.js scenarios
node src/cli.js inspect fixtures/sample --scenario ghost-payment --output out/ghost --format markdown
cat out/ghost/report.md
```

After installing a GitHub release package asset:

```sh
./node_modules/.bin/ledgerpet inspect fixtures/sample --scenario duplicate-invoice --output out/dup --format markdown
```

## What it does

- Loads local synthetic fixture files: `metadata.json`, `vendors.json`, `invoices.csv`, `payments.csv`.
- Supports standard quoted CSV fixture fields containing commas, escaped quotes, or multiple lines.
- Refuses fixtures missing the watermark: `LEDGERPET_SYNTHETIC_SAMPLE_DO_NOT_USE_AS_REAL_FINANCIAL_DATA`.
- Requires every invoice and payment `amount` to be a finite number; decimal and zero values are valid.
- Injects deterministic scenarios such as duplicate invoices, ghost payments, vendor bank swaps, weekend rush payments, and round-dollar splits.
- Runs simple detectors and scores findings with precision, recall, and a 0-100 score.
- Writes `report.json` and optional `report.md` locally.

## CLI

```sh
ledgerpet inspect <fixture-dir> [--scenario <name>] [--output <dir>] [--format json|markdown]
ledgerpet scenarios
ledgerpet --version
ledgerpet --help
```

Scenarios:

- `duplicate-invoice`
- `ghost-payment`
- `vendor-bank-swap`
- `weekend-rush`
- `round-dollar-split`

## Library

```js
import { runInspection } from "ledgerpet";

const report = await runInspection({
  fixtureDir: "fixtures/sample",
  scenario: "ghost-payment",
  outputDir: "out/ghost",
  format: "markdown"
});

console.log(report.score.score);
```

## Safety and local-first notes

ledgerpet is intentionally boring about data safety:

- No hidden network calls.
- No telemetry.
- No credentials.
- No production finance integrations.
- Synthetic fixtures are watermarked and fictional by default.

If you create custom fixtures, keep them synthetic or deliberately anonymized. The V1 tool is not a privacy scrubber.

### Custom fixture schema

A fixture directory contains `metadata.json`, `vendors.json`, `invoices.csv`,
and `payments.csv`. Metadata must be an object with the synthetic watermark.
Vendors require non-empty `vendor_id`, `name`, `category`, and
`bank_account_last4` strings; optional `bank_changed_at` must be a calendar
date. Invoice rows require non-empty `invoice_id`, `vendor_id`, and `category`,
a finite `amount`, and `issued_at` and `due_date` calendar dates. Payment rows
require non-empty `payment_id`, `invoice_id`, and `vendor_id`, a finite
`amount`, a `paid_at` calendar date, and a method of `ach`, `wire`, or
`instant`. Categories are free-form non-empty strings.

Dates use strict `YYYY-MM-DD` calendar values, so impossible dates such as
`2026-02-30` are rejected. Invalid shapes and fields throw `LedgerpetError`
with code `INVALID_FIXTURE_SCHEMA` and a row plus field diagnostic; invalid
amounts use `INVALID_FIXTURE_AMOUNT`.

Collections may otherwise be empty, but scenarios that modify an existing
entity have explicit minimums: `duplicate-invoice` requires at least one
invoice and `vendor-bank-swap` requires at least one vendor. Missing scenario
seed entities throw `LedgerpetError` with code
`SCENARIO_FIXTURE_REQUIREMENT`; the other scenarios generate their own rows
and do not require a non-empty collection.

## Development

```sh
npm run check
npm test
npm run build
npm run smoke
npm run docs:smoke
bash scripts/validate.sh
```

The StackForge-generated validation script remains the main local gate. It runs the standard package checks and treats optional `agent-qc` as a skip when unavailable.

## Project docs

- [PRD](docs/PRD.md)
- [Tasks](docs/TASKS.md)
- [Orchestration](docs/ORCHESTRATION.md)
- [Machine orchestration](docs/orchestration.json)

## Contributing

Small, well-tested scenarios are welcome. Please avoid real financial data in issues, tests, fixtures, or screenshots.

## License

MIT
