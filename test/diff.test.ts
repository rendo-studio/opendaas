import fs from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { diffAck, diffCheck } from "../src/core/diff.js";
import { saveEndGoal } from "../src/core/end-goal.js";
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

describe("diff provenance", () => {
  it("classifies CLI-authored shared-doc updates as agent diffs", async () => {
    const fixture = await createWorkspaceFixture();
    restorers.push(fixture.use());
    cleanups.push(fixture.cleanup);

    await diffAck();
    await saveEndGoal({
      name: "Production hardening iteration",
      summary: "Advance the OpenDaaS control plane to a stronger production baseline."
    });

    const diff = await diffCheck();

    expect(diff.files).toEqual([]);
  });

  it("classifies untracked shared-doc edits as human diffs", async () => {
    const fixture = await createWorkspaceFixture();
    restorers.push(fixture.use());
    cleanups.push(fixture.cleanup);

    await diffAck();
    await fs.writeFile(
      path.join(fixture.root, "docs", "project", "status.md"),
      `---\nname: 当前状态\ndescription: Workspace status page.\n---\n\n# 当前状态\n\n## 状态摘要\n\nHuman changed this file.\n`,
      "utf8"
    );

    const diff = await diffCheck();
    const statusEntry = diff.files.find((file) => file.path === "project/status.md");

    expect(statusEntry?.source).toBe("human");
    expect(statusEntry?.changeType).toBe("modified");
  });
});
