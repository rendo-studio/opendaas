import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { initWorkspace } from "../src/core/bootstrap.js";

const cleanups: string[] = [];

afterEach(async () => {
  while (cleanups.length > 0) {
    const target = cleanups.pop();
    if (target) {
      await fs.rm(target, { recursive: true, force: true });
    }
  }
});

describe("init", () => {
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
    expect(first.createdFiles).toContain("docs/shared/overview.md");
    expect(first.createdFiles).toContain("docs/shared/goal.md");
    expect(first.createdFiles).toContain("docs/public/.gitkeep");
    expect(first.createdFiles).toContain("docs/internal/.gitkeep");
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
    const progressFileExists = await fs
      .stat(path.join(root, ".opendaas", "state", "progress.yaml"))
      .then(() => true)
      .catch(() => false);
    expect(progressFileExists).toBe(false);
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

  it("initializes an existing project without destroying existing docs content", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "opendaas-init-existing-"));
    cleanups.push(root);

    await fs.writeFile(path.join(root, "README.md"), "# Existing project\n", "utf8");
    await fs.mkdir(path.join(root, "docs"), { recursive: true });
    await fs.writeFile(
      path.join(root, "docs", "index.md"),
      `# Existing Docs\n\nThis line must survive init.\n`,
      "utf8"
    );

    const result = await initWorkspace({
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
    const sharedOverviewExists = await fs
      .stat(path.join(root, "docs", "shared", "overview.md"))
      .then(() => true)
      .catch(() => false);
    const sharedGoalExists = await fs
      .stat(path.join(root, "docs", "shared", "goal.md"))
      .then(() => true)
      .catch(() => false);
    expect(indexContent).toBe("# Existing Docs\n\nThis line must survive init.\n");
    expect(sharedOverviewExists).toBe(true);
    expect(sharedGoalExists).toBe(true);
  });

  it("can initialize the current directory when it is already an existing project", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "opendaas-init-existing-cwd-"));
    cleanups.push(root);
    await fs.writeFile(path.join(root, "README.md"), "# Existing project\n", "utf8");
    const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(root);

    try {
      const result = await initWorkspace({});
      const overview = await fs.readFile(path.join(root, ".opendaas", "project", "overview.yaml"), "utf8");
      const endGoal = await fs.readFile(path.join(root, ".opendaas", "goals", "end.yaml"), "utf8");

      expect(result.root).toBe(root);
      expect(overview).toContain("has not defined a project overview yet");
      expect(endGoal).toContain("Unspecified end goal");
    } finally {
      cwdSpy.mockRestore();
    }
  });

  it("never rewrites existing docs when the target path already exists", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "opendaas-init-existing-docs-"));
    cleanups.push(root);

    await fs.mkdir(path.join(root, "docs", "shared"), { recursive: true });
    await fs.writeFile(
      path.join(root, "docs", "shared", "overview.md"),
      "# Existing shared overview\n\nDo not touch this file.\n",
      "utf8"
    );

    await initWorkspace({
      targetPath: root,
      projectName: "Existing Project"
    });

    const sharedOverview = await fs.readFile(path.join(root, "docs", "shared", "overview.md"), "utf8");
    expect(sharedOverview).toBe("# Existing shared overview\n\nDo not touch this file.\n");
  });
});
