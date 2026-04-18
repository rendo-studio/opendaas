import { afterEach, describe, expect, it } from "vitest";

import { addPlan, buildPlanTree, loadPlans, syncPlanStatuses, updatePlan } from "../src/core/plans.js";
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

describe("plan control plane", () => {
  it("adds and reparents plan nodes without breaking the tree", async () => {
    const fixture = await createWorkspaceFixture();
    restorers.push(fixture.use());
    cleanups.push(fixture.cleanup);

    const addedRoot = await addPlan({
      name: "Harden diff lifecycle",
      parent: "root"
    });
    const addedChild = await addPlan({
      name: "Add source classification",
      parent: addedRoot.plan.id
    });

    const updated = await updatePlan({
      id: addedChild.plan.id,
      status: "in_progress",
      name: "Add human and agent source classification"
    });

    const plans = await loadPlans();
    const tree = buildPlanTree(plans.items);

    expect(updated.plan.status).toBe("in_progress");
    expect(tree.some((node) => node.id === addedRoot.plan.id)).toBe(true);
    expect(tree.find((node) => node.id === addedRoot.plan.id)?.children[0]?.id).toBe(
      addedChild.plan.id
    );
  });

  it("propagates descendant task status back to parent plans", async () => {
    const fixture = await createWorkspaceFixture({
      plans: {
        endGoalRef: "goal-test",
        items: [
          {
            id: "plan-root",
            name: "Production hardening",
            summary: "Drive the control plane toward a stronger production baseline.",
            status: "pending",
            parentPlanId: null
          },
          {
            id: "plan-child",
            name: "Diff provenance",
            summary: "Track where shared-doc changes came from.",
            status: "pending",
            parentPlanId: "plan-root"
          }
        ]
      },
      tasks: {
        items: [
          {
            id: "task-1",
            name: "Implement source classification",
            summary: "Classify whether each shared-doc change was authored by a human or an agent.",
            status: "done",
            planRef: "plan-child",
            parentTaskId: null,
            countedForProgress: true
          }
        ]
      }
    });
    restorers.push(fixture.use());
    cleanups.push(fixture.cleanup);

    const plans = await syncPlanStatuses();

    expect(plans.items.find((plan) => plan.id === "plan-child")?.status).toBe("done");
    expect(plans.items.find((plan) => plan.id === "plan-root")?.status).toBe("done");
  });
});
