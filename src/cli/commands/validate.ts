import { AclipApp, booleanArgument } from "@rendo-studio/aclip";
import { repairWorkspace, validateWorkspace } from "../../core/validate.js";

export function registerValidateCommand(app: AclipApp) {
  app.command("validate", {
    summary: "Validate the current workspace.",
    description:
      "Run a validation pass over OpenDaaS anchors, metadata, migration state, and task-tree constraints. Optionally repair a workspace by backfilling managed files and schema metadata.",
    arguments: [
      booleanArgument("repair", {
        required: false,
        description: "Attempt to repair the current workspace by backfilling managed files and schema metadata.",
        flag: "--repair"
      })
    ],
    examples: ["opendaas validate", "opendaas validate --repair"],
    handler: async ({ repair }) =>
      repair
        ? {
            validation: await repairWorkspace()
          }
        : {
            validation: await validateWorkspace()
          }
  });
}
