#!/usr/bin/env node
import { createRequire } from "node:module";
import { runInspection, listScenarios, SYNTHETIC_WATERMARK } from "./index.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json");

const HELP = `ledgerpet — local-first synthetic finance anomaly trainer\n\nUsage:\n  ledgerpet inspect <fixture-dir> [--scenario <name>] [--output <dir>] [--format json|markdown]\n  ledgerpet scenarios\n  ledgerpet --version\n  ledgerpet --help\n\nSafety:\n  ${SYNTHETIC_WATERMARK}\n  Real finance data is refused unless you intentionally create compatible watermarked fixtures.\n`;

export async function main(argv = process.argv.slice(2)) {
  const [command, maybeFixture, ...rest] = argv;
  if (!command) {
    console.log(HELP);
    return 0;
  }
  if (command === "--help" || command === "-h") {
    rejectUnexpectedArguments(argv.slice(1), command);
    console.log(HELP);
    return 0;
  }
  if (command === "--version" || command === "-v") {
    rejectUnexpectedArguments(argv.slice(1), command);
    console.log(version);
    return 0;
  }
  if (command === "scenarios") {
    rejectUnexpectedArguments(argv.slice(1), command);
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
    if (["--scenario", "--output", "--format"].includes(arg)) {
      if (value === undefined || value.startsWith("--")) {
        throw new Error(`Missing value for ${arg}`);
      }
      if (arg === "--scenario") options.scenario = value;
      if (arg === "--output") options.outputDir = value;
      if (arg === "--format") {
        if (!["json", "markdown"].includes(value)) {
          throw new Error(`Unsupported format: ${value}. Expected json or markdown`);
        }
        options.format = value;
      }
      i += 1;
      continue;
    }
    throw new Error(`Unknown option: ${arg}`);
  }
  return options;
}

function rejectUnexpectedArguments(args, command) {
  if (args.length > 0) {
    throw new Error(`Unexpected argument for ${command}: ${args[0]}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().then((code) => { process.exitCode = code; }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
