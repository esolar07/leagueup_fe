"use client";

import type { ReactNode } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { ChoiceChips, type ChoiceOption } from "@/components/forms/choice-chips";
import { TextField } from "@/components/forms/text-field";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SKILL_LEVELS } from "../filters";
import { SKILL_LEVEL_LABELS, SPORT_LABEL } from "../game-state";
import type { GameFieldValues } from "../schemas";
import { VenueFinder } from "./venue-finder";

const SKILL_OPTIONS: ChoiceOption<GameFieldValues["skillLevel"]>[] = [
  { value: "", label: "All levels" },
  ...SKILL_LEVELS.map((level) => ({ value: level, label: SKILL_LEVEL_LABELS[level] })),
];

export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <fieldset className="grid gap-4 rounded-lg border border-border bg-card p-5">
      <legend className="sr-only">{title}</legend>
      <div aria-hidden>
        <p className="text-base font-semibold">{title}</p>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </fieldset>
  );
}

/**
 * The game fields shared by "List your game" and the organizer's edit form.
 */
export function GameFields() {
  const { register, control, formState } = useFormContext<GameFieldValues>();
  const { errors } = formState;
  return (
    <>
      <FormSection title="Game info">
        <TextField id="title" label="Game name" placeholder="Turkey Bowl 7v7: Morning Kickoff" description="Include the format so players can scan quickly." registration={register("title")} error={errors.title} />
        <Field data-invalid={Boolean(errors.description)}>
          <FieldLabel htmlFor="description">Description (optional)</FieldLabel>
          <Textarea id="description" rows={4} maxLength={2000} aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? "description-error" : undefined} {...register("description")} />
          <FieldError id="description-error" errors={[errors.description]} />
        </Field>
        <p className="text-sm">
          <span className="text-muted-foreground">Sport:</span> <span className="font-semibold">{SPORT_LABEL}</span>
        </p>
      </FormSection>
      <FormSection title="Date & time" description="Times are Eastern Time (ET).">
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField id="date" label="Date" type="date" registration={register("date")} error={errors.date} />
          <TextField id="startTime" label="Start time" type="time" registration={register("startTime")} error={errors.startTime} />
          <TextField id="endTime" label="End time (optional)" type="time" registration={register("endTime")} error={errors.endTime} />
        </div>
      </FormSection>
      <FormSection title="Location">
        <VenueFinder />
        <TextField id="venueName" label="Park or field" placeholder="Tropical Park, Field 3" description="Add the field number or meeting spot so players can find you." registration={register("venueName")} error={errors.venueName} />
        <TextField id="address" label="Street address (optional)" autoComplete="street-address" registration={register("address")} error={errors.address} />
        <div className="grid grid-cols-[1fr_5rem] gap-4 sm:grid-cols-[1fr_6rem_8rem]">
          <TextField id="city" label="City" autoComplete="address-level2" registration={register("city")} error={errors.city} />
          <TextField id="state" label="State" autoComplete="address-level1" className="uppercase" registration={register("state")} error={errors.state} />
          <TextField id="postalCode" label="ZIP (optional)" inputMode="numeric" autoComplete="postal-code" className="col-span-2 sm:col-span-1" registration={register("postalCode")} error={errors.postalCode} />
        </div>
      </FormSection>
      <FormSection title="Players & cost">
        <TextField id="capacity" label="Available players" inputMode="numeric" description="How many players you can take, 1 to 200." registration={register("capacity")} error={errors.capacity} />
        <Controller
          control={control}
          name="skillLevel"
          render={({ field }) => <ChoiceChips name="skillLevel" legend="Skill level" options={SKILL_OPTIONS} value={field.value} onChange={field.onChange} />}
        />
        <CostFields />
      </FormSection>
    </>
  );
}

const COST_OPTIONS: ChoiceOption<GameFieldValues["costType"]>[] = [
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
];

/** Free / Paid, plus a price when Paid. Display only: players pay the organizer directly. */
function CostFields() {
  const { register, control, formState } = useFormContext<GameFieldValues>();
  const costType = useWatch({ control, name: "costType" });
  const { errors } = formState;
  return (
    <>
      <Controller
        control={control}
        name="costType"
        render={({ field }) => <ChoiceChips name="costType" legend="Cost per player" options={COST_OPTIONS} value={field.value} onChange={field.onChange} />}
      />
      {costType === "paid" && (
        <Field data-invalid={Boolean(errors.cost)}>
          <FieldLabel htmlFor="cost">Price per player</FieldLabel>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" aria-hidden>
              $
            </span>
            <Input id="cost" inputMode="decimal" placeholder="10" aria-invalid={Boolean(errors.cost)} aria-describedby="cost-description cost-error" className="pl-7" {...register("cost")} />
          </div>
          <FieldError id="cost-error" errors={[errors.cost]} />
        </Field>
      )}
      <p id="cost-description" className="-mt-2 text-sm text-muted-foreground">
        Players pay you directly. LeagueUp doesn’t process payments.
      </p>
    </>
  );
}
