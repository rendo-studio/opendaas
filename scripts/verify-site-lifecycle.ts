import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { initWorkspace } from "../src/core/bootstrap.js";
import { buildSiteRuntime, cleanSiteRuntime, openSiteRuntime, stopSiteRuntime } from "../src/core/site.js";

interface RegistrySnapshot {
  pid: number | null;
  watcherPid: number | null;
  startedAt: string;
  port: number;
  url: string;
}

let activeWorkspaceRoot: string | null = null;
let activeRuntimeBase: string | null = null;
let cleanupStarted = false;

async function cleanupTemporaryRoots() {
  if (cleanupStarted) {
    return;
  }

  cleanupStarted = true;

  if (activeWorkspaceRoot) {
    await cleanSiteRuntime(activeWorkspaceRoot).catch(() => undefined);
    await fs.rm(activeWorkspaceRoot, { recursive: true, force: true }).catch(() => undefined);
  }

  if (activeRuntimeBase) {
    await fs.rm(activeRuntimeBase, { recursive: true, force: true }).catch(() => undefined);
  }
}

async function readRegistry(runtimeRoot: string): Promise<RegistrySnapshot> {
  return JSON.parse(
    await fs.readFile(path.join(runtimeRoot, "runtime-data", "registry.json"), "utf8")
  ) as RegistrySnapshot;
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    void cleanupTemporaryRoots().finally(() => {
      process.exit(130);
    });
  });
}

async function main() {
  const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "apcc-lifecycle-workspace-"));
  const runtimeBase = await fs.mkdtemp(path.join(os.tmpdir(), "apcc-lifecycle-runtime-"));
  const previousRuntimeBase = process.env.APCC_SITE_RUNTIME_BASE;
  activeWorkspaceRoot = workspaceRoot;
  activeRuntimeBase = runtimeBase;

  process.env.APCC_SITE_RUNTIME_BASE = runtimeBase;

  try {
    await initWorkspace({
      targetPath: workspaceRoot,
      projectName: "Lifecycle Smoke Workspace",
      endGoalName: "Verify the docs-site lifecycle",
      endGoalSummary:
        "Confirm that the local docs runtime starts, reuses, stops, restarts, and cleans predictably.",
      docsLanguage: "en"
    });

    const built = await buildSiteRuntime(workspaceRoot);
    await fs.stat(built.buildOutput);

    const first = await openSiteRuntime(workspaceRoot);
    const firstRegistry = await readRegistry(first.runtimeRoot);

    assert.equal(first.alreadyRunning, false, "first site open should start a fresh runtime");
    assert.equal(firstRegistry.pid, first.pid, "registry pid should match the started runtime pid");
    assert.equal(firstRegistry.port, first.port, "registry port should match the started runtime port");
    assert.equal(firstRegistry.url, first.url, "registry url should match the started runtime url");

    const second = await openSiteRuntime(workspaceRoot);
    const secondRegistry = await readRegistry(second.runtimeRoot);

    assert.equal(second.alreadyRunning, true, "second site open should reuse the healthy runtime");
    assert.equal(second.runtimeRoot, first.runtimeRoot, "reused runtime root should stay stable");
    assert.equal(secondRegistry.pid, firstRegistry.pid, "reused runtime pid should stay stable");
    assert.equal(
      secondRegistry.watcherPid,
      firstRegistry.watcherPid,
      "reused watcher pid should stay stable"
    );
    assert.equal(
      secondRegistry.startedAt,
      firstRegistry.startedAt,
      "reused runtime should preserve its original startedAt"
    );

    const stopped = await stopSiteRuntime(workspaceRoot);
    const stoppedRegistry = await readRegistry(first.runtimeRoot);

    assert.equal(stopped.preservedRuntime, true, "site stop should preserve the staged runtime");
    assert.equal(stoppedRegistry.pid, null, "site stop should clear the runtime pid");
    assert.equal(stoppedRegistry.watcherPid, null, "site stop should clear the watcher pid");

    const restarted = await openSiteRuntime(workspaceRoot);
    const restartedRegistry = await readRegistry(restarted.runtimeRoot);

    assert.equal(restarted.alreadyRunning, false, "site open after stop should start a fresh runtime");
    assert.notEqual(
      restartedRegistry.startedAt,
      firstRegistry.startedAt,
      "restart after stop should refresh startedAt"
    );

    const cleaned = await cleanSiteRuntime(workspaceRoot);

    assert.equal(cleaned.cleaned, true, "site clean should remove the runtime root");
    await assert.rejects(
      fs.stat(restarted.runtimeRoot),
      "site clean should remove the runtime root from disk"
    );

    console.log(
      JSON.stringify(
        {
          workspaceRoot,
          runtimeBase,
          firstPid: firstRegistry.pid,
          reusedPid: secondRegistry.pid,
          restartedPid: restartedRegistry.pid
        },
        null,
        2
      )
    );
  } finally {
    if (previousRuntimeBase === undefined) {
      delete process.env.APCC_SITE_RUNTIME_BASE;
    } else {
      process.env.APCC_SITE_RUNTIME_BASE = previousRuntimeBase;
    }

    await cleanupTemporaryRoots();
    activeWorkspaceRoot = null;
    activeRuntimeBase = null;
  }
}

await main();
