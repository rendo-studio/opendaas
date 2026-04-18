import { AclipApp, stringArgument } from "@rendo-studio/aclip";

import {
  addPlan,
  buildPlanTree,
  describeTopLevelPlans,
  loadPlans,
  renderPlanTreeLines,
  syncPlanStatuses,
  updatePlan
} from "../../core/plans.js";
import { syncStatusDocs } from "../../core/status.js";

function assertTaskStatus(status: string): "pending" | "in_progress" | "done" | "blocked" {
  if (!["pending", "in_progress", "done", "blocked"].includes(status)) {
    throw new Error(`Unsupported plan status "${status}".`);
  }

  return status as "pending" | "in_progress" | "done" | "blocked";
}

export function registerPlanGroup(app: AclipApp) {
  app
    .group("plan", {
      summary: "Inspect the plan tree.",
      description: "Read the current structured plan tree and its top-level execution phases."
    })
    .command("add", {
      summary: "Add a plan node.",
      description:
        "Create a plan node in the structured plan tree with an explicit parent marker or root.",
      arguments: [
        stringArgument("name", {
          required: true,
          description: "Plan node name."
        }),
        stringArgument("parent", {
          required: true,
          description: "Parent plan id, or root for top-level plans."
        }),
        stringArgument("status", {
          required: false,
          description: "Optional initial status: pending, in_progress, done, or blocked."
        })
      ],
      examples: [
        "opendaas plan add --name 'Harden diff lifecycle' --parent root",
        "opendaas plan add --name 'Add source classification' --parent harden-diff-lifecycle-1 --status in_progress"
      ],
      handler: async ({ name, parent, status }) => {
        const result = await addPlan({
          name: String(name),
          parent: String(parent),
          status: status ? assertTaskStatus(String(status)) : undefined
        });
        await syncStatusDocs();

        return {
          plan: result.plan,
          topLevelPlans: describeTopLevelPlans(result.plans)
        };
      }
    })
    .command("update", {
      summary: "Update a plan node.",
      description:
        "Rename, re-parent, or change a plan node status and refresh shared status projection.",
      arguments: [
        stringArgument("id", {
          required: true,
          description: "Plan id."
        }),
        stringArgument("name", {
          required: false,
          description: "Optional replacement name."
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
        "opendaas plan update --id harden-diff-lifecycle-1 --name 'Harden diff lifecycle and provenance'"
      ],
      handler: async ({ id, name, parent, status }) => {
        const result = await updatePlan({
          id: String(id),
          name: name ? String(name) : undefined,
          parent: parent ? String(parent) : undefined,
          status: status ? assertTaskStatus(String(status)) : undefined
        });
        await syncStatusDocs();

        return {
          plan: result.plan,
          topLevelPlans: describeTopLevelPlans(result.plans)
        };
      }
    })
    .command("show", {
      summary: "Show the current plan tree.",
      description: "Inspect the current structured plan tree.",
      examples: ["opendaas plan show"],
      handler: async () => {
        const plans = await loadPlans();
        const tree = buildPlanTree(plans.items);
        return {
          plans,
          planTree: tree,
          lines: renderPlanTreeLines(tree),
          topLevelPlans: describeTopLevelPlans(plans)
        };
      }
    })
    .command("sync", {
      summary: "Sync plan statuses from task state.",
      description: "Recompute plan statuses from current task statuses and persist the result.",
      examples: ["opendaas plan sync"],
      handler: async () => {
        const plans = await syncPlanStatuses();
        const tree = buildPlanTree(plans.items);
        await syncStatusDocs();
        return {
          plans,
          planTree: tree,
          lines: renderPlanTreeLines(tree),
          topLevelPlans: describeTopLevelPlans(plans)
        };
      }
    });
}
