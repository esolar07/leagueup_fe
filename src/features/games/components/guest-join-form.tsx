"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { applyApiError } from "@/components/forms/apply-api-error";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import { FieldError, FieldGroup } from "@/components/ui/field";
import { gamesApi } from "../api";
import { gameKeys } from "../hooks";
import { isTeamGame } from "../game-state";
import { guestJoinSchema, teamJoinSchema, type GuestJoinValues } from "../schemas";
import type { Game, JoinResult } from "../types";

const GUEST_FIELDS = ["name", "email", "teamName"] as const;
const guestFieldFor = (apiField: string) => GUEST_FIELDS.find((field) => field === apiField);

/** Join without an account: name + email, plus the team name on TEAM games. The API emails a link to cancel later. */
export function GuestJoinForm({ game, onJoined }: { game: Game; onJoined: (result: JoinResult) => void }) {
  const queryClient = useQueryClient();
  const team = isTeamGame(game);
  const form = useForm<GuestJoinValues>({ resolver: zodResolver(team ? teamJoinSchema : guestJoinSchema), defaultValues: { name: "", email: "", teamName: "" } });
  const { errors, isSubmitting } = form.formState;
  async function onSubmit(values: GuestJoinValues) {
    try {
      onJoined((await gamesApi.joinAsGuest(game.id, values)).data);
    } catch (error) {
      applyApiError(error, form.setError, guestFieldFor);
    }
    void queryClient.invalidateQueries({ queryKey: gameKeys.detail(game.slug) });
  }
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate aria-label={team ? "Register your team" : "Request to join"}>
      <FieldGroup className="gap-4">
        {team && <TextField id="join-team-name" label="Team name" autoComplete="organization" registration={form.register("teamName")} error={errors.teamName} />}
        <TextField id="join-name" label={team ? "Captain name" : "Your name"} autoComplete="name" registration={form.register("name")} error={errors.name} />
        <TextField id="join-email" label={team ? "Captain email" : "Email"} type="email" autoComplete="email" description="We email your confirmation and a link to cancel here." registration={form.register("email")} error={errors.email} />
        <FieldError errors={[errors.root]} />
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
          {isSubmitting ? "Sending request…" : team ? "Register your team" : "Request to join"}
        </Button>
      </FieldGroup>
    </form>
  );
}
