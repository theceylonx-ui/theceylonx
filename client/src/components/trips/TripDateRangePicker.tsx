import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarIcon, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTripsStore, validateDateRange, formatDateRange } from "@/store/tripsStore";

interface TripDateRangePickerProps {
  value?: {
    startDate: Date | null;
    endDate: Date | null;
  };
  onChange: (dates: { startDate: Date | null; endDate: Date | null }) => void;
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
  disabled?: boolean;
  className?: string;
  showSummary?: boolean;
}

export function TripDateRangePicker({
  value,
  onChange,
  onValidationChange,
  disabled = false,
  className,
  showSummary = true
}: TripDateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date | null>(value?.startDate || null);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(value?.endDate || null);
  
  const { selectedDates, setSelectedDates } = useTripsStore();
  
  // Sync with store if no value provided
  const startDate = value?.startDate || selectedDates.startDate;
  const endDate = value?.endDate || selectedDates.endDate;
  
  // Validation
  const validation = validateDateRange(startDate, endDate);
  
  useEffect(() => {
    onValidationChange?.(validation.isValid, validation.errors);
  }, [validation.isValid, validation.errors, onValidationChange]);
  
  // Handle date selection
  const handleDateSelect = (selectedDate: Date | undefined, type: 'start' | 'end') => {
    if (!selectedDate) return;
    
    if (type === 'start') {
      setTempStartDate(selectedDate);
      // If end date is before new start date, clear it
      if (tempEndDate && selectedDate > tempEndDate) {
        setTempEndDate(null);
      }
    } else {
      setTempEndDate(selectedDate);
    }
  };
  
  const handleApplyDates = () => {
    const newDates = { startDate: tempStartDate, endDate: tempEndDate };
    onChange(newDates);
    setSelectedDates(newDates);
    setIsOpen(false);
  };
  
  const handleCancel = () => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setIsOpen(false);
  };
  
  const handleClear = () => {
    const newDates = { startDate: null, endDate: null };
    setTempStartDate(null);
    setTempEndDate(null);
    onChange(newDates);
    setSelectedDates(newDates);
  };
  
  // Calculate disabled dates (past dates)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const isDateDisabled = (date: Date) => {
    return date < today;
  };
  
  const tempValidation = validateDateRange(tempStartDate, tempEndDate);
  const hasValidTempDates = tempValidation.isValid;
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* Date Selection Button */}
      <Button
        variant="outline"
        className={cn(
          "w-full justify-start text-left font-normal h-auto py-3 px-4",
          !startDate && !endDate && "text-muted-foreground",
          validation.errors.length > 0 && "border-red-500"
        )}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        data-testid="button-select-dates"
      >
        <CalendarIcon className="mr-3 h-4 w-4" />
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {startDate && endDate
              ? formatDateRange(startDate, endDate)
              : "Select travel dates"
            }
          </span>
          {startDate && endDate && (
            <span className="text-xs text-muted-foreground">
              {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
            </span>
          )}
        </div>
      </Button>
      
      {/* Summary Badge */}
      {showSummary && startDate && endDate && (
        <div className="flex items-center gap-2" data-testid="date-range-summary">
          <Badge variant="secondary" className="text-xs">
            {formatDateRange(startDate, endDate)}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-6 px-2 text-xs"
            data-testid="button-clear-dates"
          >
            Clear
          </Button>
        </div>
      )}
      
      {/* Validation Errors */}
      {validation.errors.length > 0 && (
        <Alert variant="destructive" data-testid="date-validation-errors">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {validation.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Calendar Modal */}
      {isOpen && (
        <Card className="absolute z-50 w-full max-w-md mx-auto shadow-lg" data-testid="calendar-picker">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Select Travel Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Start Date Calendar */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Start Date
                {tempStartDate && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    {tempStartDate.toLocaleDateString()}
                  </span>
                )}
              </label>
              <Calendar
                mode="single"
                selected={tempStartDate || undefined}
                onSelect={(date) => handleDateSelect(date, 'start')}
                disabled={isDateDisabled}
                className="rounded-md border"
                data-testid="calendar-start-date"
              />
            </div>
            
            {/* End Date Calendar (only show if start date selected) */}
            {tempStartDate && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  End Date
                  {tempEndDate && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {tempEndDate.toLocaleDateString()}
                    </span>
                  )}
                </label>
                <Calendar
                  mode="single"
                  selected={tempEndDate || undefined}
                  onSelect={(date) => handleDateSelect(date, 'end')}
                  disabled={(date) => isDateDisabled(date) || date <= tempStartDate!}
                  className="rounded-md border"
                  data-testid="calendar-end-date"
                />
              </div>
            )}
            
            {/* Temporary validation preview */}
            {tempStartDate && tempEndDate && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  {formatDateRange(tempStartDate, tempEndDate)}
                </p>
                {tempValidation.errors.length > 0 && (
                  <div className="mt-2">
                    {tempValidation.errors.map((error, index) => (
                      <p key={index} className="text-xs text-red-600">{error}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Action buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleCancel}
                data-testid="button-cancel-dates"
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleApplyDates}
                disabled={!hasValidTempDates}
                data-testid="button-apply-dates"
              >
                Apply Dates
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}