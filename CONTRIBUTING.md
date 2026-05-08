# Contributing

Thanks for helping make ledgerpet a better safe playground for finance-agent evaluation.

## Ground Rules

- Use synthetic data only.
- Keep changes local-first: no hidden network calls, telemetry, credentials, or SaaS dependencies.
- Prefer small, reviewable pull requests.
- Add or update tests for parser, scenario, scorer, report, or CLI behavior when you change them.

## Local Workflow

```sh
npm install
npm run check
npm test
npm run smoke
bash scripts/validate.sh
```

## Scenario Contributions

A good scenario includes:

1. A deterministic fixture mutation.
2. One or more expected findings.
3. A detector or documented reason it is meant for external agents only.
4. Tests and README/docs updates.

## Privacy

Do not paste real invoices, bank details, vendor names, or customer financial records into issues, fixtures, commits, screenshots, or generated reports.
