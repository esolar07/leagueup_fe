"use client";

import { cn } from "@/lib/utils";

export interface ChoiceOption<T extends string> {
  value: T;
  label: string;
}

interface ChoiceChipsProps<T extends string> {
  name: string;
  legend: string;
  options: ChoiceOption<T>[];
  value: T;
  onChange: (value: T) => void;
  hideLegend?: boolean;
}

/**
 * Single-choice pills. Native radio inputs underneath, so arrow keys, focus and screen
 * readers behave like any radio group.
 */
export function ChoiceChips<T extends string>({ name, legend, options, value, onChange, hideLegend }: ChoiceChipsProps<T>) {
  return (
    <fieldset>
      <legend className={cn("mb-2 text-sm font-medium", hideLegend && "sr-only")}>{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option.value} className="relative">
            <input type="radio" name={name} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} className="peer sr-only" />
            <span
              className={cn(
                "inline-flex h-10 cursor-pointer items-center rounded-full border border-input bg-input/30 px-4 text-sm font-medium transition-colors hover:bg-input/50",
                "peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
              )}
            >
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
