import { loader } from "fumadocs-core/source";
import * as collections from "fumadocs-mdx:collections/server";
import { toFumadocsSource } from "fumadocs-mdx/runtime/server";

const docsCollection =
  "docs" in collections
    ? (collections as {
        docs?: {
          toFumadocsSource: () => ReturnType<typeof toFumadocsSource>;
        };
      }).docs
    : undefined;

export const source = loader({
  baseUrl: "/docs",
  source: docsCollection?.toFumadocsSource() ?? toFumadocsSource([], [])
});
