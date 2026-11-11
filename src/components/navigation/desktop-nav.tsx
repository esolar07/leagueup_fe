"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PRIMARY_NAV, isActivePath, visibleNav } from "./nav-config";

function NavLinks({ signedIn, pathname }: { signedIn?: boolean; pathname: string | null }) {
  return (
    <ul className="flex items-center gap-1">
      {visibleNav(PRIMARY_NAV, signedIn).map((item) => {
        const active = pathname !== null && isActivePath(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative inline-flex h-10 items-center px-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground",
                active && "text-foreground after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:bg-primary",
              )}
            >
              {item.label}
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

/** The pathname is request data on dynamic routes, so the active state streams in behind Suspense. */
export function DesktopNav({ signedIn }: { signedIn?: boolean }) {
  return (
    <nav aria-label="Main" className="hidden md:block">
      <Suspense fallback={<NavLinks signedIn={signedIn} pathname={null} />}>
        <ActiveNavLinks signedIn={signedIn} />
      </Suspense>
    </nav>
  );
}
