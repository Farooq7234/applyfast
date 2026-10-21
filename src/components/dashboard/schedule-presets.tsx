"use client";

import { getSchedulePresets } from "@/lib/scheduling";
import { cn } from "@/lib/utils";

export function SchedulePresetButtons({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const presets = getSchedulePresets();
  if (presets.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {presets.map((preset) => {
        const active = value === preset.value;
        return (
          <button
            key={preset.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(preset.value)}
            className={cn(
              "border px-2 py-1 text-xs transition-colors disabled:pointer-events-none disabled:opacity-50",
              active
                ? "border-foreground bg-secondary text-foreground"
                : "border-border text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
            )}
          >
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}
