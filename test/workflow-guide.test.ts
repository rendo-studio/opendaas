import { describe, expect, it } from "vitest";

import { getWorkflowGuideAssetPath, loadWorkflowGuide } from "../src/core/workflow-guide.js";

describe("workflow guide", () => {
  it("loads the authoritative APCC workflow guide from the bundled CLI asset path", async () => {
    const guide = await loadWorkflowGuide();

    expect(getWorkflowGuideAssetPath()).toContain("assets");
    expect(guide.title).toBe("APCC Workflow Guide");
    expect(guide.markdown).toContain("# APCC Workflow Guide");
    expect(guide.markdown).toContain("apcc guide");
    expect(guide.markdown).toContain("## Operating States");
    expect(guide.markdown).toContain("### Cold Round");
    expect(guide.markdown).toContain("### Warm Continuation");
    expect(guide.markdown).toContain("### Desync Suspicion");
    expect(guide.markdown).toContain("## Goal-Driven Development");
    expect(guide.markdown).toContain("do not silently substitute a one-line feature request for a project definition");
    expect(guide.markdown).toContain("## Cold Round Start");
    expect(guide.markdown).toContain("apcc site open");
    expect(guide.markdown).toContain("do not rerun `site open` or `status show` by default");
    expect(guide.markdown).toContain("## Inspect Only If Needed");
    expect(guide.markdown).toContain("## Refresh The Workspace First");
    expect(guide.markdown).toContain("apcc init");
    expect(guide.markdown).toContain('apcc project set --name "Example Project"');
    expect(guide.markdown).not.toContain("apcc diff");
  });
});
