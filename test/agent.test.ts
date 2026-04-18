import fs from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import { inspectAgentArtifacts, syncAgentArtifacts } from "../src/core/agent.js";
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

describe("agent adaptation artifacts", () => {
  it("syncs the minimum workspace-facing agent guidance", async () => {
    const fixture = await createWorkspaceFixture();
    restorers.push(fixture.use());
    cleanups.push(fixture.cleanup);

    const result = await syncAgentArtifacts();
    const skill = await fs.readFile(result.skillPath, "utf8");
    const inspection = await inspectAgentArtifacts();

    expect(skill).toContain("Mandatory Round Start");
    expect(skill).toContain("opendaas diff check");
    expect(skill).toContain(".opendaas/goals/end.yaml");
    expect(inspection.skillExists).toBe(true);
    expect(inspection.docsExists).toBe(false);
  });
});
