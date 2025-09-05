import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { TripFormData } from "@shared/schema";

interface StepBasicsProps {
  form: UseFormReturn<TripFormData>;
}

const TRIP_CATEGORIES = [
  { value: "roadtrip", label: "Road Trip", description: "Scenic drives and city tours" },
  { value: "hiking", label: "Hiking", description: "Nature walks and mountain trails" },
  { value: "beach", label: "Beach", description: "Coastal and water activities" },
  { value: "culture", label: "Cultural", description: "Heritage sites and local experiences" },
  { value: "wellness", label: "Wellness", description: "Spa, yoga, and relaxation" },
  { value: "festival", label: "Festival", description: "Events and celebrations" },
  { value: "workshop", label: "Workshop", description: "Learning and skill development" },
  { value: "wildlife", label: "Wildlife", description: "Safari and nature observation" },
  { value: "food", label: "Food & Culinary", description: "Restaurants and food experiences" },
  { value: "adventure_sport", label: "Adventure Sports", description: "Extreme sports and activities" },
  { value: "unknown", label: "Other", description: "Doesn't fit other categories" },
];

export function StepBasics({ form }: StepBasicsProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        {/* Title Field */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                Trip Title
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Create a clear, descriptive title that highlights your trip's main attraction</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Weekend Adventure to Ella Rock"
                  {...field}
                  data-testid="trip-title-input"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description Field */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your trip in detail. Include highlights, what makes it special, and what participants can expect..."
                  className="min-h-32 resize-none"
                  {...field}
                  data-testid="trip-description-input"
                />
              </FormControl>
              <FormMessage />
              <p className="text-sm text-gray-500">
                {field.value?.length || 0}/1000 characters
              </p>
            </FormItem>
          )}
        />

        {/* Category Field */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Trip Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="trip-category-select">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {TRIP_CATEGORIES.map((category) => (
                    <SelectItem
                      key={category.value}
                      value={category.value}
                      data-testid={`category-${category.value}`}
                    >
                      <div>
                        <div className="font-medium">{category.label}</div>
                        <div className="text-sm text-gray-500">{category.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 Tips for a great trip posting</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use specific locations and highlights in your title</li>
          <li>• Describe the unique experiences participants will have</li>
          <li>• Mention the skill level or physical requirements if any</li>
          <li>• Choose the most accurate category to help people find your trip</li>
        </ul>
      </div>
    </div>
  );
}