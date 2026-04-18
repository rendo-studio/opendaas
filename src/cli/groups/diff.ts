import { AclipApp } from "@rendo-studio/aclip";
import { diffAck, diffCheck, diffShow } from "../../core/diff.js";

export function registerDiffGroup(app: AclipApp) {
  app
    .group("diff", {
      summary: "Inspect shared docs diffs.",
      description:
        "Inspect, classify, and acknowledge shared docs diffs against the current baseline."
    })
    .command("show", {
      summary: "Show pending diff state.",
      description: "Inspect the current diff placeholder state.",
      examples: ["opendaas diff show"],
      handler: async () => ({
        diff: await diffShow()
      })
    })
    .command("check", {
      summary: "Check docs diffs against the current baseline.",
      description: "Scan docs and write the current pending diff state.",
      examples: ["opendaas diff check"],
      handler: async () => ({
        diff: await diffCheck()
      })
    })
    .command("ack", {
      summary: "Acknowledge the current docs baseline.",
      description: "Capture the current docs state as the new acknowledged diff baseline.",
      examples: ["opendaas diff ack"],
      handler: async () => ({
        diff: await diffAck()
      })
    });
}
