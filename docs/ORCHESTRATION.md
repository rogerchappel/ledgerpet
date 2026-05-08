# ledgerpet Orchestration

ledgerpet is designed for safe local agent exercises. The orchestrator should run everything on local synthetic fixtures and treat any request to ingest production financial data as out-of-scope unless the operator has deliberately created a compatible, watermarked fixture.

## Suggested Agent Loop

1. Start with `fixtures/sample`.
2. Run `ledgerpet inspect fixtures/sample --scenario <scenario> --output out/<scenario> --format markdown`.
3. Hand `out/<scenario>/report.json` to an agent or evaluator.
4. Compare the agent's declared anomaly types with `expectedFindings`.
5. Keep generated reports local; do not upload ledger data by default.

## Safety Rules

- No network access is needed for normal usage.
- Fixtures must include `LEDGERPET_SYNTHETIC_SAMPLE_DO_NOT_USE_AS_REAL_FINANCIAL_DATA` in `metadata.json`.
- Example vendors and amounts are fictional.
- Reports are deterministic except for user-chosen output paths.
