import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PhotoHero } from "@/components/shared/photo-hero";
import { Button } from "@/components/ui/button";
import { TURKEY_BOWL } from "@/config/campaigns";
import { CampaignFilterBar, CampaignFilterBarSkeleton } from "@/features/games/components/campaign-filter-bar";
import { AudienceCards, NoGamesYet } from "@/features/games/components/discovery-sections";
import { GamesBrowser, GamesGridSkeleton } from "@/features/games/components/games-browser";

const campaign = TURKEY_BOWL;

export const metadata: Metadata = {
  title: campaign.name,
  description: campaign.tagline,
};

export default function TurkeyBowlPage() {
  const [first, second, accent] = campaign.headline;
  return (
    <>
      <PhotoHero>
        <p className="inline-flex rounded-full bg-brand-orange px-3 py-1 text-[11px] font-bold tracking-wide text-brand-navy uppercase">{campaign.eyebrow}</p>
        <h1 className="font-display mt-5 text-[clamp(3.25rem,11vw,7.5rem)] leading-[0.88]">
          {first}
          <br />
          {second}
          <br />
          <span className="text-primary">{accent}</span>
        </h1>
        <p className="mt-5 text-lg">{campaign.tagline}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" nativeButton={false} render={<Link href="#games" />}>
            Find a game
          </Button>
          <Button size="lg" variant="outline" nativeButton={false} render={<Link href={`/list-your-game?campaign=${campaign.slug}`} />}>
            List your game
          </Button>
        </div>
      </PhotoHero>
      <div className="relative z-10 mx-auto -mt-10 w-full px-4 sm:px-6 lg:w-[90%] lg:px-0">
        <Suspense fallback={<CampaignFilterBarSkeleton />}>
          <CampaignFilterBar campaign={campaign} />
        </Suspense>
      </div>
      <div className="mx-auto grid w-full gap-12 px-4 py-10 sm:px-6 lg:w-[90%] lg:px-0 sm:py-14">
        <section id="games" aria-labelledby="campaign-games" className="grid scroll-mt-20 gap-4">
          <h2 id="campaign-games" className="font-display text-3xl sm:text-4xl">
            {campaign.name} games
          </h2>
          <Suspense fallback={<GamesGridSkeleton />}>
            <GamesBrowser
              showFilters={false}
              campaignSlug={campaign.slug}
              emptyState={<NoGamesYet title={`No ${campaign.name} games yet`} description="Be the first to list one, or check back closer to Thanksgiving." />}
            />
          </Suspense>
        </section>
        <AudienceCards findHref="#games" />
      </div>
    </>
  );
}
