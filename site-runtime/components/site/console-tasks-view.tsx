import type { SiteLocale } from "../../lib/i18n";
import type { ControlPlaneSnapshot, RuntimeTaskNode } from "../../lib/runtime-data";
import { getSiteCopy } from "../../lib/site-copy";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { DataList, RailPanel, RailSection, StatusBadge } from "./docs-rail-shared";

function TaskAccordionGroup({
  locale,
  items,
  planNamesById
}: {
  locale: SiteLocale;
  items: RuntimeTaskNode[];
  planNamesById: Map<string, string>;
}) {
  const copy = getSiteCopy(locale);
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
              <StatusBadge status={item.status} locale={locale} />
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-3">
            <p className="text-sm leading-6 text-[color:var(--muted-foreground)]">{item.summary ?? item.name}</p>
            <div className="flex flex-wrap gap-2">
              <Badge>{planNamesById.get(item.planRef) ?? item.planRef}</Badge>
              <Badge>{item.countedForProgress ? copy.console.progressUnit : copy.console.groupingNode}</Badge>
            </div>
            {item.children.length > 0 ? (
              <div className="border-l border-[color:var(--color-border)] pl-4">
                <TaskAccordionGroup locale={locale} items={item.children} planNamesById={planNamesById} />
              </div>
            ) : null}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export function ConsoleTasksView({
  locale,
  snapshot
}: {
  locale: SiteLocale;
  snapshot: ControlPlaneSnapshot;
}) {
  const copy = getSiteCopy(locale);
  const allPlans = snapshot.plans?.items ?? [];
  const totalPlans = allPlans.length;
  const donePlans = allPlans.filter((item) => item.status === "done").length;
  const actionableTasks = (snapshot.tasks?.items ?? []).filter((item) => item.countedForProgress);
  const totalTasks = actionableTasks.length;
  const doneTasks = actionableTasks.filter((item) => item.status === "done").length;
  const recentCompleted = snapshot.tasks?.recentCompleted ?? [];
  const blockers = snapshot.tasks?.blockers ?? [];
  const planNamesById = new Map((snapshot.plans?.items ?? []).map((item) => [item.id, item.name]));
  const planPercent = totalPlans > 0 ? Math.round((donePlans / totalPlans) * 100) : 0;
  const taskPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <RailPanel className="min-w-0">
        <RailSection label={copy.console.taskTree} className="max-h-[72rem] overflow-y-auto">
          {snapshot.tasks?.tree.length ? (
            <TaskAccordionGroup locale={locale} items={snapshot.tasks.tree} planNamesById={planNamesById} />
          ) : (
            <div className="text-sm leading-6 text-[color:var(--muted-foreground)]">{copy.console.noTaskData}</div>
          )}
        </RailSection>
      </RailPanel>

      <div className="space-y-6">
        <RailPanel>
          <RailSection label={copy.console.progress}>
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-[color:var(--foreground)]">{copy.console.plans}</div>
                  <div className="text-sm text-[color:var(--muted-foreground)]">{donePlans} / {totalPlans}</div>
                </div>
                <Progress value={planPercent} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-[color:var(--foreground)]">{copy.console.tasks}</div>
                  <div className="text-sm text-[color:var(--muted-foreground)]">{doneTasks} / {totalTasks}</div>
                </div>
                <Progress value={taskPercent} />
              </div>

              <div className="pt-1">
                <StatusBadge status={snapshot.status?.phase ?? copy.console.unknown} locale={locale} />
              </div>
            </div>
          </RailSection>
        </RailPanel>

        <RailPanel>
          <RailSection label={copy.console.recentCompletion}>
            <DataList items={recentCompleted} emptyLabel={copy.console.noRecentCompletion} />
          </RailSection>
        </RailPanel>

        <RailPanel>
          <RailSection label={copy.console.blockers}>
            <DataList
              items={blockers.filter((item) => item !== copy.console.noExplicitBlocker)}
              emptyLabel={copy.console.noActiveBlockers}
            />
          </RailSection>
        </RailPanel>
      </div>
    </div>
  );
}
