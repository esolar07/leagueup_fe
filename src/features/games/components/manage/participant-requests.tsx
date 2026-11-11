"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronLeft, ChevronRight, Inbox, TriangleAlert, X } from "lucide-react";
import { toast } from "sonner";
import { ChoiceChips, type ChoiceOption } from "@/components/forms/choice-chips";
import { StatePanel } from "@/components/shared/state-panel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { friendlyErrorMessage } from "@/lib/api/error-messages";
import { formatGameDay, formatGameTime } from "@/lib/datetime/eastern-time";
import { gamesApi } from "../../api";
import { availabilityOf, PARTICIPANT_STATUS_LABELS } from "../../game-state";
import { gameKeys } from "../../hooks";
import type { Game, ManagedParticipant, ParticipantStatus } from "../../types";
import { useParticipants } from "./use-participants";

type Decision = "APPROVED" | "REJECTED";

const STATUS_OPTIONS: ChoiceOption<ParticipantStatus>[] = (["PENDING", "APPROVED", "REJECTED", "CANCELLED"] as const).map((status) => ({
  value: status,
  label: PARTICIPANT_STATUS_LABELS[status],
}));

/** Allowed moves: PENDING → APPROVED | REJECTED, APPROVED → REJECTED, REJECTED → APPROVED. */
const DECISIONS_FROM: Record<ParticipantStatus, Decision[]> = {
  PENDING: ["APPROVED", "REJECTED"],
  APPROVED: ["REJECTED"],
  REJECTED: ["APPROVED"],
  CANCELLED: [],
};

function allowedDecisions(game: Game, participant: ManagedParticipant): Decision[] {
  const availability = availabilityOf(game);
  if (availability === "cancelled") return [];
  const decisions = DECISIONS_FROM[participant.status];
  return availability === "started" ? decisions.filter((decision) => decision !== "APPROVED") : decisions;
}

function useDecide(game: Game, manageToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ participant, status }: { participant: ManagedParticipant; status: Decision }) => gamesApi.decide(game.id, participant.id, status, manageToken),
    onSuccess: ({ data }) => toast.success(`${data.participant.name} ${data.participant.status === "APPROVED" ? "approved" : "declined"}`),
    onError: (error) => toast.error(friendlyErrorMessage(error)),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: gameKeys.participants(game.id) }),
        queryClient.invalidateQueries({ queryKey: gameKeys.detail(game.slug) }),
      ]),
  });
}

/** Join requests by status, with approve / decline. The API never returns player emails. */
export function ParticipantRequests({ game, manageToken }: { game: Game; manageToken: string }) {
  const [status, setStatus] = useState<ParticipantStatus>("PENDING");
  const [page, setPage] = useState(1);
  const query = useParticipants(game.id, manageToken, status, page);
  const decide = useDecide(game, manageToken);
  const participants = query.data?.data.participants ?? [];
  const totalPages = query.data?.meta?.totalPages ?? 1;
  return (
    <section aria-labelledby="requests-title" className="grid gap-4">
      <h2 id="requests-title" className="font-display text-2xl">Requests</h2>
      <ChoiceChips name="request-status" legend="Show requests" hideLegend options={STATUS_OPTIONS} value={status} onChange={(next) => { setStatus(next); setPage(1); }} />
      {query.isPending && <Skeleton className="h-40" />}
      {query.isError && <StatePanel icon={TriangleAlert} tone="error" title="Couldn’t load requests" description={friendlyErrorMessage(query.error)} action={<Button onClick={() => query.refetch()}>Try again</Button>} />}
      {query.isSuccess && participants.length === 0 && <StatePanel icon={Inbox} title={`No ${PARTICIPANT_STATUS_LABELS[status].toLowerCase()} requests`} description="Share your game link to get more players." />}
      <ul className="grid gap-3" aria-busy={query.isFetching}>
        {participants.map((participant) => (
          <li key={participant.id} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-3">
              <Avatar className="size-10">
                <AvatarFallback className="bg-secondary font-semibold">{participant.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{participant.name}</p>
                <p className="text-xs text-muted-foreground">
                  {PARTICIPANT_STATUS_LABELS[participant.status]} · requested {formatGameDay(participant.requestedAt)}, {formatGameTime(participant.requestedAt)}
                </p>
              </div>
            </div>
            <DecisionButtons decisions={allowedDecisions(game, participant)} name={participant.name} disabled={decide.isPending} onDecide={(decision) => decide.mutate({ participant, status: decision })} />
          </li>
        ))}
      </ul>
      {totalPages > 1 && (
        <nav aria-label="Requests pages" className="flex items-center justify-between">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft aria-hidden /> Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next <ChevronRight aria-hidden /></Button>
        </nav>
      )}
    </section>
  );
}

function DecisionButtons({ decisions, name, disabled, onDecide }: { decisions: Decision[]; name: string; disabled: boolean; onDecide: (decision: Decision) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:flex">
      {decisions.includes("APPROVED") && (
        <Button onClick={() => onDecide("APPROVED")} disabled={disabled} aria-label={`Approve ${name}`}>
          <Check aria-hidden /> Approve
        </Button>
      )}
      {decisions.includes("REJECTED") && (
        <Button variant="outline" onClick={() => onDecide("REJECTED")} disabled={disabled} aria-label={`Decline ${name}`}>
          <X aria-hidden /> Decline
        </Button>
      )}
    </div>
  );
}
