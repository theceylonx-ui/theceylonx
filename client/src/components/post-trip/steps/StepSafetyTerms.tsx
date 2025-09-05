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
            <FormLabel>Your Contact Information</FormLabel>
            <FormControl>
              <Input
                placeholder="Your WhatsApp number or phone number"
                {...field}
                data-testid="contact-info-input"
              />
            </FormControl>
            <FormMessage />
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
              <p className="text-sm text-blue-800 font-medium">🔒 Privacy Protected</p>
              <p className="text-sm text-blue-700 mt-1">
                Your contact details are kept private. They will only be shared with participants through our secure chat system when you approve their trip requests. You have full control over who gets your contact information.
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
              <p className="text-sm text-green-800 font-medium">💡 WhatsApp Tip</p>
              <p className="text-sm text-green-700 mt-1">
                Enter your WhatsApp number with country code for easy communication. Examples:
              </p>
              <ul className="text-sm text-green-700 mt-1 ml-4 list-disc">
                <li>Sri Lanka: +94771234567</li>
                <li>India: +919876543210</li>
                <li>UK: +447123456789</li>
                <li>US: +15551234567</li>
              </ul>
              <p className="text-sm text-green-700 mt-1">
                International numbers work perfectly! Participants can click to message you directly on WhatsApp from anywhere in the world.
              </p>
            </div>
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
              termsAccepted={form.watch("termsAccepted")}
              onTermsChange={(accepted) => form.setValue("termsAccepted", accepted)}
              error={form.formState.errors.safetyFlags?.message}
            />
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}