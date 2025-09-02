import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface TravelPreferencesOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

type VibeOption = 'beach' | 'hills' | 'city' | 'culture';
type WhenOption = 'weekends' | 'festivals' | 'long_holidays';
type StyleOption = 'solo' | 'friends' | 'family';

const vibeOptions: { value: VibeOption; label: string; emoji: string; description: string }[] = [
  { value: 'beach', label: 'Beach', emoji: '🏝', description: 'Coastal adventures and beach relaxation' },
  { value: 'hills', label: 'Hills', emoji: '🏔', description: 'Mountain escapes and hill country' },
  { value: 'city', label: 'City', emoji: '🏙', description: 'Urban exploration and city life' },
  { value: 'culture', label: 'Culture', emoji: '🛕', description: 'Heritage sites and cultural experiences' },
];

const whenOptions: { value: WhenOption; label: string; description: string }[] = [
  { value: 'weekends', label: 'Weekends', description: 'Quick weekend getaways' },
  { value: 'festivals', label: 'Festivals', description: 'Cultural festivals and special events' },
  { value: 'long_holidays', label: 'Long Holidays', description: 'Extended trips and vacation time' },
];

const styleOptions: { value: StyleOption; label: string; description: string }[] = [
  { value: 'solo', label: 'Solo', description: 'Independent travel and self-discovery' },
  { value: 'friends', label: 'Friends', description: 'Group adventures with friends' },
  { value: 'family', label: 'Family', description: 'Family-friendly trips and bonding' },
];

export default function TravelPreferencesOnboarding({ 
  isOpen, 
  onClose, 
  onComplete 
}: TravelPreferencesOnboardingProps) {
  const [step, setStep] = useState(1);
  const [preferences, setPreferences] = useState({
    vibe: [] as VibeOption[],
    whenTravel: [] as WhenOption[],
    travelStyle: [] as StyleOption[],
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const savePreferencesMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/user/preferences', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/preferences'] });
      toast({ title: "Travel preferences saved!" });
      onComplete();
      onClose();
    },
    onError: (error) => {
      toast({ 
        title: "Failed to save preferences", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Save preferences
      savePreferencesMutation.mutate(preferences);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const canProceed = () => {
    switch (step) {
      case 1: return preferences.vibe.length > 0;
      case 2: return preferences.whenTravel.length > 0;
      case 3: return preferences.travelStyle.length > 0;
      default: return false;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">What's your vibe?</h3>
              <p className="text-sm text-gray-600">Choose one or more types of experiences you love (tap to select multiple)</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {vibeOptions.map((option) => {
                const isSelected = preferences.vibe.includes(option.value);
                return (
                  <Card 
                    key={option.value}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelected
                        ? 'ring-2 ring-ceylon-green bg-green-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      const newVibe = isSelected 
                        ? preferences.vibe.filter(v => v !== option.value)
                        : [...preferences.vibe, option.value];
                      setPreferences({ ...preferences, vibe: newVibe });
                    }}
                    data-testid={`vibe-option-${option.value}`}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl mb-2">{option.emoji}</div>
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                      {isSelected && <div className="text-xs text-ceylon-green font-medium mt-1">✓ Selected</div>}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">When do you travel?</h3>
              <p className="text-sm text-gray-600">Choose one or more travel timing preferences (tap to select multiple)</p>
            </div>
            <div className="space-y-3">
              {whenOptions.map((option) => {
                const isSelected = preferences.whenTravel.includes(option.value);
                return (
                  <Card 
                    key={option.value}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelected
                        ? 'ring-2 ring-ceylon-green bg-green-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      const newWhenTravel = isSelected 
                        ? preferences.whenTravel.filter(w => w !== option.value)
                        : [...preferences.whenTravel, option.value];
                      setPreferences({ ...preferences, whenTravel: newWhenTravel });
                    }}
                    data-testid={`when-option-${option.value}`}
                  >
                    <CardContent className="p-4">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-gray-500">{option.description}</div>
                      {isSelected && <div className="text-xs text-ceylon-green font-medium mt-1">✓ Selected</div>}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">How do you travel?</h3>
              <p className="text-sm text-gray-600">Choose one or more travel styles that suit you (tap to select multiple)</p>
            </div>
            <div className="space-y-3">
              {styleOptions.map((option) => {
                const isSelected = preferences.travelStyle.includes(option.value);
                return (
                  <Card 
                    key={option.value}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelected
                        ? 'ring-2 ring-ceylon-green bg-green-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      const newTravelStyle = isSelected 
                        ? preferences.travelStyle.filter(s => s !== option.value)
                        : [...preferences.travelStyle, option.value];
                      setPreferences({ ...preferences, travelStyle: newTravelStyle });
                    }}
                    data-testid={`style-option-${option.value}`}
                  >
                    <CardContent className="p-4">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-gray-500">{option.description}</div>
                      {isSelected && <div className="text-xs text-ceylon-green font-medium mt-1">✓ Selected</div>}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            Personalize Your Sri Lankan Journey
          </DialogTitle>
        </DialogHeader>
        
        {/* Progress indicator */}
        <div className="flex justify-center space-x-2 mb-6">
          {[1, 2, 3].map((stepNumber) => (
            <div
              key={stepNumber}
              className={`w-2 h-2 rounded-full transition-colors ${
                stepNumber <= step ? 'bg-ceylon-green' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {renderStep()}

        <div className="flex justify-between pt-6">
          <Button 
            variant="ghost" 
            onClick={handleSkip}
            data-testid="button-skip"
          >
            Skip for now
          </Button>
          <Button 
            onClick={handleNext}
            disabled={!canProceed() || savePreferencesMutation.isPending}
            data-testid={step === 3 ? "button-complete" : "button-next"}
          >
            {savePreferencesMutation.isPending 
              ? "Saving..." 
              : step === 3 
                ? "Complete Setup" 
                : "Next"
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}