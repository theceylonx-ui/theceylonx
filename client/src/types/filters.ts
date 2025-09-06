export type TripsFilters = {
  q: string;                 // text search
  from: string | null;       // city code or name
  to: string | null;         // city code or name
  region: string | null;     // e.g., "Central", "North", ...
  startDate: string | null;  // ISO date (yyyy-mm-dd)
  endDate: string | null;    // ISO date (yyyy-mm-dd)
  maxPrice: number | null;   // maximum price in LKR (0 = show all)
};