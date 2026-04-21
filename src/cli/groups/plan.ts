import { AclipApp, stringArgument } from "@rendo-studio/aclip";

import {
  addPlan,
  buildPlanTree,
  derivePlanStatuses,
  deletePlan,
  describeTopLevelPlans,
  loadPlans,
  renderPlanTreeLines,
  updatePlan
} from "../../core/plans.js";
import { syncStatusDocs } from "../../core/status.js";
import { loadTasks } from "../../core/tasks.js";
import { withGuideHint } from "../guide-hint.js";

function assertTaskStatus(status: string): "pending" | "in_progress" | "done" | "blocked" {
  if (!["pending", "in_progress", "done", "blocked"].includes(status)) {
    throw new Error(`Unsupported plan status "${status}".`);
  }

  return status as "pending" | "in_progress" | "done" | "blocked";
}

async function loadDerivedPlansForView(
  plansState?: Awaited<ReturnType<typeof loadPlans>>
) {
  const [plans, tasks] = await Promise.all([
    plansState ? Promise.resolve(plansState) : loadPlans(),
    loadTasks()
  ]);

  return derivePlanStatuses(plans, tasks);
}

export function registerPlanGroup(app: AclipApp) {
  app
    .group("plan", {
      summary: "Inspect the plan tree.",
      description: withGuideHint(
        "Read the current structured plan tree and its top-level execution phases."
      )
    })
    .command("add", {
      summary: "Add a plan node.",
      description: withGuideHint(
        "Create a plan node in the structured plan tree with an explicit parent marker or root."
      ),
      arguments: [
        stringArgument("name", {
          required: true,
          description: "Plan node name."
        }),
        stringArgument("parent", {
          required: true,
          description: "Parent plan id, or root for top-level plans."
        }),
        stringArgument("summary", {
          required: false,
          description: "Optional plan summary. Defaults to the plan name."
        }),
        stringArgument("status", {
          required: false,
          description: "Optional initial status: pending, in_progress, done, or blocked."
        })
      ],
      examples: [
        "opendaas plan add --name 'Harden workspace refresh' --parent root",
        "opendaas plan add --name 'Add console mutation coverage' --parent harden-workspace-refresh-1 --status in_progress"
      ],
      handler: async ({ name, parent, summary, status }) => {
        const result = await addPlan({
          name: String(name),
          parent: String(parent),
          summary: summary ? String(summary) : undefined,
          status: status ? assertTaskStatus(String(status)) : undefined
        });
        await syncStatusDocs();
        const plans = await loadDerivedPlansForView();

        return {
          plan: plans.items.find((plan) => plan.id === result.plan.id) ?? result.plan,
          topLevelPlans: describeTopLevelPlans(plans)
        };
      }
    })
    .command("update", {
      summary: "Update a plan node.",
      description: withGuideHint(
        "Rename, re-parent, or change a plan node status and refresh shared status projection."
      ),
      arguments: [
        stringArgument("id", {
          required: true,
          description: "Plan id."
        }),
        stringArgument("name", {
          required: false,
          description: "Optional replacement name."
        }),
        stringArgument("summary", {
          required: false,
          description: "Optional replacement summary."
        }),
        stringArgument("parent", {
          required: false,
          description: "Optional replacement parent id, or root."
        }),
        stringArgument("status", {
          required: false,
          description: "Optional replacement status: pending, in_progress, done, or blocked."
        })
      ],
      examples: [
        "opendaas plan update --id plan-1 --status done",
        "opendaas plan update --id harden-workspace-refresh-1 --name 'Harden workspace refresh and console sync'"
      ],
      handler: async ({ id, name, summary, parent, status }) => {
        const result = await updatePlan({
          id: String(id),
          name: name ? String(name) : undefined,
          summary: summary ? String(summary) : undefined,
          parent: parent ? String(parent) : undefined,
          status: status ? assertTaskStatus(String(status)) : undefined
        });
        await syncStatusDocs();
        const plans = await loadDerivedPlansForView();

        return {
          plan: plans.items.find((plan) => plan.id === result.plan.id) ?? result.plan,
          topLevelPlans: describeTopLevelPlans(plans)
        };
      }
    })
    .command("show", {
      summary: "Show the current plan tree.",
      description: withGuideHint("Inspect the current structured plan tree."),
      examples: ["opendaas plan show"],
      handler: async () => {
        const plans = await loadDerivedPlansForView();
        const tree = buildPlanTree(plans.items);
        return {
          plans,
          planTree: tree,
          lines: renderPlanTreeLines(tree),
          topLevelPlans: describeTopLevelPlans(plans)
        };
      }
    })
    .command("delete", {
      summary: "Delete a plan node.",
      description: withGuideHint(
        "Delete a plan node, all descendant plans, and any tasks attached to the removed plan subtree."
      ),
      arguments: [
        stringArgument("id", {
          required: true,
          description: "Plan id."
        })
      ],
      examples: ["opendaas plan delete --id harden-workspace-refresh-1"],
      handler: async ({ id }) => {
        const result = await deletePlan({
          id: String(id)
        });
        await syncStatusDocs();
        const plans = await loadDerivedPlansForView(result.plans);
        return {
          deletedPlanIds: result.deletedPlanIds,
          deletedTaskIds: result.deletedTaskIds,
          topLevelPlans: describeTopLevelPlans(plans)
        };
      }
    });
}
