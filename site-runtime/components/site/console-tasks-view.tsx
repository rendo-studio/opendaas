import Link from "next/link";

import type { ControlPlaneSnapshot, RuntimeTaskNode } from "../../lib/runtime-data";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { DataList, RailPanel, RailSection, StatusBadge } from "./docs-rail-shared";

function TaskAccordionGroup({
  items,
  planNamesById
}: {
  items: RuntimeTaskNode[];
  planNamesById: Map<string, string>;
}) {
  return (
    <Accordion type="multiple" className="-my-2 w-full">
      {items.map((item) => (
        <AccordionItem key={item.id} value={item.id}>
          <AccordionTrigger className="py-3">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-[color:var(--foreground)]">{item.name}</div>
                <div className="mt-1 line-clamp-2 text-xs leading-5 text-[color:var(--muted-foreground)]">
                  {item.summary ?? item.name}
                </div>
              </div>
              <StatusBadge status={item.status} />
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-3">
            <p className="text-sm leading-6 text-[color:var(--muted-foreground)]">{item.summary ?? item.name}</p>
            <div className="flex flex-wrap gap-2">
              <Badge>{planNamesById.get(item.planRef) ?? item.planRef}</Badge>
              <Badge>{item.countedForProgress ? "Progress unit" : "Grouping node"}</Badge>
            </div>
            {item.children.length > 0 ? (
              <div className="border-l border-[color:var(--color-border)] pl-4">
                <TaskAccordionGroup items={item.children} planNamesById={planNamesById} />
              </div>
            ) : null}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export function ConsoleTasksView({
  snapshot
}: {
  snapshot: ControlPlaneSnapshot;
}) {
  const allPlans = snapshot.plans?.items ?? [];
  const totalPlans = allPlans.length;
  const donePlans = allPlans.filter((item) => item.status === "done").length;
  const actionableTasks = (snapshot.tasks?.items ?? []).filter((item) => item.countedForProgress);
  const totalTasks = actionableTasks.length;
  const doneTasks = actionableTasks.filter((item) => item.status === "done").length;
  const recentCompleted = snapshot.tasks?.recentCompleted ?? [];
  const blockers = snapshot.tasks?.blockers ?? [];
  const changePages = snapshot.docs.changePages;
  const planNamesById = new Map((snapshot.plans?.items ?? []).map((item) => [item.id, item.name]));
  const planPercent = totalPlans > 0 ? Math.round((donePlans / totalPlans) * 100) : 0;
  const taskPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <RailPanel className="min-w-0">
        <RailSection label="Task tree" className="max-h-[72rem] overflow-y-auto">
          {snapshot.tasks?.tree.length ? (
            <TaskAccordionGroup items={snapshot.tasks.tree} planNamesById={planNamesById} />
          ) : (
            <div className="text-sm leading-6 text-[color:var(--muted-foreground)]">No task data is currently available.</div>
          )}
        </RailSection>
      </RailPanel>

      <div className="space-y-6">
        <RailPanel>
          <RailSection label="Progress">
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-[color:var(--foreground)]">Plans</div>
                  <div className="text-sm text-[color:var(--muted-foreground)]">{donePlans} / {totalPlans}</div>
                </div>
                <Progress value={planPercent} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-[color:var(--foreground)]">Tasks</div>
                  <div className="text-sm text-[color:var(--muted-foreground)]">{doneTasks} / {totalTasks}</div>
                </div>
                <Progress value={taskPercent} />
              </div>

              <div className="pt-1">
                <StatusBadge status={snapshot.status?.phase ?? "unknown"} />
              </div>
            </div>
          </RailSection>
        </RailPanel>

        <RailPanel>
          <RailSection label="Recent completion">
            <DataList items={recentCompleted} emptyLabel="No completed work has been recorded yet." />
          </RailSection>
        </RailPanel>

        <RailPanel>
          <RailSection label="Blockers">
            <DataList items={blockers.filter((item) => item !== "暂无明确 blocker")} emptyLabel="No active blockers." />
          </RailSection>
        </RailPanel>

        {changePages.length > 0 ? (
          <RailPanel>
            <RailSection label="Linked changes">
              <div className="space-y-2">
                {changePages.map((page) => (
                  <Link
                    key={page.path}
                    href={`/docs/${page.slug.join("/")}`}
                    className="console-item block rounded-md px-3 py-2 text-sm leading-6 text-[color:var(--foreground)] transition hover:text-[#0072f5]"
                  >
                    {page.title}
                  </Link>
                ))}
              </div>
            </RailSection>
          </RailPanel>
        ) : null}
      </div>
    </div>
  );
}
