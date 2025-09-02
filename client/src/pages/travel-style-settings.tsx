import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Settings, RotateCcw, Check } from 'lucide-react';
import { useLocation } from 'wouter';
import Navigation from '@/components/navigation';

interface TravelStyleSettings {
  vibe: string[];
  when: string[];
  companions: string[];
  interests: string[];
}

const vibeOptions = [
  { value: 'Beach', emoji: '🏝', label: 'Beach' },
  { value: 'Hills', emoji: '🏔', label: 'Hills' },
  { value: 'City', emoji: '🏙', label: 'City' },
  { value: 'Culture', emoji: '🛕', label: 'Culture' },
  { value: 'Wildlife', emoji: '🐆', label: 'Wildlife' },
  { value: 'Wellness', emoji: '🧘', label: 'Wellness' },
  { value: 'Food', emoji: '🍲', label: 'Food' },
  { value: 'Hidden gems', emoji: '✨', label: 'Hidden gems' },
];

const whenOptions = [
  { value: 'Weekends', label: 'Weekends' },
  { value: 'Long holidays', label: 'Long holidays' },
  { value: 'Festivals & events', label: 'Festivals & events' },
];

const companionsOptions = [
  { value: 'Solo', label: 'Solo' },
  { value: 'Friends', label: 'Friends' },
  { value: 'Family', label: 'Family' },
];

const interestOptions = [
  { value: 'Surfing', label: 'Surfing' },
  { value: 'Whale watching', label: 'Whale watching' },
  { value: 'Train rides', label: 'Train rides' },
  { value: 'Tea estates', label: 'Tea estates' },
  { value: 'Temple trails', label: 'Temple trails' },
  { value: 'Street food', label: 'Street food' },
  { value: 'Waterfalls', label: 'Waterfalls' },
  { value: 'Safari', label: 'Safari' },
  { value: 'Ayurveda', label: 'Ayurveda' },
];

export default function TravelStyleSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const [settings, setSettings] = useState<TravelStyleSettings>({
    vibe: [],
    when: [],
    companions: [],
    interests: [],
  });

  // Fetch existing preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['/api/user/preferences'],
    enabled: !!user,
  });

  // Load existing preferences when data arrives
  useEffect(() => {
    if (preferences) {
      setSettings({
        vibe: preferences.vibe || [],
        when: preferences.when || [],
        companions: preferences.companions || [],
        interests: preferences.interests || [],
      });
    }
  }, [preferences]);

  // Save preferences mutation
  const saveMutation = useMutation({
    mutationFn: async (data: TravelStyleSettings) => {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save preferences');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Preferences saved",
        description: "Your suggestions will update.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/preferences'] });
      queryClient.invalidateQueries({ queryKey: ['/api/recommendations/enhanced'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error saving preferences",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleChipToggle = (category: keyof TravelStyleSettings, value: string) => {
    setSettings(prev => {
      const current = prev[category];
      const isSelected = current.includes(value);
      
      if (isSelected) {
        // Remove the value
        return {
          ...prev,
          [category]: current.filter(v => v !== value),
        };
      } else {
        // Check limits
        const limits = { vibe: 3, when: 2, companions: 2, interests: Infinity };
        if (current.length >= limits[category]) {
          toast({
            title: `Maximum ${limits[category]} ${category === 'vibe' ? 'vibes' : category} allowed`,
            variant: "destructive",
          });
          return prev;
        }
        
        // Add the value
        return {
          ...prev,
          [category]: [...current, value],
        };
      }
    });
  };

  const handleReset = () => {
    setSettings({
      vibe: [],
      when: [],
      companions: [],
      interests: [],
    });
    toast({
      title: "Selections cleared",
      description: "Don't forget to save your changes.",
    });
  };

  const handleSave = () => {
    // Validate minimum requirements
    if (settings.vibe.length === 0 && settings.interests.length === 0) {
      toast({
        title: "Selection required",
        description: "Please select at least one vibe or interest.",
        variant: "destructive",
      });
      return;
    }
    
    saveMutation.mutate(settings);
  };

  const isValidForSave = settings.vibe.length > 0 || settings.interests.length > 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="p-6">
                  <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map(j => (
                      <div key={j} className="h-10 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="h-6 w-6 text-purple-600" />
            <h1 className="text-3xl font-bold" data-testid="page-title">
              Travel Style Settings
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Tell us your vibe. We'll suggest better trips in Sri Lanka.
          </p>
        </div>

        <div className="space-y-6">
          {/* Your vibe */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Your vibe
                <Badge variant="outline" className="text-sm">
                  Choose up to 3
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="vibe-chips">
                {vibeOptions.map(option => {
                  const isSelected = settings.vibe.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleChipToggle('vibe', option.value)}
                      className={`p-3 rounded-lg border-2 text-left transition-all duration-200 hover:scale-105 ${
                        isSelected 
                          ? 'border-purple-500 bg-purple-50 text-purple-900 ring-2 ring-purple-200' 
                          : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50'
                      }`}
                      data-testid={`chip-vibe-${option.value.toLowerCase().replace(' ', '-')}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{option.emoji}</span>
                        <span className="font-medium">{option.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                Selected: {settings.vibe.length}/3
              </div>
            </CardContent>
          </Card>

          {/* When you usually travel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                When you usually travel
                <Badge variant="outline" className="text-sm">
                  Choose up to 2
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3" data-testid="when-chips">
                {whenOptions.map(option => {
                  const isSelected = settings.when.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleChipToggle('when', option.value)}
                      className={`p-3 rounded-lg border-2 text-left transition-all duration-200 hover:scale-105 ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50 text-blue-900 ring-2 ring-blue-200' 
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                      }`}
                      data-testid={`chip-when-${option.value.toLowerCase().replace(/ /g, '-')}`}
                    >
                      <span className="font-medium">{option.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                Selected: {settings.when.length}/2
              </div>
            </CardContent>
          </Card>

          {/* Who you travel with */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Who you travel with
                <Badge variant="outline" className="text-sm">
                  Choose up to 2
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3" data-testid="companions-chips">
                {companionsOptions.map(option => {
                  const isSelected = settings.companions.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleChipToggle('companions', option.value)}
                      className={`p-3 rounded-lg border-2 text-left transition-all duration-200 hover:scale-105 ${
                        isSelected 
                          ? 'border-green-500 bg-green-50 text-green-900 ring-2 ring-green-200' 
                          : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50'
                      }`}
                      data-testid={`chip-companions-${option.value.toLowerCase()}`}
                    >
                      <span className="font-medium">{option.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                Selected: {settings.companions.length}/2
              </div>
            </CardContent>
          </Card>

          {/* Optional interests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Optional interests
                <Badge variant="outline" className="text-sm">
                  Choose many
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto" data-testid="interests-chips">
                {interestOptions.map(option => {
                  const isSelected = settings.interests.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleChipToggle('interests', option.value)}
                      className={`p-3 rounded-lg border-2 text-left transition-all duration-200 hover:scale-105 ${
                        isSelected 
                          ? 'border-orange-500 bg-orange-50 text-orange-900 ring-2 ring-orange-200' 
                          : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50'
                      }`}
                      data-testid={`chip-interests-${option.value.toLowerCase().replace(/ /g, '-')}`}
                    >
                      <span className="font-medium">{option.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                Selected: {settings.interests.length}
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Helper text */}
          <div className="text-sm text-muted-foreground bg-blue-50 p-4 rounded-lg">
            <p>You can change these anytime. Your picks help us reorder trips and show clearer reasons.</p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <Button
              variant="ghost"
              onClick={handleReset}
              className="text-gray-600 hover:text-gray-800"
              data-testid="button-reset"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={!isValidForSave || saveMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg"
              data-testid="button-save-preferences"
            >
              {saveMutation.isPending ? (
                <>Saving...</>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Sticky save button on mobile */}
      <div className="fixed bottom-4 right-4 sm:hidden">
        <Button
          onClick={handleSave}
          disabled={!isValidForSave || saveMutation.isPending}
          className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg rounded-full px-6 py-3"
          data-testid="button-save-preferences-mobile"
        >
          {saveMutation.isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}