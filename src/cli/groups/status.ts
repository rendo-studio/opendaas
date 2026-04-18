import { AclipApp } from "@rendo-studio/aclip";

import { getStatusSnapshot, syncStatusDocs } from "../../core/status.js";

export function registerStatusGroup(app: AclipApp) {
  app
    .group("status", {
      summary: "Inspect and sync the shared project status.",
      description: "Expose the current progress snapshot and project it back into docs."
    })
    .command("show", {
      summary: "Show the current status snapshot.",
      description: "Read the current control-plane summary without mutating files.",
      examples: ["opendaas status show"],
      handler: async () => ({
        status: await getStatusSnapshot()
      })
    })
    .command("sync", {
      summary: "Sync status back to docs.",
      description: "Project current goal, plan, task, and progress state back into shared docs.",
      examples: ["opendaas status sync"],
      handler: async () => {
        await syncStatusDocs();
        return {
          synced: true,
          status: await getStatusSnapshot()
        };
      }
    });
}
