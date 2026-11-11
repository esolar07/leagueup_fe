"use client";

import { useId, useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/api/client";
import { friendlyErrorMessage } from "@/lib/api/error-messages";

/**
 * TEMPORARY, self-contained: optional "keep me posted" signup (POST /email-captures).
 * It never gates browsing. To remove it, delete this folder and its one usage.
 */
export function EmailCaptureForm() {
  const id = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setStatus("sending");
    setError(null);
    try {
      await apiRequest<{ captured: true }>("/email-captures", { method: "POST", body: { email: email.trim() } });
      setStatus("done");
    } catch (caught) {
      setError(friendlyErrorMessage(caught));
      setStatus("idle");
    }
  }
  return (
    <section aria-labelledby={`${id}-title`} className="rounded-lg border border-border bg-card p-5 sm:p-6">
      <h2 id={`${id}-title`} className="font-display flex items-center gap-2 text-xl">
        <Mail className="size-5 text-primary" aria-hidden /> Get new games in your inbox
      </h2>
      {status === "done" ? (
        <p className="mt-3 flex items-center gap-2 text-sm" role="status">
          <CheckCircle2 className="size-4 text-primary" aria-hidden /> You’re on the list. We’ll let you know when new games go up.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="grid flex-1 gap-1.5">
            <Label htmlFor={`${id}-email`} className="sr-only">Email</Label>
            <Input id={`${id}-email`} type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} />
            {error && <p id={`${id}-error`} role="alert" className="text-sm text-destructive">{error}</p>}
          </div>
          <Button type="submit" variant="outline" className="h-11" disabled={status === "sending"}>
            {status === "sending" && <Loader2 className="animate-spin" aria-hidden />} Keep me posted
          </Button>
        </form>
      )}
      <p className="mt-2 text-xs text-muted-foreground">Optional. You don’t need an email to browse or view games.</p>
    </section>
  );
}
