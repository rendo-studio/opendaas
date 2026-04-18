import fs from "node:fs";
import path from "node:path";

import { stageDocsForSiteRuntime } from "./site.js";
import { resolveWorkspaceRoot } from "./workspace.js";

const sourceDocsRoot = process.argv[2];

if (!sourceDocsRoot) {
  throw new Error("site-watch-worker requires a docs root path argument.");
}

const watchRoots = new Set<string>([path.resolve(sourceDocsRoot)]);

try {
  const workspaceRoot = resolveWorkspaceRoot(path.dirname(sourceDocsRoot));
  for (const relative of [
    ".opendaas/goals",
    ".opendaas/plans",
    ".opendaas/tasks",
    ".opendaas/state",
    ".opendaas/decisions",
    ".opendaas/releases",
    ".opendaas/diff"
  ]) {
    watchRoots.add(path.join(workspaceRoot, relative));
  }
} catch {
  // A docs-only pack can still be watched from its docs root alone.
}

const watchers: fs.FSWatcher[] = [];
let timer: NodeJS.Timeout | null = null;
let closed = false;

async function restage() {
  if (closed) {
    return;
  }

  try {
    await stageDocsForSiteRuntime(sourceDocsRoot);
  } catch {
    // Keep the watcher alive; the next change can recover staging.
  }
}

function scheduleRestage() {
  if (timer) {
    clearTimeout(timer);
  }

  timer = setTimeout(() => {
    void restage();
  }, 250);
}

for (const root of watchRoots) {
  if (!fs.existsSync(root)) {
    continue;
  }

  watchers.push(
    fs.watch(root, { recursive: true }, () => {
      scheduleRestage();
    })
  );
}

const cleanup = () => {
  closed = true;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }

  for (const watcher of watchers) {
    watcher.close();
  }
};

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

setInterval(() => {
  // Keep the worker alive while detached.
}, 60_000).unref();
