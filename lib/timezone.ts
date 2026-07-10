import { getDb } from "@/lib/db";

/**
 * Compute "today" in the user's configured timezone.
 * Returns a date string in YYYY-MM-DD format.
 */
export function getUserToday(userId: number = 1): string {
  const db = getDb();
  const user = db.prepare("SELECT timezone FROM users WHERE id = ?").get(userId) as
    | { timezone: string }
    | undefined;

  const timezone = user?.timezone ?? "America/New_York";
  return getDateInTimezone(timezone);
}

/**
 * Get the current date string (YYYY-MM-DD) in a given timezone.
 */
export function getDateInTimezone(timezone: string): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // en-CA locale formats as YYYY-MM-DD
  return formatter.format(now);
}
