"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Link2Off, Loader2, TriangleAlert } from "lucide-react";
import { StatePanel } from "@/components/shared/state-panel";
import { Button } from "@/components/ui/button";
import { isApiError } from "@/lib/api/client";
import { friendlyErrorMessage } from "@/lib/api/error-messages";
import { forgetToken } from "@/lib/tokens/hash-token";
import { useHashToken } from "@/lib/tokens/use-hash-token";
import type { ListingReceipt } from "../types";
import { recallVerifiedListing, rememberVerifiedListing, verifyListingOnce } from "../verification";
import { ResendLinkForm } from "./resend-link-form";

const TOKEN_SCOPE = "verify";

function useVerification(token: string | null) {
  const query = useQuery({
    queryKey: ["verify-listing", token],
    queryFn: () => verifyListingOnce(token as string),
    enabled: Boolean(token),
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  useEffect(() => {
    if (query.isSuccess) rememberVerifiedListing(query.data);
    if (!query.isPending) forgetToken(TOKEN_SCOPE);
  }, [query.isSuccess, query.isPending, query.data]);
  return query;
}

/** Confirms an organizer's email from the emailed link and publishes the listing. Browser only. */
export function VerifyListing() {
  const token = useHashToken(TOKEN_SCOPE);
  const [remembered] = useState(() => (token ? null : recallVerifiedListing()));
  const query = useVerification(token);
  if (remembered) return <ListingLive receipt={remembered} />;
  if (!token) return <InvalidLink />;
  if (query.isPending) return <Verifying />;
  if (query.isSuccess) return <ListingLive receipt={query.data} />;
  if (isApiError(query.error) && ["UNPROCESSABLE", "VALIDATION_ERROR"].includes(query.error.code)) return <InvalidLink />;
  return <StatePanel icon={TriangleAlert} tone="error" title="Couldn’t confirm your listing" description={`${friendlyErrorMessage(query.error)} Open the link from your email again to retry.`} />;
}

function Verifying() {
  return (
    <div role="status" className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
      <Loader2 className="size-8 animate-spin text-primary" aria-hidden /> Confirming your listing…
    </div>
  );
}

function InvalidLink() {
  return (
    <StatePanel
      icon={Link2Off}
      title="This link is invalid or has expired"
      description="Confirmation links work once. If you already confirmed, your game is live and the manage link is in your inbox. Otherwise, list it again or resend the link from the “Check your email” screen."
      action={<Button nativeButton={false} render={<Link href="/list-your-game" />}>List a game</Button>}
    />
  );
}

function ListingLive({ receipt }: { receipt: ListingReceipt }) {
  return (
    <section className="mx-auto grid max-w-lg gap-5 rounded-lg border border-border bg-card p-6" aria-labelledby="live-title">
      <CheckCircle2 className="size-10 text-primary" aria-hidden />
      <div>
        <h2 id="live-title" className="font-display text-3xl">Your game is live</h2>
        <p className="mt-2 text-muted-foreground">
          {receipt.emailSent
            ? "Players can find it and request to join. Your manage link is on its way to your inbox: use it to approve players and edit the game."
            : "Players can find it now. We couldn’t email your manage link, so request it below."}
        </p>
      </div>
      <Button size="lg" nativeButton={false} render={<Link href={`/games/${receipt.game.slug}`} />}>
        View your game
      </Button>
      {!receipt.emailSent && <ResendLinkForm gameId={receipt.game.id} label="Send my manage link" />}
    </section>
  );
}
