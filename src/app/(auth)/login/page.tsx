import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthFormSkeleton, SignedOutOnly } from "@/features/auth/components/auth-gate";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <>
      <h1 className="font-display text-4xl">Welcome back</h1>
      <p className="mt-2 mb-8 text-muted-foreground">Sign in to get back in the game.</p>
      <Suspense fallback={<AuthFormSkeleton />}>
        <SignedOutOnly searchParams={searchParams}>{(next) => <LoginForm next={next} />}</SignedOutOnly>
      </Suspense>
    </>
  );
}
