import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { X, Plus, Save, RotateCcw, Sparkles } from "lucide-react";

// Client-side validation schema matching server requirements
const preferencesFormSchema = z.object({
  vibe: z.array(z.string()).default([]),
  companions: z.array(z.string()).default([]),
  interests: z.array(z.string()).default([]),
  months: z.array(z.string()).default([]),
  regions: z.array(z.string()).default([]),
  budgetMin: z.number().int().min(0).nullable().optional(),
  budgetMax: z.number().int().min(0).nullable().optional(),
}).refine((data) => {
  if (data.budgetMin && data.budgetMax) {
    return data.budgetMin <= data.budgetMax;
  }
  return true;
}, {
  message: "Budget minimum must be less than or equal to budget maximum",
  path: ["budgetMax"]
});

type PreferencesFormData = z.infer<typeof preferencesFormSchema>;

interface PreferenceTaxonomy {
  vibe: string[];
  companions: string[];
  interests: string[];
  months: string[];
  regions: string[];
}

interface UserPreferences extends PreferencesFormData {
  userId: string;
  version: number;
  updatedAt: string;
}

const PREFERENCE_LABELS = {
  vibe: {
    relaxed: "🌅 Relaxed",
    adventure: "🏔️ Adventure", 
    culture: "🏛️ Culture",
    beach: "🏖️ Beach",
    nature: "🌿 Nature",
    nightlife: "🌙 Nightlife",
    wellness: "🧘 Wellness"
  },
  companions: {
    solo: "🧳 Solo Travel",
    couple: "💑 Couple",
    friends: "👥 Friends",
    family: "👨‍👩‍👧‍👦 Family",
    senior_friendly: "👴 Senior Friendly"
  },
  interests: {
    hiking: "🥾 Hiking",
    wildlife: "🦁 Wildlife",
    history: "📚 History",
    photography: "📸 Photography",
    food: "🍽️ Food",
    diving: "🤿 Diving",
    surfing: "🏄 Surfing",
    temples: "🛕 Temples",
    festivals: "🎪 Festivals", 
    wellness: "💆 Wellness",
    ayurveda: "🌿 Ayurveda",
    train_journeys: "🚂 Train Journeys"
  },
  months: {
    jan: "🌟 January", feb: "💎 February", mar: "🌸 March", 
    apr: "🌺 April", may: "☀️ May", jun: "🌊 June",
    jul: "🌴 July", aug: "🌅 August", sep: "🍂 September",
    oct: "🎭 October", nov: "🏮 November", dec: "🎄 December"
  },
  regions: {
    north: "🏛️ Northern Province",
    east: "🌊 Eastern Province", 
    south: "🏖️ Southern Province",
    west: "🏙️ Western Province",
    hill_country: "⛰️ Hill Country",
    cultural_triangle: "🛕 Cultural Triangle", 
    colombo: "🌆 Colombo"
  }
} as const;

export function PreferencesForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOptimistic, setIsOptimistic] = useState(false);

  // Fetch taxonomy options
  const { data: taxonomy, isLoading: taxonomyLoading } = useQuery<PreferenceTaxonomy>({
    queryKey: ["/api/preferences/taxonomy"],
    retry: false,
  });

  // Fetch current user preferences
  const { data: preferences, isLoading: preferencesLoading, error } = useQuery<UserPreferences>({
    queryKey: ["/api/preferences"],
    retry: false,
  });

  const form = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesFormSchema),
    defaultValues: {
      vibe: [],
      companions: [],
      interests: [],
      months: [],
      regions: [],
      budgetMin: null,
      budgetMax: null,
    },
  });

  // Update form values when preferences are loaded
  useEffect(() => {
    if (preferences) {
      form.reset({
        vibe: preferences.vibe || [],
        companions: preferences.companions || [],
        interests: preferences.interests || [],
        months: preferences.months || [],
        regions: preferences.regions || [],
        budgetMin: preferences.budgetMin,
        budgetMax: preferences.budgetMax,
      });
    }
  }, [preferences, form]);

  // Save preferences mutation with optimistic updates
  const savePreferencesMutation = useMutation({
    mutationFn: async (data: PreferencesFormData) => {
      // Get the latest preferences to ensure we have the most current version
      const currentPreferences = queryClient.getQueryData<UserPreferences>(["/api/preferences"]);
      const response = await apiRequest("PUT", "/api/preferences", {
        ...data,
        version: currentPreferences?.version || 1
      });
      return response;
    },
    onMutate: async (variables) => {
      // Cancel ongoing queries
      await queryClient.cancelQueries({ queryKey: ["/api/preferences"] });
      
      // Get current data
      const previousPreferences = queryClient.getQueryData<UserPreferences>(["/api/preferences"]);
      
      // Don't do optimistic updates for preferences to avoid version conflicts
      setIsOptimistic(true);
      
      return { previousPreferences };
    },
    onSuccess: (data: any) => {
      // Update with server data
      queryClient.setQueryData(["/api/preferences"], data.preferences);
      setIsOptimistic(false);
      
      toast({
        title: "Preferences saved",
        description: "Your travel preferences have been updated successfully.",
      });
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      queryClient.setQueryData(["/api/preferences"], context?.previousPreferences);
      setIsOptimistic(false);
      
      console.error("Failed to save preferences:", error);
      toast({
        title: "Failed to save preferences",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Reset preferences mutation
  const resetPreferencesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/preferences");
      return await response.json();
    },
    onSuccess: (data: any) => {
      queryClient.setQueryData(["/api/preferences"], data.preferences);
      form.reset(data.preferences);
      
      toast({
        title: "Preferences reset",
        description: "Your travel preferences have been reset to defaults.",
      });
    },
    onError: (error) => {
      console.error("Failed to reset preferences:", error);
      toast({
        title: "Failed to reset preferences",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PreferencesFormData) => {
    savePreferencesMutation.mutate(data);
  };

  const handleReset = () => {
    resetPreferencesMutation.mutate();
  };

  // Multi-select chip component
  const MultiSelectChips = ({ 
    value, 
    onChange, 
    options, 
    labels,
    maxItems,
    placeholder 
  }: {
    value: string[];
    onChange: (value: string[]) => void;
    options: string[];
    labels: Record<string, string>;
    maxItems?: number;
    placeholder: string;
  }) => {
    const handleAdd = (option: string) => {
      if (!value.includes(option) && (!maxItems || value.length < maxItems)) {
        onChange([...value, option]);
      }
    };

    const handleRemove = (option: string) => {
      onChange(value.filter(item => item !== option));
    };

    const availableOptions = options.filter(option => !value.includes(option));

    return (
      <div className="space-y-3">
        {/* Selected items */}
        {value.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {value.map((item) => (
              <Badge
                key={item}
                variant="secondary"
                className="px-3 py-1 text-sm bg-orange-100 text-orange-800 hover:bg-orange-200 transition-colors"
              >
                {labels[item] || item}
                <button
                  type="button"
                  onClick={() => handleRemove(item)}
                  className="ml-2 hover:text-orange-600"
                  data-testid={`chip-remove-${item}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Available options */}
        {availableOptions.length > 0 && (!maxItems || value.length < maxItems) && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">{placeholder}</p>
            <div className="flex flex-wrap gap-2">
              {availableOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleAdd(option)}
                  className="inline-flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-orange-100 hover:text-orange-800 transition-colors"
                  data-testid={`chip-add-${option}`}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {labels[option] || option}
                </button>
              ))}
            </div>
          </div>
        )}

        {maxItems && value.length >= maxItems && (
          <p className="text-xs text-gray-500">
            Maximum {maxItems} items selected
          </p>
        )}
      </div>
    );
  };

  if (taxonomyLoading || preferencesLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-600">Failed to load preferences. Please try again.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-orange-500" />
          Travel Preferences
        </CardTitle>
        <CardDescription>
          Customize your travel preferences to get personalized trip recommendations.
          {isOptimistic && (
            <span className="inline-block ml-2 px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded">
              Saving...
            </span>
          )}
        </CardDescription>
        
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Travel Vibe */}
            <FormField
              control={form.control}
              name="vibe"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Travel Vibe</FormLabel>
                  <FormDescription>
                    What kind of atmosphere do you prefer? (Select up to 3)
                  </FormDescription>
                  <FormControl>
                    <MultiSelectChips
                      value={field.value}
                      onChange={field.onChange}
                      options={taxonomy?.vibe || []}
                      labels={PREFERENCE_LABELS.vibe}
                      maxItems={3}
                      placeholder="Add a travel vibe..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Travel Companions */}
            <FormField
              control={form.control}
              name="companions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Travel Companions</FormLabel>
                  <FormDescription>
                    Who do you usually travel with? (Select up to 2)
                  </FormDescription>
                  <FormControl>
                    <MultiSelectChips
                      value={field.value}
                      onChange={field.onChange}
                      options={taxonomy?.companions || []}
                      labels={PREFERENCE_LABELS.companions}
                      maxItems={2}
                      placeholder="Add travel companions..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Interests */}
            <FormField
              control={form.control}
              name="interests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interests & Activities</FormLabel>
                  <FormDescription>
                    What activities and experiences interest you most?
                  </FormDescription>
                  <FormControl>
                    <MultiSelectChips
                      value={field.value}
                      onChange={field.onChange}
                      options={taxonomy?.interests || []}
                      labels={PREFERENCE_LABELS.interests}
                      placeholder="Add interests..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Travel Months */}
            <FormField
              control={form.control}
              name="months"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Travel Months</FormLabel>
                  <FormDescription>
                    When do you prefer to travel? (Optional)
                  </FormDescription>
                  <FormControl>
                    <MultiSelectChips
                      value={field.value}
                      onChange={field.onChange}
                      options={taxonomy?.months || []}
                      labels={PREFERENCE_LABELS.months}
                      placeholder="Add preferred months..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Regions */}
            <FormField
              control={form.control}
              name="regions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Regions</FormLabel>
                  <FormDescription>
                    Which regions in Sri Lanka interest you most? (Optional)
                  </FormDescription>
                  <FormControl>
                    <MultiSelectChips
                      value={field.value}
                      onChange={field.onChange}
                      options={taxonomy?.regions || []}
                      labels={PREFERENCE_LABELS.regions}
                      placeholder="Add preferred regions..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Budget Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="budgetMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Budget (LKR)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 5000"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                        data-testid="input-budget-min"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="budgetMax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Budget (LKR)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 25000"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                        data-testid="input-budget-max"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* How to Use Tips */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                How to Use Travel Preferences
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="bg-purple-100 text-purple-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold mt-0.5">1</div>
                    <p><strong>Select Your Vibes:</strong> Choose up to 3 travel moods that match your style</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="bg-purple-100 text-purple-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold mt-0.5">2</div>
                    <p><strong>Pick Companions:</strong> Who do you usually travel with?</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="bg-purple-100 text-purple-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold mt-0.5">3</div>
                    <p><strong>Choose Interests:</strong> Select activities you enjoy most</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="bg-purple-100 text-purple-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold mt-0.5">4</div>
                    <p><strong>Select Months:</strong> When do you prefer to travel?</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="bg-purple-100 text-purple-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold mt-0.5">5</div>
                    <p><strong>Choose Regions:</strong> Which parts of Sri Lanka interest you?</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="bg-purple-100 text-purple-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold mt-0.5">6</div>
                    <p><strong>Set Budget:</strong> Optional spending range for better trip matching</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="submit"
                disabled={savePreferencesMutation.isPending}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
                data-testid="button-save-preferences"
              >
                <Save className="h-4 w-4 mr-2" />
                {savePreferencesMutation.isPending ? "Saving..." : "Save Preferences"}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={resetPreferencesMutation.isPending}
                className="flex-1 sm:flex-initial"
                data-testid="button-reset-preferences"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {resetPreferencesMutation.isPending ? "Resetting..." : "Reset to Defaults"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}