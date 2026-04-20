import fs from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import { inspectAgentArtifacts, syncAgentArtifacts } from "../src/core/agent.js";
import { loadWorkflowGuide } from "../src/core/workflow-guide.js";
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
    const guide = await loadWorkflowGuide();
    const skill = await fs.readFile(result.skillPath, "utf8");
    const workflowSkill = await fs.readFile(result.workflowSkillPath, "utf8");
    const agents = await fs.readFile(result.agentsMdPath, "utf8");
    const inspection = await inspectAgentArtifacts();

    expect(skill).toBe(guide.markdown);
    expect(workflowSkill).toBe(guide.markdown);
    expect(agents).toContain("It is identical to `opendaas guide`");
    expect(agents).toContain("cold round or the workspace may be desynced");
    expect(agents).toContain("`opendaas site open`");
    expect(agents).toContain("continue without rerunning the full round-start sequence");
    expect(agents).toContain("refresh the workspace");
    expect(inspection.workflowSkillExists).toBe(true);
    expect(inspection.agentsMdExists).toBe(true);
    expect(inspection.skillExists).toBe(true);
    expect(inspection.docsExists).toBe(false);
  });
});
