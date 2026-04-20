import { AclipApp, stringArgument } from "@rendo-studio/aclip";

import {
  createDecisionRecord,
  decideDecisionRecord,
  getDecisionRecord,
  listDecisionRecords
} from "../../core/decision.js";
import { withGuideHint } from "../guide-hint.js";

function assertCategory(value: string): "goal" | "scope" | "change" | "architecture" | "release" | "policy" | "other" {
  if (!["goal", "scope", "change", "architecture", "release", "policy", "other"].includes(value)) {
    throw new Error(
      `Unsupported category "${value}". Use goal, scope, change, architecture, release, policy, or other.`
    );
  }

  return value as "goal" | "scope" | "change" | "architecture" | "release" | "policy" | "other";
}

function assertDecision(value: string): "approve" | "reject" {
  if (!["approve", "reject"].includes(value)) {
    throw new Error(`Unsupported decision "${value}". Use "approve" or "reject".`);
  }

  return value as "approve" | "reject";
}

export function registerDecisionGroup(app: AclipApp) {
  app
    .group("decision", {
      summary: "Manage high-impact project decisions.",
      description: withGuideHint(
        "Create, inspect, and record important project decisions for goals, scope changes, architecture, release policy, and other high-impact control points."
      )
    })
    .command("new", {
      summary: "Create an important decision record.",
      description: withGuideHint(
        "Record a new decision candidate for a goal, scope, change, architecture, release, policy, or other high-impact control point."
      ),
      arguments: [
        stringArgument("name", {
          required: true,
          description: "Decision name."
        }),
        stringArgument("description", {
          required: true,
          description: "Decision description."
        }),
        stringArgument("category", {
          required: true,
          description: "Decision category.",
          flag: "--category"
        }),
        stringArgument("proposedBy", {
          required: false,
          description: "Optional proposer label.",
          flag: "--proposed-by"
        }),
        stringArgument("context", {
          required: true,
          description: "Why this decision is on the table now.",
          flag: "--context"
        }),
        stringArgument("impactOfNoAction", {
          required: true,
          description: "What happens if the project does not act.",
          flag: "--impact-of-no-action"
        }),
        stringArgument("expectedOutcome", {
          required: true,
          description: "Expected outcome if the decision is approved.",
          flag: "--expected-outcome"
        }),
        stringArgument("boundary", {
          required: true,
          description: "Current scope and explicit non-goal boundary.",
          flag: "--boundary"
        })
      ],
      examples: [
        "opendaas decision new --name 'Introduce public alpha install path' --description 'Add the minimum public installation flow for OpenDaaS.' --category release --context 'Public alpha readiness still lacks a repeatable install path.' --impact-of-no-action 'External users cannot try OpenDaaS repeatably.' --expected-outcome 'A real external trial path becomes possible.' --boundary 'Only the public alpha installation path; no SaaS platform.'"
      ],
      handler: async (payload) => ({
        decision: await createDecisionRecord({
          name: String(payload.name),
          description: String(payload.description),
          category: assertCategory(String(payload.category)),
          proposedBy: payload.proposedBy ? String(payload.proposedBy) : "agent",
          context: String(payload.context),
          impactOfNoAction: String(payload.impactOfNoAction),
          expectedOutcome: String(payload.expectedOutcome),
          boundary: String(payload.boundary)
        })
      })
    })
    .command("list", {
      summary: "List important decisions.",
      description: withGuideHint("Show recorded decision entries and their current status."),
      examples: ["opendaas decision list"],
      handler: async () => ({
        decision: await listDecisionRecords()
      })
    })
    .command("show", {
      summary: "Show one decision.",
      description: withGuideHint("Inspect one recorded decision by id."),
      arguments: [
        stringArgument("id", {
          required: true,
          description: "Decision record id."
        })
      ],
      examples: ["opendaas decision show --id introduce-public-alpha-install-path"],
      handler: async ({ id }) => ({
        decision: await getDecisionRecord(String(id))
      })
    })
    .command("decide", {
      summary: "Approve or reject a decision record.",
      description: withGuideHint("Record a decision outcome as approve or reject and persist the decision summary."),
      arguments: [
        stringArgument("id", {
          required: true,
          description: "Decision record id."
        }),
        stringArgument("decision", {
          required: true,
          description: "Decision: approve or reject."
        }),
        stringArgument("summary", {
          required: true,
          description: "Decision rationale summary."
        }),
        stringArgument("revisitCondition", {
          required: false,
          description: "Optional revisit condition.",
          flag: "--revisit-condition"
        })
      ],
      examples: [
        "opendaas decision decide --id introduce-public-alpha-install-path --decision approve --summary 'The remaining risk is bounded and the action is now necessary for public alpha readiness.'"
      ],
      handler: async (payload) => ({
        decision: await decideDecisionRecord({
          id: String(payload.id),
          decision: assertDecision(String(payload.decision)),
          summary: String(payload.summary),
          revisitCondition: payload.revisitCondition ? String(payload.revisitCondition) : undefined
        })
      })
    });
}
