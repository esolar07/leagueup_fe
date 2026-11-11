import { Suspense } from "react";
import type { Metadata } from "next";
import { Skeleton } from "@/components/ui/skeleton";
import { GuestParticipation } from "@/features/games/components/guest-participation";

export const metadata: Metadata = { title: "Your join request", robots: { index: false } };

export default function GuestParticipationPage() {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="mb-4 text-xs font-semibold tracking-widest text-primary uppercase">Your join request</p>
      <Suspense fallback={<Skeleton className="h-64" />}>
        <GuestParticipation />
      </Suspense>
    </div>
  );
}
