import fs from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  createDecisionRecord,
  decideDecisionRecord,
  listDecisionRecords,
  migrateDecisionState
} from "../src/core/decision.js";
import { createWorkspaceFixture } from "./helpers/workspace.js";

const restorers: Array<() => void> = [];
const cleanups: Array<() => Promise<void>> = [];

afterEach(async () => {
  while (restorers.length > 0) {
    restorers.pop()?.();
  }

  while (cleanups.length > 0) {
    await cleanups.pop()?.();
  }
});

describe("decision control plane", () => {
  it("creates and decides important records, then syncs decision docs", async () => {
    const fixture = await createWorkspaceFixture();
    restorers.push(fixture.use());
    cleanups.push(fixture.cleanup);

    const record = await createDecisionRecord({
      name: "Introduce public alpha install path",
      description: "Add the minimum installation path required for external users.",
      category: "release",
      proposedBy: "agent",
      context: "Public alpha readiness still lacks a repeatable install path.",
      impactOfNoAction: "External users cannot try OpenDaaS repeatably.",
      expectedOutcome: "A real external trial path becomes possible.",
      boundary: "Only the alpha installation path; no hosted control plane."
    });

    const decided = await decideDecisionRecord({
      id: record.id,
      decision: "approve",
      summary: "This is now required for public alpha readiness."
    });

    const all = await listDecisionRecords();
    const decisionDoc = await fs.readFile(
      path.join(fixture.root, "docs", "project", "decisions", `${record.id}.md`),
      "utf8"
    );
    const indexDoc = await fs.readFile(
      path.join(fixture.root, "docs", "project", "decisions", "index.md"),
      "utf8"
    );

    expect(decided.status).toBe("approved");
    expect(all).toHaveLength(1);
    expect(decisionDoc).toContain("## Decision");
    expect(decisionDoc).toContain("**批准**");
    expect(indexDoc).toContain(record.id);
    expect(indexDoc).toContain("批准");
  });

  it("migrates a legacy decision record file into the generic control plane", async () => {
    const fixture = await createWorkspaceFixture();
    restorers.push(fixture.use());
    cleanups.push(fixture.cleanup);

    await fs.mkdir(path.join(fixture.root, ".opendaas", "legacy"), { recursive: true });
    await fs.writeFile(
      path.join(fixture.root, ".opendaas", "legacy", "records.yaml"),
      [
        "items:",
        "  - id: introduce-public-alpha-install-path",
        "    name: Introduce public alpha install path",
        "    description: Add the minimum installation path required for external users.",
        "    proposedBy: agent",
        "    notActingCost: External users cannot try OpenDaaS repeatably.",
        "    expectedValue: A real external trial path becomes possible.",
        "    boundary: Only the alpha installation path; no hosted control plane.",
        "    status: started",
        "    decisionSummary: This is now required for public alpha readiness.",
        "    revisitCondition: Revisit if the install flow changes materially.",
        ""
      ].join("\n"),
      "utf8"
    );
    await fs.rm(path.join(fixture.root, ".opendaas", "decisions", "records.yaml"), { force: true });

    const migrated = await migrateDecisionState();
    const all = await listDecisionRecords();
    const legacyFileExists = await fs
      .stat(path.join(fixture.root, ".opendaas", "legacy", "records.yaml"))
      .then(() => true)
      .catch(() => false);

    expect(migrated.migrated).toBe(true);
    expect(all).toHaveLength(1);
    expect(all[0]?.status).toBe("approved");
    expect(legacyFileExists).toBe(false);
  });
});
