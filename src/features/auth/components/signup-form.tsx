"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import { FieldError, FieldGroup } from "@/components/ui/field";
import { signupAction } from "../actions";
import { signupSchema, type SignupInput } from "../schemas";
import { applyFailure } from "./apply-failure";

const FIELDS = ["firstName", "lastName", "email", "password"] as const;

export function SignupForm({ next }: { next?: string }) {
  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "" },
  });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: SignupInput) {
    const failure = await signupAction(values, next);
    if (failure) applyFailure(failure, form.setError, FIELDS);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <div className="grid gap-6 sm:grid-cols-2">
          <TextField id="firstName" label="First name" autoComplete="given-name" registration={form.register("firstName")} error={errors.firstName} />
          <TextField id="lastName" label="Last name" autoComplete="family-name" registration={form.register("lastName")} error={errors.lastName} />
        </div>
        <TextField id="email" label="Email" type="email" autoComplete="email" registration={form.register("email")} error={errors.email} />
        <TextField
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          description="At least 10 characters."
          registration={form.register("password")}
          error={errors.password}
        />
        <FieldError errors={[errors.root]} />
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
          {isSubmitting ? "Creating account…" : "Join LeagueUp"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </FieldGroup>
    </form>
  );
}
