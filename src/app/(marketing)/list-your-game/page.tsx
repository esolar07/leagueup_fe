import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { ListingFlow } from "@/features/games/components/listing-form";

export const metadata: Metadata = { title: "List your game" };

export default function ListYourGamePage() {
  return (
    <div className="mx-auto w-full px-4 py-8 sm:px-6 lg:w-[90%] lg:px-0 sm:py-12">
      <PageHeader
        eyebrow="Organizers"
        title="List your game"
        description="Takes about two minutes. No account needed: we’ll email you a link to confirm, and your listing goes public once you do."
      />
      <Suspense fallback={<Skeleton className="h-[480px]" />}>
        <ListingFlow />
      </Suspense>
    </div>
  );
}
