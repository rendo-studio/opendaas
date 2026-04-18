import { AclipApp } from "@rendo-studio/aclip";

import { registerDecisionGroup } from "./groups/decision.js";
import { registerGoalGroup } from "./groups/goal.js";
import { registerDiffGroup } from "./groups/diff.js";
import { registerPlanGroup } from "./groups/plan.js";
import { registerStatusGroup } from "./groups/status.js";
import { registerTaskGroup } from "./groups/task.js";
import { registerSiteGroup } from "./groups/site.js";
import { registerAgentGroup } from "./groups/agent.js";
import { registerReleaseGroup } from "./groups/release.js";
import { registerValidateCommand } from "./commands/validate.js";
import { registerInitCommand } from "./commands/init.js";
import { registerAdoptCommand } from "./commands/adopt.js";

export function createApp() {
  const app = new AclipApp({
    name: "opendaas",
    version: "0.1.0",
    summary: "OpenDaaS CLI.",
    description:
      "A CLI-first documentation control plane for Human-Agent collaboration."
  });

  registerInitCommand(app);
  registerAdoptCommand(app);
  registerDecisionGroup(app);
  registerGoalGroup(app);
  registerDiffGroup(app);
  registerPlanGroup(app);
  registerStatusGroup(app);
  registerTaskGroup(app);
  registerReleaseGroup(app);
  registerSiteGroup(app);
  registerAgentGroup(app);
  registerValidateCommand(app);

  return app;
}

export const app = createApp();
