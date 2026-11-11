import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PhotoHero } from "@/components/shared/photo-hero";
import { Button } from "@/components/ui/button";
import { TURKEY_BOWL } from "@/config/campaigns";
import { WAITLIST_URL } from "@/config/links";
import { CampaignBanner } from "@/features/games/components/discovery-sections";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/auth/session";

/**
 * Hero plus the Turkey Bowl link. The full landing page (discovery, league tools,
 * community sections) lands once the routes it links to exist.
 */
async function HeroActions() {
  const user = await getCurrentUser();
  if (user) {
    return (
      <Button size="lg" nativeButton={false} render={<Link href="/dashboard" />}>
        Go to My Sports <ArrowRight aria-hidden />
      </Button>
    );
  }
  return (
    <Button size="lg" nativeButton={false} render={<a href={WAITLIST_URL} />}>
      Join LeagueUp <ArrowRight aria-hidden />
    </Button>
  );
}

export default function HomePage() {
  return (
    <>
      <PhotoHero>
        <p className="mb-6 inline-flex w-fit items-center gap-2 rounded-sm bg-secondary/80 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-slate backdrop-blur">
          <span className="size-2 rounded-full bg-primary" aria-hidden />
          Flag football
        </p>
        <h1 className="font-display max-w-4xl text-6xl leading-[0.9] sm:text-7xl md:text-8xl">
          Your game.
          <br />
          Your league.
          <br />
          <span className="text-primary">Your moment.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">Find your game, connect with teams, and experience recreational sports in one place.</p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Suspense fallback={<Skeleton className="h-12 w-full sm:w-48" />}>
            <HeroActions />
          </Suspense>
        </div>
      </PhotoHero>
      <div className="mx-auto w-full px-4 py-8 sm:px-6 lg:w-[90%] lg:px-0">
        <CampaignBanner campaign={TURKEY_BOWL} />
      </div>
    </>
  );
}
