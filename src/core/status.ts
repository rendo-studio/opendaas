import { describeTopLevelPlans, getCurrentPhase, syncPlanStatuses } from "./plans.js";
import { recomputeAndPersistProgress } from "./progress.js";
import { loadEndGoal } from "./end-goal.js";
import {
  describeBlockers,
  findNextActions,
  loadTasks
} from "./tasks.js";

export async function syncStatusDocs(): Promise<void> {
  const tasksState = await loadTasks();
  await Promise.all([syncPlanStatuses(tasksState), recomputeAndPersistProgress(tasksState)]);
}

export async function getStatusSnapshot() {
  const [endGoal, tasks] = await Promise.all([
    loadEndGoal(),
    loadTasks()
  ]);
  const [plans, progress] = await Promise.all([
    syncPlanStatuses(tasks),
    recomputeAndPersistProgress(tasks)
  ]);

  return {
    endGoal,
    phase: getCurrentPhase(plans),
    progress,
    topLevelPlans: describeTopLevelPlans(plans),
    nextActions: findNextActions(tasks.items),
    blockers: describeBlockers(tasks.items)
  };
}
