import { AclipApp, booleanArgument, stringArgument } from "@rendo-studio/aclip";

import { adoptWorkspace } from "../../core/bootstrap.js";
import { withGuideHint } from "../guide-hint.js";

function assertProjectKind(value?: string): "general" | "frontend" | "library" | "service" | undefined {
  if (!value) {
    return undefined;
  }

  if (!["general", "frontend", "library", "service"].includes(value)) {
    throw new Error(`Unsupported projectKind "${value}".`);
  }

  return value as "general" | "frontend" | "library" | "service";
}

function assertDocsMode(value?: string): "minimal" | "standard" | undefined {
  if (!value) {
    return undefined;
  }

  if (!["minimal", "standard"].includes(value)) {
    throw new Error(`Unsupported docsMode "${value}".`);
  }

  return value as "minimal" | "standard";
}

export function registerAdoptCommand(app: AclipApp) {
  app.command("adopt", {
    summary: "Adopt an existing project into OpenDaaS.",
    description: withGuideHint(
      "Attach the OpenDaaS control plane and shared-doc anchors to an existing repository without taking over unrelated user files."
    ),
    arguments: [
      stringArgument("targetPath", {
        required: false,
        description: "Existing project root to adopt. Defaults to the current directory.",
        flag: "--target-path"
      }),
      stringArgument("endGoalName", {
        required: false,
        description: "Optional long-lived end goal name. If omitted, OpenDaaS writes a provisional end goal anchor.",
        flag: "--end-goal-name"
      }),
      stringArgument("endGoalSummary", {
        required: false,
        description: "Optional one-sentence end goal summary. If omitted, OpenDaaS writes a provisional end goal anchor.",
        flag: "--end-goal-summary"
      }),
      stringArgument("projectName", {
        required: false,
        description: "Optional project name. Defaults to the target directory name.",
        flag: "--project-name"
      }),
      stringArgument("projectSummary", {
        required: false,
        description: "Optional project overview summary. If omitted, OpenDaaS writes a provisional overview anchor.",
        flag: "--project-summary"
      }),
      stringArgument("projectKind", {
        required: false,
        description: "Optional project kind: general, frontend, library, or service.",
        flag: "--project-kind"
      }),
      stringArgument("docsMode", {
        required: false,
        description: "Optional docs mode: minimal or standard.",
        flag: "--docs-mode"
      }),
      booleanArgument("force", {
        required: false,
        description: "Allow overwriting OpenDaaS-managed anchor files and control-plane files.",
        flag: "--force"
      })
    ],
    examples: [
      "opendaas adopt",
      "opendaas adopt --project-name Existing --project-summary 'Existing service repo brought under OpenDaaS control.' --end-goal-name 'Make Existing durable' --end-goal-summary 'Turn the existing project into a repeatable and well-governed delivery loop.'",
      "opendaas adopt --target-path D:/project/existing --project-kind service"
    ],
    handler: async (payload) => ({
      adopt: await adoptWorkspace({
        targetPath: payload.targetPath ? String(payload.targetPath) : undefined,
        projectName: payload.projectName ? String(payload.projectName) : undefined,
        projectSummary: payload.projectSummary ? String(payload.projectSummary) : undefined,
        endGoalName: payload.endGoalName ? String(payload.endGoalName) : undefined,
        endGoalSummary: payload.endGoalSummary ? String(payload.endGoalSummary) : undefined,
        projectKind: assertProjectKind(payload.projectKind ? String(payload.projectKind) : undefined),
        docsMode: assertDocsMode(payload.docsMode ? String(payload.docsMode) : undefined),
        force: Boolean(payload.force)
      })
    })
  });
}
