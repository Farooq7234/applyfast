import { format } from "date-fns";

export const MAX_SCHEDULE_DAYS = 30;
export const MIN_SCHEDULE_LEAD_MS = 60 * 1000;
export const MAX_SCHEDULE_LEAD_MS = MAX_SCHEDULE_DAYS * 24 * 60 * 60 * 1000;
export const FOLLOW_UP_DELAY_MS = 5 * 24 * 60 * 60 * 1000;

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

export function scheduledFollowUpDate(scheduledAt: Date): Date {
  return new Date(scheduledAt.getTime() + FOLLOW_UP_DELAY_MS);
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
