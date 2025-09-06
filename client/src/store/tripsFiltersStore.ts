import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TripsFilters } from "@/types/filters";

const DEFAULTS: TripsFilters = {
  q: "",
  from: null,
  to: null,
  region: null,
  startDate: null,
  endDate: null,
  priceMin: null,
  priceMax: null,
};

type State = {
  filters: TripsFilters;
  resultsCount: number;       // updated by TripList after fetch
  set<K extends keyof TripsFilters>(key: K, val: TripsFilters[K]): void;
  setMany(vals: Partial<TripsFilters>): void;
  clearAll(): void;
  setResultsCount(n: number): void;
};

export const useTripsFiltersStore = create<State>()(
  persist(
    (set, get) => ({
      filters: DEFAULTS,
      resultsCount: 0,
      set: (key, val) => set({ filters: { ...get().filters, [key]: val } }),
      setMany: (vals) => set({ filters: { ...get().filters, ...vals } }),
      clearAll: () => set({ filters: DEFAULTS }),
      setResultsCount: (n) => set({ resultsCount: n }),
    }),
    { name: "trips-filters" }
  )
);