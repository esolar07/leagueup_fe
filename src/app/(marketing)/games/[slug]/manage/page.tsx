import { Suspense } from "react";
import type { Metadata } from "next";
import { Skeleton } from "@/components/ui/skeleton";
import { ManageListing } from "@/features/games/components/manage/manage-listing";

export const metadata: Metadata = { title: "Manage your game", robots: { index: false } };

export default function ManageGamePage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="mb-4 text-xs font-semibold tracking-widest text-primary uppercase">Manage your game</p>
      <Suspense fallback={<Skeleton className="h-64" />}>
        <ManageListing />
      </Suspense>
    </div>
  );
}
