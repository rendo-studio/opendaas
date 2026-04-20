import fs from "node:fs";

import { stageDocsForSiteRuntime } from "./site.js";
import { resolveSiteWatchRoots } from "./site-watch-roots.js";

const sourceDocsRoot = process.argv[2];

if (!sourceDocsRoot) {
  throw new Error("site-watch-worker requires a docs root path argument.");
}

const watchRoots = new Set<string>(resolveSiteWatchRoots(sourceDocsRoot));

const watchers: fs.FSWatcher[] = [];
let timer: NodeJS.Timeout | null = null;
let closed = false;
let pendingSyncDocs = false;

async function restage(syncDocs: boolean) {
  if (closed) {
    return;
  }

  try {
    await stageDocsForSiteRuntime(sourceDocsRoot, { syncDocs });
  } catch {
    // Keep the watcher alive; the next change can recover staging.
  }
}

function scheduleRestage(syncDocs: boolean) {
  pendingSyncDocs ||= syncDocs;
  if (timer) {
    clearTimeout(timer);
  }

  timer = setTimeout(() => {
    const nextSyncDocs = pendingSyncDocs;
    pendingSyncDocs = false;
    void restage(nextSyncDocs);
  }, 250);
}

for (const root of watchRoots) {
  if (!fs.existsSync(root)) {
    continue;
  }

  watchers.push(
    fs.watch(root, { recursive: true }, () => {
      scheduleRestage(root === sourceDocsRoot);
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
