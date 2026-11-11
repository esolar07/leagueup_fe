import type { ReactNode } from "react";
import { Logo } from "@/components/layout/logo";

/** Focused layout for sign-in flows: no navigation competing with the form. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="field-lines flex flex-1 flex-col">
      <header className="mx-auto flex h-16 w-full items-center px-4 sm:px-6 lg:px-10">
        <Logo preload />
      </header>
      <main className="flex flex-1 items-start justify-center px-4 py-8 sm:items-center sm:py-12">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-2xl shadow-black/30 sm:p-8">{children}</div>
      </main>
    </div>
  );
}
