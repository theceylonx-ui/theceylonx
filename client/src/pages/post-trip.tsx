import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Checkbox } from "@/components/ui/checkbox";

const postTripSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  fromLocation: z.string().min(1, "From location is required"),
  toLocation: z.string().min(1, "To location is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  seatsAvailable: z.number().min(1, "At least 1 seat is required").max(10, "Maximum 10 seats allowed"),
  price: z.string().min(1, "Price is required"),
  region: z.string().min(1, "Region is required"),
  contactInfo: z.string().min(1, "Contact information is required"),
  notes: z.string().optional(),
  // Enhanced fields
  tags: z.array(z.string()).min(1, "At least one trip type is required"),
  priceMin: z.string().min(1, "Minimum price is required"),
  priceMax: z.string().min(1, "Maximum price is required"),
  duration: z.string().min(1, "Duration is required"),
  difficulty: z.string().min(1, "Difficulty level is required"),
  buddyFriendly: z.boolean(),
  seasonality: z.array(z.string()).min(1, "At least one season is required"),
  safetyFlags: z.array(z.string()),
});

type PostTripFormData = z.infer<typeof postTripSchema>;

export default function PostTrip() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading } = useAuth();

  const form = useForm<PostTripFormData>({
    resolver: zodResolver(postTripSchema),
    defaultValues: {
      title: "",
      fromLocation: "",
      toLocation: "",
      date: "",
      time: "",
      seatsAvailable: 1,
      price: "",
      region: "",
      contactInfo: "",
      notes: "",
      tags: [],
      priceMin: "",
      priceMax: "",
      duration: "",
      difficulty: "",
      buddyFriendly: false,
      seasonality: [],
      safetyFlags: [],
    },
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/auth/signin";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ceylon-green mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Don't render content if not authenticated (redirect is handled in useEffect)
  if (!isAuthenticated) {
    return null;
  }

  const createTripMutation = useMutation({
    mutationFn: async (data: PostTripFormData) => {
      return await apiRequest("POST", "/api/trips", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your trip has been posted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      setLocation("/browse");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/auth/signin";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to post trip. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PostTripFormData) => {
    createTripMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4" data-testid="page-title">
            Post Your Trip
          </h1>
          <p className="text-lg text-gray-600" data-testid="page-subtitle">
            Share your adventure and find travel companions
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Trip Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="form-post-trip">
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trip Title</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Beach Adventure to Unawatuna" 
                            {...field} 
                            data-testid="input-title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Region</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-region">
                              <SelectValue placeholder="Select Region" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="western">Western Province</SelectItem>
                            <SelectItem value="southern">Southern Province</SelectItem>
                            <SelectItem value="central">Central Province</SelectItem>
                            <SelectItem value="northern">Northern Province</SelectItem>
                            <SelectItem value="eastern">Eastern Province</SelectItem>
                            <SelectItem value="northwestern">Northwestern Province</SelectItem>
                            <SelectItem value="north-central">North Central Province</SelectItem>
                            <SelectItem value="sabaragamuwa">Sabaragamuwa Province</SelectItem>
                            <SelectItem value="uva">Uva Province</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="fromLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Starting location" 
                            {...field} 
                            data-testid="input-from"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="toLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>To</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Destination" 
                            {...field} 
                            data-testid="input-to"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            data-testid="input-date"
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
                        <FormLabel>Time</FormLabel>
                        <FormControl>
                          <Input 
                            type="time" 
                            {...field} 
                            data-testid="input-time"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="seatsAvailable"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seats Available</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            max="10" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            data-testid="input-seats"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price per Person (LKR)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., 2500" 
                            {...field} 
                            data-testid="input-price"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="contactInfo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Information</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="WhatsApp number or email" 
                            {...field} 
                            data-testid="input-contact"
                          />
                        </FormControl>
                        <FormDescription>
                          This will be visible to interested travelers
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trip Details & Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your trip, what to expect, what to bring, etc." 
                          rows={4}
                          {...field} 
                          data-testid="textarea-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Enhanced Trip Details */}
                <div className="space-y-6 border-t pt-6">
                  <h3 className="text-lg font-semibold">Trip Characteristics</h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select duration" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="half_day">Half Day</SelectItem>
                              <SelectItem value="1_day">1 Day</SelectItem>
                              <SelectItem value="2_days">2 Days</SelectItem>
                              <SelectItem value="3_days">3 Days</SelectItem>
                              <SelectItem value="1_week">1 Week</SelectItem>
                              <SelectItem value="2_weeks">2 Weeks</SelectItem>
                              <SelectItem value="1_month">1 Month</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="difficulty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Difficulty Level</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select difficulty" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="easy">Easy</SelectItem>
                              <SelectItem value="moderate">Moderate</SelectItem>
                              <SelectItem value="challenging">Challenging</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="priceMin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Price Range (LKR)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="5000" 
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="priceMax"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Price Range (LKR)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="15000" 
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trip Types (Select Multiple)</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                          {['adventure', 'cultural', 'beach', 'mountain', 'wildlife', 'historical', 'spiritual', 'food', 'photography'].map((tag) => (
                            <div key={tag} className="flex items-center space-x-2">
                              <Checkbox
                                checked={field.value?.includes(tag)}
                                onCheckedChange={(checked) => {
                                  const current = field.value || [];
                                  if (checked) {
                                    field.onChange([...current, tag]);
                                  } else {
                                    field.onChange(current.filter((t: string) => t !== tag));
                                  }
                                }}
                              />
                              <label className="text-sm capitalize">{tag}</label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="seasonality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Best Seasons</FormLabel>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {['dry_season', 'wet_season', 'year_round'].map((season) => (
                            <div key={season} className="flex items-center space-x-2">
                              <Checkbox
                                checked={field.value?.includes(season)}
                                onCheckedChange={(checked) => {
                                  const current = field.value || [];
                                  if (checked) {
                                    field.onChange([...current, season]);
                                  } else {
                                    field.onChange(current.filter((s: string) => s !== season));
                                  }
                                }}
                              />
                              <label className="text-sm capitalize">{season.replace('_', ' ')}</label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="safetyFlags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Safety Considerations (Optional)</FormLabel>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {['weather_dependent', 'road_conditions', 'equipment_required', 'guide_recommended'].map((flag) => (
                            <div key={flag} className="flex items-center space-x-2">
                              <Checkbox
                                checked={field.value?.includes(flag)}
                                onCheckedChange={(checked) => {
                                  const current = field.value || [];
                                  if (checked) {
                                    field.onChange([...current, flag]);
                                  } else {
                                    field.onChange(current.filter((f: string) => f !== flag));
                                  }
                                }}
                              />
                              <label className="text-sm capitalize">{flag.replace('_', ' ')}</label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="buddyFriendly"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Solo Traveler Friendly
                          </FormLabel>
                          <FormDescription>
                            This trip is suitable for solo travelers looking for buddies
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-center">
                  <Button 
                    type="submit" 
                    size="lg"
                    className="bg-ceylon-green text-white hover:bg-ceylon-green/90"
                    disabled={createTripMutation.isPending}
                    data-testid="button-submit"
                  >
                    {createTripMutation.isPending ? "Posting..." : "Post Trip"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
}
