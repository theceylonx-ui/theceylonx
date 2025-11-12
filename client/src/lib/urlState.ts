import { TripsFilters } from "@/types/filters";

export function encodeFiltersToQuery(f: TripsFilters): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.from) p.set("from", f.from);
  if (f.to) p.set("to", f.to);
  if (f.region) p.set("region", f.region);
  if (f.category) p.set("category", f.category);
  if (f.startDate) p.set("start", f.startDate);
  if (f.endDate) p.set("end", f.endDate);
  if (f.maxPrice != null) p.set("maxPrice", String(f.maxPrice));
  // Advanced filters
  if (f.duration) p.set("duration", f.duration);
  if (f.difficulty && f.difficulty.length > 0) p.set("difficulty", f.difficulty.join(","));
  if (f.interests && f.interests.length > 0) p.set("interests", f.interests.join(","));
  if (f.groupSizeMin != null) p.set("groupMin", String(f.groupSizeMin));
  if (f.groupSizeMax != null) p.set("groupMax", String(f.groupSizeMax));
  if (f.daysRange != null) p.set("days", String(f.daysRange));
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function decodeFiltersFromQuery(search: string): Partial<TripsFilters> {
  const q = new URLSearchParams(search);
  const pick = (k: string) => q.get(k);
  const n = (k: string) => {
    const v = q.get(k); if (v == null) return null;
    const num = Number(v); return Number.isFinite(num) ? num : null;
  };
  const arr = (k: string) => {
    const v = q.get(k);
    return v ? v.split(",").filter(Boolean) : [];
  };
  return {
    q: pick("q") ?? "",
    from: pick("from"),
    to: pick("to"),
    region: pick("region"),
    category: pick("category"),
    startDate: pick("start"),
    endDate: pick("end"),
    maxPrice: n("maxPrice"),
    // Advanced filters
    duration: pick("duration"),
    difficulty: arr("difficulty"),
    interests: arr("interests"),
    groupSizeMin: n("groupMin"),
    groupSizeMax: n("groupMax"),
    daysRange: n("days"),
  };
}