import { AclipApp } from "@rendo-studio/aclip";

import { getStatusSnapshot, syncStatusDocs } from "../../core/status.js";
import { withGuideHint } from "../guide-hint.js";

export function registerStatusGroup(app: AclipApp) {
  app
    .group("status", {
      summary: "Inspect and sync the derived project status.",
      description: withGuideHint(
        "Inspect the derived status snapshot and, when needed, explicitly persist refreshed plan/progress projections."
      )
    })
    .command("show", {
      summary: "Show the current status snapshot.",
      description: withGuideHint("Read the current control-plane summary without mutating files."),
      examples: ["opendaas status show"],
      handler: async () => ({
        status: await getStatusSnapshot()
      })
    })
    .command("sync", {
      summary: "Refresh derived status state.",
      description: withGuideHint(
        "Recompute and persist plan status plus progress after direct .opendaas edits or when the derived status projection may be stale."
      ),
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
