import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
if (!process.env.CI && existsSync("githooks") && existsSync(".git"))
  spawnSync("git", ["config", "core.hooksPath", "githooks"], { stdio: "inherit" });
