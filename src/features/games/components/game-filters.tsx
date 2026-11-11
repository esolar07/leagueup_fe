"use client";

import { useId, useState, type FormEvent } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { ChoiceChips, type ChoiceOption } from "@/components/forms/choice-chips";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SKILL_LEVELS, type GameFilters } from "../filters";
import { SKILL_LEVEL_LABELS } from "../game-state";
import type { GameSort, SkillLevel } from "../types";

const SKILL_OPTIONS: ChoiceOption<SkillLevel | "">[] = [
  { value: "", label: "Any level" },
  ...SKILL_LEVELS.map((level) => ({ value: level, label: SKILL_LEVEL_LABELS[level] })),
];

const SORT_OPTIONS: ChoiceOption<GameSort>[] = [
  { value: "startDateTime", label: "Soonest" },
  { value: "-createdAt", label: "Newest listed" },
];

function hasMoreFilters(filters: GameFilters): boolean {
  return Boolean(filters.city || filters.postalCode || filters.skillLevel || filters.hasSpots || filters.sort);
}

/** Edits a draft; nothing hits the URL (or the API) until Search. Clear resets everything. */
export function GameFiltersForm({ filters, onApply }: { filters: GameFilters; onApply: (filters: GameFilters) => void }) {
  const id = useId();
  const [draft, setDraft] = useState(filters);
  const [expanded, setExpanded] = useState(() => hasMoreFilters(filters));
  const update = (changes: Partial<GameFilters>) => setDraft((current) => ({ ...current, ...changes }));
  function submit(event: FormEvent) {
    event.preventDefault();
    onApply({ ...draft, page: undefined });
  }
  function clear() {
    setDraft({});
    onApply({});
  }
  return (
    <form onSubmit={submit} role="search" aria-label="Find games" className="rounded-lg border border-border bg-card p-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_200px_auto]">
        <div className="relative">
          <Label htmlFor={`${id}-q`} className="sr-only">Search games</Label>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input id={`${id}-q`} type="search" placeholder="Search by game, park or city" value={draft.q ?? ""} onChange={(event) => update({ q: event.target.value })} className="pl-9" />
        </div>
        <div>
          <Label htmlFor={`${id}-date`} className="sr-only">Date</Label>
          <Input id={`${id}-date`} type="date" value={draft.date ?? ""} onChange={(event) => update({ date: event.target.value || undefined, until: undefined })} />
        </div>
        <Button type="submit" size="lg" className="h-11">
          <Search aria-hidden /> Search
        </Button>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <Button type="button" variant="ghost" size="sm" aria-expanded={expanded} aria-controls={`${id}-more`} onClick={() => setExpanded((open) => !open)}>
          <SlidersHorizontal aria-hidden /> {expanded ? "Fewer filters" : "More filters"}
        </Button>
        <Button type="button" variant="link" size="sm" onClick={clear}>
          Clear all
        </Button>
      </div>
      {expanded && (
        <div id={`${id}-more`} className="mt-4 grid gap-5 border-t border-border pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor={`${id}-city`}>City</Label>
              <Input id={`${id}-city`} placeholder="City" value={draft.city ?? ""} onChange={(event) => update({ city: event.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${id}-zip`}>ZIP code</Label>
              <Input id={`${id}-zip`} inputMode="numeric" maxLength={5} pattern="\d{5}" title="5-digit ZIP code" placeholder="33155" value={draft.postalCode ?? ""} onChange={(event) => update({ postalCode: event.target.value })} />
            </div>
          </div>
          <ChoiceChips name={`${id}-skill`} legend="Skill level" options={SKILL_OPTIONS} value={draft.skillLevel ?? ""} onChange={(value) => update({ skillLevel: value || undefined })} />
          <ChoiceChips name={`${id}-sort`} legend="Sort by" options={SORT_OPTIONS} value={draft.sort ?? "startDateTime"} onChange={(sort) => update({ sort })} />
          <div className="flex items-center gap-3">
            <Switch id={`${id}-spots`} checked={Boolean(draft.hasSpots)} onCheckedChange={(checked) => update({ hasSpots: checked || undefined })} />
            <Label htmlFor={`${id}-spots`}>Only games with open spots</Label>
          </div>
        </div>
      )}
    </form>
  );
}
