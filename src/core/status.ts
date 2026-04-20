import { describeTopLevelPlans, derivePlanStatuses, getCurrentPhase, loadPlans, syncPlanStatuses } from "./plans.js";
import { computeProgress, recomputeAndPersistProgress } from "./progress.js";
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
  const [endGoal, tasks, plans] = await Promise.all([
    loadEndGoal(),
    loadTasks(),
    loadPlans()
  ]);
  const derivedPlans = derivePlanStatuses(plans, tasks);
  const progress = computeProgress(tasks.items);

  return {
    endGoal,
    phase: getCurrentPhase(derivedPlans),
    progress,
    topLevelPlans: describeTopLevelPlans(derivedPlans),
    nextActions: findNextActions(tasks.items),
    blockers: describeBlockers(tasks.items)
  };
}
