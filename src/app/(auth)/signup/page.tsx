import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthFormSkeleton, SignedOutOnly } from "@/features/auth/components/auth-gate";
import { SignupForm } from "@/features/auth/components/signup-form";

export const metadata: Metadata = { title: "Join LeagueUp" };

export default function SignupPage({ searchParams }: PageProps<"/signup">) {
  return (
    <>
      <h1 className="font-display text-4xl">Join LeagueUp</h1>
      <p className="mt-2 mb-8 text-muted-foreground">One account to play, organize and follow the game.</p>
      <Suspense fallback={<AuthFormSkeleton />}>
        <SignedOutOnly searchParams={searchParams}>{(next) => <SignupForm next={next} />}</SignedOutOnly>
      </Suspense>
    </>
  );
}
