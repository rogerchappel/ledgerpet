# Security Policy

ledgerpet is local-first and uses synthetic sample finance data by default. It should not receive production ledgers, banking details, secrets, or customer financial records in issues or pull requests.

## Supported Versions

The `main` branch is the supported development line until the first tagged release.

## Reporting a Vulnerability

Please open a private security advisory on GitHub if available, or contact the maintainer privately. Do not include real financial data in the report. A minimal synthetic reproduction is preferred.

## Data Safety Expectations

- Keep fixtures synthetic or deliberately anonymized.
- Do not add telemetry, hidden network calls, credential collection, or remote uploads.
- Preserve the synthetic watermark checks unless a safer replacement is reviewed.
- Treat any accidental real ledger sample as sensitive and remove it from history before publication.
