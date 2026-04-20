import type { ReactNode } from "react";
import { RootProvider } from "fumadocs-ui/provider/next";
import { Toaster } from "sonner";

import "./global.css";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <RootProvider>
          {children}
          <Toaster position="top-right" richColors expand={false} />
        </RootProvider>
      </body>
    </html>
  );
}
