import { Suspense } from "react";
import type { Metadata } from "next";
import { Skeleton } from "@/components/ui/skeleton";
import { BackToGames, GameDetailScreen, GameDetailSkeleton } from "@/features/games/components/game-detail-screen";
import { ViewerJoinPanel } from "@/features/games/components/viewer-join-panel";

export const metadata: Metadata = { title: "Game details" };

export default function GameDetailPage({ params }: PageProps<"/games/[slug]">) {
  return (
    <div className="mx-auto w-full px-4 py-6 sm:px-6 lg:w-[90%] lg:px-0 sm:py-10">
      <BackToGames />
      <Suspense fallback={<GameDetailSkeleton />}>
        <GameDetailScreen
          joinPanel={
            <Suspense fallback={<Skeleton className="h-72" />}>
              <ViewerJoinPanel params={params} />
            </Suspense>
          }
        />
      </Suspense>
    </div>
  );
}
