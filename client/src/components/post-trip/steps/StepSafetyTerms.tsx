import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SafetyChecklist } from "../SafetyChecklist";
import type { TripFormData } from "@shared/schema";

interface StepSafetyTermsProps {
  form: UseFormReturn<TripFormData>;
}

export function StepSafetyTerms({ form }: StepSafetyTermsProps) {
  return (
    <div className="space-y-6">
      {/* Contact Information */}
      <FormField
        control={form.control}
        name="contactInfo"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Contact Information</FormLabel>
            <FormControl>
              <Input
                placeholder="WhatsApp number, email, or other contact method"
                {...field}
                data-testid="contact-info-input"
              />
            </FormControl>
            <FormMessage />
            <p className="text-sm text-gray-600">
              This will be shared with participants for trip coordination
            </p>
          </FormItem>
        )}
      />

      {/* Additional Notes */}
      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Additional Notes (Optional)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Any special instructions, what to bring, meeting point details, etc."
                className="min-h-24 resize-none"
                {...field}
                data-testid="trip-notes-input"
              />
            </FormControl>
            <FormMessage />
            <p className="text-sm text-gray-500">
              {field.value?.length || 0}/500 characters
            </p>
          </FormItem>
        )}
      />

      {/* Safety Checklist */}
      <FormField
        control={form.control}
        name="safetyFlags"
        render={({ field }) => (
          <FormItem>
            <SafetyChecklist
              value={field.value || []}
              onChange={field.onChange}
              error={form.formState.errors.safetyFlags?.message}
            />
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}