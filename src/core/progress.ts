import { getWorkspacePaths } from "./workspace.js";
import { readYamlFile, writeYamlFile } from "./storage.js";
import type { ProgressState, TaskNode, TasksState } from "./types.js";

export function computeProgress(tasks: TaskNode[]): ProgressState {
  const countedTasks = tasks.filter((task) => task.countedForProgress);
  const doneTasks = countedTasks.filter((task) => task.status === "done");
  const percent =
    countedTasks.length === 0
      ? 0
      : Math.round((doneTasks.length / countedTasks.length) * 100);

  return {
    percent,
    countedTasks: countedTasks.length,
    doneTasks: doneTasks.length,
    computedAt: new Date().toISOString()
  };
}

export async function loadProgress(): Promise<ProgressState> {
  const paths = getWorkspacePaths();
  return readYamlFile<ProgressState>(paths.progressFile);
}

export async function recomputeAndPersistProgress(
  tasksState?: TasksState
): Promise<ProgressState> {
  const paths = getWorkspacePaths();
  const tasks =
    tasksState ?? (await readYamlFile<TasksState>(paths.taskFile));
  const progress = computeProgress(tasks.items);
  await writeYamlFile(paths.progressFile, progress);
  return progress;
}
