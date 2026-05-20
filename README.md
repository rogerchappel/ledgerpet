# ledgerpet

A tiny synthetic finance-ops anomaly trainer for testing agents without feeding them real ledgers.

ledgerpet turns fictional vendors, invoices, and payments into deterministic anomaly drills, then scores what an agent found. Think of it as a chew toy for finance agents: safe, local, and obvious when someone tries to bring real data to the dog park.

> Inspired by the public `finagotchi` idea signal noted in the PRD, but built as a fresh local-first OSS concept with its own implementation and scope.

## Why

Agent demos often need finance-like data. Real ledgers are sensitive; random CSVs are boring; hidden SaaS calls are a trust problem. ledgerpet gives you sample fixtures that are clearly watermarked as synthetic, scenario generators, and simple scoring so you can practice the workflow locally.

## Install

```sh
npm install ledgerpet
```

Or try it locally:

```sh
git clone https://github.com/rogerchappel/ledgerpet.git
cd ledgerpet
npm install
```

No runtime dependencies are required.

## Quickstart

```sh
node src/cli.js scenarios
node src/cli.js inspect fixtures/sample --scenario ghost-payment --output out/ghost --format markdown
cat out/ghost/report.md
```

After package installation or linking:

```sh
npx ledgerpet inspect fixtures/sample --scenario duplicate-invoice --output out/dup --format markdown
```

## What it does

- Loads local synthetic fixture files: `metadata.json`, `vendors.json`, `invoices.csv`, `payments.csv`.
- Refuses fixtures missing the watermark: `LEDGERPET_SYNTHETIC_SAMPLE_DO_NOT_USE_AS_REAL_FINANCIAL_DATA`.
- Injects deterministic scenarios such as duplicate invoices, ghost payments, vendor bank swaps, weekend rush payments, and round-dollar splits.
- Runs simple detectors and scores findings with precision, recall, and a 0-100 score.
- Writes `report.json` and optional `report.md` locally.

## CLI

```sh
ledgerpet inspect <fixture-dir> [--scenario <name>] [--output <dir>] [--format json|markdown]
ledgerpet scenarios
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

## Development

```sh
npm run check
npm test
npm run build
npm run smoke
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
