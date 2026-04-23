import { describe, expect, it } from "vitest";

import { renderCapturedOutput, stripGlobalJsonFlag } from "../src/cli/output-renderer.js";

describe("output renderer", () => {
  it("strips the global --json flag before passing argv to the CLI", () => {
    expect(stripGlobalJsonFlag(["status", "show", "--json"])).toEqual({
      argv: ["status", "show"],
      json: true
    });
  });

  it("renders the guide payload as markdown instead of a JSON envelope", () => {
    const rendered = renderCapturedOutput(
      JSON.stringify({
        guide: {
          markdown: "# APCC Workflow Guide\n\nRun `apcc site open` first.\n"
        }
      }),
      "stdout"
    );

    expect(rendered).toContain("# APCC Workflow Guide");
    expect(rendered).toContain("apcc site open");
    expect(rendered).not.toContain('"guide"');
  });

  it("renders status payloads as agent-friendly markdown summaries", () => {
    const rendered = renderCapturedOutput(
      JSON.stringify({
        status: {
          endGoal: {
            goalId: "end-goal-apcc",
            name: "APCC long-term end goal",
            summary: "Keep project context durable.",
            successCriteria: ["Stable anchors."],
            nonGoals: ["Hosted SaaS."]
          },
          phase: "Ship Agent-friendly CLI output",
          progress: {
            percent: 89,
            countedTasks: 28,
            doneTasks: 25
          },
          topLevelPlans: ["Ship Agent-friendly CLI output [in_progress]"],
          nextActions: ["Add a CLI entry renderer with explicit --json passthrough"],
          blockers: ["No blocker"]
        }
      }),
      "stdout"
    );

    expect(rendered).toContain("# Status");
    expect(rendered).toContain("Progress: `89%` (25/28)");
    expect(rendered).toContain("## Top-level Plans");
    expect(rendered).not.toContain('"status"');
  });

  it("renders error envelopes as markdown", () => {
    const rendered = renderCapturedOutput(
      JSON.stringify({
        error: {
          message: "Plan does not exist.",
          code: "not_found",
          hint: "Run `apcc plan show` first."
        }
      }),
      "stderr"
    );

    expect(rendered).toContain("# Error");
    expect(rendered).toContain("Plan does not exist.");
    expect(rendered).toContain("## Hint");
  });
});
