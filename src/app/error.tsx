"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatePanel } from "@/components/shared/state-panel";

export default function RootError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-16">
      <StatePanel
        icon={TriangleAlert}
        tone="error"
        title="Something went wrong"
        description="We couldn't load this page. If LeagueUp's servers are down, try again in a moment."
        action={<Button onClick={reset}>Try again</Button>}
      />
    </div>
  );
}
