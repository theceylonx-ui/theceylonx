"use client";
import { Slider } from "@/components/ui/slider";
import { useTripsFiltersStore } from "@/store/tripsFiltersStore";
import { formatLKR } from "@/lib/currency";
import { useState, useEffect } from "react";

const MAX_LKR = 100_000; // adjust as needed

export default function PriceRangeSlider() {
  const { filters, setMany } = useTripsFiltersStore();
  const [range, setRange] = useState<[number, number]>([
    filters.priceMin ?? 0, filters.priceMax ?? MAX_LKR
  ]);

  useEffect(() => {
    setRange([filters.priceMin ?? 0, filters.priceMax ?? MAX_LKR]);
  }, [filters.priceMin, filters.priceMax]);

  const onCommit = (v: number[]) => {
    const [min, max] = v as [number, number];
    setMany({ priceMin: min === 0 ? null : min, priceMax: max === MAX_LKR ? null : max });
  };

  return (
    <div className="space-y-2" data-testid="price-range-slider">
      <div className="text-sm text-muted-foreground" data-testid="price-range-display">
        {formatLKR(range[0])} — {formatLKR(range[1])}
      </div>
      <Slider
        min={0} max={MAX_LKR} step={500}
        value={range}
        onValueChange={(v) => setRange(v as [number, number])}
        onValueCommit={onCommit}
        aria-label="Price range in LKR"
        data-testid="price-slider"
      />
    </div>
  );
}