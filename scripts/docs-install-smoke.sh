#!/usr/bin/env bash

set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
smoke_root=$(mktemp -d "${TMPDIR:-/tmp}/ledgerpet-docs-smoke.XXXXXX")
trap 'rm -rf "$smoke_root"' EXIT

package_dir="$smoke_root/package"
consumer_dir="$smoke_root/consumer"
output_dir="$smoke_root/output"
mkdir -p "$package_dir" "$consumer_dir"

package_name=$(npm pack "$repo_root" --pack-destination "$package_dir" --silent)

cd "$consumer_dir"
npm init --yes --silent >/dev/null
npm install --offline --ignore-scripts --no-audit --no-fund \
  "$package_dir/$package_name" >/dev/null

help_output=$(./node_modules/.bin/ledgerpet --help)
grep -F 'ledgerpet inspect <fixture-dir>' <<<"$help_output" >/dev/null
./node_modules/.bin/ledgerpet inspect "$repo_root/fixtures/sample" \
  --scenario duplicate-invoice \
  --output "$output_dir" \
  --format markdown >/dev/null

test -s "$output_dir/report.json"
test -s "$output_dir/report.md"
echo "Documentation install smoke passed for $package_name"
