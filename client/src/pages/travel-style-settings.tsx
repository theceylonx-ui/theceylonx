import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Settings, ArrowRight, Sparkles } from 'lucide-react';
import { useLocation } from 'wouter';
import Navigation from '@/components/navigation';

export default function TravelStyleSettings() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Auto-redirect to profile preferences after a brief moment
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user) {
        setLocation('/me');
        // Programmatically switch to preferences tab
        setTimeout(() => {
          const preferencesTab = document.querySelector('[value="preferences"]');
          if (preferencesTab) {
            (preferencesTab as HTMLElement).click();
          }
        }, 100);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [user, setLocation]);

  const goToPreferences = () => {
    setLocation('/me');
    // Programmatically switch to preferences tab
    setTimeout(() => {
      const preferencesTab = document.querySelector('[value="preferences"]');
      if (preferencesTab) {
        (preferencesTab as HTMLElement).click();
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className="h-8 w-8 text-orange-500" />
              <h1 className="text-4xl font-bold text-gray-900">
                Travel Preferences Upgraded!
              </h1>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We've moved your travel preferences to a better location with more options and improved features.
            </p>
          </div>

          {/* Main Card */}
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <Settings className="h-6 w-6 text-orange-500" />
                Enhanced Preferences System
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-left">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">💡 Travel Tip:</span> These preferences are based on your personal choices. 
                  Always check with locals for more accurate and up-to-date information about destinations, weather, and activities.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">What's New:</h3>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-3">
                    <div className="bg-green-100 text-green-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold mt-0.5">✓</div>
                    <div>
                      <strong>More Travel Vibes:</strong> Choose from relaxed, adventure, culture, beach, nature, nightlife, and wellness
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-green-100 text-green-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold mt-0.5">✓</div>
                    <div>
                      <strong>Seasonal Preferences:</strong> Select your preferred travel months for better recommendations
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-green-100 text-green-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold mt-0.5">✓</div>
                    <div>
                      <strong>Regional Preferences:</strong> Choose specific regions of Sri Lanka you'd like to explore
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-green-100 text-green-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold mt-0.5">✓</div>
                    <div>
                      <strong>Budget Range:</strong> Set your preferred spending range for better trip matching
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-green-100 text-green-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold mt-0.5">✓</div>
                    <div>
                      <strong>Enhanced Interests:</strong> More specific interests including ayurveda, train journeys, and diving
                    </div>
                  </li>
                </ul>
              </div>

              <div className="pt-4">
                <Button 
                  onClick={goToPreferences}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white text-lg py-3"
                  data-testid="button-go-to-preferences"
                >
                  <ArrowRight className="h-5 w-5 mr-2" />
                  Go to Enhanced Preferences
                </Button>
                <p className="text-sm text-gray-500 mt-3">
                  You'll be redirected automatically in a few seconds...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}