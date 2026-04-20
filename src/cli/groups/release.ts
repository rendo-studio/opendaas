import { AclipApp, stringArgument } from "@rendo-studio/aclip";

import {
  createReleaseRecord,
  getReleaseRecord,
  listReleaseRecords,
  updateReleaseRecord
} from "../../core/release.js";
import { withGuideHint } from "../guide-hint.js";

function splitCsv(value?: string): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function assertReleaseStatus(value: string): "draft" | "frozen" | "published" {
  if (!["draft", "frozen", "published"].includes(value)) {
    throw new Error(`Unsupported release status "${value}". Use draft, frozen, or published.`);
  }

  return value as "draft" | "frozen" | "published";
}

export function registerReleaseGroup(app: AclipApp) {
  app
    .group("release", {
      summary: "Manage structured release and changelog entries.",
      description: withGuideHint(
        "Persist structured release/changelog records in .opendaas and project them into docs/project/releases."
      )
    })
    .command("new", {
      summary: "Create a draft release entry.",
      description: withGuideHint(
        "Create a new draft release/changelog entry. This becomes the structured truth source for later docs projection."
      ),
      arguments: [
        stringArgument("version", {
          required: true,
          description: "Version or iteration label."
        }),
        stringArgument("title", {
          required: true,
          description: "Human-readable release title."
        }),
        stringArgument("summary", {
          required: true,
          description: "Release summary."
        }),
        stringArgument("changeRefs", {
          required: false,
          description: "Optional comma-separated change refs.",
          flag: "--change-refs"
        }),
        stringArgument("decisionRefs", {
          required: false,
          description: "Optional comma-separated decision refs.",
          flag: "--decision-refs"
        })
      ],
      examples: [
        "opendaas release new --version 0.1.0-alpha.1 --title 'Public alpha baseline' --summary 'First externally trialable OpenDaaS baseline.' --change-refs release-readiness-iteration-1 --decision-refs introduce-public-alpha-install-path"
      ],
      handler: async (payload) => ({
        release: await createReleaseRecord({
          version: String(payload.version),
          title: String(payload.title),
          summary: String(payload.summary),
          changeRefs: splitCsv(payload.changeRefs ? String(payload.changeRefs) : undefined),
          decisionRefs: splitCsv(payload.decisionRefs ? String(payload.decisionRefs) : undefined)
        })
      })
    })
    .command("list", {
      summary: "List release entries.",
      description: withGuideHint("Show structured release/changelog entries in descending creation order."),
      examples: ["opendaas release list"],
      handler: async () => ({
        release: await listReleaseRecords()
      })
    })
    .command("show", {
      summary: "Show one release entry.",
      description: withGuideHint("Inspect one structured release/changelog entry by id."),
      arguments: [
        stringArgument("id", {
          required: true,
          description: "Release record id."
        })
      ],
      examples: ["opendaas release show --id 0-1-0-alpha-1-public-alpha-baseline"],
      handler: async ({ id }) => ({
        release: await getReleaseRecord(String(id))
      })
    })
    .command("update", {
      summary: "Update a release entry.",
      description: withGuideHint(
        "Append structured highlights, change refs, decision refs, breaking changes, migration notes, or advance the release status."
      ),
      arguments: [
        stringArgument("id", {
          required: true,
          description: "Release record id."
        }),
        stringArgument("summary", {
          required: false,
          description: "Optional replacement summary."
        }),
        stringArgument("status", {
          required: false,
          description: "Optional new status: draft, frozen, or published."
        }),
        stringArgument("changeRefs", {
          required: false,
          description: "Optional comma-separated change refs to add.",
          flag: "--change-refs"
        }),
        stringArgument("decisionRefs", {
          required: false,
          description: "Optional comma-separated decision refs to add.",
          flag: "--decision-refs"
        }),
        stringArgument("highlights", {
          required: false,
          description: "Optional comma-separated highlights to add.",
          flag: "--highlights"
        }),
        stringArgument("breakingChanges", {
          required: false,
          description: "Optional comma-separated breaking changes to add.",
          flag: "--breaking-changes"
        }),
        stringArgument("migrationNotes", {
          required: false,
          description: "Optional comma-separated migration notes to add.",
          flag: "--migration-notes"
        }),
        stringArgument("validationSummary", {
          required: false,
          description: "Optional validation summary.",
          flag: "--validation-summary"
        })
      ],
      examples: [
        "opendaas release update --id 0-1-0-alpha-1-public-alpha-baseline --highlights 'Introduced init/adopt,Added minimum agent adaptation' --status frozen"
      ],
      handler: async (payload) => ({
        release: await updateReleaseRecord({
          id: String(payload.id),
          summary: payload.summary ? String(payload.summary) : undefined,
          status: payload.status ? assertReleaseStatus(String(payload.status)) : undefined,
          addChangeRefs: splitCsv(payload.changeRefs ? String(payload.changeRefs) : undefined),
          addDecisionRefs: splitCsv(payload.decisionRefs ? String(payload.decisionRefs) : undefined),
          addHighlights: splitCsv(payload.highlights ? String(payload.highlights) : undefined),
          addBreakingChanges: splitCsv(
            payload.breakingChanges ? String(payload.breakingChanges) : undefined
          ),
          addMigrationNotes: splitCsv(
            payload.migrationNotes ? String(payload.migrationNotes) : undefined
          ),
          validationSummary: payload.validationSummary ? String(payload.validationSummary) : undefined
        })
      })
    })
    .command("publish", {
      summary: "Publish a release entry.",
      description: withGuideHint("Mark a release entry as published."),
      arguments: [
        stringArgument("id", {
          required: true,
          description: "Release record id."
        })
      ],
      examples: ["opendaas release publish --id 0-1-0-alpha-1-public-alpha-baseline"],
      handler: async ({ id }) => ({
        release: await updateReleaseRecord({
          id: String(id),
          status: "published"
        })
      })
    });
}
