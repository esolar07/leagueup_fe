import type { ComponentProps } from "react";
import type { FieldError as FormFieldError, UseFormRegisterReturn } from "react-hook-form";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface TextFieldProps extends Omit<ComponentProps<typeof Input>, "id" | keyof UseFormRegisterReturn> {
  id: string;
  label: string;
  registration: UseFormRegisterReturn;
  error?: FormFieldError;
  description?: string;
}

/** A labelled input wired to React Hook Form, with accessible error and hint text. */
export function TextField({ id, label, registration, error, description, ...inputProps }: TextFieldProps) {
  const describedBy = [description && `${id}-description`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input id={id} aria-invalid={Boolean(error)} aria-describedby={describedBy} {...registration} {...inputProps} />
      {description && <FieldDescription id={`${id}-description`}>{description}</FieldDescription>}
      <FieldError id={`${id}-error`} errors={[error]} />
    </Field>
  );
}
