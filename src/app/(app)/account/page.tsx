import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/features/auth/actions";
import { initialsOf } from "@/features/auth/utils";
import { PageHeader } from "@/components/shared/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Profile" };

const memberSince = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

/**
 * Read-only for now: the backend exposes only GET /auth/me. Editable profile
 * fields (photo, username, location, bio, sports, positions) need a profile API.
 */
export default async function AccountPage() {
  const user = await requireUser("/account");
  return (
    <>
      <PageHeader eyebrow="Profile" title="Your account" />
      <section className="flex flex-col gap-6 rounded-lg border border-border bg-card p-6 sm:flex-row sm:items-center">
        <Avatar className="size-20">
          <AvatarFallback className="bg-secondary text-2xl font-bold text-foreground">{initialsOf(user)}</AvatarFallback>
        </Avatar>
        <dl className="grid flex-1 gap-1">
          <dt className="sr-only">Name</dt>
          <dd className="font-display text-3xl">
            {user.firstName} {user.lastName}
          </dd>
          <dt className="sr-only">Email</dt>
          <dd className="text-muted-foreground">{user.email}</dd>
          <dt className="sr-only">Member since</dt>
          <dd className="text-sm text-muted-foreground">Member since {memberSince.format(new Date(user.createdAt))}</dd>
        </dl>
        <form action={logoutAction}>
          <Button type="submit" variant="outline" className="w-full sm:w-auto">
            <LogOut aria-hidden /> Sign out
          </Button>
        </form>
      </section>
    </>
  );
}
