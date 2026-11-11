import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import wordmark from "../../../public/brand/leagueup-wordmark.png";

/** Official LeagueUp wordmark, linked home. Size it with a height class (width follows). */
export function Logo({ className, preload }: { className?: string; preload?: boolean }) {
  return (
    <Link href="/" className="inline-flex shrink-0 items-center rounded-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
      <Image src={wordmark} alt="LeagueUp" preload={preload} className={cn("h-7 w-auto", className)} />
    </Link>
  );
}
