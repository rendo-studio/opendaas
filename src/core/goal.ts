import { renderBulletList, replaceSectionContent } from "./markdown.js";
import { readYamlFile, writeYamlFile } from "./storage.js";
import { getWorkspacePaths } from "./workspace.js";
import type { GoalState } from "./types.js";
import { loadProgress } from "./progress.js";

export async function loadGoal(): Promise<GoalState> {
  const paths = getWorkspacePaths();
  return readYamlFile<GoalState>(paths.goalFile);
}

export async function saveGoal(input: Pick<GoalState, "name" | "summary">): Promise<GoalState> {
  const paths = getWorkspacePaths();
  const current = await loadGoal();
  const next: GoalState = {
    ...current,
    name: input.name,
    summary: input.summary
  };

  await writeYamlFile(paths.goalFile, next);
  await syncGoalDocs(next);
  return next;
}

export async function syncGoalDocs(goal?: GoalState): Promise<void> {
  const paths = getWorkspacePaths();
  const currentGoal = goal ?? (await loadGoal());
  const progress = await loadProgress().catch(() => ({
    percent: 0
  }));

  await replaceSectionContent(
    paths.docsGoalFile,
    "最终目标",
    `${currentGoal.name}\n\n${currentGoal.summary}`
  );
  await replaceSectionContent(
    paths.docsGoalFile,
    "完成标准",
    renderBulletList(currentGoal.successCriteria)
  );
  await replaceSectionContent(
    paths.docsGoalFile,
    "明确不做什么",
    renderBulletList(currentGoal.nonGoals)
  );
  await replaceSectionContent(
    paths.docsGoalFile,
    "当前进度摘要",
    `当前默认进度：**${progress.percent}%**`
  );

  await replaceSectionContent(paths.docsIndexFile, "最终目标", currentGoal.summary);
}
