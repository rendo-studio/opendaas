import { notFound, redirect } from "next/navigation";
import defaultMdxComponents, { createRelativeLink } from "fumadocs-ui/mdx";
import { DocsBody, DocsPage } from "fumadocs-ui/layouts/docs/page";

import { ConsoleOverviewView } from "../../../components/site/console-overview-view";
import { ConsoleTasksView } from "../../../components/site/console-tasks-view";
import { DocumentCompareView, DocumentRevisionPreview } from "../../../components/site/document-compare-view";
import { DocumentRevisionBar } from "../../../components/site/document-revision-bar";
import { LiveRefresh } from "../../../components/site/live-refresh";
import { loadControlPlaneSnapshot, loadDocsRevisionState, loadRuntimeMetadata, loadRuntimeVersion } from "../../../lib/runtime-data";
import { source } from "../../../lib/source";

export function generateStaticParams() {
  return source.generateParams();
}

function findPage(slug: string[] | undefined) {
  const normalized = slug ?? [];
  const direct = source.getPage(normalized);

  if (direct) {
    return direct;
  }

  const joined = normalized.join("/");

  return source.getPages().find((candidate) => {
    if (candidate.slugs.join("/") === joined) {
      return true;
    }

    const candidatePath = candidate.url.replace(/^\/docs\/?/, "");
    return candidatePath === joined;
  });
}

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<{ compare?: string; revision?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const key = (params.slug ?? []).join("/");
  const resolvedSlug = params.slug ?? [];

  const runtime = await loadRuntimeMetadata();
  const version = await loadRuntimeVersion();
  const useOverviewConsole = key === "console";
  const useTasksConsole = key === "console/tasks";
  const useConsoleView = useOverviewConsole || useTasksConsole;
  const snapshot = await loadControlPlaneSnapshot();
  const page = findPage(resolvedSlug);
  const currentDocPath =
    useConsoleView ? null : snapshot.docs.pages.find((entry) => entry.slug.join("/") === key)?.path ?? null;
  const revisionState = currentDocPath ? await loadDocsRevisionState() : null;
  const revisionRecord = currentDocPath
    ? revisionState?.items.find((entry) => entry.path === currentDocPath) ?? null
    : null;
  const latestRevision = revisionRecord?.revisions.at(-1) ?? null;
  const requestedRevisionId = searchParams.revision ?? null;
  const compareRevisionId = searchParams.compare ?? null;
  const selectedRevision =
    revisionRecord && requestedRevisionId
      ? revisionRecord.revisions.find((entry) => entry.id === requestedRevisionId) ?? null
      : null;
  const comparedRevision =
    revisionRecord && compareRevisionId
      ? revisionRecord.revisions.find((entry) => entry.id === compareRevisionId) ?? null
      : null;
  const effectiveSelectedRevision =
    selectedRevision && selectedRevision.id !== latestRevision?.id ? selectedRevision : null;
  const effectiveComparedRevision =
    comparedRevision && comparedRevision.id !== latestRevision?.id ? comparedRevision : null;
  const pathname = `/docs/${key}`.replace(/\/+$/, "") || "/docs";

  if (key === "console/overview") {
    redirect("/docs/console");
  }

  if (!useConsoleView && !page) {
    notFound();
  }

  const MDX = page?.data.body ?? null;
  const components =
    page === null
      ? defaultMdxComponents
      : {
          ...defaultMdxComponents,
          a: createRelativeLink(source, page)
        };

  return (
    <DocsPage toc={useConsoleView ? undefined : page?.data.toc} full={useConsoleView ? true : page?.data.full ?? false}>
      {runtime.mode === "dev" ? (
        <LiveRefresh
          initialVersion={version.updatedAt}
          currentPath={currentDocPath}
          pages={snapshot.docs.pages.map((entry) => ({
            path: entry.path,
            title: entry.title,
            latestRevisionId: entry.latestRevisionId,
            revisionCount: entry.revisionCount
          }))}
        />
      ) : null}
      <DocsBody>
        {useConsoleView ? (
          useOverviewConsole ? (
            <ConsoleOverviewView snapshot={snapshot} />
          ) : (
            <ConsoleTasksView snapshot={snapshot} />
          )
        ) : (
          <>
            {revisionRecord ? (
              <DocumentRevisionBar
                pathname={pathname}
                record={revisionRecord}
                activeRevisionId={effectiveSelectedRevision?.id ?? null}
                compareRevisionId={effectiveComparedRevision?.id ?? null}
              />
            ) : null}
            {effectiveComparedRevision && latestRevision ? (
              <DocumentCompareView previous={effectiveComparedRevision} current={latestRevision} />
            ) : effectiveSelectedRevision ? (
              <DocumentRevisionPreview revision={effectiveSelectedRevision} />
            ) : (
              MDX ? <MDX components={components} /> : null
            )}
          </>
        )}
      </DocsBody>
    </DocsPage>
  );
}
