import fs from "node:fs/promises";
import path from "node:path";

import { getDocRevisionRecord, listRecentlyChangedDocs, loadDocsRevisionState } from "./docs-revisions.js";
import { loadDecisionState } from "./decision.js";
import { loadEndGoal } from "./end-goal.js";
import { readText, readYamlFile } from "./storage.js";
import { loadProjectOverview } from "./project-overview.js";
import { derivePlanStatuses, loadPlans } from "./plans.js";
import { computeProgress } from "./progress.js";
import { loadReleaseState } from "./release.js";
import { loadTaskArchive, sortArchivedTasks } from "./task-archive.js";
import {
  buildTaskTree,
  describeBlockers,
  findNextActions,
  loadTasks,
  summarizeRecentCompleted
} from "./tasks.js";
import type {
  TaskArchiveState,
  TaskTreeNode,
  WorkspaceState
} from "./types.js";
import { getStatusSnapshot } from "./status.js";
import { getWorkspacePaths, resolveWorkspaceRoot, withWorkspaceRoot } from "./workspace.js";

interface FrontmatterShape {
  name?: string;
  description?: string;
}

interface DocManifestEntry {
  path: string;
  slug: string[];
  title: string;
  description: string;
  latestRevisionId: string | null;
  updatedAt: string | null;
  revisionCount: number;
}

interface WorkspaceSiteSnapshot {
  root: string | null;
  docsRoot: string;
  workspaceRoot: string | null;
  hasWorkspace: boolean;
  activeChange: string | null;
  currentRoundId: string | null;
}

export interface SiteControlPlaneSnapshot {
  generatedAt: string;
  workspace: WorkspaceSiteSnapshot;
  project: Awaited<ReturnType<typeof loadProjectOverview>> | null;
  endGoal: Awaited<ReturnType<typeof loadEndGoal>> | null;
  status: Awaited<ReturnType<typeof getStatusSnapshot>> | null;
  plans: Awaited<ReturnType<typeof loadPlans>> | null;
    progress:
      | {
          percent: number;
          countedTasks: number;
          doneTasks: number;
          computedAt: string | null;
        }
      | null;
  tasks:
    | {
        items: Awaited<ReturnType<typeof loadTasks>>["items"];
        tree: TaskTreeNode[];
        recentCompleted: string[];
        nextActions: string[];
        blockers: string[];
        archive: TaskArchiveState;
      }
    | null;
  decisions: Awaited<ReturnType<typeof loadDecisionState>> | null;
  releases: Awaited<ReturnType<typeof loadReleaseState>> | null;
  docs: {
    pages: DocManifestEntry[];
    changePages: Array<Pick<DocManifestEntry, "path" | "slug" | "title" | "description">>;
    changedPages: DocManifestEntry[];
  };
}

function parseFrontmatter(content: string): { frontmatter: FrontmatterShape; body: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const frontmatter: FrontmatterShape = {};
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(":");
    if (separator === -1) {
      continue;
    }
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (key === "name" || key === "description") {
      frontmatter[key] = value;
    }
  }

  return {
    frontmatter,
    body: match[2] ?? ""
  };
}

async function collectMarkdownFiles(root: string, base = root): Promise<string[]> {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue;
    }

    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectMarkdownFiles(fullPath, base)));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();
    if (extension === ".md" || extension === ".mdx") {
      files.push(path.relative(base, fullPath).replace(/\\/g, "/"));
    }
  }

  return files.sort();
}

export function docsPathToSlug(relativePath: string): string[] {
  const normalized = relativePath.replace(/\\/g, "/");
  const parts = normalized.split("/");
  const fileName = parts.at(-1) ?? "";
  const baseName = fileName.replace(/\.(md|mdx)$/i, "");

  if (baseName === "index") {
    return parts.slice(0, -1);
  }

  return [...parts.slice(0, -1), baseName];
}

export function slugToDocsPath(slug: string[]): string {
  if (slug.length === 0) {
    return "index.md";
  }

  const joined = slug.join("/");
  if (joined.includes("changes") || joined.includes("decisions") || joined.includes("releases")) {
    return `${joined}/index.md`;
  }

  return `${joined}.md`;
}

async function buildDocsManifest(docsRoot: string, workspaceRoot?: string): Promise<DocManifestEntry[]> {
  const files = await collectMarkdownFiles(docsRoot);
  const manifest: DocManifestEntry[] = [];
  const revisionState = workspaceRoot ? await loadDocsRevisionState(workspaceRoot) : null;

  for (const relativePath of files) {
    const content = await readText(path.join(docsRoot, relativePath));
    const { frontmatter, body } = parseFrontmatter(content);
    const revisionRecord = revisionState ? getDocRevisionRecord(revisionState, relativePath) : null;
    const title =
      frontmatter.name ??
      body.match(/^#\s+(.+)$/m)?.[1]?.trim() ??
      path.basename(relativePath, path.extname(relativePath));

    manifest.push({
      path: relativePath.replace(/\\/g, "/"),
      slug: docsPathToSlug(relativePath),
      title,
      description: frontmatter.description ?? "",
      latestRevisionId: revisionRecord?.latestRevisionId ?? null,
      updatedAt: revisionRecord?.updatedAt ?? null,
      revisionCount: revisionRecord?.revisions.length ?? 0
    });
  }

  return manifest;
}

function tryResolveWorkspaceRootFromDocsRoot(docsRoot: string): string | null {
  try {
    return resolveWorkspaceRoot(path.dirname(docsRoot));
  } catch {
    return null;
  }
}

async function loadWorkspaceSiteSnapshot(workspaceRoot: string, docsRoot: string): Promise<SiteControlPlaneSnapshot> {
  return withWorkspaceRoot(workspaceRoot, async () => {
    const paths = getWorkspacePaths();
    const [project, endGoal, status, plansState, tasksState, archive, decisions, releases] =
      await Promise.all([
        loadProjectOverview(),
        loadEndGoal(),
        getStatusSnapshot(),
        loadPlans(),
        loadTasks(),
        loadTaskArchive(),
        loadDecisionState(),
        loadReleaseState()
      ]);
    const plans = derivePlanStatuses(plansState, tasksState);
    const progress = computeProgress(tasksState.items);

    const active = await readYamlFile<WorkspaceState>(paths.activeStateFile);
    const docsManifest = await buildDocsManifest(docsRoot, workspaceRoot);
    const changedPages = listRecentlyChangedDocs(await loadDocsRevisionState(workspaceRoot))
      .map((record) => docsManifest.find((page) => page.path === record.path))
      .filter((page): page is DocManifestEntry => Boolean(page));

    return {
      generatedAt: new Date().toISOString(),
      workspace: {
        root: paths.root,
        docsRoot,
        workspaceRoot: paths.workspaceRoot,
        hasWorkspace: true,
        activeChange: active.activeChange,
        currentRoundId: active.currentRoundId
      },
      project,
      endGoal,
      status,
      plans,
      progress,
      tasks: {
        items: tasksState.items,
        tree: buildTaskTree(tasksState.items),
        recentCompleted: summarizeRecentCompleted(tasksState.items),
        nextActions: findNextActions(tasksState.items),
        blockers: describeBlockers(tasksState.items),
        archive: {
          items: sortArchivedTasks(archive.items)
        }
      },
      decisions,
      releases,
      docs: {
        pages: docsManifest,
        changePages: docsManifest
          .filter((page) => page.path.startsWith("project/changes/") && page.path !== "project/changes/index.md")
          .map(({ path: pagePath, slug, title, description }) => ({
            path: pagePath,
            slug,
            title,
            description
          })),
        changedPages
      }
    };
  });
}

export async function buildSiteControlPlaneSnapshot(docsRoot: string): Promise<SiteControlPlaneSnapshot> {
  const workspaceRoot = tryResolveWorkspaceRootFromDocsRoot(docsRoot);
  if (workspaceRoot) {
    return loadWorkspaceSiteSnapshot(workspaceRoot, docsRoot);
  }

  const docsManifest = await buildDocsManifest(docsRoot);
  return {
    generatedAt: new Date().toISOString(),
    workspace: {
      root: null,
      docsRoot,
      workspaceRoot: null,
      hasWorkspace: false,
      activeChange: null,
      currentRoundId: null
    },
    project: null,
    endGoal: null,
    status: null,
    plans: null,
    progress: null,
    tasks: null,
    decisions: null,
    releases: null,
    docs: {
      pages: docsManifest,
      changePages: docsManifest
        .filter((page) => page.path.startsWith("project/changes/") && page.path !== "project/changes/index.md")
        .map(({ path: pagePath, slug, title, description }) => ({
          path: pagePath,
          slug,
          title,
          description
        })),
      changedPages: []
    }
  };
}
