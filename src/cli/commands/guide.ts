import { AclipApp } from "@rendo-studio/aclip";

import { loadWorkflowGuide } from "../../core/workflow-guide.js";

export function registerGuideCommand(app: AclipApp) {
  app.command("guide", {
    summary: "Show the APCC workflow guide.",
    description:
      "Read the canonical Agent-first APCC Workflow Guide distributed with the CLI package.",
    examples: ["apcc guide"],
    handler: async () => ({
      guide: await loadWorkflowGuide()
    })
  });
}
