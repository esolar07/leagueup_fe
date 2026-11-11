"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MailCheck } from "lucide-react";
import { applyApiError } from "@/components/forms/apply-api-error";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { gamesApi } from "../api";
import { resendLinkSchema } from "../schemas";

export const RESEND_RATE_LIMIT_MESSAGE =
  "Too many attempts, or too many unconfirmed listings for this email. Confirm a listing from your inbox, or wait a few minutes and try again.";

/**
 * POST /games/:id/resend-link always answers `{ accepted: true }`, so we never say whether
 * the email matched the organizer's — only that a link is on its way if it did.
 */
export function ResendLinkForm({ gameId, defaultEmail = "", label = "Resend link" }: { gameId: string; defaultEmail?: string; label?: string }) {
  const [sent, setSent] = useState(false);
  const form = useForm<{ email: string }>({ resolver: zodResolver(resendLinkSchema), defaultValues: { email: defaultEmail } });
  const { errors, isSubmitting } = form.formState;
  async function onSubmit({ email }: { email: string }) {
    try {
      await gamesApi.resendLink(gameId, email);
      setSent(true);
    } catch (error) {
      applyApiError(error, form.setError, (field) => (field === "email" ? "email" : undefined), { RATE_LIMITED: RESEND_RATE_LIMIT_MESSAGE });
    }
  }
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-3">
      <TextField id="resend-email" label="Organizer email" type="email" autoComplete="email" registration={form.register("email")} error={errors.email} />
      <FieldError errors={[errors.root]} />
      <Button type="submit" variant="outline" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin" aria-hidden />} {label}
      </Button>
      {sent && (
        <p role="status" className="flex items-start gap-2 text-sm text-muted-foreground">
          <MailCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          If that’s the organizer email for this game, a new link is on its way. Check your inbox and spam folder.
        </p>
      )}
    </form>
  );
}
