import path from "node:path";
import { existsSync } from "node:fs";

export interface WorkspacePaths {
  root: string;
  docsRoot: string;
  workspaceRoot: string;
  workspaceMetaFile: string;
  workspaceConfigFile: string;
  projectOverviewFile: string;
  endGoalFile: string;
  planFile: string;
  taskFile: string;
  taskArchiveFile: string;
  activeStateFile: string;
  decisionFile: string;
  versionFile: string;
  docsSharedOverviewFile: string;
  docsSharedGoalFile: string;
  docsDecisionsIndexFile: string;
  docsVersionsIndexFile: string;
}

export function resolveWorkspaceRoot(start = process.cwd()): string {
  const explicitRoot = process.env.OPENDAAS_WORKSPACE_ROOT;
  if (explicitRoot) {
    return path.resolve(explicitRoot);
  }

  let current = path.resolve(start);

  while (true) {
    const hasWorkspace = existsSync(path.join(current, ".opendaas"));
    const hasDocs = existsSync(path.join(current, "docs"));

    if (hasWorkspace && hasDocs) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      throw new Error(
        `Unable to locate an OpenDaaS workspace from ${start}. Expected both .opendaas and docs.`
      );
    }
    current = parent;
  }
}

export function getWorkspacePaths(start = process.cwd()): WorkspacePaths {
  const root = resolveWorkspaceRoot(start);
  const docsRoot = path.join(root, "docs");
  const workspaceRoot = path.join(root, ".opendaas");

  return {
    root,
    docsRoot,
    workspaceRoot,
    workspaceMetaFile: path.join(workspaceRoot, "meta", "workspace.yaml"),
    workspaceConfigFile: path.join(workspaceRoot, "config", "workspace.yaml"),
    projectOverviewFile: path.join(workspaceRoot, "project", "overview.yaml"),
    endGoalFile: path.join(workspaceRoot, "goals", "end.yaml"),
    planFile: path.join(workspaceRoot, "plans", "current.yaml"),
    taskFile: path.join(workspaceRoot, "tasks", "current.yaml"),
    taskArchiveFile: path.join(workspaceRoot, "tasks", "archive.yaml"),
    activeStateFile: path.join(workspaceRoot, "state", "active.yaml"),
    decisionFile: path.join(workspaceRoot, "decisions", "records.yaml"),
    versionFile: path.join(workspaceRoot, "versions", "records.yaml"),
    docsSharedOverviewFile: path.join(docsRoot, "shared", "overview.md"),
    docsSharedGoalFile: path.join(docsRoot, "shared", "goal.md"),
    docsDecisionsIndexFile: path.join(docsRoot, "project", "decisions", "index.md"),
    docsVersionsIndexFile: path.join(docsRoot, "internal", "versions", "index.md")
  };
}

export async function withWorkspaceRoot<T>(root: string, work: () => Promise<T>): Promise<T> {
  const previous = process.env.OPENDAAS_WORKSPACE_ROOT;
  process.env.OPENDAAS_WORKSPACE_ROOT = path.resolve(root);

  try {
    return await work();
  } finally {
    if (previous === undefined) {
      delete process.env.OPENDAAS_WORKSPACE_ROOT;
    } else {
      process.env.OPENDAAS_WORKSPACE_ROOT = previous;
    }
  }
}
