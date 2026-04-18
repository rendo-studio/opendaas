import { renderBulletList } from "./markdown.js";
import { readYamlFile, writeYamlFile } from "./storage.js";
import { getWorkspacePaths } from "./workspace.js";
import type { TaskNode, TasksState, TaskStatus, TaskTreeNode } from "./types.js";
import { loadProgress } from "./progress.js";
import { syncStatusDocs } from "./status.js";
import { loadPlans } from "./plans.js";

export async function loadTasks(): Promise<TasksState> {
  const paths = getWorkspacePaths();
  return readYamlFile<TasksState>(paths.taskFile);
}

export function assertValidTaskTree(tasks: TaskNode[]): void {
  const ids = new Set(tasks.map((task) => task.id));

  for (const task of tasks) {
    if (task.parentTaskId !== null && !ids.has(task.parentTaskId)) {
      throw new Error(`Task ${task.id} points to missing parent ${task.parentTaskId}`);
    }
  }
}

export function createTaskId(name: string, siblingCount: number): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return slug ? `${slug}-${siblingCount + 1}` : `task-${siblingCount + 1}`;
}

export async function addTask(input: {
  name: string;
  parent: string;
  plan?: string;
}): Promise<{ task: TaskNode; progressPercent: number }> {
  const paths = getWorkspacePaths();
  const [current, plans] = await Promise.all([loadTasks(), loadPlans()]);
  const parentTaskId = input.parent === "root" ? null : input.parent;

  if (parentTaskId !== null && !current.items.some((task) => task.id === parentTaskId)) {
    throw new Error(`Parent task "${input.parent}" does not exist.`);
  }

  const inheritedPlanRef =
    parentTaskId !== null
      ? current.items.find((task) => task.id === parentTaskId)?.planRef
      : undefined;
  const planRef = input.plan ?? inheritedPlanRef;

  if (!planRef) {
    throw new Error(`Task "${input.name}" requires an explicit plan when added at the root level.`);
  }

  if (!plans.items.some((plan) => plan.id === planRef)) {
    throw new Error(`Plan "${planRef}" does not exist.`);
  }

  const siblings = current.items.filter((task) => task.parentTaskId === parentTaskId);
  const task: TaskNode = {
    id: createTaskId(input.name, siblings.length),
    name: input.name,
    status: "pending",
    planRef,
    parentTaskId,
    countedForProgress: true
  };

  const next: TasksState = {
    items: [...current.items, task]
  };
  assertValidTaskTree(next.items);
  await writeYamlFile(paths.taskFile, next);
  await syncStatusDocs();
  const progress = await loadProgress();

  return { task, progressPercent: progress.percent };
}

export async function updateTaskStatus(input: {
  id: string;
  status: TaskStatus;
}): Promise<{ task: TaskNode; progressPercent: number }> {
  const paths = getWorkspacePaths();
  const current = await loadTasks();
  const index = current.items.findIndex((task) => task.id === input.id);

  if (index === -1) {
    throw new Error(`Task "${input.id}" does not exist.`);
  }

  const updatedTask: TaskNode = {
    ...current.items[index],
    status: input.status
  };

  const nextItems = [...current.items];
  nextItems[index] = updatedTask;
  const next: TasksState = { items: nextItems };
  await writeYamlFile(paths.taskFile, next);
  await syncStatusDocs();
  const progress = await loadProgress();

  return { task: updatedTask, progressPercent: progress.percent };
}

export function buildTaskTree(tasks: TaskNode[]): TaskTreeNode[] {
  const nodes = new Map<string, TaskTreeNode>();
  const roots: TaskTreeNode[] = [];

  for (const task of tasks) {
    nodes.set(task.id, { ...task, children: [] });
  }

  for (const task of tasks) {
    const node = nodes.get(task.id)!;
    if (task.parentTaskId === null) {
      roots.push(node);
      continue;
    }

    const parent = nodes.get(task.parentTaskId);
    if (!parent) {
      throw new Error(`Task ${task.id} points to missing parent ${task.parentTaskId}`);
    }
    parent.children.push(node);
  }

  return roots;
}

export function renderTaskTreeLines(tree: TaskTreeNode[], depth = 0): string[] {
  return tree.flatMap((node) => {
    const prefix = `${"  ".repeat(depth)}- `;
    const line = `${prefix}${node.name} (${node.id}) [${node.status}]`;
    return [line, ...renderTaskTreeLines(node.children, depth + 1)];
  });
}

export function findNextActions(tasks: TaskNode[]): string[] {
  return tasks
    .filter((task) => task.countedForProgress && task.status !== "done")
    .slice(0, 3)
    .map((task) => task.name);
}

export function summarizeRecentCompleted(tasks: TaskNode[]): string[] {
  return tasks
    .filter((task) => task.countedForProgress && task.status === "done")
    .slice(-4)
    .map((task) => task.name);
}

export function describeBlockers(tasks: TaskNode[]): string[] {
  const blockers = tasks
    .filter((task) => task.status === "blocked")
    .map((task) => task.name);

  return blockers.length > 0 ? blockers : ["暂无明确 blocker"];
}

export function renderCurrentHighLevelPlan(tasks: TaskNode[]): string {
  const roots = buildTaskTree(tasks)
    .filter((task) => task.status !== "done")
    .map((task) => task.name);

  return renderBulletList(roots.length > 0 ? roots : ["当前高层任务已全部完成"]);
}
