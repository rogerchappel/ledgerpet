import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import { main } from "../src/cli.js";

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
