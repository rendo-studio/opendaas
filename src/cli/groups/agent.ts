import { AclipApp } from "@rendo-studio/aclip";

import { inspectAgentArtifacts, syncAgentArtifacts } from "../../core/agent.js";
import { withGuideHint } from "../guide-hint.js";

export function registerAgentGroup(app: AclipApp) {
  app
    .group("agent", {
      summary: "Manage OpenDaaS agent adaptation artifacts.",
      description: withGuideHint(
        "Generate and inspect the minimum OpenDaaS guidance artifacts that help development agents operate inside the current workspace."
      )
    })
    .command("show", {
      summary: "Show current agent adaptation artifacts.",
      description: withGuideHint(
        "Inspect whether the current workspace already contains the minimum OpenDaaS agent guidance artifacts."
      ),
      examples: ["opendaas agent show"],
      handler: async () => ({
        agent: await inspectAgentArtifacts()
      })
    })
    .command("sync", {
      summary: "Generate or refresh the minimum agent adaptation artifacts.",
      description: withGuideHint(
        "Write the current workspace-facing OpenDaaS agent guidance into .opendaas and docs so first-time development agents can operate correctly."
      ),
      examples: ["opendaas agent sync"],
      handler: async () => ({
        agent: await syncAgentArtifacts()
      })
    });
}
