import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Settings, RotateCcw, Check, TrendingUp, Shield, Trash2 } from 'lucide-react';
import { useLocation } from 'wouter';
import Navigation from '@/components/navigation';

interface TravelStyleSettings {
  vibe: string[];
  when: string[];
  companions: string[];
  interests: string[];
}

const vibeOptions = [
  { value: 'beach', label: 'Beach', emoji: '🏖️' },
  { value: 'hills', label: 'Hills', emoji: '⛰️' },
  { value: 'city', label: 'City', emoji: '🏙️' },
  { value: 'culture', label: 'Culture', emoji: '🏛️' },
  { value: 'nature', label: 'Nature', emoji: '🌿' },
  { value: 'adventure', label: 'Adventure', emoji: '🎒' },
];

const whenOptions = [
  { value: 'weekends', label: 'Weekends' },
  { value: 'festivals', label: 'Festival season' },
  { value: 'long_holidays', label: 'Long holidays' },
];

const companionsOptions = [
  { value: 'solo', label: 'Solo travel' },
  { value: 'friends', label: 'With friends' },
  { value: 'family', label: 'With family' },
  { value: 'partner', label: 'With partner' },
];

const interestOptions = [
  { value: 'photography', label: 'Photography' },
  { value: 'food', label: 'Food & dining' },
  { value: 'temples', label: 'Temples & heritage' },
  { value: 'wildlife', label: 'Wildlife' },
  { value: 'tea_estates', label: 'Tea estates' },
  { value: 'waterfalls', label: 'Waterfalls' },
  { value: 'beaches', label: 'Beach activities' },
  { value: 'trekking', label: 'Trekking' },
  { value: 'train_rides', label: 'Scenic train rides' },
  { value: 'ayurveda', label: 'Ayurveda & wellness' },
  { value: 'nightlife', label: 'Nightlife' },
  { value: 'markets', label: 'Local markets' },
];

export default function TravelStyleSettings() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [settings, setSettings] = useState<TravelStyleSettings>({
    vibe: [],
    when: [],
    companions: [],
    interests: [],
  });

  // Fetch existing settings
  const { data: existingSettings, isLoading } = useQuery({
    queryKey: ['/api/user/personalization'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/user/personalization');
      return response.json();
    },
    enabled: !!user,
  });

  // Load existing settings
  useEffect(() => {
    if (existingSettings) {
      setSettings({
        vibe: existingSettings.vibe || [],
        when: existingSettings.when || [],
        companions: existingSettings.companions || [],
        interests: existingSettings.interests || [],
      });
    }
  }, [existingSettings]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: TravelStyleSettings) => {
      const response = await apiRequest('POST', '/api/user/personalization', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/personalization'] });
      queryClient.invalidateQueries({ queryKey: ['/api/recommendations/enhanced'] });
      toast({
        title: 'Settings saved!',
        description: 'Your travel style preferences have been updated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleChipToggle = (category: keyof TravelStyleSettings, value: string) => {
    setSettings(prev => {
      const current = prev[category];
      let updated;
      
      if (current.includes(value)) {
        updated = current.filter(item => item !== value);
      } else {
        // Apply limits
        const limits = { vibe: 3, when: 2, companions: 2, interests: Infinity };
        const limit = limits[category];
        
        if (current.length < limit) {
          updated = [...current, value];
        } else {
          updated = current;
          if (limit !== Infinity) {
            toast({
              title: `Maximum ${limit} selections`,
              description: `You can only select up to ${limit} options for ${category}.`,
              variant: 'destructive',
            });
          }
        }
      }
      
      return { ...prev, [category]: updated };
    });
  };

  const handleReset = () => {
    setSettings({
      vibe: [],
      when: [],
      companions: [],
      interests: [],
    });
  };

  const handleSave = () => {
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
      
      <div className="max-w-7xl mx-auto px-4 py-8">
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

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-6">
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
          
          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-3">
                  <div className="bg-purple-100 text-purple-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold">1</div>
                  <p>Set your travel preferences and interests</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-purple-100 text-purple-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold">2</div>
                  <p>Our AI analyzes your preferences and behavior</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-purple-100 text-purple-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold">3</div>
                  <p>Get personalized trip recommendations on your home page</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-purple-100 text-purple-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold">4</div>
                  <p>Recommendations improve as you interact with trips</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5" />
                  Privacy & Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <p>
                  Your preferences and interaction data are used solely to improve your experience with personalized recommendations.
                </p>
                <p>
                  We track which trips you view, bookmark, and join to better understand your travel interests and suggest relevant trips.
                </p>
                <p>
                  All data is stored securely and is never shared with third parties.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-red-600">
                  <Trash2 className="h-5 w-5" />
                  Account Deletion
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <p>
                  Need to delete your account? You can permanently remove all your data from Ceylon Expand.
                </p>
                <p className="text-red-600 font-medium">
                  Warning: This action cannot be undone and all your data will be permanently deleted.
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to permanently delete your account? This action cannot be undone.')) {
                      // TODO: Implement account deletion
                      toast({
                        title: "Account deletion requested",
                        description: "Please contact support to complete account deletion.",
                        variant: "destructive"
                      });
                    }
                  }}
                  data-testid="button-delete-account"
                >
                  Delete Account
                </Button>
              </CardContent>
            </Card>
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