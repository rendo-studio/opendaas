import { loader } from "fumadocs-core/source";
import * as collections from "fumadocs-mdx:collections/server";
import { toFumadocsSource } from "fumadocs-mdx/runtime/server";

import { i18n, type SiteLocale } from "./i18n";

const docsCollection =
  "docs" in collections
    ? (collections as {
        docs?: {
          toFumadocsSource: () => ReturnType<typeof toFumadocsSource>;
        };
      }).docs
    : undefined;

function resolveCollectionSource() {
  return docsCollection?.toFumadocsSource() ?? toFumadocsSource([], []);
}

export function getSource(locale: SiteLocale) {
  return loader({
    baseUrl: `/${locale}/docs`,
    source: resolveCollectionSource()
  });
}

export const source = getSource(i18n.defaultLanguage);
