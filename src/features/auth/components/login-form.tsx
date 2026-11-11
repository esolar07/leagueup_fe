"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import { FieldError, FieldGroup } from "@/components/ui/field";
import { loginAction } from "../actions";
import { loginSchema, type LoginInput } from "../schemas";
import { applyFailure } from "./apply-failure";

const FIELDS = ["email", "password"] as const;

export function LoginForm({ next }: { next?: string }) {
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: LoginInput) {
    const failure = await loginAction(values, next);
    if (failure) applyFailure(failure, form.setError, FIELDS);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <TextField id="email" label="Email" type="email" autoComplete="email" registration={form.register("email")} error={errors.email} />
        <TextField id="password" label="Password" type="password" autoComplete="current-password" registration={form.register("password")} error={errors.password} />
        <FieldError errors={[errors.root]} />
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          New to LeagueUp?{" "}
          <Link href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"} className="font-semibold text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </FieldGroup>
    </form>
  );
}
