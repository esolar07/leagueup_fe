import type { ReactNode } from "react";
import { SiteShell } from "@/components/layout/site-shell";

/** Signed-in area. proxy.ts gates it optimistically; each page calls requireUser to verify. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SiteShell>
      <div className="mx-auto w-full px-4 py-8 sm:px-6 lg:w-[90%] lg:px-0 sm:py-12">{children}</div>
    </SiteShell>
  );
}
