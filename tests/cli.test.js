import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access, mkdtemp, readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import { main } from "../src/cli.js";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("CLI prints package version", () => {
  const result = spawnSync(process.execPath, ["src/cli.js", "--version"], { encoding: "utf8" });
  assert.equal(result.status, 0);
  assert.equal(result.stdout, `${pkg.version}\n`);
  assert.equal(result.stderr, "");
});

test("CLI smoke writes markdown report with fixtures", async () => {
  const output = await mkdtemp(join(tmpdir(), "ledgerpet-cli-"));
  const code = await main(["inspect", "fixtures/sample", "--scenario", "ghost-payment", "--output", output, "--format", "markdown"]);
  assert.equal(code, 0);
  const markdown = await readFile(join(output, "report.md"), "utf8");
  assert.ok(markdown.includes("unmatched_payment"));
});

test("CLI help exits cleanly with usage text", async () => {
  const writes = [];
  const originalLog = console.log;
  try {
    console.log = (value = "") => writes.push(String(value));
    const code = await main(["--help"]);
    assert.equal(code, 0);
  } finally {
    console.log = originalLog;
  }
  const output = writes.join("\n");
  assert.match(output, /Usage:/);
  assert.match(output, /ledgerpet inspect/);
});

test("CLI accepts json and markdown report formats", async () => {
  for (const [format, reportFile] of [["json", "report.json"], ["markdown", "report.md"]]) {
    const output = await mkdtemp(join(tmpdir(), `ledgerpet-${format}-`));
    const result = spawnSync(process.execPath, ["src/cli.js", "inspect", "fixtures/sample", "--output", output, "--format", format], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    await access(join(output, reportFile));
  }
});

test("CLI rejects options with missing values without writing reports", async () => {
  for (const option of ["--scenario", "--output", "--format"]) {
    const output = join(await mkdtemp(join(tmpdir(), "ledgerpet-missing-")), "reports");
    const args = ["src/cli.js", "inspect", "fixtures/sample", "--output", output, option];
    if (option === "--output") args.splice(4, 2);
    const result = spawnSync(process.execPath, args, { encoding: "utf8" });
    assert.notEqual(result.status, 0, option);
    assert.match(result.stderr, new RegExp(`Missing value for ${option}`));
    await assert.rejects(access(output));
  }
});

test("CLI rejects unsupported report formats without writing reports", async () => {
  const output = join(await mkdtemp(join(tmpdir(), "ledgerpet-format-")), "reports");
  const result = spawnSync(process.execPath, ["src/cli.js", "inspect", "fixtures/sample", "--output", output, "--format", "yaml"], { encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unsupported format: yaml\. Expected json or markdown/);
  await assert.rejects(access(output));
});

test("CLI fixed-form commands reject unexpected arguments", () => {
  for (const command of ["scenarios", "--version", "--help"]) {
    const result = spawnSync(process.execPath, ["src/cli.js", command, "unexpected"], { encoding: "utf8" });
    assert.notEqual(result.status, 0, command);
    assert.match(result.stderr, /Unexpected argument/);
    assert.equal(result.stdout, "");
  }
});
