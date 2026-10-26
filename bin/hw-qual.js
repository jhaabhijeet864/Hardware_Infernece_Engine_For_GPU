#!/usr/bin/env node
import { spawn } from "node:child_process";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const runnerPath = path.resolve(__dirname, "../src/cli/runner.ts");

const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const child = spawn(npx, ["tsx", runnerPath, ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
