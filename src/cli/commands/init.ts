import { AclipApp, booleanArgument, stringArgument } from "@rendo-studio/aclip";

import { initWorkspace } from "../../core/bootstrap.js";

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

export function registerInitCommand(app: AclipApp) {
  app.command("init", {
    summary: "Initialize a new OpenDaaS workspace.",
    description:
      "Create a new OpenDaaS workspace in an empty directory, including docs anchors and the internal .opendaas control plane.",
    arguments: [
      stringArgument("targetPath", {
        required: true,
        description: "Target directory for the new workspace.",
        flag: "--target-path"
      }),
      stringArgument("projectName", {
        required: true,
        description: "Human-readable project name.",
        flag: "--project-name"
      }),
      stringArgument("goalName", {
        required: true,
        description: "Final goal name.",
        flag: "--goal-name"
      }),
      stringArgument("goalSummary", {
        required: true,
        description: "One-sentence final goal summary.",
        flag: "--goal-summary"
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
      "opendaas init --target-path D:/project/example --project-name Example --goal-name 'Launch Example' --goal-summary 'Ship the first releasable slice of Example.'",
      "opendaas init --target-path D:/project/example --project-name Example --goal-name 'Launch Example' --goal-summary 'Ship the first releasable slice of Example.' --project-kind frontend --docs-mode standard"
    ],
    handler: async (payload) => ({
      init: await initWorkspace({
        targetPath: String(payload.targetPath),
        projectName: String(payload.projectName),
        goalName: String(payload.goalName),
        goalSummary: String(payload.goalSummary),
        projectKind: assertProjectKind(payload.projectKind ? String(payload.projectKind) : undefined),
        docsMode: assertDocsMode(payload.docsMode ? String(payload.docsMode) : undefined),
        force: Boolean(payload.force)
      })
    })
  });
}
