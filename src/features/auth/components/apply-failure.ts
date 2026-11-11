import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { toast } from "sonner";
import type { AuthActionFailure } from "../actions";

/** Puts backend field errors on their inputs; anything else becomes a form-level error and a toast. */
export function applyFailure<T extends FieldValues>(failure: AuthActionFailure, setError: UseFormSetError<T>, fields: readonly Path<T>[]) {
  const fieldEntries = Object.entries(failure.fieldErrors ?? {}).filter(([path]) => fields.includes(path as Path<T>));
  for (const [path, message] of fieldEntries) setError(path as Path<T>, { message });
  if (fieldEntries.length === 0) setError("root", { message: failure.message });
  toast.error(failure.message);
}
