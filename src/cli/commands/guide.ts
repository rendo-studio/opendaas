import { AclipApp } from "@rendo-studio/aclip";

import { loadWorkflowGuide } from "../../core/workflow-guide.js";

export function registerGuideCommand(app: AclipApp) {
  app.command("guide", {
    summary: "Show the OpenDaaS workflow guide.",
    description:
      "Read the canonical Agent-first OpenDaaS Workflow Guide distributed with the CLI package.",
    examples: ["opendaas guide"],
    handler: async () => ({
      guide: await loadWorkflowGuide()
    })
  });
}
