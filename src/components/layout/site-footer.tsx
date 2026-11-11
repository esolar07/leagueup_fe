import { cacheLife } from "next/cache";
import { Logo } from "./logo";

/** Cached so the footer stays in the static shell; the year changes once a year. */
async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full flex-col gap-3 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:w-[90%] lg:px-0">
        <div>
          <Logo className="h-6" />
          <p className="mt-2 text-sm text-muted-foreground">Recreational flag football.</p>
        </div>
        <p className="text-xs text-muted-foreground">© <CopyrightYear /> LeagueUp</p>
      </div>
    </footer>
  );
}
