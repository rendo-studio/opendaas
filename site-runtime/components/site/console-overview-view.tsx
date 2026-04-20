import Link from "next/link";

import type { ControlPlaneSnapshot } from "../../lib/runtime-data";
import { Progress } from "../ui/progress";
import { DataList, RailPanel, RailSection, StatusBadge, docsPathToHref } from "./docs-rail-shared";

export function ConsoleOverviewView({
  snapshot
}: {
  snapshot: ControlPlaneSnapshot;
}) {
  const projectName = snapshot.project?.name ?? "Project";
  const projectSummary =
    snapshot.project?.summary ?? "This workspace does not have a structured project overview yet.";
  const projectDocHref = snapshot.project?.docPath ? docsPathToHref(snapshot.project.docPath) : null;
  const endGoalName = snapshot.endGoal?.name ?? "No end goal";
  const endGoalSummary =
    snapshot.endGoal?.summary ?? "This workspace does not have a structured end goal yet.";
  const successCriteria = snapshot.endGoal?.successCriteria ?? [];
  const nonGoals = snapshot.endGoal?.nonGoals ?? [];
  const progress = snapshot.progress?.percent ?? 0;
  const phase = snapshot.status?.phase ?? "unknown";
  const changedPages = snapshot.docs.changedPages.slice(0, 6);

  return (
    <div className="space-y-6">
      <section className="console-surface rounded-lg px-6 py-6">
        <div className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[color:var(--muted-foreground)]">
          Project
        </div>
        <h1 className="mt-3 text-[2.25rem] font-semibold tracking-[-0.06em] text-[color:var(--foreground)]">
          {projectName}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-[color:var(--muted-foreground)]">{projectSummary}</p>
        {projectDocHref ? (
          <div className="mt-5">
            <Link
              href={projectDocHref}
              className="text-sm font-medium text-[#0072f5] underline underline-offset-4"
            >
              Read project overview
            </Link>
          </div>
        ) : null}
      </section>

      <div className="space-y-6">
        <RailPanel>
          <RailSection label="End goal">
            <div className="space-y-4">
              <div className="text-xl font-semibold tracking-[-0.03em] text-[color:var(--foreground)]">{endGoalName}</div>
              <p className="text-sm leading-7 text-[color:var(--muted-foreground)]">{endGoalSummary}</p>
              <div className="rounded-md bg-[color:var(--muted)] px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[color:var(--muted-foreground)]">
                      Progress
                    </div>
                    <div className="mt-1 text-2xl font-semibold tracking-[-0.05em] text-[color:var(--foreground)]">
                      {progress}%
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={phase} />
                    <Link
                      href="/docs/console/tasks"
                      className="rounded-md bg-[color:var(--foreground)] px-3 py-2 text-sm font-medium text-[color:var(--background)]"
                    >
                      View tasks
                    </Link>
                  </div>
                </div>
                <div className="mt-4">
                  <Progress value={progress} />
                </div>
              </div>
            </div>
          </RailSection>
        </RailPanel>

        <div className="grid gap-6 lg:grid-cols-2">
          <RailPanel>
            <RailSection label="Success criteria">
              <DataList items={successCriteria} emptyLabel="No success criteria are defined yet." />
            </RailSection>
          </RailPanel>

          <RailPanel>
            <RailSection label="Non-goals">
              <DataList items={nonGoals} emptyLabel="No non-goals are defined yet." />
            </RailSection>
          </RailPanel>

          <RailPanel>
            <RailSection label="Changed docs">
              {changedPages.length > 0 ? (
                <div className="space-y-2">
                  {changedPages.map((page) => (
                    <Link
                      key={page.path}
                      href={`/docs/${page.slug.join("/")}`}
                      className="console-item flex items-center justify-between gap-3 rounded-md px-3 py-3 text-sm leading-6 text-[color:var(--foreground)] transition hover:text-[#00a35c]"
                    >
                      <span className="min-w-0 truncate">{page.title}</span>
                      <span className="rounded-full bg-[#ecfff5] px-2 py-0.5 text-[11px] font-medium text-[#00663a]">
                        {page.revisionCount} rev
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-sm leading-6 text-[color:var(--muted-foreground)]">
                  No authored docs have historical revisions yet.
                </div>
              )}
            </RailSection>
          </RailPanel>

          <RailPanel>
            <RailSection label="Workflow guide">
              <div className="space-y-3 text-sm leading-6 text-[color:var(--muted-foreground)]">
                <p>Use the OpenDaaS Workflow Guide as the authority for first-hour orientation and round-start behavior.</p>
                <div className="rounded-md border border-[color:var(--color-border)] px-3 py-3 text-[color:var(--foreground)]">
                  <div className="font-medium">CLI</div>
                  <div className="mt-1 font-mono text-xs">opendaas guide</div>
                </div>
                <p>The guide is shipped with the CLI and mirrored into generated Agent artifacts. It is no longer an authored docs page.</p>
              </div>
            </RailSection>
          </RailPanel>
        </div>
      </div>
    </div>
  );
}
