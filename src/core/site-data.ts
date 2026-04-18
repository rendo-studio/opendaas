import fs from "node:fs/promises";
import path from "node:path";

import { loadDecisionState } from "./decision.js";
import { diffHistory, diffShow } from "./diff.js";
import { readText, readYamlFile } from "./storage.js";
import { loadGoal } from "./goal.js";
import { loadPlans } from "./plans.js";
import { loadProgress } from "./progress.js";
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
  DiffHistoryState,
  PendingDiffState,
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
}

interface WorkspaceSiteSnapshot {
  root: string | null;
  docsRoot: string;
  workspaceRoot: string | null;
  hasWorkspace: boolean;
  activeChange: string | null;
  currentRoundId: string | null;
  lastDiffCheckAt: string | null;
  lastDiffAckAt: string | null;
}

export interface SiteControlPlaneSnapshot {
  generatedAt: string;
  workspace: WorkspaceSiteSnapshot;
  status: Awaited<ReturnType<typeof getStatusSnapshot>> | null;
  goal: Awaited<ReturnType<typeof loadGoal>> | null;
  plans: Awaited<ReturnType<typeof loadPlans>> | null;
  progress: Awaited<ReturnType<typeof loadProgress>> | null;
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
  diff:
    | {
        pending: PendingDiffState;
        history: DiffHistoryState;
      }
    | null;
  docs: {
    pages: DocManifestEntry[];
    changePages: Array<Pick<DocManifestEntry, "path" | "slug" | "title" | "description">>;
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

async function buildDocsManifest(docsRoot: string): Promise<DocManifestEntry[]> {
  const files = await collectMarkdownFiles(docsRoot);
  const manifest: DocManifestEntry[] = [];

  for (const relativePath of files) {
    const content = await readText(path.join(docsRoot, relativePath));
    const { frontmatter, body } = parseFrontmatter(content);
    const title =
      frontmatter.name ??
      body.match(/^#\s+(.+)$/m)?.[1]?.trim() ??
      path.basename(relativePath, path.extname(relativePath));

    manifest.push({
      path: relativePath.replace(/\\/g, "/"),
      slug: docsPathToSlug(relativePath),
      title,
      description: frontmatter.description ?? ""
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
    const [status, goal, plans, progress, tasksState, archive, decisions, releases, pending, history] =
      await Promise.all([
        getStatusSnapshot(),
        loadGoal(),
        loadPlans(),
        loadProgress(),
        loadTasks(),
        loadTaskArchive(),
        loadDecisionState(),
        loadReleaseState(),
        diffShow(),
        diffHistory()
      ]);

    const active = await readYamlFile<WorkspaceState>(paths.activeStateFile);
    const docsManifest = await buildDocsManifest(docsRoot);

    return {
      generatedAt: new Date().toISOString(),
      workspace: {
        root: paths.root,
        docsRoot,
        workspaceRoot: paths.workspaceRoot,
        hasWorkspace: true,
        activeChange: active.activeChange,
        currentRoundId: active.currentRoundId,
        lastDiffCheckAt: active.lastDiffCheckAt,
        lastDiffAckAt: active.lastDiffAckAt
      },
      status,
      goal,
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
      diff: {
        pending,
        history
      },
      docs: {
        pages: docsManifest,
        changePages: docsManifest
          .filter((page) => page.path.startsWith("project/changes/") && page.path !== "project/changes/index.md")
          .map(({ path: pagePath, slug, title, description }) => ({
            path: pagePath,
            slug,
            title,
            description
          }))
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
      currentRoundId: null,
      lastDiffCheckAt: null,
      lastDiffAckAt: null
    },
    status: null,
    goal: null,
    plans: null,
    progress: null,
    tasks: null,
    decisions: null,
    releases: null,
    diff: null,
    docs: {
      pages: docsManifest,
      changePages: docsManifest
        .filter((page) => page.path.startsWith("project/changes/") && page.path !== "project/changes/index.md")
        .map(({ path: pagePath, slug, title, description }) => ({
          path: pagePath,
          slug,
          title,
          description
        }))
    }
  };
}
