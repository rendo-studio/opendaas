import fs from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  createReleaseRecord,
  getReleaseRecord,
  listReleaseRecords,
  updateReleaseRecord
} from "../src/core/release.js";
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

describe("release control plane", () => {
  it("creates, updates, and publishes structured release records", async () => {
    const fixture = await createWorkspaceFixture();
    restorers.push(fixture.use());
    cleanups.push(fixture.cleanup);

    const draft = await createReleaseRecord({
      version: "0.1.0-alpha.1",
      title: "Public alpha baseline",
      summary: "First externally trialable OpenDaaS baseline.",
      changeRefs: ["release-readiness-iteration-1"],
      decisionRefs: ["introduce-public-alpha-install-path"]
    });

    const frozen = await updateReleaseRecord({
      id: draft.id,
      status: "frozen",
      addHighlights: ["Introduced init/adopt", "Added workflow guidance artifacts"],
      addMigrationNotes: ["Existing workspaces should run opendaas validate --repair once."],
      validationSummary: "Core release record and docs projection flow validated."
    });

    const published = await updateReleaseRecord({
      id: draft.id,
      status: "published"
    });

    const releaseDoc = await fs.readFile(
      path.join(fixture.root, "docs", "project", "releases", `${draft.id}.md`),
      "utf8"
    );
    const indexDoc = await fs.readFile(
      path.join(fixture.root, "docs", "project", "releases", "index.md"),
      "utf8"
    );
    const listed = await listReleaseRecords();
    const loaded = await getReleaseRecord(draft.id);

    expect(frozen.status).toBe("frozen");
    expect(published.status).toBe("published");
    expect(loaded.publishedAt).not.toBeNull();
    expect(listed).toHaveLength(1);
    expect(releaseDoc).toContain("## Highlights");
    expect(releaseDoc).toContain("Introduced init/adopt");
    expect(indexDoc).toContain("0.1.0-alpha.1 Public alpha baseline");
  });
});
