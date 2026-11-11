"use client";

import { useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import type { VariantProps } from "class-variance-authority";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, type buttonVariants } from "@/components/ui/button";

interface ConfirmActionProps {
  trigger: ReactNode;
  triggerVariant?: VariantProps<typeof buttonVariants>["variant"];
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** Resolve to close the dialog; throw (after reporting the error) to keep it open. */
  onConfirm: () => Promise<void>;
}

/** A button that asks before doing something that can't be undone. */
export function ConfirmAction({ trigger, triggerVariant = "outline", title, description, confirmLabel, cancelLabel = "Keep it", onConfirm }: ConfirmActionProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  async function confirm() {
    setPending(true);
    try {
      await onConfirm();
      setOpen(false);
    } catch {
    } finally {
      setPending(false);
    }
  }
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant={triggerVariant} />}>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={confirm} disabled={pending}>
            {pending && <Loader2 className="animate-spin" aria-hidden />} {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
