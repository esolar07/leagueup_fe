import { Suspense, type ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth/session";
import { MobileBottomNav } from "@/components/navigation/mobile-bottom-nav";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

async function SessionBottomNav() {
  return <MobileBottomNav signedIn={Boolean(await getCurrentUser())} />;
}

/** Header, footer and mobile bottom nav shared by public and signed-in pages. */
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <SiteFooter />
      <Suspense fallback={<MobileBottomNav />}>
        <SessionBottomNav />
      </Suspense>
    </>
  );
}
