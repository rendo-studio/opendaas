import { AclipApp, booleanArgument, stringArgument } from "@rendo-studio/aclip";

import { initWorkspace } from "../../core/bootstrap.js";
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

export function registerInitCommand(app: AclipApp) {
  app.command("init", {
    summary: "Initialize a new OpenDaaS workspace.",
    description: withGuideHint(
      "Initialize OpenDaaS in the current directory or target path. Empty directories get a new workspace; existing projects are attached safely without rewriting existing authored docs."
    ),
    arguments: [
      stringArgument("targetPath", {
        required: false,
        description: "Target directory to initialize. Defaults to the current directory.",
        flag: "--target-path"
      }),
      stringArgument("projectName", {
        required: false,
        description: "Optional human-readable project name. Defaults to the current directory name.",
        flag: "--project-name"
      }),
      stringArgument("projectSummary", {
        required: false,
        description: "Optional project overview summary. If omitted, OpenDaaS writes a provisional overview anchor.",
        flag: "--project-summary"
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
        description: "Allow overwriting OpenDaaS-managed control-plane files.",
        flag: "--force"
      })
    ],
    examples: [
      "opendaas init",
      "opendaas init --project-name Example --project-summary 'CLI-first project context control plane for a service repo.' --end-goal-name 'Make Example reliable' --end-goal-summary 'Turn Example into a stable product with a clear delivery loop.'",
      "opendaas init --target-path D:/project/existing --project-name Existing --project-summary 'Existing repo brought under OpenDaaS control.'",
      "opendaas init --target-path D:/project/example --project-name Example --project-summary 'Frontend app managed through OpenDaaS.' --project-kind frontend --docs-mode standard"
    ],
    handler: async (payload) => ({
      init: await initWorkspace({
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
