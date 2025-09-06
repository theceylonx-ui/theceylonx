export type TripsFilters = {
  q: string;                 // text search
  from: string | null;       // city code or name
  to: string | null;         // city code or name
  region: string | null;     // e.g., "Central", "North", ...
  startDate: string | null;  // ISO date (yyyy-mm-dd)
  endDate: string | null;    // ISO date (yyyy-mm-dd)
  priceMin: number | null;   // in LKR
  priceMax: number | null;   // in LKR
};