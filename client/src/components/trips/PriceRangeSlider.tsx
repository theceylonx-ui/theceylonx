"use client";
import { Slider } from "@/components/ui/slider";
import { useTripsFiltersStore } from "@/store/tripsFiltersStore";
import { formatLKR } from "@/lib/currency";
import { useState, useEffect } from "react";

const MAX_LKR = 100_000; // adjust as needed

export default function PriceRangeSlider() {
  const { filters, set } = useTripsFiltersStore();
  const [value, setValue] = useState<number>(filters.maxPrice ?? 0);

  useEffect(() => {
    setValue(filters.maxPrice ?? 0);
  }, [filters.maxPrice]);

  const onCommit = (values: number[]) => {
    const maxPrice = values[0];
    // When slider is at 0, we want no price filter (show all prices)
    // When slider is > 0, we want to filter to prices up to that amount
    set("maxPrice", maxPrice === 0 ? null : maxPrice);
  };

  const displayText = value === 0 
    ? `All prices` 
    : `Up to ${formatLKR(value)}`;

  return (
    <div className="space-y-2" data-testid="price-range-slider">
      <div className="text-sm text-muted-foreground" data-testid="price-range-display">
        {displayText}
      </div>
      <Slider
        min={0} 
        max={MAX_LKR} 
        step={500}
        value={[value]}
        onValueChange={(values) => setValue(values[0])}
        onValueCommit={onCommit}
        aria-label="Maximum price filter in LKR"
        data-testid="price-slider"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>All prices</span>
        <span>{formatLKR(MAX_LKR)}</span>
      </div>
    </div>
  );
}