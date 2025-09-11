import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Settings, CheckCircle, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

interface UserPreferences {
  vibe?: string[];
  companions?: string[];
  interests?: string[];
  months?: string[];
  regions?: string[];
  budgetMin?: number;
  budgetMax?: number;
}

interface PreferencesCompletionBannerProps {
  onDismiss?: () => void;
  className?: string;
}

// Helper function to calculate travel preferences completion
function calculatePreferencesCompletion(preferences: UserPreferences | null): number {
  if (!preferences) return 0;
  
  let completed = 0;
  let total = 4; // vibe, companions, interests, months
  
  if (preferences.vibe?.length && preferences.vibe.length > 0) completed++;
  if (preferences.companions?.length && preferences.companions.length > 0) completed++;
  if (preferences.interests?.length && preferences.interests.length > 0) completed++;
  if (preferences.months?.length && preferences.months.length > 0) completed++;
  
  return Math.round((completed / total) * 100);
}

export function PreferencesCompletionBanner({ onDismiss, className }: PreferencesCompletionBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Fetch current user preferences
  const { data: preferences, isLoading } = useQuery<UserPreferences>({
    queryKey: ["/api/preferences"],
    retry: false,
  });

  const completionPercentage = calculatePreferencesCompletion(preferences || null);

  // Don't show banner if dismissed, loading, or preferences are complete
  if (isDismissed || isLoading || completionPercentage >= 75) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <Card className={`border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50 to-yellow-50 shadow-sm ${className}`} data-testid="preferences-completion-banner">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-5 w-5 text-orange-500" />
              <h3 className="font-semibold text-gray-800">Complete Your Travel Preferences</h3>
              <Badge variant="outline" className="text-orange-700 border-orange-300">
                {completionPercentage}% complete
              </Badge>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">
              Set up your travel preferences to get personalized trip recommendations and find perfect travel companions!
            </p>
            
            {/* Progress bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>{completionPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-orange-500 to-yellow-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Quick benefits list */}
            <div className="text-xs text-gray-600 mb-3">
              <strong>Benefits:</strong> Personalized recommendations • Better trip matches • Find compatible companions
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                className="bg-orange-500 hover:bg-orange-600 text-white" 
                data-testid="button-complete-preferences"
                onClick={() => {
                  console.log('🔍 Complete Setup clicked - navigating to /me?tab=preferences');
                  window.location.href = '/me?tab=preferences';
                }}
              >
                <Settings className="h-4 w-4 mr-2" />
                Complete Setup
              </Button>
              
              {completionPercentage > 0 && (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {Math.round(completionPercentage / 25)} of 4 sections done
                </Badge>
              )}
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 p-1"
            data-testid="button-dismiss-banner"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}