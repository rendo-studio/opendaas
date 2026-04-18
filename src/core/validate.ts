import { existsSync } from "node:fs";
import path from "node:path";

import { adoptWorkspace, WORKSPACE_SCHEMA_VERSION, WORKSPACE_TEMPLATE_VERSION } from "./bootstrap.js";
import { migrateDecisionState } from "./decision.js";
import { loadGoal } from "./goal.js";
import { readText, readYamlFile, writeYamlFile } from "./storage.js";
import { loadTasks, assertValidTaskTree } from "./tasks.js";
import type { WorkspaceConfigState, WorkspaceMetaState } from "./types.js";
import { getWorkspacePaths } from "./workspace.js";

async function hasMinimalMetadata(filePath: string): Promise<boolean> {
  const content = await readText(filePath);
  const firstLines = content.split(/\r?\n/).slice(0, 6);

  return (
    firstLines.includes("---") &&
    firstLines.some((line) => line.startsWith("name:")) &&
    firstLines.some((line) => line.startsWith("description:"))
  );
}

function unique(items: string[]): string[] {
  return [...new Set(items)];
}

async function loadMetaAndConfig() {
  const paths = getWorkspacePaths();
  let meta: WorkspaceMetaState | null = null;
  let config: WorkspaceConfigState | null = null;

  try {
    meta = await readYamlFile<WorkspaceMetaState>(path.join(paths.workspaceRoot, "meta", "workspace.yaml"));
  } catch {
    meta = null;
  }

  try {
    config = await readYamlFile<WorkspaceConfigState>(path.join(paths.workspaceRoot, "config", "workspace.yaml"));
  } catch {
    config = null;
  }

  return { meta, config };
}

export async function validateWorkspace() {
  const paths = getWorkspacePaths();
  const requiredFiles = [
    paths.goalFile,
    paths.planFile,
    paths.taskFile,
    paths.taskArchiveFile,
    paths.progressFile,
    paths.decisionFile,
    paths.releaseFile,
    paths.diffHistoryFile,
    paths.diffSourcesFile,
    paths.docsIndexFile,
    paths.docsGoalFile,
    paths.docsStatusFile,
    paths.docsCurrentWorkFile,
    paths.docsTasksFile,
    path.join(paths.docsRoot, "project", "changes", "index.md"),
    paths.docsDecisionsIndexFile,
    paths.docsReleasesIndexFile,
    path.join(paths.docsRoot, "engineering", "development.md"),
    path.join(paths.docsRoot, "engineering", "agent.md"),
    path.join(paths.workspaceRoot, "agent", "SKILL.md")
  ];

  const missingFiles = requiredFiles.filter((filePath) => !existsSync(filePath));
  const metadataChecks = await Promise.all([
    hasMinimalMetadata(paths.docsIndexFile).catch(() => false),
    hasMinimalMetadata(paths.docsGoalFile).catch(() => false),
    hasMinimalMetadata(paths.docsStatusFile).catch(() => false),
    hasMinimalMetadata(paths.docsCurrentWorkFile).catch(() => false)
  ]);

  const goal = await loadGoal();
  const tasks = await loadTasks();
  assertValidTaskTree(tasks.items);

  const { meta, config } = await loadMetaAndConfig();
  const schemaIssues: string[] = [];
  const repairableIssues: string[] = [];
  const warnings: string[] = [];

  if (!meta) {
    schemaIssues.push("Missing .opendaas/meta/workspace.yaml");
    repairableIssues.push("Backfill workspace metadata");
  } else {
    if ((meta.schemaVersion ?? 0) < WORKSPACE_SCHEMA_VERSION) {
      schemaIssues.push(
        `Workspace schemaVersion ${meta.schemaVersion ?? 0} is behind the current schema ${WORKSPACE_SCHEMA_VERSION}`
      );
      repairableIssues.push("Upgrade workspace metadata schema");
    }
    if (!meta.bootstrapMode) {
      schemaIssues.push("Workspace metadata is missing bootstrapMode");
      repairableIssues.push("Backfill workspace bootstrapMode");
    }
    if (!meta.templateVersion || meta.templateVersion !== WORKSPACE_TEMPLATE_VERSION) {
      warnings.push(
        `Workspace templateVersion is ${meta.templateVersion ?? "missing"}; current templateVersion is ${WORKSPACE_TEMPLATE_VERSION}`
      );
      repairableIssues.push("Refresh managed docs and control-plane templates");
    }
  }

  if (!config) {
    schemaIssues.push("Missing .opendaas/config/workspace.yaml");
    repairableIssues.push("Backfill workspace config");
  } else {
    if ((config.workspaceSchemaVersion ?? 0) < WORKSPACE_SCHEMA_VERSION) {
      schemaIssues.push(
        `Workspace config schemaVersion ${config.workspaceSchemaVersion ?? 0} is behind the current schema ${WORKSPACE_SCHEMA_VERSION}`
      );
      repairableIssues.push("Upgrade workspace config schema");
    }
    if (!config.projectKind) {
      schemaIssues.push("Workspace config is missing projectKind");
      repairableIssues.push("Backfill workspace projectKind");
    }
    if (!config.docsMode) {
      schemaIssues.push("Workspace config is missing docsMode");
      repairableIssues.push("Backfill workspace docsMode");
    }
  }

  if (missingFiles.length > 0) {
    repairableIssues.push("Backfill missing managed files and docs anchors");
  }

  const migrationNeeded = missingFiles.length > 0 || schemaIssues.length > 0;

  return {
    ok:
      missingFiles.length === 0 &&
      metadataChecks.every(Boolean) &&
      schemaIssues.length === 0,
    missingFiles,
    metadataChecks: {
      index: metadataChecks[0],
      goal: metadataChecks[1],
      status: metadataChecks[2],
      currentWork: metadataChecks[3]
    },
    schemaIssues,
    warnings,
    migrationNeeded,
    repairableIssues: unique(repairableIssues),
    goalName: goal.name,
    taskCount: tasks.items.length
  };
}

export async function repairWorkspace() {
  const paths = getWorkspacePaths();
  const goal = await loadGoal();
  const { meta, config } = await loadMetaAndConfig();

  const result = await adoptWorkspace({
    targetPath: paths.root,
    projectName: path.basename(paths.root),
    goalName: goal.name,
    goalSummary: goal.summary,
    projectKind: config?.projectKind ?? meta?.projectKind ?? "general",
    docsMode: config?.docsMode ?? meta?.docsMode ?? "standard",
    force: false
  });
  await migrateDecisionState();

  const nextMeta: WorkspaceMetaState = {
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    workspaceName: meta?.workspaceName ?? path.basename(paths.root),
    docsRoot: meta?.docsRoot ?? "docs",
    workspaceRoot: meta?.workspaceRoot ?? ".opendaas",
    bootstrapMode: meta?.bootstrapMode ?? "adopt",
    templateVersion: WORKSPACE_TEMPLATE_VERSION,
    projectKind: config?.projectKind ?? meta?.projectKind ?? "general",
    docsMode: config?.docsMode ?? meta?.docsMode ?? "standard",
    createdAt: meta?.createdAt ?? new Date().toISOString(),
    lastUpgradedAt: new Date().toISOString()
  };
  const nextConfig: WorkspaceConfigState = {
    requireDiffCheckBeforeTask: config?.requireDiffCheckBeforeTask ?? true,
    docsSiteEnabled: config?.docsSiteEnabled ?? true,
    defaultDiffMode: "line",
    siteFramework: config?.siteFramework ?? "fumadocs",
    packageManager: config?.packageManager ?? "npm",
    projectKind: config?.projectKind ?? meta?.projectKind ?? "general",
    docsMode: config?.docsMode ?? meta?.docsMode ?? "standard",
    workspaceSchemaVersion: WORKSPACE_SCHEMA_VERSION
  };

  await writeYamlFile(path.join(paths.workspaceRoot, "meta", "workspace.yaml"), nextMeta);
  await writeYamlFile(path.join(paths.workspaceRoot, "config", "workspace.yaml"), nextConfig);

  return {
    repaired: true,
    workspace: result,
    validation: await validateWorkspace()
  };
}
