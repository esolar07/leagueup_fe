"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/shared/confirm-action";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";
import { friendlyErrorMessage } from "@/lib/api/error-messages";
import { formatCost } from "@/lib/money";
import { cancelMyRequestAction, joinAsMemberAction, type MemberActionResult } from "../actions";
import { AVAILABILITY_COPY, availabilityOf } from "../game-state";
import { gameKeys, useGameDetail } from "../hooks";
import type { Game, JoinResult, OwnParticipation } from "../types";
import { SpotsMeter } from "./game-bits";
import { GuestJoinForm } from "./guest-join-form";

export const APPROVAL_NOTE = "The organizer reviews every request. Your spot is only held once they approve it.";

export interface Viewer {
  firstName: string;
}

interface JoinPanelProps {
  slug: string;
  viewer: Viewer | null;
  myParticipation: OwnParticipation | null;
}

function unwrap<T>(result: MemberActionResult<T>): T {
  if (result.ok) return result.data;
  throw new ApiError(result.error.status, result.error.code, result.error.message);
}

/** Signed-in actions return plain results (server actions can't throw rich errors); refresh both server and client data after. */
function useMemberAction() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pending, startTransition] = useTransition();
  async function run<T>(slug: string, action: () => Promise<MemberActionResult<T>>, success: string) {
    unwrap(await action());
    toast.success(success);
    startTransition(() => router.refresh());
    await queryClient.invalidateQueries({ queryKey: gameKeys.detail(slug) });
  }
  return { pending, run };
}

/** Cost, spots and the right join state for this viewer. */
export function JoinPanel({ slug, viewer, myParticipation }: JoinPanelProps) {
  const { data: game } = useGameDetail(slug);
  if (!game) return <Skeleton className="h-72" />;
  return (
    <section aria-labelledby="join-title" className="rounded-lg border border-border bg-card p-5">
      <h2 id="join-title" className="sr-only">Join this game</h2>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">Cost per player</p>
          <p className="font-display text-4xl text-primary">{formatCost(game.costCents)}</p>
        </div>
        <SpotsMeter game={game} className="items-end" />
      </div>
      <div className="mt-5">
        <JoinBody game={game} viewer={viewer} myParticipation={myParticipation} />
      </div>
    </section>
  );
}

function JoinBody({ game, viewer, myParticipation }: { game: Game; viewer: Viewer | null; myParticipation: OwnParticipation | null }) {
  const [guestResult, setGuestResult] = useState<JoinResult | null>(null);
  const availability = availabilityOf(game);
  if (guestResult) return <GuestJoinConfirmation game={game} emailSent={guestResult.emailSent} />;
  if (availability === "cancelled" || availability === "started") return <Notice {...AVAILABILITY_COPY[availability]} />;
  if (myParticipation?.status === "PENDING" || myParticipation?.status === "APPROVED") return <MemberRequest game={game} participation={myParticipation} />;
  if (myParticipation?.status === "REJECTED") return <Notice title="Request declined" description="The organizer declined your request for this game." />;
  if (availability !== "open") return <Notice {...AVAILABILITY_COPY[availability]} />;
  if (viewer) return <MemberJoin game={game} viewer={viewer} />;
  return <GuestJoinForm game={game} onJoined={setGuestResult} />;
}

function Notice({ title, description }: { title: string; description: string }) {
  return (
    <div role="status" className="rounded-md bg-secondary p-4">
      <p className="flex items-center gap-2 font-semibold">
        <Info className="size-4 text-brand-orange" aria-hidden /> {title}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function GuestJoinConfirmation({ game, emailSent }: { game: Game; emailSent: boolean }) {
  return (
    <div role="status" className="grid gap-3">
      <p className="flex items-center gap-2 text-lg font-semibold">
        <CheckCircle2 className="size-5 text-primary" aria-hidden /> Request sent to {game.organizer.name}
      </p>
      <p className="text-sm text-muted-foreground">{APPROVAL_NOTE}</p>
      <p className="text-sm text-muted-foreground">
        {emailSent
          ? "Check your email for a confirmation with a link to cancel if your plans change."
          : "We couldn’t send your confirmation email, so you won’t get a cancel link. Your request was still sent."}
      </p>
    </div>
  );
}

function MemberJoin({ game, viewer }: { game: Game; viewer: Viewer }) {
  const { pending, run } = useMemberAction();
  const [error, setError] = useState<string | null>(null);
  async function join() {
    setError(null);
    await run(game.slug, () => joinAsMemberAction(game.id), "Request sent").catch((caught) => setError(friendlyErrorMessage(caught)));
  }
  return (
    <div className="grid gap-3">
      <Button size="lg" className="w-full" onClick={join} disabled={pending}>
        {pending && <Loader2 className="animate-spin" aria-hidden />} Request to join as {viewer.firstName}
      </Button>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <p className="text-sm text-muted-foreground">{APPROVAL_NOTE}</p>
    </div>
  );
}

function MemberRequest({ game, participation }: { game: Game; participation: OwnParticipation }) {
  const { run } = useMemberAction();
  const approved = participation.status === "APPROVED";
  async function cancel() {
    await run(game.slug, () => cancelMyRequestAction(game.id, participation.id), "Request cancelled").catch((caught) => {
      toast.error(friendlyErrorMessage(caught));
      throw caught;
    });
  }
  return (
    <div role="status" className="grid gap-3">
      <p className="flex items-center gap-2 text-lg font-semibold">
        {approved ? <CheckCircle2 className="size-5 text-primary" aria-hidden /> : <Clock className="size-5 text-brand-orange" aria-hidden />}
        {approved ? "You’re in. See you on the field." : `Waiting on ${game.organizer.name}`}
      </p>
      <p className="text-sm text-muted-foreground">{approved ? "Your spot is held. Cancel if your plans change so someone else can play." : APPROVAL_NOTE}</p>
      <ConfirmAction
        trigger={approved ? "Give up my spot" : "Cancel my request"}
        title={approved ? "Give up your spot?" : "Cancel your request?"}
        description="You can request again later if there’s still room."
        confirmLabel="Yes, cancel"
        onConfirm={cancel}
      />
    </div>
  );
}
