import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DestinationSelect } from "../DestinationSelect";
import { Calendar, Clock, MapPin } from "lucide-react";
import type { TripFormData } from "@shared/schema";

interface StepScheduleProps {
  form: UseFormReturn<TripFormData>;
}

const DURATION_OPTIONS = [
  { value: "half_day", label: "Half Day (4-6 hours)" },
  { value: "full_day", label: "Full Day (8-12 hours)" },
  { value: "2_days", label: "2 Days" },
  { value: "3_days", label: "3 Days" },
  { value: "4_days", label: "4 Days" },
  { value: "1_week", label: "1 Week" },
  { value: "2_weeks", label: "2 Weeks" },
  { value: "custom", label: "Custom Duration" },
];

export function StepSchedule({ form }: StepScheduleProps) {
  const handleRegionChange = (region: string) => {
    form.setValue("region", region);
  };

  // Generate time options
  const timeOptions: Array<{ value: string; label: string }> = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute of [0, 30]) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const displayTime = new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      timeOptions.push({ value: timeStr, label: displayTime });
    }
  }

  // Get minimum date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        {/* From Location */}
        <FormField
          control={form.control}
          name="fromLocation"
          render={({ field }) => (
            <FormItem>
              <DestinationSelect
                value={field.value}
                onChange={field.onChange}
                label="Departure Location"
                placeholder="Where does the trip start?"
                error={form.formState.errors.fromLocation?.message}
                required={true}
                data-testid="from-location-select"
              />
            </FormItem>
          )}
        />

        {/* To Location */}
        <FormField
          control={form.control}
          name="toLocation"
          render={({ field }) => (
            <FormItem>
              <DestinationSelect
                value={field.value}
                onChange={field.onChange}
                onRegionChange={handleRegionChange}
                label="Destination"
                placeholder="Where are you going?"
                error={form.formState.errors.toLocation?.message}
                required={true}
                data-testid="to-location-select"
              />
            </FormItem>
          )}
        />

        {/* Region - Auto-filled but can be overridden */}
        <FormField
          control={form.control}
          name="region"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Region <span className="text-red-500">*</span></FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="region-select">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="western">Western Province</SelectItem>
                  <SelectItem value="central">Central Province</SelectItem>
                  <SelectItem value="southern">Southern Province</SelectItem>
                  <SelectItem value="northern">Northern Province</SelectItem>
                  <SelectItem value="eastern">Eastern Province</SelectItem>
                  <SelectItem value="north_western">North Western Province</SelectItem>
                  <SelectItem value="north_central">North Central Province</SelectItem>
                  <SelectItem value="uva">Uva Province</SelectItem>
                  <SelectItem value="sabaragamuwa">Sabaragamuwa Province</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Date and Time Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Trip Date <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    min={minDate}
                    {...field}
                    value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                    onChange={(e) => field.onChange(e.target.value)}
                    data-testid="trip-date-input"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Departure Time <span className="text-red-500">*</span>
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="trip-time-select">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-60">
                    {timeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Duration */}
        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="duration-select">
                    <SelectValue placeholder="How long is the trip?" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {DURATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Schedule Tips */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-medium text-amber-900 mb-2">📅 Scheduling Tips</h4>
        <ul className="text-sm text-amber-800 space-y-1">
          <li>• Choose a departure time that allows for easy meetups</li>
          <li>• Consider traffic patterns when setting departure times</li>
          <li>• Allow buffer time for unexpected delays</li>
          <li>• Weekend trips tend to get more interest</li>
        </ul>
      </div>
    </div>
  );
}