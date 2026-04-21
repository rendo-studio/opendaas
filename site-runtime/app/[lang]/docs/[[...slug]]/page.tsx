import { notFound, redirect } from "next/navigation";
import defaultMdxComponents, { createRelativeLink } from "fumadocs-ui/mdx";
import { DocsBody, DocsPage } from "fumadocs-ui/layouts/docs/page";
import type { ComponentProps, ComponentType } from "react";

import { ConsoleOverviewView } from "../../../../components/site/console-overview-view";
import { ConsoleTasksView } from "../../../../components/site/console-tasks-view";
import { DocumentCompareView, DocumentRevisionPreview } from "../../../../components/site/document-compare-view";
import { DocumentRevisionSidebar } from "../../../../components/site/document-revision-bar";
import { i18n, isSiteLocale } from "../../../../lib/i18n";
import { loadControlPlaneSnapshot, loadDocsRevisionState } from "../../../../lib/runtime-data";
import { getSource } from "../../../../lib/source";

function findPage(source: ReturnType<typeof getSource>, slug: string[] | undefined) {
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

    const candidatePath = candidate.url.replace(/^\/[^/]+\/docs\/?/, "");
    return candidatePath === joined;
  });
}

interface PageDataShape {
  body?: ComponentType<{ components?: Record<string, unknown> }>;
  toc?: ComponentProps<typeof DocsPage>["toc"];
  full?: boolean;
}

export async function generateStaticParams() {
  return i18n.languages.flatMap((lang) =>
    getSource(lang).generateParams().map(({ slug }) => ({
      lang,
      slug
    }))
  );
}

export default async function Page(props: {
  params: Promise<{ lang: string; slug?: string[] }>;
  searchParams: Promise<{ compare?: string; revision?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { lang } = params;
  if (!isSiteLocale(lang)) {
    notFound();
  }

  const key = (params.slug ?? []).join("/");
  const resolvedSlug = params.slug ?? [];
  const source = getSource(lang);

  const useOverviewConsole = key === "console";
  const useTasksConsole = key === "console/tasks";
  const useConsoleView = useOverviewConsole || useTasksConsole;
  const snapshot = await loadControlPlaneSnapshot();
  const page = findPage(source, resolvedSlug);
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
  const pathname = `/${lang}/docs/${key}`.replace(/\/+$/, "") || `/${lang}/docs`;

  if (key === "console/overview") {
    redirect(`/${lang}/docs/console`);
  }

  if (!useConsoleView && !page) {
    notFound();
  }

  const resolvedPage = useConsoleView ? null : (page ?? null);
  const pageData = resolvedPage?.data as PageDataShape | undefined;
  const MDX = pageData?.body ?? null;
  const components =
    resolvedPage === null
      ? defaultMdxComponents
      : {
          ...defaultMdxComponents,
          a: createRelativeLink(source, resolvedPage)
        };

  return (
    <DocsPage
      toc={useConsoleView ? undefined : pageData?.toc}
      full={useConsoleView ? true : pageData?.full ?? false}
      tableOfContent={
        useConsoleView || !revisionRecord
          ? undefined
          : {
              footer: (
                <DocumentRevisionSidebar
                  locale={lang}
                  pathname={pathname}
                  record={revisionRecord}
                  activeRevisionId={effectiveSelectedRevision?.id ?? null}
                  compareRevisionId={effectiveComparedRevision?.id ?? null}
                />
              )
            }
      }
    >
      <DocsBody>
        {useConsoleView ? (
          useOverviewConsole ? (
            <ConsoleOverviewView locale={lang} snapshot={snapshot} />
          ) : (
            <ConsoleTasksView locale={lang} snapshot={snapshot} />
          )
        ) : (
          <>
            {effectiveComparedRevision && latestRevision ? (
              <DocumentCompareView locale={lang} previous={effectiveComparedRevision} current={latestRevision} />
            ) : effectiveSelectedRevision ? (
              <DocumentRevisionPreview locale={lang} revision={effectiveSelectedRevision} components={components} />
            ) : (
              MDX ? <MDX components={components} /> : null
            )}
          </>
        )}
      </DocsBody>
    </DocsPage>
  );
}
