"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MOBILE_NAV, isActivePath, visibleNav } from "./nav-config";

function NavLinks({ signedIn, pathname }: { signedIn?: boolean; pathname: string | null }) {
  return (
    <ul className="flex">
      {visibleNav(MOBILE_NAV, signedIn).map(({ href, label, icon: Icon }) => {
        const active = pathname !== null && isActivePath(pathname, href);
        return (
          <li key={href} className="flex-1">
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-16 flex-col items-center justify-center gap-1 text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground",
                active && "text-primary",
              )}
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function ActiveNavLinks({ signedIn }: { signedIn?: boolean }) {
  return <NavLinks signedIn={signedIn} pathname={usePathname()} />;
}

/** Thumb-reachable primary navigation for phones. Hidden from md up, where the header nav takes over. */
export function MobileBottomNav({ signedIn }: { signedIn?: boolean }) {
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <Suspense fallback={<NavLinks signedIn={signedIn} pathname={null} />}>
        <ActiveNavLinks signedIn={signedIn} />
      </Suspense>
    </nav>
  );
}
