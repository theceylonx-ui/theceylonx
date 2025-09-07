import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Heart, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { TripFormData } from "@shared/schema";

interface StepCapacityProps {
  form: UseFormReturn<TripFormData>;
}

export function StepCapacity({ form }: StepCapacityProps) {
  const seatsValue = form.watch("seatsAvailable");
  const buddyFriendlyValue = form.watch("buddyFriendly");

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* Available Seats */}
        <FormField
          control={form.control}
          name="seatsAvailable"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Available Seats
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>How many people can join your trip? Consider vehicle capacity and activity limits.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </FormLabel>
              <FormControl>
                <div className="relative max-w-xs">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="number"
                    placeholder="1"
                    min="1"
                    max="50"
                    className="pl-9"
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 1)}
                    data-testid="seats-available-input"
                  />
                </div>
              </FormControl>
              <FormMessage />
              {seatsValue && (
                <p className="text-sm text-gray-600">
                  {seatsValue === 1 ? 'Solo trip - just you!' : `Trip for ${seatsValue + 1} people total (including you)`}
                </p>
              )}
            </FormItem>
          )}
        />

        {/* Solo Traveler Friendly */}
        <Card className="border-pink-200 bg-pink-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Heart className="h-5 w-5 text-pink-600" />
              Solo Traveler Friendly
            </CardTitle>
            <CardDescription>
              Make your trip welcoming for solo travelers looking to make new friends.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="buddyFriendly"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border-2 border-gray-200 p-4 bg-white hover:border-pink-300 transition-colors">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base font-semibold flex items-center gap-2">
                      <span className="text-lg">❤️</span>
                      Solo Traveler Friendly Trip
                    </FormLabel>
                    <div className="text-sm text-gray-600">
                      Perfect for solo travelers who want to meet new people and share experiences
                    </div>
                  </div>
                  <FormControl>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-semibold ${
                        field.value ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {field.value ? '✓ Enabled' : 'Disabled'}
                      </span>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="buddy-friendly-switch"
                      />
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Capacity Guidelines */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Vehicle Capacity Guide</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span>Car (sedan):</span>
                <span>3-4 people</span>
              </div>
              <div className="flex justify-between">
                <span>SUV/Van:</span>
                <span>6-8 people</span>
              </div>
              <div className="flex justify-between">
                <span>Mini Bus:</span>
                <span>12-15 people</span>
              </div>
              <div className="flex justify-between">
                <span>Tour Bus:</span>
                <span>25-50 people</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Activity Considerations</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div>• <strong>Restaurants:</strong> Call ahead for large groups</div>
              <div>• <strong>Hotels:</strong> Book multiple rooms in advance</div>
              <div>• <strong>Activities:</strong> Check group size limits</div>
              <div>• <strong>Hiking:</strong> Smaller groups are more manageable</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Buddy Friendly Benefits */}
      {buddyFriendlyValue && (
        <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
          <h4 className="font-medium text-pink-900 mb-2">💕 Solo Traveler Friendly Benefits</h4>
          <ul className="text-sm text-pink-800 space-y-1">
            <li>• Your trip will be highlighted to solo travelers</li>
            <li>• Attracts people who are open to making new friends</li>
            <li>• Creates a welcoming atmosphere for everyone</li>
            <li>• Often leads to more engaging and social experiences</li>
          </ul>
        </div>
      )}

      {/* Capacity Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">👥 Capacity Planning Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Consider your vehicle's comfortable capacity</li>
          <li>• Smaller groups (4-8) often have better dynamics</li>
          <li>• Factor in luggage space for longer trips</li>
          <li>• Account for accessibility needs if applicable</li>
          <li>• Remember: you can always add more seats later if demand is high</li>
        </ul>
      </div>
    </div>
  );
}