"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ExternalLink, Flag, Link2Off, Loader2, TriangleAlert } from "lucide-react";
import { StatePanel } from "@/components/shared/state-panel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isApiError } from "@/lib/api/client";
import { friendlyErrorMessage } from "@/lib/api/error-messages";
import { useHashToken } from "@/lib/tokens/use-hash-token";
import { AVAILABILITY_COPY, isEditable } from "../../game-state";
import { useGameDetail } from "../../hooks";
import type { Game } from "../../types";
import { GameMeta, MetaTag, SpotsMeter } from "../game-bits";
import { ResendLinkForm } from "../resend-link-form";
import { EditGameForm } from "./edit-game-form";
import { ListingControls } from "./listing-controls";
import { ParticipantRequests } from "./participant-requests";
import { useParticipants } from "./use-participants";

const INVALID_TOKEN_CODES = ["NOT_FOUND", "FORBIDDEN", "UNAUTHENTICATED"];

/** Organizer tools, unlocked by the emailed manage link (sent as X-Manage-Token). No login. Browser only. */
export function ManageListing() {
  const { slug } = useParams<{ slug: string }>();
  const manageToken = useHashToken(`manage:${slug}`);
  const gameQuery = useGameDetail(slug);
  const access = useParticipants(gameQuery.data?.id, manageToken, "PENDING", 1);
  if (gameQuery.isError) return <GameUnavailable error={gameQuery.error} retry={() => gameQuery.refetch()} />;
  if (gameQuery.isPending) return <Skeleton className="h-64" aria-label="Loading" />;
  if (!manageToken || (isApiError(access.error) && INVALID_TOKEN_CODES.includes(access.error.code))) return <InvalidManageLink game={gameQuery.data} />;
  if (access.isError) return <StatePanel icon={TriangleAlert} tone="error" title="Couldn’t open your listing" description={friendlyErrorMessage(access.error)} action={<Button onClick={() => access.refetch()}>Try again</Button>} />;
  if (access.isPending) return <div role="status" className="flex justify-center py-16"><Loader2 className="size-8 animate-spin text-primary" aria-label="Checking your manage link" /></div>;
  return <ManageDashboard game={gameQuery.data} manageToken={manageToken} />;
}

function GameUnavailable({ error, retry }: { error: Error; retry: () => void }) {
  if (isApiError(error) && error.code === "NOT_FOUND") return <StatePanel icon={Flag} title="Game not found" description="This game doesn’t exist, or it hasn’t been confirmed yet. Open the confirmation link from your email first." />;
  return <StatePanel icon={TriangleAlert} tone="error" title="Couldn’t load your game" description={friendlyErrorMessage(error)} action={<Button onClick={retry}>Try again</Button>} />;
}

function InvalidManageLink({ game }: { game: Game }) {
  return (
    <div className="grid gap-6">
      <StatePanel icon={Link2Off} title="This manage link is invalid or has expired" description="Use the most recent manage link we emailed you, or request a new one with the organizer email for this game." />
      <section className="mx-auto w-full max-w-md rounded-lg border border-border bg-card p-5" aria-label="Request a new manage link">
        <ResendLinkForm gameId={game.id} label="Email me a new manage link" />
      </section>
    </div>
  );
}

const STATUS_TAG: Record<Game["status"], string> = { PUBLISHED: "Published", CLOSED: "Requests closed", CANCELLED: "Cancelled" };

function ManageDashboard({ game, manageToken }: { game: Game; manageToken: string }) {
  const editable = isEditable(game);
  const lockReason = game.status === "CANCELLED" ? "cancelled" : "started";
  return (
    <div className="grid gap-8">
      <header className="grid gap-4 rounded-lg border border-primary/40 bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <MetaTag highlight={game.status === "PUBLISHED"}>{STATUS_TAG[game.status]}</MetaTag>
          <Link href={`/games/${game.slug}`} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            View public page <ExternalLink className="size-3.5" aria-hidden />
          </Link>
        </div>
        <h1 className="font-display text-3xl leading-none sm:text-4xl">{game.title}</h1>
        <GameMeta game={game} />
        <SpotsMeter game={game} />
        {editable ? <ListingControls game={game} manageToken={manageToken} /> : <p role="status" className="text-sm text-muted-foreground">{AVAILABILITY_COPY[lockReason].title}. It can no longer be changed.</p>}
      </header>
      <Tabs defaultValue="requests">
        <TabsList className="h-11 w-full sm:w-fit">
          <TabsTrigger value="requests" className="px-4">Requests</TabsTrigger>
          <TabsTrigger value="edit" className="px-4" disabled={!editable}>Edit game</TabsTrigger>
        </TabsList>
        <TabsContent value="requests" className="pt-4">
          <ParticipantRequests game={game} manageToken={manageToken} />
        </TabsContent>
        <TabsContent value="edit" className="pt-4">
          {editable && <EditGameForm game={game} manageToken={manageToken} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
