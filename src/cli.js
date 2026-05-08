#!/usr/bin/env node
import { runInspection, listScenarios, SYNTHETIC_WATERMARK } from "./index.js";

const HELP = `ledgerpet — local-first synthetic finance anomaly trainer\n\nUsage:\n  ledgerpet inspect <fixture-dir> [--scenario <name>] [--output <dir>] [--format json|markdown]\n  ledgerpet scenarios\n  ledgerpet --help\n\nSafety:\n  ${SYNTHETIC_WATERMARK}\n  Real finance data is refused unless you intentionally create compatible watermarked fixtures.\n`;

export async function main(argv = process.argv.slice(2)) {
  const [command, maybeFixture, ...rest] = argv;
  if (!command || command === "--help" || command === "-h") {
    console.log(HELP);
    return 0;
  }
  if (command === "scenarios") {
    console.log(listScenarios().join("\n"));
    return 0;
  }
  if (command !== "inspect") {
    console.error(`Unknown command: ${command}\n\n${HELP}`);
    return 1;
  }
  if (!maybeFixture) {
    console.error("Missing fixture directory. Try: ledgerpet inspect fixtures/sample");
    return 1;
  }
  const options = parseOptions(rest);
  const report = await runInspection({ fixtureDir: maybeFixture, ...options });
  console.log(JSON.stringify({ ok: true, scenario: report.scenario, score: report.score.score, output: options.outputDir ?? "out/ledgerpet" }, null, 2));
  return 0;
}

function parseOptions(args) {
  const options = {};
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    const value = args[i + 1];
    if (arg === "--scenario") { options.scenario = value; i += 1; continue; }
    if (arg === "--output") { options.outputDir = value; i += 1; continue; }
    if (arg === "--format") { options.format = value; i += 1; continue; }
    throw new Error(`Unknown option: ${arg}`);
  }
  return options;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().then((code) => { process.exitCode = code; }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
