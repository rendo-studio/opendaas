import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { adoptWorkspace, initWorkspace } from "../src/core/bootstrap.js";
import { diffShow } from "../src/core/diff.js";
import { withWorkspaceRoot } from "../src/core/workspace.js";

const cleanups: string[] = [];

afterEach(async () => {
  while (cleanups.length > 0) {
    const target = cleanups.pop();
    if (target) {
      await fs.rm(target, { recursive: true, force: true });
    }
  }
});

describe("init and adopt", () => {
  it("initializes a new workspace and acknowledges the generated docs baseline", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "opendaas-init-"));
    cleanups.push(root);

    const first = await initWorkspace({
      targetPath: root,
      projectName: "Example Project",
      goalName: "Launch Example",
      goalSummary: "Ship the first releasable slice of Example."
    });

    expect(first.createdFiles).toContain(".opendaas/goals/current.yaml");
    expect(first.createdFiles).toContain("docs/index.md");

    const second = await initWorkspace({
      targetPath: root,
      projectName: "Example Project",
      goalName: "Launch Example",
      goalSummary: "Ship the first releasable slice of Example."
    });

    expect(second.skippedFiles.length).toBeGreaterThan(0);

    const diff = await withWorkspaceRoot(root, async () => diffShow());
    const agentSkillExists = await fs
      .stat(path.join(root, ".opendaas", "agent", "SKILL.md"))
      .then(() => true)
      .catch(() => false);
    expect(diff.files).toHaveLength(0);
    expect(agentSkillExists).toBe(true);
  });

  it("adopts an existing project without destroying existing docs content", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "opendaas-adopt-"));
    cleanups.push(root);

    await fs.writeFile(path.join(root, "README.md"), "# Existing project\n", "utf8");
    await fs.mkdir(path.join(root, "docs"), { recursive: true });
    await fs.writeFile(
      path.join(root, "docs", "index.md"),
      `# Existing Docs\n\nThis line must survive adopt.\n`,
      "utf8"
    );

    const result = await adoptWorkspace({
      targetPath: root,
      goalName: "Ship Existing MVP",
      goalSummary: "Stabilize and ship the first production slice of the existing project."
    });

    const indexContent = await fs.readFile(path.join(root, "docs", "index.md"), "utf8");
    const goalFileExists = await fs
      .stat(path.join(root, ".opendaas", "goals", "current.yaml"))
      .then(() => true)
      .catch(() => false);
    const agentDocExists = await fs
      .stat(path.join(root, "docs", "engineering", "agent.md"))
      .then(() => true)
      .catch(() => false);

    expect(result.createdFiles).toContain(".opendaas/goals/current.yaml");
    expect(goalFileExists).toBe(true);
    expect(agentDocExists).toBe(true);
    expect(indexContent).toContain("This line must survive adopt.");
    expect(indexContent).toContain("## 最终目标");
    expect(indexContent).toContain("name:");
    expect(indexContent).toContain("description:");
  });
});
