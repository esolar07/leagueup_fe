import { Suspense } from "react";
import type { Metadata } from "next";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { VerifyListing } from "@/features/games/components/verify-listing";

export const metadata: Metadata = { title: "Confirm your listing", robots: { index: false } };

export default function VerifyListingPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <PageHeader eyebrow="List your game" title="Confirm your listing" />
      <Suspense fallback={<Loader2 className="mx-auto size-8 animate-spin text-primary" aria-label="Loading" />}>
        <VerifyListing />
      </Suspense>
    </div>
  );
}
