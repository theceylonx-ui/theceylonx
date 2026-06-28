import { create } from "zustand";
import type { TripsFilters } from "@/types/filters";

export const TRIPS_FILTER_DEFAULTS: TripsFilters = {
  q: "",
  from: null,
  to: null,
  region: null,
  category: null,
  startDate: null,
  endDate: null,
  maxPrice: null,
  duration: null,
  difficulty: [],
  interests: [],
  groupSizeMin: null,
  groupSizeMax: null,
  daysRange: null,
};

type State = {
  filters: TripsFilters;
  resultsCount: number;
  set<K extends keyof TripsFilters>(key: K, val: TripsFilters[K]): void;
  setMany(vals: Partial<TripsFilters>): void;
  clearAll(): void;
  setResultsCount(n: number): void;
};

export const useTripsFiltersStore = create<State>()((set, get) => ({
  filters: TRIPS_FILTER_DEFAULTS,
  resultsCount: 0,
  set: (key, val) => set({ filters: { ...get().filters, [key]: val } }),
  setMany: (vals) => set({ filters: { ...get().filters, ...vals } }),
  clearAll: () => set({ filters: TRIPS_FILTER_DEFAULTS }),
  setResultsCount: (n) => set({ resultsCount: n }),
}));
