import fs from "node:fs/promises";
import path from "node:path";
import "server-only";

export interface RuntimeDocPage {
  path: string;
  slug: string[];
  title: string;
  description: string;
}

export interface RuntimeTaskNode {
  id: string;
  name: string;
  summary: string | null;
  status: "pending" | "in_progress" | "done" | "blocked";
  planRef: string;
  parentTaskId: string | null;
  countedForProgress: boolean;
  children: RuntimeTaskNode[];
}

export interface RuntimeArchiveEntry {
  id: string;
  name: string;
  planRef: string;
  parentTaskId: string | null;
  status: "pending" | "in_progress" | "done" | "blocked";
  closedAt: string;
  closedByChange: string | null;
  summary: string | null;
}

export interface RuntimeDiffFile {
  path: string;
  changeType: "added" | "modified" | "deleted";
  source: "human" | "agent" | "unknown";
  hunks: Array<{
    oldStart: number;
    oldCount: number;
    newStart: number;
    newCount: number;
  }>;
}

export interface ControlPlaneSnapshot {
  generatedAt: string;
  workspace: {
    root: string | null;
    docsRoot: string;
    workspaceRoot: string | null;
    hasWorkspace: boolean;
    activeChange: string | null;
    currentRoundId: string | null;
    lastDiffCheckAt: string | null;
    lastDiffAckAt: string | null;
  };
  project:
    | {
        name: string;
        summary: string;
        docPath: string;
      }
    | null;
  endGoal:
    | {
        goalId: string;
        name: string;
        summary: string;
        successCriteria: string[];
        nonGoals: string[];
      }
    | null;
  status:
    | {
        phase: string;
        progress: {
          percent: number;
          countedTasks: number;
          doneTasks: number;
          computedAt: string | null;
        };
        topLevelPlans: string[];
        nextActions: string[];
        blockers: string[];
      }
    | null;
  plans:
    | {
        endGoalRef: string;
        items: Array<{
          id: string;
          name: string;
          summary: string | null;
          status: "pending" | "in_progress" | "done" | "blocked";
          parentPlanId: string | null;
        }>;
      }
    | null;
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
        items: Array<{
          id: string;
          name: string;
          summary: string | null;
          status: "pending" | "in_progress" | "done" | "blocked";
          planRef: string;
          parentTaskId: string | null;
          countedForProgress: boolean;
        }>;
        tree: RuntimeTaskNode[];
        recentCompleted: string[];
        nextActions: string[];
        blockers: string[];
        archive: {
          items: RuntimeArchiveEntry[];
        };
      }
    | null;
  decisions:
    | {
        items: Array<{
          id: string;
          name: string;
          category: string;
          status: "pending" | "approved" | "rejected";
          createdAt: string;
        }>;
      }
    | null;
  releases:
    | {
        items: Array<{
          id: string;
          version: string;
          title: string;
          status: "draft" | "frozen" | "published";
          startedAt: string;
        }>;
      }
    | null;
  diff:
    | {
        pending: {
          generatedAt: string | null;
          files: RuntimeDiffFile[];
        };
        history: {
          items: Array<{
            id: string;
            kind: "check" | "ack";
            generatedAt: string;
            fileCount: number;
            addedCount: number;
            modifiedCount: number;
            deletedCount: number;
            files: RuntimeDiffFile[];
          }>;
        };
      }
    | null;
  docs: {
    pages: RuntimeDocPage[];
    changePages: Array<Pick<RuntimeDocPage, "path" | "slug" | "title" | "description">>;
  };
}

interface RuntimeVersion {
  updatedAt: string;
}

export interface RuntimeMetadata {
  siteId: string;
  sourceDocsRoot: string;
  sourceWorkspaceRoot: string | null;
  runtimeRoot: string;
  templateRoot: string;
  mode: "staged" | "open" | "dev" | "build";
  port: number | null;
  url: string | null;
  updatedAt: string;
}

const runtimeDataRoot = path.join(process.cwd(), "runtime-data");

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export async function loadControlPlaneSnapshot(): Promise<ControlPlaneSnapshot> {
  return readJsonFile<ControlPlaneSnapshot>(path.join(runtimeDataRoot, "control-plane.json"), {
    generatedAt: new Date().toISOString(),
    workspace: {
      root: null,
      docsRoot: "",
      workspaceRoot: null,
      hasWorkspace: false,
      activeChange: null,
      currentRoundId: null,
      lastDiffCheckAt: null,
      lastDiffAckAt: null
    },
    project: null,
    endGoal: null,
    status: null,
    plans: null,
    progress: null,
    tasks: null,
    decisions: null,
    releases: null,
    diff: null,
    docs: {
      pages: [],
      changePages: []
    }
  });
}

export async function loadRuntimeVersion(): Promise<RuntimeVersion> {
  return readJsonFile<RuntimeVersion>(path.join(runtimeDataRoot, "version.json"), {
    updatedAt: new Date().toISOString()
  });
}

export async function loadRuntimeMetadata(): Promise<RuntimeMetadata> {
  return readJsonFile<RuntimeMetadata>(path.join(runtimeDataRoot, "runtime.json"), {
    siteId: "",
    sourceDocsRoot: "",
    sourceWorkspaceRoot: null,
    runtimeRoot: process.cwd(),
    templateRoot: "",
    mode: "staged",
    port: null,
    url: null,
    updatedAt: new Date().toISOString()
  });
}

export function slugKey(slug: string[] | undefined): string {
  return (slug ?? []).join("/");
}
