"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle2, Link2Off } from "lucide-react";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/shared/confirm-action";
import { StatePanel } from "@/components/shared/state-panel";
import { Button } from "@/components/ui/button";
import { friendlyErrorMessage, type ErrorMessageOverrides } from "@/lib/api/error-messages";
import { forgetToken } from "@/lib/tokens/hash-token";
import { useHashToken } from "@/lib/tokens/use-hash-token";
import { gamesApi } from "../api";
import { useGameDetail } from "../hooks";
import type { Game } from "../types";
import { GameCard } from "./game-card";
import { GameDetailSkeleton } from "./game-detail-screen";

const INVALID_LINK = "This link is invalid or has expired. Open the latest link from your email.";

export const CANCEL_REQUEST_ERRORS: ErrorMessageOverrides = {
  UNPROCESSABLE: "This request can no longer be cancelled. It may already be cancelled or declined, or the game has started.",
  FORBIDDEN: INVALID_LINK,
  UNAUTHENTICATED: INVALID_LINK,
  NOT_FOUND: "We couldn’t find this request.",
};

/**
 * A guest's emailed request link. The API offers no way for a guest to read their request's
 * status, so none is shown: only the game and a cancel button. Browser only.
 */
export function GuestParticipation() {
  const { slug, participantId } = useParams<{ slug: string; participantId: string }>();
  const tokenScope = `participation:${participantId}`;
  const token = useHashToken(tokenScope);
  const gameQuery = useGameDetail(slug);
  const [cancelled, setCancelled] = useState(false);
  async function cancel(game: Game) {
    try {
      await gamesApi.cancelParticipation(game.id, participantId, { participationToken: token as string });
      forgetToken(tokenScope);
      setCancelled(true);
    } catch (error) {
      toast.error(friendlyErrorMessage(error, CANCEL_REQUEST_ERRORS));
      throw error;
    }
  }
  if (gameQuery.isPending) return <GameDetailSkeleton />;
  if (gameQuery.isError) return <StatePanel icon={Link2Off} tone="error" title="Couldn’t load this game" description={friendlyErrorMessage(gameQuery.error)} />;
  const game = gameQuery.data;
  return (
    <div className="grid gap-6">
      <GameCard game={game} href={`/games/${game.slug}`} />
      {cancelled && <RequestCancelled />}
      {!cancelled && !token && <StatePanel icon={Link2Off} title="This link is invalid or has expired" description="Open the link from your join confirmation email again." />}
      {!cancelled && token && (
        <section className="grid gap-3 rounded-lg border border-border bg-card p-5" aria-labelledby="cancel-title">
          <h1 id="cancel-title" className="font-display text-2xl">Can’t make it?</h1>
          <p className="text-sm text-muted-foreground">Cancel your request so the organizer can give the spot to someone else.</p>
          <ConfirmAction trigger="Cancel my request" triggerVariant="destructive" title="Cancel your request?" description="If there’s still room later, you can request to join again from the game page." confirmLabel="Yes, cancel" onConfirm={() => cancel(game)} />
        </section>
      )}
    </div>
  );
}

function RequestCancelled() {
  return (
    <section role="status" className="grid gap-3 rounded-lg border border-border bg-card p-5">
      <p className="flex items-center gap-2 text-lg font-semibold">
        <CheckCircle2 className="size-5 text-primary" aria-hidden /> Your request was cancelled
      </p>
      <Button variant="outline" nativeButton={false} render={<Link href="/games" />}>
        Find another game
      </Button>
    </section>
  );
}
