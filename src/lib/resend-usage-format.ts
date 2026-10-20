import { format, formatDistanceToNowStrict, isValid } from "date-fns";

export type UsageTone = "default" | "warning" | "danger";

export function usagePercent(used: number, limit: number | null): number | null {
  if (limit === null || limit <= 0) return null;
  return Math.min(100, Math.round((used / limit) * 100));
}

export function usageTone(percent: number | null): UsageTone {
  if (percent === null) return "default";
  if (percent >= 90) return "danger";
  if (percent >= 70) return "warning";
  return "default";
}

export function formatResetRelative(resetsAt: string): string {
  const date = new Date(resetsAt);
  if (!isValid(date)) return "at an unknown time";
  return `in ${formatDistanceToNowStrict(date)}`;
}

export function formatResetExact(resetsAt: string): string {
  const date = new Date(resetsAt);
  return isValid(date) ? format(date, "PPpp") : resetsAt;
}

export function formatNumber(value: number): string {
  return value.toLocaleString();
}

export function formatLimit(limit: number | null): string {
  return limit === null ? "Unlimited" : formatNumber(limit);
}
