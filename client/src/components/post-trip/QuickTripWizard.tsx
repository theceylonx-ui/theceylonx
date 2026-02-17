import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { DestinationSelect } from "./DestinationSelect";
import { ChevronLeft, ChevronRight, Send, MapPin, Calendar, Clock, Users, Zap, Check } from "lucide-react";
import {
  QuickTripFormSchema,
  QuickTripStep1Schema,
  QuickTripStep2Schema,
  type QuickTripFormData,
} from "@shared/schema";

const TRIP_CATEGORIES = [
  { value: "roadtrip", label: "Road Trip" },
  { value: "hiking", label: "Hiking" },
  { value: "beach", label: "Beach" },
  { value: "culture", label: "Cultural" },
  { value: "wellness", label: "Wellness" },
  { value: "festival", label: "Festival" },
  { value: "workshop", label: "Workshop" },
  { value: "wildlife", label: "Wildlife" },
  { value: "food", label: "Food & Culinary" },
  { value: "adventure_sport", label: "Adventure Sports" },
];

const STEPS = [
  { id: 1, title: "Where & When", icon: MapPin },
  { id: 2, title: "Trip Details", icon: Users },
  { id: 3, title: "Review & Post", icon: Check },
];

export function QuickTripWizard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);

  const form = useForm<QuickTripFormData>({
    resolver: zodResolver(QuickTripFormSchema),
    defaultValues: {
      fromLocation: "",
      toLocation: "",
      region: "",
      date: "",
      time: "",
      title: "",
      description: "",
      category: "adventure_sport",
      seatsAvailable: 1,
    },
    mode: "onBlur",
  });

  const formData = form.watch();

  const createMutation = useMutation({
    mutationFn: async (data: QuickTripFormData) => {
      const res = await apiRequest("POST", "/api/quick-trips", data);
      return res.json();
    },
    onSuccess: (trip) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/quick-trips"] });
      toast({
        title: "Quick Trip Posted!",
        description: "Your trip is live and will be visible for 3 days.",
      });
      setLocation(`/trips`);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to post trip",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const validateStep = async () => {
    const schema = currentStep === 1 ? QuickTripStep1Schema : QuickTripStep2Schema;
    try {
      const fields = currentStep === 1
        ? { fromLocation: formData.fromLocation, toLocation: formData.toLocation, region: formData.region, date: formData.date, time: formData.time }
        : { title: formData.title, description: formData.description, category: formData.category, seatsAvailable: formData.seatsAvailable };
      await schema.parseAsync(fields);
      return true;
    } catch {
      if (currentStep === 1) {
        await form.trigger(["fromLocation", "toLocation", "region", "date", "time"]);
      } else {
        await form.trigger(["title", "description", "category", "seatsAvailable"]);
      }
      return false;
    }
  };

  const handleNext = async () => {
    const isValid = await validateStep();
    if (isValid) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    const isValid = await form.trigger();
    if (isValid) {
      createMutation.mutate(formData);
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const timeOptions: { value: string; label: string }[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (const minute of [0, 30]) {
      const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      const displayTime = new Date(`2000-01-01T${timeStr}`).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      timeOptions.push({ value: timeStr, label: displayTime });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isComplete = currentStep > step.id;
          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-orange-500 text-white shadow-lg"
                      : isComplete
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {isComplete ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={`text-xs mt-1 font-medium ${isActive ? "text-orange-600" : isComplete ? "text-green-600" : "text-gray-400"}`}>
                  {step.title}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-2 ${currentStep > step.id ? "bg-green-400" : "bg-gray-200"}`} />
              )}
            </div>
          );
        })}
      </div>

      <Form {...form}>
        <form onSubmit={(e) => e.preventDefault()}>
          {currentStep === 1 && (
            <Card>
              <CardContent className="pt-6 space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-5 h-5 text-orange-500" />
                  <h3 className="text-lg font-semibold">Where & When</h3>
                </div>

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
                        required
                      />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="toLocation"
                  render={({ field }) => (
                    <FormItem>
                      <DestinationSelect
                        value={field.value}
                        onChange={field.onChange}
                        onRegionChange={(region: string) => form.setValue("region", region)}
                        label="Destination"
                        placeholder="Where are you heading?"
                        error={form.formState.errors.toLocation?.message}
                        required
                      />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" /> Date <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input type="date" min={minDate} {...field} value={typeof field.value === 'string' ? field.value : ''} />
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
                        <FormLabel className="flex items-center gap-1">
                          <Clock className="w-4 h-4" /> Time <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {timeOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 2 && (
            <Card>
              <CardContent className="pt-6 space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-orange-500" />
                  <h3 className="text-lg font-semibold">Trip Details</h3>
                </div>

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trip Title <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Quick ride to Ella" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Briefly describe your trip..."
                          className="min-h-24 resize-none"
                          {...field}
                        />
                      </FormControl>
                      <p className="text-xs text-gray-500">{field.value?.length || 0}/500</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category <span className="text-red-500">*</span></FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TRIP_CATEGORIES.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="seatsAvailable"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seats Available <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={50}
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 3 && (
            <Card>
              <CardContent className="pt-6 space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="w-5 h-5 text-orange-500" />
                  <h3 className="text-lg font-semibold">Review & Post</h3>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-orange-700 font-medium mb-1">
                    <Zap className="w-4 h-4" />
                    Quick Trip - Auto-deletes in 3 days
                  </div>
                  <p className="text-sm text-orange-600">
                    This trip will be automatically removed 72 hours after posting.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">From</p>
                      <p className="font-medium">{formData.fromLocation || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">To</p>
                      <p className="font-medium">{formData.toLocation || "—"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium">
                        {formData.date ? new Date(formData.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Time</p>
                      <p className="font-medium">
                        {formData.time ? new Date(`2000-01-01T${formData.time}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }) : "—"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Title</p>
                    <p className="font-medium">{formData.title || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="text-sm text-gray-700">{formData.description || "—"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Category</p>
                      <Badge variant="secondary">
                        {TRIP_CATEGORIES.find(c => c.value === formData.category)?.label || formData.category}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Seats</p>
                      <p className="font-medium">{formData.seatsAvailable}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between mt-6">
            {currentStep > 1 ? (
              <Button type="button" variant="outline" onClick={handleBack}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            ) : (
              <div />
            )}

            {currentStep < 3 ? (
              <Button type="button" onClick={handleNext} className="bg-orange-500 hover:bg-orange-600">
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={createMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {createMutation.isPending ? "Posting..." : (
                  <>
                    <Send className="w-4 h-4 mr-1" /> Post Quick Trip
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
