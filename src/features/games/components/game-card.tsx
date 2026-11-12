import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { formatCost } from "@/lib/money";
import { cn } from "@/lib/utils";
import { isTeamGame, skillLevelLabel, TEAM_REGISTRATION_LABEL } from "../game-state";
import type { Game } from "../types";
import { CampaignBadge, GameMeta, MetaTag, SpotsMeter } from "./game-bits";

type CardGame = Omit<Game, "id" | "slug" | "status" | "description" | "sport" | "organizer">;

/**
 * Compact (thumbnail beside text) on phones, cover-on-top from `sm`. With `href` the whole
 * card is one link; without it, it's a static preview (the listing form's live preview).
 */
export function GameCard({ game, href, className }: { game: CardGame; href?: string; className?: string }) {
  return (
    <article
      className={cn(
        "relative flex overflow-hidden rounded-lg border border-border bg-card transition-colors sm:flex-col",
        href && "hover:border-primary/50 focus-within:border-primary",
        className,
      )}
    >
      <div className="cover-stripes relative w-24 shrink-0 sm:h-28 sm:w-auto">
        {game.campaign && <CampaignBadge name={game.campaign.name} className="absolute top-2 left-2 hidden whitespace-nowrap sm:inline-flex" />}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="flex flex-wrap items-center gap-1.5">
            {game.campaign && <CampaignBadge name={game.campaign.name} className="whitespace-nowrap sm:hidden" />}
            <MetaTag highlight>{skillLevelLabel(game.skillLevel)}</MetaTag>
            {isTeamGame(game) && <MetaTag>{TEAM_REGISTRATION_LABEL}</MetaTag>}
          </span>
          <span className="text-sm font-semibold text-primary">{formatCost(game.costCents, game.costBasis)}</span>
        </div>
        <h3 className="leading-tight font-semibold">
          {href ? (
            <Link href={href} className="after:absolute after:inset-0 focus-visible:outline-none">
              {game.title}
            </Link>
          ) : (
            game.title
          )}
        </h3>
        <GameMeta game={game} />
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <SpotsMeter game={game} />
          {href && (
            <span className="inline-flex items-center text-sm font-semibold text-primary" aria-hidden>
              View game <ChevronRight className="size-4" />
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
