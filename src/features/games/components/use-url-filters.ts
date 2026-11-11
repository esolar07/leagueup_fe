"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { filtersToSearchParams, parseFilters, type GameFilters } from "../filters";

/** Filters as stored in the URL. `key` changes with the URL, to reset draft forms on back/forward. Render inside <Suspense>. */
export function useUrlFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const filters = useMemo(() => parseFilters(new URLSearchParams(searchParams.toString())), [searchParams]);
  const hrefFor = (next: GameFilters) => `${pathname}${filtersToSearchParams(next).size ? `?${filtersToSearchParams(next)}` : ""}`;
  return { filters, key: searchParams.toString(), hrefFor, apply: (next: GameFilters) => router.push(hrefFor(next), { scroll: false }) };
}
