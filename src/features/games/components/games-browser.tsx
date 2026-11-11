"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, SearchX, TriangleAlert } from "lucide-react";
import { StatePanel } from "@/components/shared/state-panel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { friendlyErrorMessage } from "@/lib/api/error-messages";
import { gamesApi } from "../api";
import { hasActiveFilters, toGamesQuery } from "../filters";
import { gameKeys } from "../hooks";
import { GameCard } from "./game-card";
import { GameFiltersForm } from "./game-filters";
import { useUrlFilters } from "./use-url-filters";

const GRID = "grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))]";

export function GamesGridSkeleton() {
  return (
    <div className={GRID} aria-busy="true" aria-label="Loading games">
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton key={index} className="h-36 sm:h-72" />
      ))}
    </div>
  );
}

interface GamesBrowserProps {
  campaignSlug?: string;
  /** Shown when there are no games at all (no filters applied). */
  emptyState: ReactNode;
  /** Off when the page renders its own filter bar (both read and write the same URL). */
  showFilters?: boolean;
}

/** Filters (kept in the URL) + results, for any discovery page. Render inside <Suspense>. */
export function GamesBrowser({ campaignSlug, emptyState, showFilters = true }: GamesBrowserProps) {
  const { filters, key, hrefFor, apply } = useUrlFilters();
  const query = toGamesQuery(filters, campaignSlug);
  const result = useQuery({
    queryKey: gameKeys.list(query),
    queryFn: ({ signal }) => gamesApi.list(query, signal),
    placeholderData: keepPreviousData,
  });
  const total = result.data?.meta?.total ?? 0;
  const totalPages = result.data?.meta?.totalPages ?? 1;
  const page = filters.page ?? 1;
  return (
    <div className="grid gap-6">
      {showFilters && <GameFiltersForm key={key} filters={filters} onApply={apply} />}
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {result.isSuccess && `${total} ${total === 1 ? "game" : "games"} found`}
      </p>
      {result.isPending && <GamesGridSkeleton />}
      {result.isError && (
        <StatePanel
          icon={TriangleAlert}
          tone="error"
          title="Couldn’t load games"
          description={friendlyErrorMessage(result.error)}
          action={<Button onClick={() => result.refetch()}>Try again</Button>}
        />
      )}
      {result.isSuccess && result.data.data.games.length === 0 && (hasActiveFilters(filters) ? <NoMatches clearHref={hrefFor({})} /> : emptyState)}
      {result.isSuccess && result.data.data.games.length > 0 && (
        <ul className={GRID} aria-busy={result.isFetching}>
          {result.data.data.games.map((game) => (
            <li key={game.id} className="grid">
              <GameCard game={game} href={`/games/${game.slug}`} />
            </li>
          ))}
        </ul>
      )}
      {totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between gap-3">
          <PageLink href={hrefFor({ ...filters, page: page - 1 })} disabled={page <= 1} direction="previous" />
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <PageLink href={hrefFor({ ...filters, page: page + 1 })} disabled={page >= totalPages} direction="next" />
        </nav>
      )}
    </div>
  );
}

function PageLink({ href, disabled, direction }: { href: string; disabled: boolean; direction: "previous" | "next" }) {
  const label = direction === "previous" ? "Previous" : "Next";
  const content = direction === "previous" ? <><ChevronLeft aria-hidden /> {label}</> : <>{label} <ChevronRight aria-hidden /></>;
  if (disabled) return <Button variant="outline" disabled>{content}</Button>;
  return <Button variant="outline" nativeButton={false} render={<Link href={href} scroll={false} />}>{content}</Button>;
}

function NoMatches({ clearHref }: { clearHref: string }) {
  return (
    <StatePanel
      icon={SearchX}
      title="No games match those filters"
      description="Try another date, widen the area, or clear a filter."
      action={
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="outline" nativeButton={false} render={<Link href={clearHref} scroll={false} />}>
            Clear filters
          </Button>
          <Button nativeButton={false} render={<Link href="/list-your-game" />}>
            List a game
          </Button>
        </div>
      }
    />
  );
}
