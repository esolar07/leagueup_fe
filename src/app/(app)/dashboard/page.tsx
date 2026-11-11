import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatePanel } from "@/components/shared/state-panel";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "My Sports" };

/**
 * Player home. There is no backend endpoint yet for "my games / teams / leagues",
 * so this shows an honest empty state rather than invented data.
 */
export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  return (
    <>
      <PageHeader eyebrow="My Sports" title={`Welcome, ${user.firstName}`} />
      <StatePanel
        icon={CalendarDays}
        title="Nothing on your schedule yet"
        description="Games, teams and leagues you join will show up here."
      />
    </>
  );
}
