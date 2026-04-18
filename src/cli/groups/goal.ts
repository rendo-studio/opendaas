import { AclipApp, stringArgument } from "@rendo-studio/aclip";
import { loadEndGoal, updateEndGoal } from "../../core/end-goal.js";
import { syncStatusDocs } from "../../core/status.js";

export function registerGoalGroup(app: AclipApp) {
  app
    .group("goal", {
      summary: "Manage the long-lived end goal anchor.",
      description: "Set and inspect the project-level end goal tracked in the control plane."
    })
    .command("set", {
      summary: "Set the end goal.",
      description:
        "Persist the long-lived end goal summary after the corresponding goal decision has been approved.",
      arguments: [
        stringArgument("name", {
          required: true,
          description: "Human-readable end goal name."
        }),
        stringArgument("description", {
          required: true,
          description: "One-sentence end goal description."
        })
      ],
      examples: [
        "opendaas goal set --name 'Make OpenDaaS durable' --description 'Turn OpenDaaS into a stable project context control plane for human developers and development agents.'"
      ],
      handler: async ({ name, description }) => {
        const goal = await updateEndGoal({
          name: String(name),
          summary: String(description)
        });
        await syncStatusDocs();

        return {
          goal,
          nextAction: "Update the current plan tree so the phase and progress stay aligned with the end goal."
        };
      }
    })
    .command("show", {
      summary: "Show the end goal.",
      description: "Inspect the currently anchored end goal.",
      examples: ["opendaas goal show"],
      handler: async () => ({
        goal: await loadEndGoal()
      })
    });
}
