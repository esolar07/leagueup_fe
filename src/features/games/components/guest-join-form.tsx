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
import { guestJoinSchema, type GuestJoinValues } from "../schemas";
import type { Game, JoinResult } from "../types";

const GUEST_FIELDS = ["name", "email"] as const;
const guestFieldFor = (apiField: string) => GUEST_FIELDS.find((field) => field === apiField);

/** Join without an account: name + email. The API emails a link to cancel later. */
export function GuestJoinForm({ game, onJoined }: { game: Game; onJoined: (result: JoinResult) => void }) {
  const queryClient = useQueryClient();
  const form = useForm<GuestJoinValues>({ resolver: zodResolver(guestJoinSchema), defaultValues: { name: "", email: "" } });
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
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate aria-label="Request to join">
      <FieldGroup className="gap-4">
        <TextField id="join-name" label="Your name" autoComplete="name" registration={form.register("name")} error={errors.name} />
        <TextField id="join-email" label="Email" type="email" autoComplete="email" description="We email your confirmation and a link to cancel here." registration={form.register("email")} error={errors.email} />
        <FieldError errors={[errors.root]} />
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
          {isSubmitting ? "Sending request…" : "Request to join"}
        </Button>
      </FieldGroup>
    </form>
  );
}
