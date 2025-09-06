import { formatISO, addDays, nextMonday, nextSaturday } from "date-fns";

// Returns ISO yyyy-mm-dd (no time)
const iso = (d: Date) => formatISO(d, { representation: "date" });

export const quickPicks = {
  thisWeekend(): { start: string; end: string } {
    const now = new Date();
    const sat = nextSaturday(now);
    const end = addDays(sat, 1); // Sunday
    return { start: iso(sat), end: iso(end) };
  },
  nextWeek(): { start: string; end: string } {
    const start = nextMonday(new Date());
    const end = addDays(start, 7);
    return { start: iso(start), end: iso(end) };
  },
  // Placeholder. Wire real holidays later.
  upcomingHolidays(): { start: string; end: string } {
    const start = addDays(new Date(), 14);
    const end = addDays(start, 3);
    return { start: iso(start), end: iso(end) };
  },
};