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
import { useLocation } from "wouter";
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
  const [, setLocation] = useLocation();
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

  // Save preferences mutation with improved error handling
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
      
      // CRITICAL FIX: Properly invalidate the /api/preferences query that the banner uses
      // This ensures the PreferencesCompletionBanner gets fresh data when user returns
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return key === '/api/preferences' || 
                 key.includes('/api/me') || 
                 key.includes('/api/auth/me') || 
                 key.includes('/api/user/preferences');
        }
      });
      
      toast({
        title: "Preferences saved",
        description: "Your travel preferences have been updated successfully. Redirecting to recommendations...",
      });

      // Redirect to home page to see personalized recommendations after a brief delay
      setTimeout(() => {
        setLocation('/');
      }, 1500);
    },
    onError: async (error, variables, context) => {
      // Rollback optimistic update
      queryClient.setQueryData(["/api/preferences"], context?.previousPreferences);
      setIsOptimistic(false);
      
      console.error("Failed to save preferences:", error);
      
      // Handle version conflict with clear user feedback
      if (error instanceof Error && error.message.includes("409")) {
        toast({
          title: "Preferences were updated by another session",
          description: "Please refresh the page and try saving again to avoid conflicts.",
          variant: "destructive",
          duration: 7000,
        });
        
        // Refresh preferences to get latest version for next attempt
        queryClient.invalidateQueries({ queryKey: ["/api/preferences"] });
        return;
      }
      
      // Handle other errors with specific feedback
      const errorMessage = error instanceof Error ? error.message : "Please try again later.";
      
      toast({
        title: "Failed to save preferences",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
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

  // Enhanced Multi-select chip component with beautiful design
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
      <div className="space-y-6">
        {/* Selected items */}
        {value.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
            <div className="flex items-center mb-3">
              <div className="bg-blue-500 p-1.5 rounded-lg mr-2">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
              <h4 className="font-semibold text-blue-900">Your Selections</h4>
            </div>
            <div className="flex flex-wrap gap-3">
              {value.map((item) => (
                <div
                  key={item}
                  className="group bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <div className="flex items-center">
                    <span className="font-medium text-sm">{labels[item] || item}</span>
                    <button
                      type="button"
                      onClick={() => handleRemove(item)}
                      className="ml-3 bg-white/20 hover:bg-white/30 p-1 rounded-full transition-colors"
                      data-testid={`chip-remove-${item}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available options */}
        {availableOptions.length > 0 && (!maxItems || value.length < maxItems) && (
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="bg-gradient-to-r from-brand to-accent p-1.5 rounded-lg mr-2">
                <Plus className="h-3 w-3 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900">{placeholder}</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleAdd(option)}
                  className="group bg-white hover:bg-gradient-to-r hover:from-brand hover:to-accent border border-gray-200 hover:border-transparent rounded-xl px-4 py-3 text-left transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:text-white"
                  data-testid={`chip-add-${option}`}
                >
                  <div className="flex items-center">
                    <div className="bg-gray-100 group-hover:bg-white/20 p-2 rounded-lg mr-3 transition-colors">
                      <Plus className="h-4 w-4 text-gray-600 group-hover:text-white" />
                    </div>
                    <span className="font-medium text-sm text-gray-800 group-hover:text-white">
                      {labels[option] || option}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {maxItems && value.length >= maxItems && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center">
              <div className="bg-amber-500 p-1.5 rounded-lg mr-2">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <p className="text-amber-800 font-medium text-sm">
                Maximum {maxItems} items selected
              </p>
            </div>
          </div>
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
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Beautiful Header Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 shadow-2xl">
        <div className="absolute inset-0 bg-black/10">
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
        </div>
        <div className="relative p-8 lg:p-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3 flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                Travel Preferences
              </h1>
              <p className="text-white/90 text-lg max-w-2xl leading-relaxed">
                Customize your travel preferences to get personalized trip recommendations and connect with like-minded travelers.
              </p>
            </div>
            {isOptimistic && (
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
                <span className="text-white font-medium text-sm">✨ Saving...</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Form Content */}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-10">
            
            {/* Travel Vibe Section */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 border border-purple-100">
              <FormField
                control={form.control}
                name="vibe"
                render={({ field }) => (
                  <FormItem>
                    <div className="mb-6">
                      <div className="flex items-center mb-3">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-xl mr-4">
                          <span className="text-white text-xl">✨</span>
                        </div>
                        <div>
                          <FormLabel className="text-2xl font-bold text-gray-900">Travel Vibe</FormLabel>
                          <FormDescription className="text-gray-600 text-lg mt-1">
                            What kind of atmosphere do you prefer? (Select up to 3)
                          </FormDescription>
                        </div>
                      </div>
                    </div>
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
            </div>

            {/* Travel Companions Section */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-8 border border-blue-100">
              <FormField
                control={form.control}
                name="companions"
                render={({ field }) => (
                  <FormItem>
                    <div className="mb-6">
                      <div className="flex items-center mb-3">
                        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-3 rounded-xl mr-4">
                          <span className="text-white text-xl">👥</span>
                        </div>
                        <div>
                          <FormLabel className="text-2xl font-bold text-gray-900">Travel Companions</FormLabel>
                          <FormDescription className="text-gray-600 text-lg mt-1">
                            Who do you usually travel with? (Select up to 2)
                          </FormDescription>
                        </div>
                      </div>
                    </div>
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
            </div>

            {/* Interests & Activities Section */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-8 border border-emerald-100">
              <FormField
                control={form.control}
                name="interests"
                render={({ field }) => (
                  <FormItem>
                    <div className="mb-6">
                      <div className="flex items-center mb-3">
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-3 rounded-xl mr-4">
                          <span className="text-white text-xl">🎯</span>
                        </div>
                        <div>
                          <FormLabel className="text-2xl font-bold text-gray-900">Interests & Activities</FormLabel>
                          <FormDescription className="text-gray-600 text-lg mt-1">
                            What activities and experiences interest you most?
                          </FormDescription>
                        </div>
                      </div>
                    </div>
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
            </div>

            {/* Travel Months Section */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-8 border border-amber-100">
              <FormField
                control={form.control}
                name="months"
                render={({ field }) => (
                  <FormItem>
                    <div className="mb-6">
                      <div className="flex items-center mb-3">
                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-3 rounded-xl mr-4">
                          <span className="text-white text-xl">📅</span>
                        </div>
                        <div>
                          <FormLabel className="text-2xl font-bold text-gray-900">Preferred Travel Months</FormLabel>
                          <FormDescription className="text-gray-600 text-lg mt-1">
                            When do you prefer to travel? (Optional)
                          </FormDescription>
                        </div>
                      </div>
                    </div>
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
            </div>

            {/* Regions Section */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-8 border border-indigo-100">
              <FormField
                control={form.control}
                name="regions"
                render={({ field }) => (
                  <FormItem>
                    <div className="mb-6">
                      <div className="flex items-center mb-3">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-3 rounded-xl mr-4">
                          <span className="text-white text-xl">🗺️</span>
                        </div>
                        <div>
                          <FormLabel className="text-2xl font-bold text-gray-900">Preferred Regions</FormLabel>
                          <FormDescription className="text-gray-600 text-lg mt-1">
                            Which regions in Sri Lanka interest you most? (Optional)
                          </FormDescription>
                        </div>
                      </div>
                    </div>
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
            </div>

            {/* Budget Range Section */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 border border-green-100">
              <div className="mb-6">
                <div className="flex items-center mb-3">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-3 rounded-xl mr-4">
                    <span className="text-white text-xl">💰</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Budget Range</h3>
                    <p className="text-gray-600 text-lg mt-1">Set your comfortable spending range (Optional)</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      </div>
    </div>
  );
}