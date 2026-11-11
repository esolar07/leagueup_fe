"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Controller, FormProvider, useForm, useWatch, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2, Mail, TriangleAlert } from "lucide-react";
import { applyApiError } from "@/components/forms/apply-api-error";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { LISTABLE_CAMPAIGN } from "@/config/campaigns";
import { easternToUtcIso } from "@/lib/datetime/eastern-time";
import { gamesApi } from "../api";
import { API_FIELD_TO_FORM_FIELD, costCentsOf, EMPTY_LISTING, isScheduleReady, listingSchema, toSubmitGameInput, type ListingValues } from "../schemas";
import type { ListingReceipt, SkillLevel } from "../types";
import { FormSection, GameFields } from "./game-fields";
import { GameCard } from "./game-card";
import { RESEND_RATE_LIMIT_MESSAGE, ResendLinkForm } from "./resend-link-form";

/** "List your game": no account, just a verified email. Shows "check your email" once submitted. */
export function ListingFlow() {
  const [submitted, setSubmitted] = useState<{ receipt: ListingReceipt; email: string } | null>(null);
  if (submitted) return <CheckYourEmail receipt={submitted.receipt} email={submitted.email} />;
  return <ListingForm onSubmitted={(receipt, email) => setSubmitted({ receipt, email })} />;
}

function ListingForm({ onSubmitted }: { onSubmitted: (receipt: ListingReceipt, email: string) => void }) {
  const searchParams = useSearchParams();
  const joinCampaign = searchParams.get("campaign") === LISTABLE_CAMPAIGN.slug;
  const form = useForm<ListingValues>({ resolver: zodResolver(listingSchema), defaultValues: { ...EMPTY_LISTING, joinCampaign } });
  const { errors, isSubmitting } = form.formState;
  async function onSubmit(values: ListingValues) {
    try {
      onSubmitted((await gamesApi.submit(toSubmitGameInput(values))).data, values.organizerEmail);
      window.scrollTo({ top: 0 });
    } catch (error) {
      applyApiError(error, form.setError, (field) => API_FIELD_TO_FORM_FIELD[field], { RATE_LIMITED: RESEND_RATE_LIMIT_MESSAGE });
    }
  }
  return (
    <FormProvider {...form}>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-4" aria-label="List your game">
          <GameFields />
          <FormSection title="Turkey Bowl">
            <Controller
              control={form.control}
              name="joinCampaign"
              render={({ field }) => (
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="joinCampaign">{LISTABLE_CAMPAIGN.listingLabel}</Label>
                  <Switch id="joinCampaign" checked={field.value} onCheckedChange={field.onChange} />
                </div>
              )}
            />
          </FormSection>
          <FormSection title="About you" description="Players see your name. Your email is only used to confirm and manage this listing.">
            <TextField id="organizerName" label="Your name" autoComplete="name" registration={form.register("organizerName")} error={errors.organizerName} />
            <TextField id="organizerEmail" label="Your email" type="email" autoComplete="email" registration={form.register("organizerEmail")} error={errors.organizerEmail} />
          </FormSection>
          <FieldError errors={[errors.root]} />
          <Button type="submit" size="lg" className="w-full sm:ml-auto sm:w-auto" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" aria-hidden /> : null}
            {isSubmitting ? "Submitting…" : "Submit listing"} {!isSubmitting && <ArrowRight aria-hidden />}
          </Button>
        </form>
        <ListingPreview control={form.control} />
      </div>
    </FormProvider>
  );
}

function previewStart({ date, startTime }: ListingValues): string {
  return isScheduleReady(date, startTime) ? easternToUtcIso(date, startTime) : "";
}

function previewOf(values: ListingValues) {
  const capacity = Number(values.capacity) || 0;
  return {
    title: values.title || "Your game name",
    skillLevel: (values.skillLevel || null) as SkillLevel | null,
    costCents: costCentsOf(values),
    startDateTime: previewStart(values),
    endDateTime: isScheduleReady(values.date, values.endTime) ? easternToUtcIso(values.date, values.endTime) : null,
    capacity,
    availableSpots: capacity,
    location: { venueName: values.venueName || "Park or field", address: null, city: values.city, state: values.state, postalCode: null },
    campaign: values.joinCampaign ? { slug: LISTABLE_CAMPAIGN.slug, name: LISTABLE_CAMPAIGN.name } : null,
  };
}

function ListingPreview({ control }: { control: Control<ListingValues> }) {
  const values = useWatch({ control }) as ListingValues;
  return (
    <aside aria-label="Live preview" className="hidden lg:block">
      <div className="sticky top-24">
        <p className="mb-3 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">Live preview · how players will see it</p>
        <GameCard game={previewOf(values)} />
      </div>
    </aside>
  );
}

function CheckYourEmail({ receipt, email }: { receipt: ListingReceipt; email: string }) {
  return (
    <section className="mx-auto grid max-w-lg gap-6 rounded-lg border border-border bg-card p-6" aria-labelledby="check-email-title">
      <span className="grid size-12 place-items-center rounded-full bg-secondary text-primary">
        <Mail className="size-6" aria-hidden />
      </span>
      <div>
        <h2 id="check-email-title" className="font-display text-3xl" tabIndex={-1} ref={(heading) => heading?.focus()}>
          Check your email
        </h2>
        <p className="mt-2 text-muted-foreground">
          We sent a confirmation link to <span className="font-semibold text-foreground">{email}</span>. Your game goes live once you open it.
        </p>
      </div>
      {!receipt.emailSent && (
        <p role="alert" className="flex gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> We couldn’t send that email. Resend the link below.
        </p>
      )}
      <div className="border-t border-border pt-5">
        <p className="mb-3 text-sm text-muted-foreground">Didn’t get it? Check spam, then resend.</p>
        <ResendLinkForm gameId={receipt.game.id} defaultEmail={email} label="Resend confirmation link" />
      </div>
    </section>
  );
}
