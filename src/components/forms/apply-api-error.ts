import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { toast } from "sonner";
import { bodyFieldErrors, friendlyErrorMessage, type ErrorMessageOverrides } from "@/lib/api/error-messages";

/**
 * Maps backend `body.<field>` validation errors onto form fields (via `fieldFor`, which
 * translates API field names into form field names). Anything that doesn't map becomes
 * a form-level error and a toast.
 */
export function applyApiError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fieldFor: (apiField: string) => Path<T> | undefined,
  overrides?: ErrorMessageOverrides,
) {
  const mapped = Object.entries(bodyFieldErrors(error)).flatMap(([apiField, message]) => {
    const field = fieldFor(apiField);
    return field ? [[field, message] as const] : [];
  });
  for (const [field, message] of mapped) setError(field, { message });
  const message = friendlyErrorMessage(error, overrides);
  if (mapped.length === 0) setError("root", { message });
  toast.error(message);
}
