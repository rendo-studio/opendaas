import { renderBulletList, replaceSectionContent } from "./markdown.js";
import { loadPlans, describeTopLevelPlans, getCurrentPhase, syncPlanStatuses } from "./plans.js";
import { loadProgress, recomputeAndPersistProgress } from "./progress.js";
import { loadGoal, syncGoalDocs } from "./goal.js";
import { loadTaskArchive, sortArchivedTasks } from "./task-archive.js";
import {
  buildTaskTree,
  describeBlockers,
  findNextActions,
  loadTasks,
  renderTaskTreeLines,
  renderCurrentHighLevelPlan,
  summarizeRecentCompleted
} from "./tasks.js";
import { getWorkspacePaths } from "./workspace.js";

export async function syncStatusDocs(): Promise<void> {
  const paths = getWorkspacePaths();
  const [goal, tasksState, archive] = await Promise.all([loadGoal(), loadTasks(), loadTaskArchive()]);
  const [plans, progress] = await Promise.all([
    syncPlanStatuses(tasksState),
    recomputeAndPersistProgress(tasksState)
  ]);

  const topLevelPlans = describeTopLevelPlans(plans);
  const nextActions = findNextActions(tasksState.items);
  const blockers = describeBlockers(tasksState.items);
  const recentCompleted = summarizeRecentCompleted(tasksState.items);
  const summary =
    progress.percent === 100
      ? `当前围绕最终目标“${goal.name}”的本轮计划已完成，控制面与共享文档已经同步到完成态。`
      : `当前围绕最终目标“${goal.name}”推进，结构化控制面、共享文档与发布路径仍在继续收敛。`;

  await replaceSectionContent(
    paths.docsStatusFile,
    "状态摘要",
    summary
  );
  await replaceSectionContent(paths.docsStatusFile, "当前阶段", `当前阶段：**${getCurrentPhase(plans)}**`);
  await replaceSectionContent(
    paths.docsStatusFile,
    "当前进度",
    `当前默认进度：**${progress.percent}%**\n\n计算口径：\n\n- 控制面当前纳入统计的 ${progress.countedTasks} 个叶子任务中，已完成 ${progress.doneTasks} 个`
  );
  await replaceSectionContent(paths.docsStatusFile, "当前进展", renderBulletList(recentCompleted));
  await replaceSectionContent(paths.docsStatusFile, "主要 blocker / 风险", renderBulletList(blockers));
  await replaceSectionContent(paths.docsStatusFile, "下一步动作", renderBulletList(nextActions));
  await replaceSectionContent(
    paths.docsStatusFile,
    "最近更新时间",
    new Date().toISOString()
  );

  await replaceSectionContent(paths.docsIndexFile, "当前进度", `当前默认进度：**${progress.percent}%**`);
  await replaceSectionContent(
    paths.docsCurrentWorkFile,
    "当前 active work",
    `当前 active work：**${goal.summary}**`
  );
  await replaceSectionContent(
    paths.docsCurrentWorkFile,
    "当前高层焦点",
    renderBulletList(
      topLevelPlans.filter((plan) => !plan.endsWith("[done]")).slice(0, 3).map((plan) => plan.replace(/\s+\[[^\]]+\]$/, "")) ||
        []
    )
  );
  await replaceSectionContent(
    paths.docsCurrentWorkFile,
    "当前高层计划",
    renderBulletList(topLevelPlans)
  );
  await replaceSectionContent(
    paths.docsTasksFile,
    "当前任务树",
    renderTaskTreeLines(buildTaskTree(tasksState.items)).join("\n")
  );
  await replaceSectionContent(
    paths.docsTasksFile,
    "最近完成",
    renderBulletList(recentCompleted)
  );
  await replaceSectionContent(
    paths.docsTasksFile,
    "历史闭环",
    renderBulletList(
      sortArchivedTasks(archive.items).map((item) => `${item.name} [${item.closedAt}]`).slice(0, 10)
    )
  );
  await syncGoalDocs(goal);
}

export async function getStatusSnapshot() {
  const [goal, tasks] = await Promise.all([
    loadGoal(),
    loadTasks()
  ]);
  const [plans, progress] = await Promise.all([
    syncPlanStatuses(tasks),
    recomputeAndPersistProgress(tasks)
  ]);

  return {
    goal,
    phase: getCurrentPhase(plans),
    progress,
    topLevelPlans: describeTopLevelPlans(plans),
    nextActions: findNextActions(tasks.items),
    blockers: describeBlockers(tasks.items)
  };
}
