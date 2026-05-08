# ledgerpet Tasks

## V1 Must Haves

- [x] Preserve StackForge `oss-cli` scaffold baseline.
- [x] Copy the idea PRD into `docs/PRD.md`.
- [x] Add local-first synthetic fixture loading with a hard watermark check.
- [x] Generate deterministic finance-ops anomaly scenarios.
- [x] Detect common anomalies from the generated fixture.
- [x] Score findings by anomaly type with precision, recall, and 0-100 score.
- [x] Render JSON and Markdown reports.
- [x] Ship a CLI smoke path using `fixtures/sample`.
- [x] Add tests for CSV parsing, fixture safety, scenario generation, scoring, reporting, and CLI smoke.
- [x] Document install, examples, safety boundaries, and inspiration attribution.

## Follow-up Ideas

- Add a `score <expected> <actual>` command for external agent submissions.
- Add fixture schema validation with friendly repair hints.
- Add more scenario packs for procurement, payroll, and reimbursements.
- Emit SARIF or junit-style outputs for CI-based agent evals.
