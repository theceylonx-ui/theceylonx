import { TripsFilters } from "@/types/filters";

export function encodeFiltersToQuery(f: TripsFilters): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.from) p.set("from", f.from);
  if (f.to) p.set("to", f.to);
  if (f.region) p.set("region", f.region);
  if (f.startDate) p.set("start", f.startDate);
  if (f.endDate) p.set("end", f.endDate);
  if (f.maxPrice != null) p.set("maxPrice", String(f.maxPrice));
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
  return {
    q: pick("q") ?? "",
    from: pick("from"),
    to: pick("to"),
    region: pick("region"),
    startDate: pick("start"),
    endDate: pick("end"),
    maxPrice: n("maxPrice"),
  };
}