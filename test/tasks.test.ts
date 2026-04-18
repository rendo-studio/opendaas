import { afterEach, describe, expect, it } from "vitest";

import { loadProgress } from "../src/core/progress.js";
import { addTask, loadTasks, updateTaskStatus } from "../src/core/tasks.js";
import { createWorkspaceFixture } from "./helpers/workspace.js";

const restorers: Array<() => void> = [];
const cleanups: Array<() => Promise<void>> = [];

afterEach(async () => {
  while (restorers.length > 0) {
    restorers.pop()?.();
  }

  while (cleanups.length > 0) {
    await cleanups.pop()?.();
  }
});

describe("task control plane", () => {
  it("requires an explicit plan for root tasks and inherits plan from parent tasks", async () => {
    const fixture = await createWorkspaceFixture();
    restorers.push(fixture.use());
    cleanups.push(fixture.cleanup);

    await expect(
      addTask({
        name: "Root task without plan",
        parent: "root"
      })
    ).rejects.toThrow(/requires an explicit plan/i);

    const rootTask = await addTask({
      name: "Root task",
      parent: "root",
      plan: "plan-root"
    });
    const childTask = await addTask({
      name: "Child task",
      parent: rootTask.task.id
    });

    expect(rootTask.task.planRef).toBe("plan-root");
    expect(childTask.task.planRef).toBe("plan-root");
  });

  it("recomputes progress when task statuses change", async () => {
    const fixture = await createWorkspaceFixture();
    restorers.push(fixture.use());
    cleanups.push(fixture.cleanup);

    const first = await addTask({
      name: "Task A",
      parent: "root",
      plan: "plan-root"
    });
    await addTask({
      name: "Task B",
      parent: "root",
      plan: "plan-root"
    });

    await updateTaskStatus({
      id: first.task.id,
      status: "done"
    });

    const progress = await loadProgress();
    const tasks = await loadTasks();

    expect(tasks.items).toHaveLength(2);
    expect(progress.countedTasks).toBe(2);
    expect(progress.doneTasks).toBe(1);
    expect(progress.percent).toBe(50);
  });
});
