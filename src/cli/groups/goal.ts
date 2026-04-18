import { AclipApp, stringArgument } from "@rendo-studio/aclip";
import { loadGoal, saveGoal } from "../../core/goal.js";
import { syncStatusDocs } from "../../core/status.js";

export function registerGoalGroup(app: AclipApp) {
  app
    .group("goal", {
      summary: "Manage the final goal anchor.",
      description: "Set and inspect the project-level final goal."
    })
    .command("set", {
      summary: "Set the final goal.",
      description:
        "Persist a final goal summary after the corresponding goal decision has been approved.",
      arguments: [
        stringArgument("name", {
          required: true,
          description: "Human-readable goal name."
        }),
        stringArgument("description", {
          required: true,
          description: "One-sentence goal description."
        })
      ],
      examples: [
        "opendaas goal set --name 'Launch docs control plane' --description 'Provide a CLI-first documentation control plane for Human-Agent collaboration.'"
      ],
      handler: async ({ name, description }) => {
        const goal = await saveGoal({
          name: String(name),
          summary: String(description)
        });
        await syncStatusDocs();

        return {
          goal,
          nextAction: "Update plan/tree state so progress and docs stay aligned."
        };
      }
    })
    .command("show", {
      summary: "Show the current final goal.",
      description: "Inspect the currently anchored final goal.",
      examples: ["opendaas goal show"],
      handler: async () => ({
        goal: await loadGoal()
      })
    });
}
