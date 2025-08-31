import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserPreferences, useUpdatePreferences } from "@/hooks/useRecommendations";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, MapPin, DollarSign, Calendar, Clock, Users, Compass } from "lucide-react";

const SRI_LANKAN_REGIONS = [
  "Western Province",
  "Central Province", 
  "Southern Province",
  "Northern Province",
  "Eastern Province",
  "North Western Province",
  "North Central Province",
  "Uva Province",
  "Sabaragamuwa Province"
];

const TRIP_TYPES = [
  "adventure",
  "cultural", 
  "beach",
  "nature",
  "heritage",
  "wildlife",
  "city",
  "mountain",
  "religious",
  "food"
];

const INTERESTS = [
  "photography",
  "hiking",
  "surfing",
  "diving",
  "temples",
  "wildlife watching",
  "local cuisine",
  "history",
  "tea estates",
  "beaches",
  "mountains",
  "festivals"
];

const PREFERRED_DAYS = [
  { value: "weekday", label: "Weekdays" },
  { value: "weekend", label: "Weekends" }
];

const PREFERRED_TIMES = [
  { value: "morning", label: "Morning (6-12 PM)" },
  { value: "afternoon", label: "Afternoon (12-6 PM)" },
  { value: "evening", label: "Evening (6+ PM)" }
];

interface UserPreferencesProps {
  className?: string;
}

export function UserPreferences({ className }: UserPreferencesProps) {
  const { data: preferences, isLoading } = useUserPreferences();
  const { mutate: updatePreferences, isPending } = useUpdatePreferences();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    preferredRegions: preferences?.preferredRegions || [],
    budgetRange: preferences?.budgetRange || { min: 0, max: 1000 },
    preferredDays: preferences?.preferredDays || [],
    preferredTimes: preferences?.preferredTimes || [],
    tripTypes: preferences?.tripTypes || [],
    groupSize: preferences?.groupSize || "",
    travelStyle: preferences?.travelStyle || "",
    interests: preferences?.interests || [],
  });

  // Update form data when preferences load
  useState(() => {
    if (preferences) {
      setFormData({
        preferredRegions: preferences.preferredRegions || [],
        budgetRange: preferences.budgetRange || { min: 0, max: 1000 },
        preferredDays: preferences.preferredDays || [],
        preferredTimes: preferences.preferredTimes || [],
        tripTypes: preferences.tripTypes || [],
        groupSize: preferences.groupSize || "",
        travelStyle: preferences.travelStyle || "",
        interests: preferences.interests || [],
      });
    }
  });

  const handleSubmit = () => {
    updatePreferences(formData, {
      onSuccess: () => {
        toast({
          title: "Preferences updated",
          description: "Your travel preferences have been saved successfully!",
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to update preferences. Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item) 
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Travel Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Travel Preferences
        </CardTitle>
        <p className="text-sm text-gray-600">
          Help us recommend the perfect trips for you by setting your preferences.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preferred Regions */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Preferred Regions
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {SRI_LANKAN_REGIONS.map((region) => (
              <div key={region} className="flex items-center space-x-2">
                <Checkbox
                  id={`region-${region}`}
                  checked={formData.preferredRegions.includes(region)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFormData(prev => ({
                        ...prev,
                        preferredRegions: [...prev.preferredRegions, region]
                      }));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        preferredRegions: prev.preferredRegions.filter(r => r !== region)
                      }));
                    }
                  }}
                  data-testid={`checkbox-region-${region}`}
                />
                <Label htmlFor={`region-${region}`} className="text-sm">
                  {region}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Budget Range */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Budget Range (USD)
          </Label>
          <div className="space-y-2">
            <Slider
              min={0}
              max={2000}
              step={50}
              value={[formData.budgetRange.min, formData.budgetRange.max]}
              onValueChange={(value) => {
                setFormData(prev => ({
                  ...prev,
                  budgetRange: { min: value[0], max: value[1] }
                }));
              }}
              className="w-full"
              data-testid="slider-budget-range"
            />
            <div className="flex justify-between text-sm text-gray-600">
              <span>${formData.budgetRange.min}</span>
              <span>${formData.budgetRange.max}</span>
            </div>
          </div>
        </div>

        {/* Preferred Days */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Preferred Days
          </Label>
          <div className="flex gap-2">
            {PREFERRED_DAYS.map((day) => (
              <div key={day.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`day-${day.value}`}
                  checked={formData.preferredDays.includes(day.value)}
                  onCheckedChange={(checked) => {
                    setFormData(prev => ({
                      ...prev,
                      preferredDays: checked 
                        ? [...prev.preferredDays, day.value]
                        : prev.preferredDays.filter(d => d !== day.value)
                    }));
                  }}
                  data-testid={`checkbox-day-${day.value}`}
                />
                <Label htmlFor={`day-${day.value}`} className="text-sm">
                  {day.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Preferred Times */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Preferred Times
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {PREFERRED_TIMES.map((time) => (
              <div key={time.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`time-${time.value}`}
                  checked={formData.preferredTimes.includes(time.value)}
                  onCheckedChange={(checked) => {
                    setFormData(prev => ({
                      ...prev,
                      preferredTimes: checked 
                        ? [...prev.preferredTimes, time.value]
                        : prev.preferredTimes.filter(t => t !== time.value)
                    }));
                  }}
                  data-testid={`checkbox-time-${time.value}`}
                />
                <Label htmlFor={`time-${time.value}`} className="text-sm">
                  {time.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Trip Types */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Compass className="h-4 w-4" />
            Trip Types
          </Label>
          <div className="flex flex-wrap gap-2">
            {TRIP_TYPES.map((type) => (
              <Badge
                key={type}
                variant={formData.tripTypes.includes(type) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    tripTypes: toggleArrayItem(prev.tripTypes, type)
                  }));
                }}
                data-testid={`badge-trip-type-${type}`}
              >
                {type}
              </Badge>
            ))}
          </div>
        </div>

        {/* Group Size */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Preferred Group Size
          </Label>
          <Select 
            value={formData.groupSize} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, groupSize: value }))}
          >
            <SelectTrigger data-testid="select-group-size">
              <SelectValue placeholder="Select group size preference" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="solo">Solo Travel</SelectItem>
              <SelectItem value="couple">Couple (2 people)</SelectItem>
              <SelectItem value="small_group">Small Group (3-5 people)</SelectItem>
              <SelectItem value="large_group">Large Group (6+ people)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Travel Style */}
        <div className="space-y-2">
          <Label>Travel Style</Label>
          <Select 
            value={formData.travelStyle} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, travelStyle: value }))}
          >
            <SelectTrigger data-testid="select-travel-style">
              <SelectValue placeholder="Select your travel style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="budget">Budget Travel</SelectItem>
              <SelectItem value="comfort">Comfort Travel</SelectItem>
              <SelectItem value="luxury">Luxury Travel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Interests */}
        <div className="space-y-2">
          <Label>Interests</Label>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((interest) => (
              <Badge
                key={interest}
                variant={formData.interests.includes(interest) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    interests: toggleArrayItem(prev.interests, interest)
                  }));
                }}
                data-testid={`badge-interest-${interest}`}
              >
                {interest}
              </Badge>
            ))}
          </div>
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={isPending}
          className="w-full"
          data-testid="button-save-preferences"
        >
          <Save className="h-4 w-4 mr-2" />
          {isPending ? "Saving..." : "Save Preferences"}
        </Button>
      </CardContent>
    </Card>
  );
}