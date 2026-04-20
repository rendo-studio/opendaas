import path from "node:path";
import { fileURLToPath } from "node:url";

import { readText } from "./storage.js";

function packageRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
}

export function getWorkflowGuideAssetPath(): string {
  return path.join(packageRoot(), "assets", "workflow-guide.md");
}

export async function loadWorkflowGuide() {
  const assetPath = getWorkflowGuideAssetPath();
  const markdown = await readText(assetPath);
  return {
    title: "OpenDaaS Workflow Guide",
    description: "Canonical Agent-first workflow guidance distributed with the CLI.",
    assetPath,
    markdown
  };
}
