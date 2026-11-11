import type { ReactNode } from "react";
import { CalendarDays, MapPin } from "lucide-react";
import { formatGameDay, formatGameTimeRange } from "@/lib/datetime/eastern-time";
import { cn } from "@/lib/utils";
import { locationLine, spotsLabel } from "../game-state";
import type { Game } from "../types";

/** Orange pill marking a campaign game (e.g. Turkey Bowl). */
export function CampaignBadge({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn("inline-flex h-5 items-center rounded-full bg-brand-orange px-2 text-[10px] font-bold uppercase tracking-wide text-brand-navy", className)}>
      {name}
    </span>
  );
}

/** Monospace tag for sport, format and skill level, as in the design system's chips. */
export function MetaTag({ children, highlight }: { children: ReactNode; highlight?: boolean }) {
  return (
    <span className={cn("inline-flex h-5 items-center rounded-sm px-1.5 font-mono text-[10px] uppercase tracking-wider", highlight ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground")}>
      {children}
    </span>
  );
}

const MAX_SEGMENTS = 10;

/** Segmented bar: lime segments are the share of spots still open. Decorative; the label carries the meaning. Hidden until a capacity exists (draft preview). */
export function SpotsMeter({ game, className }: { game: Pick<Game, "capacity" | "availableSpots">; className?: string }) {
  if (game.capacity === 0) return null;
  const segments = Math.min(game.capacity, MAX_SEGMENTS);
  const open = Math.round((game.availableSpots / Math.max(game.capacity, 1)) * segments);
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="flex gap-0.5" aria-hidden>
        {Array.from({ length: segments }, (_, index) => (
          <span key={index} className={cn("h-1.5 w-1.5 rounded-[1px]", index >= segments - open ? "bg-primary" : "bg-brand-slate/40")} />
        ))}
      </span>
      <span className={cn("text-xs font-medium", game.availableSpots === 0 && "text-brand-orange")}>{spotsLabel(game)}</span>
    </div>
  );
}

/** Date, time and place lines, always in Eastern Time. An empty start (a draft preview) shows a placeholder. */
export function GameMeta({ game, className }: { game: Pick<Game, "startDateTime" | "endDateTime" | "location">; className?: string }) {
  return (
    <ul className={cn("grid gap-1.5 text-sm text-muted-foreground", className)}>
      <li className="flex items-center gap-2">
        <CalendarDays className="size-4 shrink-0" aria-hidden />
        <span>{game.startDateTime ? `${formatGameDay(game.startDateTime)} · ${formatGameTimeRange(game.startDateTime, game.endDateTime)}` : "Date and time to come"}</span>
      </li>
      <li className="flex items-center gap-2">
        <MapPin className="size-4 shrink-0" aria-hidden />
        <span className="truncate">{locationLine(game)}</span>
      </li>
    </ul>
  );
}
