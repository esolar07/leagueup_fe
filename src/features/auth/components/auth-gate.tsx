import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/auth/session";
import { safeRedirectPath } from "../schemas";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Sends signed-in visitors on to where they were going; renders the form for everyone else. */
export async function SignedOutOnly({ searchParams, children }: { searchParams: SearchParams; children: (next?: string) => ReactNode }) {
  const { next } = await searchParams;
  const nextPath = typeof next === "string" ? safeRedirectPath(next) : undefined;
  if (await getCurrentUser()) redirect(nextPath ?? "/dashboard");
  return children(nextPath);
}

export function AuthFormSkeleton() {
  return (
    <div className="grid gap-6" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-16" />
      <Skeleton className="h-16" />
      <Skeleton className="h-12" />
    </div>
  );
}
