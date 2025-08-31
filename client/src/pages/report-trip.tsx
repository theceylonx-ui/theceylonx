import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import { 
  ArrowLeft, 
  AlertTriangle, 
  Shield, 
  Flag, 
  UserX, 
  DollarSign,
  MapPin,
  Calendar,
  Users
} from "lucide-react";
import type { Trip } from "@shared/schema";

const reportReasons = [
  {
    id: "inappropriate_content",
    label: "Inappropriate Content",
    description: "Contains offensive, discriminatory, or inappropriate language",
    icon: <Flag className="h-5 w-5 text-red-500" />
  },
  {
    id: "misleading_information",
    label: "Misleading Information",
    description: "False details about trip location, pricing, or itinerary",
    icon: <AlertTriangle className="h-5 w-5 text-orange-500" />
  },
  {
    id: "suspicious_behavior",
    label: "Suspicious Behavior",
    description: "Organizer behavior seems suspicious or potentially unsafe",
    icon: <UserX className="h-5 w-5 text-red-600" />
  },
  {
    id: "pricing_scam",
    label: "Pricing Issues / Scam",
    description: "Unrealistic pricing, hidden fees, or potential financial scam",
    icon: <DollarSign className="h-5 w-5 text-yellow-600" />
  },
  {
    id: "safety_concerns",
    label: "Safety Concerns",
    description: "Trip poses potential safety risks or dangerous activities",
    icon: <Shield className="h-5 w-5 text-red-500" />
  },
  {
    id: "spam_duplicate",
    label: "Spam / Duplicate",
    description: "Duplicate listing or spam content",
    icon: <Flag className="h-5 w-5 text-gray-500" />
  }
];

const reportSchema = z.object({
  reason: z.string().min(1, "Please select a reason for reporting"),
  description: z.string().min(10, "Please provide additional details (minimum 10 characters)").max(500, "Description cannot exceed 500 characters"),
});

type ReportFormData = z.infer<typeof reportSchema>;

export default function ReportTripPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      reason: "",
      description: "",
    },
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to report a trip.",
        variant: "destructive",
      });
      setLocation("/auth/signin");
    }
  }, [user, authLoading, setLocation, toast]);

  // Fetch trip details
  const { data: trip, isLoading: tripLoading } = useQuery<Trip>({
    queryKey: [`/api/trips/${id}`],
    enabled: !!id && !!user,
  });

  // Submit report mutation
  const submitReportMutation = useMutation({
    mutationFn: async (data: ReportFormData) => {
      return await apiRequest("POST", "/api/reports", {
        tripId: id,
        reason: data.reason,
        description: data.description,
      });
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Report Submitted",
        description: "Thank you for reporting this trip. Our team will review it shortly.",
      });
    },
    onError: (error) => {
      console.error("Report submission error:", error);
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ReportFormData) => {
    submitReportMutation.mutate(data);
  };

  if (authLoading || tripLoading) {
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

  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Trip Not Found</h2>
            <p className="text-gray-600 mb-4">The trip you're trying to report doesn't exist.</p>
            <Link href="/browse-trips">
              <Button className="bg-ceylon-green hover:bg-ceylon-green/90">Browse Trips</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="text-center">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Report Submitted Successfully</h2>
              <p className="text-gray-600 mb-6">
                Thank you for helping keep our community safe. Our moderation team will review this report and take appropriate action if necessary.
              </p>
              <div className="space-y-3">
                <Link href={`/trip/${id}`}>
                  <Button variant="outline" className="mr-3">
                    Back to Trip
                  </Button>
                </Link>
                <Link href="/browse-trips">
                  <Button className="bg-ceylon-green hover:bg-ceylon-green/90">
                    Browse More Trips
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link href={`/trip/${id}`}>
          <Button variant="outline" className="mb-6" data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Trip
          </Button>
        </Link>

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Report Trip</h1>
          <p className="text-gray-600">
            Help us maintain a safe and trustworthy travel community by reporting inappropriate content or suspicious behavior.
          </p>
        </div>

        {/* Trip Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Trip Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-gray-800">{trip.title}</h3>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {trip.fromLocation} → {trip.toLocation}
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(trip.date).toLocaleDateString()}
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {trip.seatsAvailable} seats available
                </div>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  LKR {trip.price}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Flag className="h-5 w-5 mr-2 text-red-500" />
              Report This Trip
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Reason Selection */}
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">
                        What's the issue with this trip?
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="space-y-3"
                        >
                          {reportReasons.map((reason) => (
                            <div
                              key={reason.id}
                              className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                              onClick={() => field.onChange(reason.id)}
                            >
                              <RadioGroupItem value={reason.id} id={reason.id} className="mt-1" />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  {reason.icon}
                                  <Label 
                                    htmlFor={reason.id}
                                    className="font-medium cursor-pointer"
                                  >
                                    {reason.label}
                                  </Label>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  {reason.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Additional Details */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">
                        Additional Details
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Please provide specific details about the issue. This helps our moderation team take appropriate action."
                          rows={4}
                          {...field}
                          data-testid="textarea-description"
                        />
                      </FormControl>
                      <p className="text-xs text-gray-500">
                        {field.value?.length || 0}/500 characters
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Safety Notice */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-800">Important Notice</h4>
                      <p className="text-sm text-amber-700 mt-1">
                        False reports may result in account restrictions. Only report trips that genuinely violate our community guidelines or pose safety risks.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-between pt-4">
                  <Link href={`/trip/${id}`}>
                    <Button variant="outline" type="button">
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={submitReportMutation.isPending}
                    className="bg-red-600 hover:bg-red-700 text-white"
                    data-testid="button-submit-report"
                  >
                    {submitReportMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      "Submit Report"
                    )}
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