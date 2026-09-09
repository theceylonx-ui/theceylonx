/**
 * Safely formats a date-like value, falling back instead of rendering "Invalid Date"
 * when the value is missing or unparseable.
 */
function toValidDate(value: unknown): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value as string);
  return isNaN(date.getTime()) ? null : date;
}

export function formatMemberSince(value: unknown, fallback = "Recently"): string {
  const date = toValidDate(value);
  if (!date) return fallback;
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function formatShortDate(value: unknown, fallback = "Recently"): string {
  const date = toValidDate(value);
  if (!date) return fallback;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
