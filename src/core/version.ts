import path from "node:path";
import { existsSync } from "node:fs";

import { replaceSectionContent } from "./markdown.js";
import { readYamlFile, writeText, writeYamlFile } from "./storage.js";
import { getWorkspacePaths } from "./workspace.js";
import type { VersionRecord, VersionRecordStatus, VersionState } from "./types.js";

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function renderBulletOrNone(items: string[]): string {
  return items.length === 0 ? "- 暂无" : items.map((item) => `- ${item}`).join("\n");
}

function labelForStatus(status: VersionRecordStatus): string {
  switch (status) {
    case "draft":
      return "draft";
    case "recorded":
      return "recorded";
  }
}

function versionDocFilePath(recordId: string): string {
  const paths = getWorkspacePaths();
  return path.join(path.dirname(paths.docsVersionsIndexFile), `${recordId}.md`);
}

async function ensureVersionIndexDocExists() {
  const paths = getWorkspacePaths();
  if (existsSync(paths.docsVersionsIndexFile)) {
    return;
  }

  const content = `---
name: Versions
description: 项目的版本记录与更新摘要入口页。
---

# Versions

## 版本摘要

当前还没有正式记录的项目级版本 entry。

## 最近版本

- 暂无

## 重要变化

- 暂无
`;
  await writeText(paths.docsVersionsIndexFile, content);
}

function renderVersionDoc(record: VersionRecord): string {
  return `---
name: ${record.id}
description: ${record.title} 的项目级版本记录。
---

# ${record.id}

## Version

${record.version}

## Title

${record.title}

## Status

${labelForStatus(record.status)}

## Summary

${record.summary}

## Decision Refs

${renderBulletOrNone(record.decisionRefs)}

## Highlights

${renderBulletOrNone(record.highlights)}

## Breaking Changes

${renderBulletOrNone(record.breakingChanges)}

## Migration Notes

${renderBulletOrNone(record.migrationNotes)}

## Validation Summary

${record.validationSummary ?? "待补充"}

## Timeline

- Created: ${record.createdAt}
- Recorded: ${record.recordedAt ?? "待定"}
`;
}

async function syncVersionDocs(state: VersionState) {
  const paths = getWorkspacePaths();
  await ensureVersionIndexDocExists();
  const sorted = [...state.items].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  const summary =
    sorted.length === 0
      ? "当前还没有正式记录的项目级版本 entry。"
      : `当前最新的项目级版本记录是：**${sorted[0].version} ${sorted[0].title}**`;

  const recent =
    sorted.length === 0
      ? "- 暂无"
      : sorted
          .slice(0, 5)
          .map((record) => `- [${record.version} ${record.title}](./${record.id}.md) [${labelForStatus(record.status)}]`)
          .join("\n");

  const highlights =
    sorted.length === 0
      ? "- 暂无"
      : sorted
          .flatMap((record) => record.highlights.slice(0, 3).map((item) => `${record.version}: ${item}`))
          .slice(0, 5);

  await replaceSectionContent(paths.docsVersionsIndexFile, "版本摘要", summary);
  await replaceSectionContent(paths.docsVersionsIndexFile, "最近版本", recent);
  await replaceSectionContent(
    paths.docsVersionsIndexFile,
    "重要变化",
    Array.isArray(highlights) ? renderBulletOrNone(highlights) : highlights
  );

  for (const record of state.items) {
    await writeText(versionDocFilePath(record.id), renderVersionDoc(record));
  }
}

export async function loadVersionState(): Promise<VersionState> {
  try {
    return await readYamlFile<VersionState>(getWorkspacePaths().versionFile);
  } catch {
    return { items: [] };
  }
}

export async function saveVersionState(state: VersionState): Promise<void> {
  const paths = getWorkspacePaths();
  await writeYamlFile(paths.versionFile, state);
  await syncVersionDocs(state);
}

export async function listVersionRecords(): Promise<VersionRecord[]> {
  const state = await loadVersionState();
  return [...state.items].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function getVersionRecord(id: string): Promise<VersionRecord> {
  const state = await loadVersionState();
  const record = state.items.find((item) => item.id === id);
  if (!record) {
    throw new Error(`Version record "${id}" does not exist.`);
  }
  return record;
}

export async function createVersionRecord(input: {
  version: string;
  title: string;
  summary: string;
  decisionRefs?: string[];
}) {
  const state = await loadVersionState();
  const baseId = slugify(`${input.version}-${input.title}`) || slugify(input.version) || "version-record";
  let id = baseId;
  let sequence = 2;

  while (state.items.some((item) => item.id === id)) {
    id = `${baseId}-${sequence}`;
    sequence += 1;
  }

  const record: VersionRecord = {
    id,
    version: input.version,
    title: input.title,
    summary: input.summary,
    status: "draft",
    decisionRefs: input.decisionRefs ?? [],
    highlights: [],
    breakingChanges: [],
    migrationNotes: [],
    validationSummary: null,
    createdAt: new Date().toISOString(),
    recordedAt: null
  };

  await saveVersionState({
    items: [...state.items, record]
  });

  return record;
}

export async function updateVersionRecord(input: {
  id: string;
  summary?: string;
  status?: VersionRecordStatus;
  addDecisionRefs?: string[];
  addHighlights?: string[];
  addBreakingChanges?: string[];
  addMigrationNotes?: string[];
  validationSummary?: string;
}) {
  const state = await loadVersionState();
  const index = state.items.findIndex((item) => item.id === input.id);
  if (index === -1) {
    throw new Error(`Version record "${input.id}" does not exist.`);
  }

  const current = state.items[index];
  const nextStatus = input.status ?? current.status;
  const unique = (values: string[]) => [...new Set(values.filter(Boolean))];

  const updated: VersionRecord = {
    ...current,
    ...(input.summary ? { summary: input.summary } : {}),
    status: nextStatus,
    decisionRefs: unique([...current.decisionRefs, ...(input.addDecisionRefs ?? [])]),
    highlights: unique([...current.highlights, ...(input.addHighlights ?? [])]),
    breakingChanges: unique([...current.breakingChanges, ...(input.addBreakingChanges ?? [])]),
    migrationNotes: unique([...current.migrationNotes, ...(input.addMigrationNotes ?? [])]),
    validationSummary: input.validationSummary ?? current.validationSummary,
    recordedAt: nextStatus === "recorded" ? current.recordedAt ?? new Date().toISOString() : current.recordedAt
  };

  const next = {
    items: [...state.items]
  };
  next.items[index] = updated;
  await saveVersionState(next);

  return updated;
}
