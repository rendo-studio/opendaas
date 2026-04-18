import { AclipApp } from "@rendo-studio/aclip";

import { getStatusSnapshot, syncStatusDocs } from "../../core/status.js";

export function registerStatusGroup(app: AclipApp) {
  app
    .group("status", {
      summary: "Inspect and sync the derived project status.",
      description: "Expose the current progress snapshot and refresh derived control-plane state."
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
      summary: "Refresh derived status state.",
      description: "Recompute plan status and progress from the current structured control plane.",
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
