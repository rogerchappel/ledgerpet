import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile } from "node:fs/promises";
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
