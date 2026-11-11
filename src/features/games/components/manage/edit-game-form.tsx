"use client";

import { FormProvider, useForm, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { applyApiError } from "@/components/forms/apply-api-error";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { gamesApi } from "../../api";
import { useStoreGame } from "../../hooks";
import { API_FIELD_TO_FORM_FIELD, diffGameChanges, editGameSchema, gameToFormValues, type GameFieldValues } from "../../schemas";
import type { Game } from "../../types";
import { GameFields } from "../game-fields";

/** PATCH /games/:id with only the fields that changed (cleared optional fields are sent as null). */
export function EditGameForm({ game, manageToken }: { game: Game; manageToken: string }) {
  const storeGame = useStoreGame();
  const form = useForm<GameFieldValues>({ resolver: zodResolver(editGameSchema), defaultValues: gameToFormValues(game) });
  const { errors, isSubmitting, isDirty } = form.formState;
  async function onSubmit(values: GameFieldValues) {
    const changes = diffGameChanges(game, values);
    if (Object.keys(changes).length === 0) return void toast.info("No changes to save.");
    try {
      const { data } = await gamesApi.update(game.id, changes, manageToken);
      storeGame(data.game);
      form.reset(gameToFormValues(data.game));
      toast.success("Game updated");
    } catch (error) {
      applyApiError(error, form.setError, (field) => API_FIELD_TO_FORM_FIELD[field] as Path<GameFieldValues> | undefined);
    }
  }
  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-4" aria-label="Edit game details">
        <GameFields />
        <FieldError errors={[errors.root]} />
        <Button type="submit" size="lg" className="w-full sm:ml-auto sm:w-auto" disabled={isSubmitting || !isDirty}>
          {isSubmitting && <Loader2 className="animate-spin" aria-hidden />} Save changes
        </Button>
      </form>
    </FormProvider>
  );
}
