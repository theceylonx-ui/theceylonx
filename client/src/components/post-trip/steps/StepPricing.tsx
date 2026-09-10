import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { TripFormData } from "@shared/schema";
import { useState } from "react";

interface StepPricingProps {
  form: UseFormReturn<TripFormData>;
}

export function StepPricing({ form }: StepPricingProps) {
  const [useRange, setUseRange] = useState(false);
  
  const watchedPrice = form.watch("price");
  const watchedPriceMin = form.watch("priceMin");
  const watchedPriceMax = form.watch("priceMax");

  const handleToggleRange = (checked: boolean) => {
    setUseRange(checked);
    if (!checked) {
      // Clear range values when switching to fixed price
      form.setValue("priceMin", undefined);
      form.setValue("priceMax", undefined);
    } else {
      // Clear fixed price when switching to range
      form.setValue("price", undefined);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* Pricing Type Toggle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pricing Structure
            </CardTitle>
            <CardDescription>
              Choose between a fixed price or a price range for your trip.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg border-2 border-gray-200 bg-white hover:border-accent/40 transition-colors">
              <div className="flex items-center space-x-3">
                <span className="text-lg">💰</span>
                <div>
                  <label htmlFor="use-price-range" className="text-sm font-semibold block">
                    Use price range instead of fixed price
                  </label>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {useRange ? 'Flexible pricing with min/max values' : 'Single fixed price for all participants'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-semibold ${
                  useRange ? 'text-success' : 'text-gray-500'
                }`}>
                  {useRange ? '✓ Range' : 'Fixed'}
                </span>
                <Switch
                  id="use-price-range"
                  checked={useRange}
                  onCheckedChange={handleToggleRange}
                  data-testid="price-range-toggle"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fixed Price */}
        {!useRange && (
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  Price per Person (LKR)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Set a fair price considering transportation, activities, and your time</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">LKR</span>
                    <Input
                      type="number"
                      placeholder="0"
                      min="0"
                      step="50"
                      className="pl-12"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      data-testid="fixed-price-input"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Price Range */}
        {useRange && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="priceMin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Price (LKR)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">LKR</span>
                      <Input
                        type="number"
                        placeholder="0"
                        min="0"
                        step="50"
                        className="pl-12"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        data-testid="min-price-input"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priceMax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Price (LKR)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">LKR</span>
                      <Input
                        type="number"
                        placeholder="0"
                        min={watchedPriceMin || 0}
                        step="50"
                        className="pl-12"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        data-testid="max-price-input"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Free Trip Option */}
        <Card className="border-success/30 bg-success/10">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="free-trip"
                checked={(!useRange && watchedPrice === 0) || (useRange && watchedPriceMin === 0 && watchedPriceMax === 0)}
                onChange={(e) => {
                  if (e.target.checked) {
                    if (useRange) {
                      form.setValue("priceMin", 0);
                      form.setValue("priceMax", 0);
                    } else {
                      form.setValue("price", 0);
                    }
                  }
                }}
                className="mt-1"
                data-testid="free-trip-checkbox"
              />
              <div className="flex-1">
                <label htmlFor="free-trip" className="text-sm font-medium text-success">
                  This is a free trip
                </label>
                <p className="text-xs text-success/80 mt-1">
                  Participants only need to cover their own expenses (food, entrance fees, etc.)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Tips */}
      <div className="bg-accent-subtle border border-accent/20 rounded-lg p-4">
        <h4 className="font-medium text-accent mb-2">💰 Pricing Guidelines</h4>
        <ul className="text-sm text-text-secondary space-y-1">
          <li>• Consider transportation costs (fuel, tolls, parking)</li>
          <li>• Factor in entrance fees and activity costs</li>
          <li>• Account for your time and effort as organizer</li>
          <li>• Be transparent about what's included/excluded</li>
          <li>• Price ranges work well for flexible trips</li>
          <li>• Free trips attract more participants but check cost coverage</li>
        </ul>
      </div>

    </div>
  );
}