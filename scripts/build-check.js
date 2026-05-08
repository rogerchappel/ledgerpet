#!/usr/bin/env node
import { access } from "node:fs/promises";

for (const path of ["src/cli.js", "src/index.js", "fixtures/sample/metadata.json", "docs/orchestration.json"]) {
  await access(path);
}
console.log("build-check ok: runtime files present");
