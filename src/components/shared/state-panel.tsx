import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatePanelProps {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  tone?: "neutral" | "error";
  className?: string;
}

/** One layout for empty and error states, so every page handles "nothing here" and "it broke" the same way. */
export function StatePanel({ icon: Icon, title, description, action, tone = "neutral", className }: StatePanelProps) {
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className={cn("flex flex-col items-center rounded-lg border border-dashed border-border px-6 py-12 text-center", className)}
    >
      <span className={cn("mb-4 grid size-12 place-items-center rounded-full bg-secondary", tone === "error" ? "text-destructive" : "text-primary")}>
        <Icon className="size-6" aria-hidden />
      </span>
      <h2 className="font-display text-2xl">{title}</h2>
      {description && <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
