import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import { TipsBox } from "@/components/TipsBox";
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
import { ArrowLeft, Camera } from "lucide-react";
import { Link } from "wouter";

const postTripSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  fromLocation: z.string().min(1, "From location is required"),
  toLocation: z.string().min(1, "To location is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  seatsAvailable: z.number().min(1, "At least 1 seat is required").max(10, "Maximum 10 seats allowed"),
  price: z.string().optional(),
  region: z.string().min(1, "Region is required"),
  category: z.string().min(1, "Category is required"),
  contactInfo: z.string().min(1, "Contact information is required"),
  notes: z.string().optional(),
});

type PostTripFormData = z.infer<typeof postTripSchema>;

export default function PostTrip() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading } = useAuth();

  // Get date parameter from URL
  const urlParams = new URLSearchParams(window.location.search);
  const selectedDate = urlParams.get('date') || '';

  // Fetch categories for dropdown
  const { data: categoriesData } = useQuery({
    queryKey: ["/api/categories"],
  });

  const form = useForm<PostTripFormData>({
    resolver: zodResolver(postTripSchema),
    defaultValues: {
      title: "",
      fromLocation: "",
      toLocation: "",
      date: selectedDate,
      time: "",
      seatsAvailable: 1,
      price: "",
      region: "",
      category: "",
      contactInfo: "",
      notes: "",
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
      queryClient.invalidateQueries({ queryKey: ["/api/users/trips"] });
      setLocation("/dashboard");
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
        {/* Back Button */}
        <Link href="/">
          <Button variant="outline" className="mb-6" data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
        
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

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Camera className="w-4 h-4" />
                          Trip Category
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-category">
                              <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categoriesData?.categories?.map((cat: any) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-sm text-blue-600">
                          We'll automatically assign a beautiful Sri Lanka image based on your category
                        </FormDescription>
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
                        <FormDescription className="text-sm text-muted-foreground">
                          Type 0 or leave blank if this trip is free.
                        </FormDescription>
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
                            placeholder="e.g., +94771234567 or user@email.com" 
                            {...field} 
                            data-testid="input-contact"
                          />
                        </FormControl>
                        <FormDescription>
                          For international numbers, include country code (e.g., +1, +44, +91, +94). This will be visible to interested travelers.
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
        
        {/* Tips Section */}
        <div className="mt-6">
          <TipsBox
            title="Tips for Posting Great Trips"
            defaultCollapsed={true}
            tips={[
              "Add clear trip title, date, and meeting point so others can plan easily",
              "Set a price or leave it 0 for <strong>Free Trips 💚</strong>",
              "Include extra details (seats, notes) to build trust",
              "Trips with photos (or region-auto images) get more interest",
              "After posting, you can always edit or delete your trip in Profile"
            ]}
          />
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
