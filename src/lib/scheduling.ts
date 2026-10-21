import { format } from "date-fns";

const MAX_SCHEDULE_DAYS = 30;
const MIN_SCHEDULE_LEAD_MS = 60 * 1000;
const MAX_SCHEDULE_LEAD_MS = MAX_SCHEDULE_DAYS * 24 * 60 * 60 * 1000;

export function getScheduledAtError(value: string, now = Date.now()): string | null {
  if (!value.trim()) return "Choose a date and time";

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "Choose a valid date and time";

  if (timestamp < now + MIN_SCHEDULE_LEAD_MS) {
    return "Schedule the email at least a minute from now";
  }

  if (timestamp > now + MAX_SCHEDULE_LEAD_MS) {
    return `Resend allows scheduling up to ${MAX_SCHEDULE_DAYS} days in advance`;
  }

  return null;
}

export function toDateTimeLocalValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDateTimeLocalValue(value: string): string {
  return new Date(value).toISOString();
}

export function getScheduleBounds(now = new Date()) {
  return {
    min: toDateTimeLocalValue(
      new Date(now.getTime() + MIN_SCHEDULE_LEAD_MS + 60 * 1000),
    ),
    max: toDateTimeLocalValue(new Date(now.getTime() + MAX_SCHEDULE_LEAD_MS)),
  };
}

export function formatScheduledAt(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return format(date, "MMM d, yyyy 'at' h:mm a");
}

export type SchedulePreset = {
  label: string;
  value: string;
};

export function getSchedulePresets(now = new Date()): SchedulePreset[] {
  function at(dayOffset: number, hour: number, minute = 0) {
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);
    date.setHours(hour, minute, 0, 0);
    return date;
  }

  const nextMonday = new Date(now);
  const daysUntilMonday = (8 - nextMonday.getDay()) % 7 || 7;
  nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
  nextMonday.setHours(8, 0, 0, 0);

  const candidates: Array<{ label: string; date: Date }> = [
    { label: "Tomorrow 8:00 AM", date: at(1, 8) },
    { label: "Tomorrow 12:00 PM", date: at(1, 12) },
    { label: "Tomorrow 6:00 PM", date: at(1, 18) },
    { label: "Monday 8:00 AM", date: nextMonday },
  ];

  const seen = new Set<number>();
  const minimum = now.getTime() + MIN_SCHEDULE_LEAD_MS;

  return candidates.flatMap((candidate) => {
    const timestamp = candidate.date.getTime();
    if (timestamp < minimum || seen.has(timestamp)) return [];
    seen.add(timestamp);
    return [
      {
        label: candidate.label,
        value: toDateTimeLocalValue(candidate.date),
      },
    ];
  });
}
