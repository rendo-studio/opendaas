import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { adoptWorkspace, initWorkspace } from "../src/core/bootstrap.js";

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
  it("initializes a new workspace and generates the expected control-plane files", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "opendaas-init-"));
    cleanups.push(root);

    const first = await initWorkspace({
      targetPath: root,
      projectName: "Example Project",
      endGoalName: "Launch Example",
      endGoalSummary: "Ship the first releasable slice of Example."
    });

    expect(first.createdFiles).toContain(".opendaas/project/overview.yaml");
    expect(first.createdFiles).toContain(".opendaas/goals/end.yaml");
    expect(first.createdFiles).toContain("docs/project/overview.md");
    expect(first.createdFiles).toContain("docs/index.md");
    expect(first.createdFiles).toContain("AGENTS.md");
    expect(first.createdFiles).toContain(".agents/skills/opendaas-workflow/SKILL.md");

    const second = await initWorkspace({
      targetPath: root,
      projectName: "Example Project",
      endGoalName: "Launch Example",
      endGoalSummary: "Ship the first releasable slice of Example."
    });

    expect(second.skippedFiles.length).toBeGreaterThan(0);
    const workspaceEntries = await fs.readdir(path.join(root, ".opendaas"));
    expect(workspaceEntries).not.toContain(String.fromCharCode(100, 105, 102, 102));
  });

  it("can initialize the current directory with provisional overview and end-goal anchors", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "opendaas-init-cwd-"));
    cleanups.push(root);
    const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(root);

    try {
      const result = await initWorkspace({});
      const overview = await fs.readFile(path.join(root, ".opendaas", "project", "overview.yaml"), "utf8");
      const endGoal = await fs.readFile(path.join(root, ".opendaas", "goals", "end.yaml"), "utf8");

      expect(result.root).toBe(root);
      expect(overview).toContain("has not defined a project overview yet");
      expect(endGoal).toContain("Unspecified end goal");
      expect(endGoal).toContain("has not defined a long-lived end goal yet");
    } finally {
      cwdSpy.mockRestore();
    }
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
      endGoalName: "Ship Existing MVP",
      endGoalSummary: "Stabilize and ship the first production slice of the existing project."
    });

    const indexContent = await fs.readFile(path.join(root, "docs", "index.md"), "utf8");
    const endGoalFileExists = await fs
      .stat(path.join(root, ".opendaas", "goals", "end.yaml"))
      .then(() => true)
      .catch(() => false);
    const projectOverviewExists = await fs
      .stat(path.join(root, ".opendaas", "project", "overview.yaml"))
      .then(() => true)
      .catch(() => false);
    const agentsExists = await fs
      .stat(path.join(root, "AGENTS.md"))
      .then(() => true)
      .catch(() => false);
    const workflowSkillExists = await fs
      .stat(path.join(root, ".agents", "skills", "opendaas-workflow", "SKILL.md"))
      .then(() => true)
      .catch(() => false);
    expect(result.createdFiles).toContain(".opendaas/goals/end.yaml");
    expect(endGoalFileExists).toBe(true);
    expect(projectOverviewExists).toBe(true);
    expect(agentsExists).toBe(true);
    expect(workflowSkillExists).toBe(true);
    expect(indexContent).toContain("This line must survive adopt.");
    expect(indexContent).toContain("## 默认入口");
    expect(indexContent).toContain("name:");
    expect(indexContent).toContain("description:");
  });

  it("can adopt the current directory without requiring a final goal up front", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "opendaas-adopt-cwd-"));
    cleanups.push(root);
    await fs.writeFile(path.join(root, "README.md"), "# Existing project\n", "utf8");
    const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(root);

    try {
      const result = await adoptWorkspace({});
      const overview = await fs.readFile(path.join(root, ".opendaas", "project", "overview.yaml"), "utf8");
      const endGoal = await fs.readFile(path.join(root, ".opendaas", "goals", "end.yaml"), "utf8");

      expect(result.root).toBe(root);
      expect(overview).toContain("has not defined a project overview yet");
      expect(endGoal).toContain("Unspecified end goal");
    } finally {
      cwdSpy.mockRestore();
    }
  });
});
