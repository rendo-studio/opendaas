import path from "node:path";
import { existsSync } from "node:fs";

import { replaceSectionContent } from "./markdown.js";
import { readYamlFile, writeText, writeYamlFile } from "./storage.js";
import { getWorkspacePaths } from "./workspace.js";
import type { ReleaseRecord, ReleaseRecordStatus, ReleaseState } from "./types.js";
import { recordAgentDocWrite } from "./doc-sources.js";

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

function labelForStatus(status: ReleaseRecordStatus): string {
  switch (status) {
    case "draft":
      return "draft";
    case "frozen":
      return "frozen";
    case "published":
      return "published";
  }
}

function releaseFilePath(recordId: string): string {
  const paths = getWorkspacePaths();
  return path.join(path.dirname(paths.docsReleasesIndexFile), `${recordId}.md`);
}

async function ensureReleaseIndexDocExists() {
  const paths = getWorkspacePaths();
  if (existsSync(paths.docsReleasesIndexFile)) {
    return;
  }

  const content = `---
name: Releases
description: 项目的发布与版本更新入口页。
---

# Releases

## 发布摘要

当前还没有正式记录的 release / changelog entry。

## 最近版本

- 暂无

## 重要变化

- 暂无
`;
  await writeText(paths.docsReleasesIndexFile, content);
  await recordAgentDocWrite(paths.docsReleasesIndexFile, content);
}

function renderReleaseDoc(record: ReleaseRecord): string {
  return `---
name: ${record.id}
description: ${record.title} 的 release / changelog entry。
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

## Change Refs

${renderBulletOrNone(record.changeRefs)}

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

- Started: ${record.startedAt}
- Closed: ${record.closedAt ?? "待定"}
- Published: ${record.publishedAt ?? "待定"}
`;
}

async function syncReleaseDocs(state: ReleaseState) {
  const paths = getWorkspacePaths();
  await ensureReleaseIndexDocExists();
  const sorted = [...state.items].sort((left, right) => right.startedAt.localeCompare(left.startedAt));
  const summary =
    sorted.length === 0
      ? "当前还没有正式记录的 release / changelog entry。"
      : `当前最新的 release / changelog entry 是：**${sorted[0].version} ${sorted[0].title}**`;

  const recent =
    sorted.length === 0
      ? "- 暂无"
      : sorted.slice(0, 5).map((record) => `- [${record.version} ${record.title}](./${record.id}.md) [${labelForStatus(record.status)}]`).join("\n");

  const highlights =
    sorted.length === 0
      ? "- 暂无"
      : sorted
          .flatMap((record) =>
            record.highlights.slice(0, 3).map((item) => `${record.version}: ${item}`)
          )
          .slice(0, 5);

  await replaceSectionContent(paths.docsReleasesIndexFile, "发布摘要", summary);
  await replaceSectionContent(paths.docsReleasesIndexFile, "最近版本", recent);
  await replaceSectionContent(
    paths.docsReleasesIndexFile,
    "重要变化",
    Array.isArray(highlights) ? renderBulletOrNone(highlights) : highlights
  );

  for (const record of state.items) {
    const filePath = releaseFilePath(record.id);
    const content = renderReleaseDoc(record);
    await writeText(filePath, content);
    await recordAgentDocWrite(filePath, content);
  }
}

export async function loadReleaseState(): Promise<ReleaseState> {
  try {
    return await readYamlFile<ReleaseState>(getWorkspacePaths().releaseFile);
  } catch {
    return { items: [] };
  }
}

export async function saveReleaseState(state: ReleaseState): Promise<void> {
  const paths = getWorkspacePaths();
  await writeYamlFile(paths.releaseFile, state);
  await syncReleaseDocs(state);
}

export async function listReleaseRecords(): Promise<ReleaseRecord[]> {
  const state = await loadReleaseState();
  return [...state.items].sort((left, right) => right.startedAt.localeCompare(left.startedAt));
}

export async function getReleaseRecord(id: string): Promise<ReleaseRecord> {
  const state = await loadReleaseState();
  const record = state.items.find((item) => item.id === id);
  if (!record) {
    throw new Error(`Release record "${id}" does not exist.`);
  }
  return record;
}

export async function createReleaseRecord(input: {
  version: string;
  title: string;
  summary: string;
  changeRefs?: string[];
  decisionRefs?: string[];
}) {
  const state = await loadReleaseState();
  const baseId = slugify(`${input.version}-${input.title}`) || slugify(input.version) || "release-record";
  let id = baseId;
  let sequence = 2;

  while (state.items.some((item) => item.id === id)) {
    id = `${baseId}-${sequence}`;
    sequence += 1;
  }

  const record: ReleaseRecord = {
    id,
    version: input.version,
    title: input.title,
    summary: input.summary,
    status: "draft",
    changeRefs: input.changeRefs ?? [],
    decisionRefs: input.decisionRefs ?? [],
    highlights: [],
    breakingChanges: [],
    migrationNotes: [],
    validationSummary: null,
    startedAt: new Date().toISOString(),
    closedAt: null,
    publishedAt: null
  };

  const next: ReleaseState = {
    items: [...state.items, record]
  };
  await saveReleaseState(next);

  return record;
}

export async function updateReleaseRecord(input: {
  id: string;
  summary?: string;
  status?: ReleaseRecordStatus;
  addChangeRefs?: string[];
  addDecisionRefs?: string[];
  addHighlights?: string[];
  addBreakingChanges?: string[];
  addMigrationNotes?: string[];
  validationSummary?: string;
}) {
  const state = await loadReleaseState();
  const index = state.items.findIndex((item) => item.id === input.id);
  if (index === -1) {
    throw new Error(`Release record "${input.id}" does not exist.`);
  }

  const current = state.items[index];
  const nextStatus = input.status ?? current.status;
  const unique = (values: string[]) => [...new Set(values.filter(Boolean))];

  const updated: ReleaseRecord = {
    ...current,
    ...(input.summary ? { summary: input.summary } : {}),
    status: nextStatus,
    changeRefs: unique([...current.changeRefs, ...(input.addChangeRefs ?? [])]),
    decisionRefs: unique([...current.decisionRefs, ...(input.addDecisionRefs ?? [])]),
    highlights: unique([...current.highlights, ...(input.addHighlights ?? [])]),
    breakingChanges: unique([...current.breakingChanges, ...(input.addBreakingChanges ?? [])]),
    migrationNotes: unique([...current.migrationNotes, ...(input.addMigrationNotes ?? [])]),
    validationSummary: input.validationSummary ?? current.validationSummary,
    closedAt: nextStatus === "draft" ? current.closedAt : current.closedAt ?? new Date().toISOString(),
    publishedAt:
      nextStatus === "published"
        ? current.publishedAt ?? new Date().toISOString()
        : current.publishedAt
  };

  const nextItems = [...state.items];
  nextItems[index] = updated;
  const next: ReleaseState = {
    items: nextItems
  };
  await saveReleaseState(next);

  return updated;
}
