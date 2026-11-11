import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: ReactNode }) {
  return (
    <header className="mb-8 sm:mb-10">
      {eyebrow && <p className="text-xs font-semibold uppercase tracking-widest text-primary">{eyebrow}</p>}
      <h1 className="font-display mt-1 text-4xl sm:text-5xl">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>}
    </header>
  );
}
