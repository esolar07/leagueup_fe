"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CalendarDays, ChevronLeft, ExternalLink, Link2, MapPin, Users, Zap, Flag, TriangleAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { GoogleMapDirectionsLink, GoogleMapPreview } from "@/components/maps/google-map-preview";
import { StatePanel } from "@/components/shared/state-panel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { isApiError } from "@/lib/api/client";
import { friendlyErrorMessage } from "@/lib/api/error-messages";
import { formatGameDay, formatGameTimeRange } from "@/lib/datetime/eastern-time";
import { isTeamGame, SPORT_LABEL, skillLevelLabel, spotsLabel, TEAM_REGISTRATION_LABEL } from "../game-state";
import { useGameDetail } from "../hooks";
import type { Game } from "../types";
import { CampaignBadge, MetaTag } from "./game-bits";

/** Details are public; `joinPanel` is server-rendered so it can know who's signed in. */
export function GameDetailScreen({ joinPanel }: { joinPanel: ReactNode }) {
  const { slug } = useParams<{ slug: string }>();
  const query = useGameDetail(slug);
  if (query.isPending) return <GameDetailSkeleton />;
  if (query.isError) return <GameLoadError error={query.error} retry={() => query.refetch()} />;
  const game = query.data;
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-x-8">
      <GameHero game={game} />
      <aside className="grid content-start gap-4 lg:col-start-2 lg:row-span-3 lg:row-start-1">
        {joinPanel}
        <ShareCard game={game} />
        <OrganizerCard game={game} />
      </aside>
      <InfoTiles game={game} />
      <AboutGame game={game} />
    </div>
  );
}

export function GameDetailSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]" aria-busy="true" aria-label="Loading game">
      <Skeleton className="h-64 lg:h-80" />
      <Skeleton className="h-72" />
    </div>
  );
}

function GameLoadError({ error, retry }: { error: Error; retry: () => void }) {
  if (isApiError(error) && error.code === "NOT_FOUND") {
    const action = <Button nativeButton={false} render={<Link href="/games" />}>Find a game</Button>;
    return <StatePanel icon={Flag} title="Game not found" description="This game doesn’t exist, or it hasn’t been confirmed by its organizer yet." action={action} />;
  }
  return <StatePanel icon={TriangleAlert} tone="error" title="Couldn’t load this game" description={friendlyErrorMessage(error)} action={<Button onClick={retry}>Try again</Button>} />;
}

export function BackToGames() {
  return (
    <Link href="/games" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ChevronLeft className="size-4" aria-hidden /> Find Games
    </Link>
  );
}

function GameHero({ game }: { game: Game }) {
  return (
    <header className="cover-stripes flex min-h-56 flex-col justify-end rounded-lg border border-border p-5 sm:min-h-72 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        {game.campaign && <CampaignBadge name={game.campaign.name} />}
        <MetaTag>{SPORT_LABEL}</MetaTag>
        {isTeamGame(game) && <MetaTag>{TEAM_REGISTRATION_LABEL}</MetaTag>}
        {game.status !== "PUBLISHED" && <MetaTag>{game.status === "CLOSED" ? "Closed" : "Cancelled"}</MetaTag>}
      </div>
      <h1 className="font-display mt-3 text-[clamp(2rem,6vw,3.25rem)] leading-[0.95]">{game.title}</h1>
    </header>
  );
}

function InfoTile({ icon: Icon, label, value, detail }: { icon: LucideIcon; label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <Icon className="size-4 text-primary" aria-hidden />
      <p className="mt-2 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
      {detail && <p className="text-sm text-muted-foreground">{detail}</p>}
    </div>
  );
}

function InfoTiles({ game }: { game: Game }) {
  const { location } = game;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <InfoTile icon={CalendarDays} label="Date & time" value={formatGameDay(game.startDateTime)} detail={formatGameTimeRange(game.startDateTime, game.endDateTime)} />
      <InfoTile icon={MapPin} label="Location" value={location.venueName} detail={`${location.city}, ${location.state}`} />
      <InfoTile icon={Zap} label="Skill level" value={skillLevelLabel(game.skillLevel)} />
      <InfoTile icon={Users} label={isTeamGame(game) ? "Teams" : "Players"} value={spotsLabel(game)} />
    </div>
  );
}

function fullAddress({ location }: Game): string {
  return [location.venueName, location.address, `${location.city}, ${location.state} ${location.postalCode ?? ""}`.trim()].filter(Boolean).join(", ");
}

function AboutGame({ game }: { game: Game }) {
  const address = fullAddress(game);
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <section>
        <h2 className="font-display text-2xl">About this game</h2>
        <p className="mt-2 whitespace-pre-line text-muted-foreground">{game.description || "The organizer hasn’t added a description."}</p>
      </section>
      <section>
        <h2 className="font-display text-2xl">Location</h2>
        <GoogleMapPreview address={address} label={`Map of ${game.location.venueName}`} className="mt-3 h-48 sm:h-56" />
        <p className="mt-3 text-muted-foreground">{address}</p>
        <GoogleMapDirectionsLink address={address} className="mt-2" />
      </section>
    </div>
  );
}

const SHARE_BUTTON_CLASS = "h-11 rounded-full px-2 sm:px-4";

/** Built on click, so the server and browser render the same markup. */
function shareLinks(game: Game) {
  const url = `${window.location.origin}/games/${game.slug}`;
  const body = encodeURIComponent(`Join me at ${game.title}: ${url}`);
  return { url, sms: `sms:?&body=${body}`, email: `mailto:?subject=${encodeURIComponent(game.title)}&body=${body}` };
}

/** Copy the link, or hand it to the device's messages or email app. */
function ShareCard({ game }: { game: Game }) {
  const copy = () => navigator.clipboard.writeText(shareLinks(game).url).then(() => toast.success("Link copied"), () => toast.error("Couldn’t copy the link"));
  const open = (kind: "sms" | "email") => window.location.assign(shareLinks(game)[kind]);
  return (
    <section aria-labelledby="share-title" className="rounded-lg border border-border bg-card p-4">
      <h2 id="share-title" className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">Share</h2>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Button variant="outline" className={SHARE_BUTTON_CLASS} onClick={copy}><Link2 aria-hidden /> Copy link</Button>
        <Button variant="outline" className={SHARE_BUTTON_CLASS} onClick={() => open("sms")}><Users aria-hidden /> Message</Button>
        <Button variant="outline" className={SHARE_BUTTON_CLASS} onClick={() => open("email")}><ExternalLink aria-hidden /> Email</Button>
      </div>
    </section>
  );
}

function OrganizerCard({ game }: { game: Game }) {
  const initials = game.organizer.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
      <Avatar className="size-11">
        <AvatarFallback className="bg-secondary font-semibold">{initials}</AvatarFallback>
      </Avatar>
      <div>
        <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">Organizer</p>
        <p className="font-semibold">{game.organizer.name}</p>
      </div>
    </div>
  );
}
