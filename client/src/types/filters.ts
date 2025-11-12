export type TripsFilters = {
  q: string;                 // text search
  from: string | null;       // city code or name
  to: string | null;         // city code or name
  region: string | null;     // e.g., "Central", "North", ...
  category: string | null;   // trip category
  startDate: string | null;  // ISO date (yyyy-mm-dd)
  endDate: string | null;    // ISO date (yyyy-mm-dd)
  maxPrice: number | null;   // maximum price in LKR (0 = show all)
  // Advanced filters
  duration: string | null;   // e.g., "half-day", "full-day", "multi-day"
  difficulty: string[];      // e.g., ["easy", "moderate"]
  interests: string[];       // e.g., ["beach", "culture", "adventure"]
  groupSizeMin: number | null;  // minimum preferred group size
  groupSizeMax: number | null;  // maximum preferred group size
  daysRange: number | null;  // flexible date range (e.g., 7 for "next 7 days")
};