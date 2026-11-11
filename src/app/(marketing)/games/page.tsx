import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { TURKEY_BOWL } from "@/config/campaigns";
import { EmailCaptureForm } from "@/features/email-capture/email-capture-form";
import { CampaignBanner, NoGamesYet } from "@/features/games/components/discovery-sections";
import { GamesBrowser, GamesGridSkeleton } from "@/features/games/components/games-browser";

export const metadata: Metadata = { title: "Find Games" };

export default function FindGamesPage() {
  return (
    <div className="mx-auto grid w-full gap-8 px-4 py-8 sm:px-6 lg:w-[90%] lg:px-0 sm:py-12">
      <PageHeader
        eyebrow="Flag football"
        title="Find a game"
        description="Open games near you. No account or email needed to look."
      />
      <CampaignBanner campaign={TURKEY_BOWL} />
      <Suspense fallback={<GamesGridSkeleton />}>
        <GamesBrowser emptyState={<NoGamesYet title="No games listed yet" description="Be the first to put a game on the board." />} />
      </Suspense>
      <EmailCaptureForm />
    </div>
  );
}
