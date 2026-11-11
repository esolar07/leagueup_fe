"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";
import { CalendarDays, MapPin, Search, Users, Zap, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { Campaign } from "@/config/campaigns";
import { cn } from "@/lib/utils";
import { formatLocation, parseLocationInput, SKILL_LEVELS, type GameFilters } from "../filters";
import { SKILL_LEVEL_LABELS } from "../game-state";
import { useUrlFilters } from "./use-url-filters";

const ANY = "any";
const SKILL_ITEMS: Record<string, string> = { [ANY]: "All levels", ...Object.fromEntries(SKILL_LEVELS.map((level) => [level, SKILL_LEVEL_LABELS[level]])) };
const PLAYER_ITEMS: Record<string, string> = { [ANY]: "Any", open: "Still needs players" };

const SEGMENT = "flex min-w-0 items-center gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-muted/40 xl:border-l xl:border-border xl:first:border-l-0";
const SEGMENT_LABEL = "block font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase";

function dateItems(campaign: Campaign): Record<string, string> {
  return { [ANY]: "Any date", ...Object.fromEntries(campaign.datePresets.map((preset) => [preset.label, preset.label])) };
}

function presetFor(campaign: Campaign, filters: GameFilters): string {
  const match = campaign.datePresets.find((preset) => preset.from === filters.date && preset.until === (filters.until ?? filters.date));
  return match?.label ?? ANY;
}

function dateFilters(campaign: Campaign, presetLabel: string): Pick<GameFilters, "date" | "until"> {
  const preset = campaign.datePresets.find(({ label }) => label === presetLabel);
  return preset ? { date: preset.from, until: preset.until } : {};
}

interface SelectSegmentProps {
  icon: LucideIcon;
  label: string;
  items: Record<string, string>;
  value: string;
  onChange: (value: string) => void;
}

/** The trigger is a combobox, which can't take its name from its content: label it with "Date" + the current value. */
function SelectSegment({ icon: Icon, label, items, value, onChange }: SelectSegmentProps) {
  const id = useId();
  return (
    <Select items={items} value={value} onValueChange={(next) => onChange(next ?? ANY)}>
      <SelectTrigger aria-labelledby={`${id}-label ${id}-value`} className={cn(SEGMENT, "h-auto w-full justify-start border-0 bg-transparent text-left dark:bg-transparent dark:hover:bg-muted/40")}>
        <Icon className="size-5! shrink-0 text-primary" aria-hidden />
        <span className="grid min-w-0 flex-1">
          <span id={`${id}-label`} className={SEGMENT_LABEL}>
            {label}
          </span>
          <SelectValue id={`${id}-value`} className="truncate text-base font-semibold text-foreground" />
        </span>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(items).map(([itemValue, itemLabel]) => (
          <SelectItem key={itemValue} value={itemValue}>
            {itemLabel}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function LocationSegment({ id, value, onChange }: { id: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className={cn(SEGMENT, "focus-within:bg-muted/40 sm:col-span-2 xl:col-span-1")}>
      <MapPin className="size-5 shrink-0 text-primary" aria-hidden />
      <div className="grid min-w-0 flex-1">
        <label htmlFor={id} className={SEGMENT_LABEL}>
          Location
        </label>
        <input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="City or ZIP"
          autoComplete="address-level2"
          className="w-full min-w-0 bg-transparent text-base font-semibold outline-none placeholder:text-foreground"
        />
      </div>
    </div>
  );
}

function CampaignFilterForm({ campaign, filters, onApply }: { campaign: Campaign; filters: GameFilters; onApply: (filters: GameFilters) => void }) {
  const id = useId();
  const [location, setLocation] = useState(formatLocation(filters));
  const [datePreset, setDatePreset] = useState(presetFor(campaign, filters));
  const [skillLevel, setSkillLevel] = useState<string>(filters.skillLevel ?? ANY);
  const [players, setPlayers] = useState(filters.hasSpots ? "open" : ANY);
  function submit(event: FormEvent) {
    event.preventDefault();
    const skill = skillLevel === ANY ? undefined : (skillLevel as GameFilters["skillLevel"]);
    onApply({ q: filters.q, sort: filters.sort, ...parseLocationInput(location), ...dateFilters(campaign, datePreset), skillLevel: skill, hasSpots: players === "open" || undefined });
  }
  return (
    <FilterBarFrame onSubmit={submit} label={`Find ${campaign.name} games`}>
      <LocationSegment id={`${id}-location`} value={location} onChange={setLocation} />
      <SelectSegment icon={CalendarDays} label="Date" items={dateItems(campaign)} value={datePreset} onChange={setDatePreset} />
      <SelectSegment icon={Zap} label="Skill level" items={SKILL_ITEMS} value={skillLevel} onChange={setSkillLevel} />
      <SelectSegment icon={Users} label="Players needed" items={PLAYER_ITEMS} value={players} onChange={setPlayers} />
      <Button type="submit" size="lg" className="h-14 rounded-lg px-8 font-bold tracking-wider uppercase sm:col-span-2 xl:col-span-1 xl:ml-2">
        <Search aria-hidden /> Search
      </Button>
    </FilterBarFrame>
  );
}

function FilterBarFrame({ onSubmit, label, children }: { onSubmit?: (event: FormEvent) => void; label: string; children: ReactNode }) {
  return (
    <form
      onSubmit={onSubmit}
      role="search"
      aria-label={label}
      className="grid gap-1 rounded-2xl border border-border bg-card/95 p-2 shadow-2xl shadow-black/40 backdrop-blur sm:grid-cols-2 xl:grid-cols-[1.25fr_1.35fr_1fr_1.1fr_auto] xl:items-center"
    >
      {children}
    </form>
  );
}

/** Location · Date · Skill level · Players needed, for a campaign hub. Writes the same URL filters the results read. */
export function CampaignFilterBar({ campaign }: { campaign: Campaign }) {
  const { filters, key, apply } = useUrlFilters();
  return <CampaignFilterForm key={key} campaign={campaign} filters={filters} onApply={apply} />;
}

export function CampaignFilterBarSkeleton() {
  return <Skeleton className="h-[148px] rounded-2xl md:h-[76px]" aria-label="Loading filters" />;
}
