import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { readText, readYamlFile, writeText, writeYamlFile } from "./storage.js";
import { getWorkspacePaths } from "./workspace.js";
import { classifyDocSource } from "./doc-sources.js";
import type {
  DiffHistoryEntry,
  DiffHistoryState,
  PendingDiffState,
  PendingFile,
  PendingHunk,
  WorkspaceState
} from "./types.js";

interface BaselineEntry {
  hash: string;
  acknowledgedAt: string | null;
}

type BaselineState = Record<string, BaselineEntry>;

function sha256(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function snapshotPathFor(relativePath: string): string {
  const paths = getWorkspacePaths();
  const safeName = relativePath.replace(/[\\/]/g, "__");
  return path.join(paths.workspaceRoot, "diff", "cache", safeName);
}

async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const content = await readText(filePath);
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
  const content = `${JSON.stringify(value, null, 2)}\n`;
  await writeText(filePath, content);
}

function summarizePendingFiles(files: PendingFile[]) {
  return {
    addedCount: files.filter((file) => file.changeType === "added").length,
    modifiedCount: files.filter((file) => file.changeType === "modified").length,
    deletedCount: files.filter((file) => file.changeType === "deleted").length
  };
}

async function loadDiffHistoryState(): Promise<DiffHistoryState> {
  const paths = getWorkspacePaths();
  return readJsonFile<DiffHistoryState>(paths.diffHistoryFile, {
    items: []
  });
}

async function appendDiffHistoryEntry(
  kind: DiffHistoryEntry["kind"],
  generatedAt: string,
  files: PendingFile[]
) {
  if (kind === "check" && files.length === 0) {
    return;
  }

  const paths = getWorkspacePaths();
  const history = await loadDiffHistoryState();
  const summary = summarizePendingFiles(files);
  const entry: DiffHistoryEntry = {
    id: `diff-${kind}-${generatedAt}`,
    kind,
    generatedAt,
    fileCount: files.length,
    addedCount: summary.addedCount,
    modifiedCount: summary.modifiedCount,
    deletedCount: summary.deletedCount,
    files
  };

  const next: DiffHistoryState = {
    items: [entry, ...history.items].slice(0, 100)
  };
  await writeJsonFile(paths.diffHistoryFile, next);
}

async function collectDocFiles(root: string, base = root): Promise<string[]> {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectDocFiles(fullPath, base)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(path.relative(base, fullPath).replace(/\\/g, "/"));
    }
  }

  return files.sort();
}

function computeLineHunks(previousContent: string, currentContent: string): PendingHunk[] {
  const previousLines = previousContent.split(/\r?\n/);
  const currentLines = currentContent.split(/\r?\n/);
  const max = Math.max(previousLines.length, currentLines.length);
  const hunks: PendingHunk[] = [];
  let start = -1;

  for (let index = 0; index < max; index += 1) {
    const oldLine = previousLines[index];
    const newLine = currentLines[index];

    if (oldLine !== newLine) {
      if (start === -1) {
        start = index;
      }
      continue;
    }

    if (start !== -1) {
      hunks.push({
        oldStart: start + 1,
        oldCount: index - start,
        newStart: start + 1,
        newCount: index - start
      });
      start = -1;
    }
  }

  if (start !== -1) {
    hunks.push({
      oldStart: start + 1,
      oldCount: previousLines.length - start,
      newStart: start + 1,
      newCount: currentLines.length - start
    });
  }

  return hunks;
}

export async function diffCheck() {
  const paths = getWorkspacePaths();
  const baseline = await readJsonFile<BaselineState>(paths.diffBaselineFile, {});
  const docFiles = await collectDocFiles(paths.docsRoot);
  const now = new Date().toISOString();
  const files: PendingFile[] = [];

  for (const relativePath of docFiles) {
    const fullPath = path.join(paths.docsRoot, relativePath);
    const currentContent = await readText(fullPath);
    const currentHash = sha256(currentContent);
    const baselineEntry = baseline[relativePath];

    if (!baselineEntry) {
      files.push({
        path: relativePath,
        changeType: "added",
        source: await classifyDocSource(relativePath, currentContent),
        hunks: computeLineHunks("", currentContent)
      });
      continue;
    }

    if (baselineEntry.hash === currentHash) {
      continue;
    }

    const snapshotFile = snapshotPathFor(relativePath);
    let previousContent = "";
    try {
      previousContent = await readText(snapshotFile);
    } catch {
      previousContent = "";
    }

    files.push({
      path: relativePath,
      changeType: "modified",
      source: await classifyDocSource(relativePath, currentContent),
      hunks: computeLineHunks(previousContent, currentContent)
    });
  }

  for (const relativePath of Object.keys(baseline)) {
    if (docFiles.includes(relativePath)) {
      continue;
    }

    let previousContent = "";
    try {
      previousContent = await readText(snapshotPathFor(relativePath));
    } catch {
      previousContent = "";
    }

    files.push({
      path: relativePath,
      changeType: "deleted",
      source: "unknown",
      hunks: computeLineHunks(previousContent, "")
    });
  }

  const pending: PendingDiffState = {
    generatedAt: now,
    files
  };

  await writeJsonFile(paths.diffPendingFile, pending);
  await appendDiffHistoryEntry("check", now, files);

  const activeState = await readYamlFile<WorkspaceState>(paths.activeStateFile);
  activeState.lastDiffCheckAt = now;
  await writeYamlFile(paths.activeStateFile, activeState);

  return pending;
}

export async function diffAck() {
  const paths = getWorkspacePaths();
  const pending = await readJsonFile<PendingDiffState>(paths.diffPendingFile, {
    generatedAt: null,
    files: []
  });
  const docFiles = await collectDocFiles(paths.docsRoot);
  const now = new Date().toISOString();
  const baseline: BaselineState = {};
  const cacheDir = path.join(paths.workspaceRoot, "diff", "cache");

  await ensureDir(cacheDir);

  for (const relativePath of docFiles) {
    const fullPath = path.join(paths.docsRoot, relativePath);
    const content = await readText(fullPath);
    const hash = sha256(content);
    baseline[relativePath] = {
      hash,
      acknowledgedAt: now
    };
    await writeText(snapshotPathFor(relativePath), content);
  }

  const expectedSnapshots = new Set(docFiles.map((relativePath) => path.basename(snapshotPathFor(relativePath))));
  const cachedFiles = await fs.readdir(cacheDir).catch(() => []);
  for (const fileName of cachedFiles) {
    if (expectedSnapshots.has(fileName)) {
      continue;
    }
    await fs.rm(path.join(cacheDir, fileName), { force: true });
  }

  await writeJsonFile(paths.diffBaselineFile, baseline);
  await writeJsonFile(paths.diffPendingFile, {
    generatedAt: now,
    files: []
  });
  await appendDiffHistoryEntry("ack", now, pending.files);

  const activeState = await readYamlFile<WorkspaceState>(paths.activeStateFile);
  activeState.lastDiffCheckAt = now;
  activeState.lastDiffAckAt = now;
  await writeYamlFile(paths.activeStateFile, activeState);

  return {
    acknowledgedAt: now,
    fileCount: docFiles.length
  };
}

export async function diffShow() {
  const paths = getWorkspacePaths();
  return readJsonFile<PendingDiffState>(paths.diffPendingFile, {
    generatedAt: null,
    files: []
  });
}

export async function diffHistory() {
  return loadDiffHistoryState();
}
