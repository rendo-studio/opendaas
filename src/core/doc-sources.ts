import crypto from "node:crypto";
import path from "node:path";

import { readText, writeText } from "./storage.js";
import { getWorkspacePaths } from "./workspace.js";
import type { DiffSource } from "./types.js";

interface DocSourceEntry {
  hash: string;
  source: DiffSource;
  recordedAt: string;
}

type DocSourceRegistry = Record<string, DocSourceEntry>;

function sha256(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

async function readRegistry(start = process.cwd()): Promise<DocSourceRegistry> {
  const paths = getWorkspacePaths(start);

  try {
    return JSON.parse(await readText(paths.diffSourcesFile)) as DocSourceRegistry;
  } catch {
    return {};
  }
}

async function writeRegistry(registry: DocSourceRegistry, start = process.cwd()): Promise<void> {
  const paths = getWorkspacePaths(start);
  await writeText(paths.diffSourcesFile, `${JSON.stringify(registry, null, 2)}\n`);
}

function resolveRelativeDocPath(filePath: string): { start: string; relativePath: string } | null {
  const absolute = path.resolve(filePath);
  const paths = getWorkspacePaths(path.dirname(absolute));
  const relativePath = path.relative(paths.docsRoot, absolute);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    return null;
  }

  return {
    start: paths.root,
    relativePath: relativePath.replace(/\\/g, "/")
  };
}

export async function recordAgentDocWrite(filePath: string, content: string): Promise<void> {
  const resolved = resolveRelativeDocPath(filePath);
  if (!resolved) {
    return;
  }

  const registry = await readRegistry(resolved.start);
  registry[resolved.relativePath] = {
    hash: sha256(content),
    source: "agent",
    recordedAt: new Date().toISOString()
  };
  await writeRegistry(registry, resolved.start);
}

export async function classifyDocSource(relativePath: string, content: string): Promise<DiffSource> {
  const registry = await readRegistry();
  const entry = registry[relativePath];

  if (!entry) {
    return "human";
  }

  return entry.hash === sha256(content) ? entry.source : "human";
}
