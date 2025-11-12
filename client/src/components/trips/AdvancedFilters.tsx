import { useState } from "react";
import { useTripsFiltersStore } from "@/store/tripsFiltersStore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, X, Users, Clock, Mountain, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const INTERESTS_OPTIONS = [
  { value: "beach", label: "Beach", icon: "🏖️" },
  { value: "culture", label: "Culture", icon: "🏛️" },
  { value: "adventure", label: "Adventure", icon: "⛰️" },
  { value: "wildlife", label: "Wildlife", icon: "🦁" },
  { value: "food", label: "Food Tours", icon: "🍜" },
  { value: "festivals", label: "Festivals", icon: "🎉" },
  { value: "wellness", label: "Wellness", icon: "🧘" },
  { value: "photography", label: "Photography", icon: "📸" },
];

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Easy", color: "bg-green-100 text-green-700 border-green-200 hover:bg-green-200" },
  { value: "moderate", label: "Moderate", color: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200" },
  { value: "challenging", label: "Challenging", color: "bg-red-100 text-red-700 border-red-200 hover:bg-red-200" },
];

export default function AdvancedFilters() {
  const { filters, set, setMany } = useTripsFiltersStore();
  const [isOpen, setIsOpen] = useState(false);
  const [groupSizeError, setGroupSizeError] = useState<string | null>(null);

  const toggleDifficulty = (difficulty: string) => {
    const current = filters.difficulty || [];
    const newDifficulties = current.includes(difficulty)
      ? current.filter(d => d !== difficulty)
      : [...current, difficulty];
    set("difficulty", newDifficulties);
  };

  const toggleInterest = (interest: string) => {
    const current = filters.interests || [];
    const newInterests = current.includes(interest)
      ? current.filter(i => i !== interest)
      : [...current, interest];
    set("interests", newInterests);
  };

  const hasAdvancedFilters = 
    filters.duration ||
    (filters.difficulty && filters.difficulty.length > 0) ||
    (filters.interests && filters.interests.length > 0) ||
    filters.groupSizeMin != null ||
    filters.groupSizeMax != null ||
    filters.daysRange != null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2 text-brand hover:text-brand-hover hover:bg-brand-subtle p-0"
            data-testid="btn-toggle-advanced-filters"
          >
            <Sparkles className="h-4 w-4" />
            <span className="font-semibold">Advanced Filters</span>
            {hasAdvancedFilters && (
              <Badge variant="secondary" className="ml-2 bg-brand text-white">
                Active
              </Badge>
            )}
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </Button>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent>
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6 pt-4 border-t"
        >
          <div className="grid gap-4 md:grid-cols-2">
            {/* Duration Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Trip Duration
              </label>
              <Select
                value={filters.duration || "all"}
                onValueChange={(v) => set("duration", v === "all" ? null : v)}
              >
                <SelectTrigger data-testid="select-duration">
                  <SelectValue placeholder="Any duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any duration</SelectItem>
                  <SelectItem value="half-day">Half Day (&lt; 6 hours)</SelectItem>
                  <SelectItem value="full-day">Full Day (6-12 hours)</SelectItem>
                  <SelectItem value="multi-day">Multi-Day (2+ days)</SelectItem>
                  <SelectItem value="overnight">Overnight</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quick Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                📅 Quick Date Range
              </label>
              <Select
                value={filters.daysRange?.toString() || "all"}
                onValueChange={(v) => {
                  if (v === "all") {
                    setMany({ daysRange: null, startDate: null, endDate: null });
                  } else {
                    const days = parseInt(v);
                    // Validate: only allow positive integers
                    if (!isNaN(days) && days > 0 && days <= 365) {
                      setMany({ daysRange: days, startDate: null, endDate: null });
                    }
                  }
                }}
              >
                <SelectTrigger data-testid="select-days-range">
                  <SelectValue placeholder="Any time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any time</SelectItem>
                  <SelectItem value="3">This Weekend (3 days)</SelectItem>
                  <SelectItem value="7">Next Week (7 days)</SelectItem>
                  <SelectItem value="14">Next 2 Weeks</SelectItem>
                  <SelectItem value="30">Next Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Difficulty Level */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Mountain className="h-4 w-4" />
              Difficulty Level
            </label>
            <div className="flex flex-wrap gap-2">
              {DIFFICULTY_OPTIONS.map((option) => (
                <Badge
                  key={option.value}
                  variant={filters.difficulty?.includes(option.value) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-all px-3 py-1.5",
                    filters.difficulty?.includes(option.value)
                      ? option.color
                      : "hover:bg-gray-100"
                  )}
                  onClick={() => toggleDifficulty(option.value)}
                  data-testid={`badge-difficulty-${option.value}`}
                >
                  {option.label}
                  {filters.difficulty?.includes(option.value) && (
                    <X className="ml-1 h-3 w-3" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              ✨ Trip Interests
            </label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS_OPTIONS.map((option) => (
                <Badge
                  key={option.value}
                  variant={filters.interests?.includes(option.value) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-all px-3 py-1.5 text-sm",
                    filters.interests?.includes(option.value)
                      ? "bg-brand text-white border-brand hover:bg-brand-hover"
                      : "hover:bg-gray-100"
                  )}
                  onClick={() => toggleInterest(option.value)}
                  data-testid={`badge-interest-${option.value}`}
                >
                  <span className="mr-1">{option.icon}</span>
                  {option.label}
                  {filters.interests?.includes(option.value) && (
                    <X className="ml-1 h-3 w-3" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Group Size */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Preferred Group Size
            </label>
            <div className="flex gap-3 items-center">
              <div className="flex-1">
                <Input
                  type="number"
                  min="1"
                  max="100"
                  placeholder="Min"
                  value={filters.groupSizeMin ?? ""}
                  onChange={(e) => {
                    const input = e.target.value.trim();
                    if (input === "") {
                      set("groupSizeMin", null);
                      setGroupSizeError(null);
                      return;
                    }
                    const val = parseInt(input);
                    if (isNaN(val) || val < 1 || val > 100) {
                      setGroupSizeError("Min must be between 1 and 100");
                      return;
                    }
                    if (filters.groupSizeMax && val > filters.groupSizeMax) {
                      setGroupSizeError("Min cannot be greater than max");
                      return;
                    }
                    set("groupSizeMin", val);
                    setGroupSizeError(null);
                  }}
                  data-testid="input-group-size-min"
                  className={cn(
                    "text-center",
                    groupSizeError && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
              </div>
              <span className="text-text-muted">to</span>
              <div className="flex-1">
                <Input
                  type="number"
                  min="1"
                  max="100"
                  placeholder="Max"
                  value={filters.groupSizeMax ?? ""}
                  onChange={(e) => {
                    const input = e.target.value.trim();
                    if (input === "") {
                      set("groupSizeMax", null);
                      setGroupSizeError(null);
                      return;
                    }
                    const val = parseInt(input);
                    if (isNaN(val) || val < 1 || val > 100) {
                      setGroupSizeError("Max must be between 1 and 100");
                      return;
                    }
                    if (filters.groupSizeMin && val < filters.groupSizeMin) {
                      setGroupSizeError("Max cannot be less than min");
                      return;
                    }
                    set("groupSizeMax", val);
                    setGroupSizeError(null);
                  }}
                  data-testid="input-group-size-max"
                  className={cn(
                    "text-center",
                    groupSizeError && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
              </div>
              <span className="text-sm text-text-muted">people</span>
            </div>
            {groupSizeError && (
              <p className="text-xs text-red-600" data-testid="group-size-error">
                {groupSizeError}
              </p>
            )}
            <p className="text-xs text-text-muted">
              Find trips that match your preferred group size range
            </p>
          </div>
        </motion.div>
      </CollapsibleContent>
    </Collapsible>
  );
}
