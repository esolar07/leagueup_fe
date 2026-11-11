import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { WAITLIST_URL } from "@/config/links";
import { Skeleton } from "@/components/ui/skeleton";
import { DesktopNav } from "@/components/navigation/desktop-nav";
import { getCurrentUser } from "@/lib/auth/session";
import { Logo } from "./logo";
import { UserMenu } from "./user-menu";

/** Session-dependent part of the header. Streams in; the rest of the header is static. */
async function HeaderSession() {
  const user = await getCurrentUser();
  return (
    <>
      <DesktopNav signedIn={Boolean(user)} />
      <div className="ml-auto flex items-center gap-2">
        {user ? (
          <UserMenu user={user} />
        ) : (
          <>
            <Button nativeButton={false} render={<a href={WAITLIST_URL} />}>
              Join LeagueUp
            </Button>
          </>
        )}
      </div>
    </>
  );
}

function HeaderSessionFallback() {
  return (
    <>
      <DesktopNav />
      <Skeleton className="ml-auto size-10 rounded-full" />
    </>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 items-center gap-6 px-4 sm:px-6 lg:px-10">
        <Logo preload />
        <Suspense fallback={<HeaderSessionFallback />}>
          <HeaderSession />
        </Suspense>
      </div>
    </header>
  );
}
