"use client";
import { Button } from "@/components/ui/button";
import { useTripsFiltersStore } from "@/store/tripsFiltersStore";
import { quickPicks } from "@/lib/dateQuickPicks";

export default function QuickDateChips() {
  const { filters, setMany } = useTripsFiltersStore();
  const apply = (fn: () => { start: string; end: string }) => {
    const { start, end } = fn();
    setMany({ startDate: start, endDate: end });
  };

  // Check if a chip is active by comparing dates
  const isChipActive = (chipFn: () => { start: string; end: string }) => {
    const { start, end } = chipFn();
    return filters.startDate === start && filters.endDate === end;
  };

  return (
    <div className="flex flex-wrap gap-2" data-testid="quick-date-chips">
      <Button 
        variant={isChipActive(quickPicks.thisWeekend) ? "default" : "outline"} 
        size="sm" 
        onClick={() => apply(quickPicks.thisWeekend)}
        data-testid="btn-this-weekend"
      >
        This Weekend
      </Button>
      <Button 
        variant={isChipActive(quickPicks.nextWeek) ? "default" : "outline"} 
        size="sm" 
        onClick={() => apply(quickPicks.nextWeek)}
        data-testid="btn-next-week"
      >
        Next Week
      </Button>
      <Button 
        variant={isChipActive(quickPicks.upcomingHolidays) ? "default" : "outline"} 
        size="sm" 
        onClick={() => apply(quickPicks.upcomingHolidays)}
        data-testid="btn-upcoming-holidays"
      >
        Upcoming Holidays
      </Button>
    </div>
  );
}