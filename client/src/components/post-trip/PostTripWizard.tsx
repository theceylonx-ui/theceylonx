import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useReturn } from "@/hooks/useReturn";
import { useAutosaveDraft } from "@/hooks/useAutosaveDraft";
import { Stepper } from "./Stepper";
import { StepBasics } from "./steps/StepBasics";
import { StepSchedule } from "./steps/StepSchedule";
import { StepPricing } from "./steps/StepPricing";
import { StepCapacity } from "./steps/StepCapacity";
import { StepMedia } from "./steps/StepMedia";
import { StepSafetyTerms } from "./steps/StepSafetyTerms";
import { StepPreview } from "./steps/StepPreview";
import { 
  TripSchema, 
  Step1Schema, 
  Step2Schema, 
  Step3Schema, 
  Step4Schema, 
  Step5Schema, 
  Step6Schema,
  type TripFormData 
} from "@shared/schema";
import { ChevronLeft, ChevronRight, Save, Eye, Send } from "lucide-react";

const STEPS = [
  { id: 1, title: "Basics", description: "Title & description", schema: Step1Schema },
  { id: 2, title: "Schedule", description: "Date & location", schema: Step2Schema },
  { id: 3, title: "Pricing", description: "Cost details", schema: Step3Schema },
  { id: 4, title: "Capacity", description: "Seats & preferences", schema: Step4Schema },
  { id: 5, title: "Media", description: "Photos & visuals", schema: Step5Schema },
  { id: 6, title: "Safety", description: "Terms & safety", schema: Step6Schema },
  { id: 7, title: "Preview", description: "Review & publish", schema: TripSchema },
];

const FEATURE_FLAG_POST_TRIP_V3 = true; // Default ON as requested

interface PostTripWizardProps {
  draftId?: string;
  initialData?: Partial<TripFormData>;
}

export function PostTripWizard({ draftId, initialData }: PostTripWizardProps) {
  const [, setLocation] = useLocation();
  const { navigateBack } = useReturn();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Check feature flag
  if (!FEATURE_FLAG_POST_TRIP_V3) {
    setLocation("/post-trip-legacy");
    return null;
  }
  
  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      const currentPath = window.location.pathname + window.location.search;
      setLocation(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [isAuthenticated, authLoading, setLocation]);
  
  const form = useForm<TripFormData>({
    resolver: zodResolver(TripSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "unknown",
      fromLocation: "",
      toLocation: "",
      region: "",
      date: "",
      time: "",
      duration: "",
      price: undefined,
      priceMin: undefined,
      priceMax: undefined,
      seatsAvailable: 1,
      buddyFriendly: false,
      mediaUrls: [],
      coverImageIndex: 0,
      mediaMetadata: [],
      safetyFlags: [],
      termsAccepted: false,
      contactInfo: "",
      notes: "",
      tags: [],
      difficulty: undefined,
      seasonality: [],
      ...initialData,
    },
    mode: "onBlur", // Changed from onChange to reduce re-renders
  });
  
  const formData = form.watch(); // Keep for autosave but optimize below
  
  // Autosave functionality
  const { saveDraft, isSaving, isSuccess } = useAutosaveDraft(formData, {
    draftId,
    onSave: (savedDraft) => {
      if (!draftId && savedDraft?.id) {
        // Update URL with draft ID without navigation
        const url = new URL(window.location.href);
        url.searchParams.set("draftId", savedDraft.id);
        window.history.replaceState({}, "", url.toString());
      }
      setHasUnsavedChanges(false);
    },
  });
  
  // Track unsaved changes
  useEffect(() => {
    const subscription = form.watch(() => {
      setHasUnsavedChanges(true);
    });
    return () => subscription.unsubscribe();
  }, [form]);
  
  // Unsaved changes guard
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
      }
    };
    
    window.addEventListener("beforeunload", handleBeforeUnload);
    
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);
  
  const validateCurrentStep = async () => {
    const stepSchema = STEPS.find(s => s.id === currentStep)?.schema;
    if (!stepSchema) return false;
    
    try {
      await stepSchema.parseAsync(formData);
      
      // Mark step as completed if not already
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps(prev => [...prev, currentStep]);
      }
      
      return true;
    } catch (error) {
      return false;
    }
  };
  
  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    
    if (isValid && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      toast({
        title: "Please complete required fields",
        description: "Some required information is missing or invalid.",
        variant: "destructive",
      });
    }
  };
  
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to cancel?"
      );
      if (!confirmed) return;
    }
    
    navigateBack();
  };
  
  const handlePreview = async () => {
    try {
      await saveDraft();
      // For now, just show the preview step instead of navigating away
      setCurrentStep(7);
    } catch (error) {
      toast({
        title: "Error saving draft",
        description: "Please try again before previewing.",
        variant: "destructive",
      });
    }
  };
  
  const handlePublish = async () => {
    try {
      const isValid = await form.trigger();
      if (!isValid) {
        toast({
          title: "Please complete all required fields",
          description: "Review the form and fix any errors before publishing.",
          variant: "destructive",
        });
        return;
      }
      
      // Create the trip data for publishing
      const tripData = {
        title: formData.title,
        fromLocation: formData.fromLocation,
        toLocation: formData.toLocation,
        date: formData.date ? new Date(formData.date).toISOString() : new Date().toISOString(),
        time: formData.time || '09:00',
        duration: formData.duration || '1 day',
        description: formData.description || '',
        seatsAvailable: formData.seatsAvailable || 1,
        price: formData.price || 0,
        priceMin: formData.priceMin,
        priceMax: formData.priceMax,
        notes: formData.notes,
        // New separate contact fields instead of contactInfo
        organizerPhone: formData.organizerPhone,
        organizerEmail: formData.organizerEmail,
        organizerCountryCode: formData.organizerCountryCode || '+94',
        safetyFlags: formData.safetyFlags || [],
        region: formData.region,
        category: formData.category, // Use selected category (required field)
        difficulty: 'easy', // Default difficulty
        status: 'active',
        mediaUrls: formData.mediaUrls || [], // Send as mediaUrls to match server schema
        coverImageIndex: formData.coverImageIndex || 0,
        mediaMetadata: formData.mediaMetadata || []
      };

      
      // Create the trip via API
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tripData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      toast({
        title: "Trip published successfully!",
        description: "Your trip is now live and visible to other travelers.",
      });
      
      // Navigate to the specific trip that was just created
      setLocation(`/trips/${result.id}`);
    } catch (error) {
      console.error('Publishing error:', error);
      toast({
        title: "Publishing failed",
        description: "Please try again or contact support if the problem persists.",
        variant: "destructive",
      });
    }
  };
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <StepBasics form={form} />;
      case 2:
        return <StepSchedule form={form} />;
      case 3:
        return <StepPricing form={form} />;
      case 4:
        return <StepCapacity form={form} />;
      case 5:
        return <StepMedia form={form} />;
      case 6:
        return <StepSafetyTerms form={form} />;
      case 7:
        return <StepPreview form={form} />;
      default:
        return null;
    }
  };
  
  const isLastStep = currentStep === STEPS.length;
  
  // Check if current step can proceed (has valid data)
  const checkCanProceed = () => {
    const stepSchema = STEPS.find(s => s.id === currentStep)?.schema;
    if (!stepSchema) return false;
    
    try {
      stepSchema.parse(formData);
      return true;
    } catch {
      return false;
    }
  };
  
  const canProceed = checkCanProceed();
  
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ceylon-blue mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return null;
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Post a Trip</h1>
          
          {/* Save indicator */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {isSaving && (
              <div className="flex items-center gap-1">
                <div className="animate-spin w-3 h-3 border border-gray-400 border-t-transparent rounded-full"></div>
                Saving...
              </div>
            )}
            {isSuccess && !isSaving && (
              <div className="text-green-600">Saved just now</div>
            )}
          </div>
        </div>
        
        <Stepper
          steps={STEPS}
          currentStep={currentStep}
          completedSteps={completedSteps}
        />
      </div>
      
      {/* Main Content */}
      <Form {...form}>
        <form className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>
                {STEPS.find(s => s.id === currentStep)?.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderStepContent()}
            </CardContent>
          </Card>
          
          {/* Navigation */}
          <div className="flex items-center justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              data-testid="wizard-cancel-button"
            >
              Cancel
            </Button>
            
            <div className="flex items-center gap-3">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300"
                  data-testid="wizard-back-button"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              )}
              
              {currentStep === STEPS.length - 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreview}
                  className="border-pink-200 text-pink-600 hover:bg-pink-50 hover:border-pink-300"
                  data-testid="wizard-preview-button"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Preview
                </Button>
              )}
              
              {isLastStep ? (
                <Button
                  type="button"
                  onClick={handlePublish}
                  className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 text-white hover:from-orange-600 hover:via-red-600 hover:to-pink-700 transition-all duration-300"
                  data-testid="wizard-publish-button"
                >
                  <Send className="w-4 h-4 mr-1" />
                  Publish Trip
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceed}
                  className="bg-gradient-to-r from-orange-400 to-pink-500 text-white hover:from-orange-500 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  data-testid="wizard-next-button"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}