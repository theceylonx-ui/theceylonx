import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SafetyChecklist } from "../SafetyChecklist";
import type { TripFormData } from "@shared/schema";
import { Phone, Mail, Globe } from "lucide-react";

interface StepSafetyTermsProps {
  form: UseFormReturn<TripFormData>;
}

// Common country codes for South Asian and international users
const COUNTRY_CODES = [
  { code: "+94", label: "+94 🇱🇰 Sri Lanka", flag: "🇱🇰" },
  { code: "+91", label: "+91 🇮🇳 India", flag: "🇮🇳" },
  { code: "+92", label: "+92 🇵🇰 Pakistan", flag: "🇵🇰" },
  { code: "+880", label: "+880 🇧🇩 Bangladesh", flag: "🇧🇩" },
  { code: "+44", label: "+44 🇬🇧 United Kingdom", flag: "🇬🇧" },
  { code: "+1", label: "+1 🇺🇸 United States", flag: "🇺🇸" },
  { code: "+61", label: "+61 🇦🇺 Australia", flag: "🇦🇺" },
  { code: "+971", label: "+971 🇦🇪 UAE", flag: "🇦🇪" },
  { code: "+65", label: "+65 🇸🇬 Singapore", flag: "🇸🇬" },
  { code: "+60", label: "+60 🇲🇾 Malaysia", flag: "🇲🇾" },
];

export function StepSafetyTerms({ form }: StepSafetyTermsProps) {
  return (
    <div className="space-y-6">
      {/* Contact Information Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Contact Information</h3>
          <p className="text-sm text-gray-600 mb-4">
            Provide at least one contact method (phone or email) for participants to reach you.
          </p>
        </div>

        {/* Phone Number Section */}
        <div className="space-y-3">
          <FormField
            control={form.control}
            name="organizerCountryCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Country Code
                </FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange} data-testid="country-code-select">
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select country code" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRY_CODES.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="organizerPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  WhatsApp/Phone Number
                  <span className="text-gray-500 text-sm">(optional but recommended)</span>
                </FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 py-2 border border-input bg-background rounded-md text-sm font-mono">
                      {form.watch("organizerCountryCode") || "+94"}
                    </div>
                    <Input
                      placeholder="771234567"
                      maxLength={9}
                      {...field}
                      className="flex-1"
                      data-testid="organizer-phone-input"
                    />
                  </div>
                </FormControl>
                <FormMessage />
                <p className="text-xs text-gray-500">
                  9-digit number without country code. Direct WhatsApp messaging available.
                </p>
              </FormItem>
            )}
          />
        </div>

        {/* Email Section */}
        <FormField
          control={form.control}
          name="organizerEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
                <span className="text-gray-500 text-sm">(optional but recommended)</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  {...field}
                  data-testid="organizer-email-input"
                />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-gray-500">
                For participants who prefer email communication.
              </p>
            </FormItem>
          )}
        />

        {/* Privacy Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 font-medium mb-2">🔒 Your Privacy is Protected</p>
          <p className="text-sm text-blue-700">
            Contact details are kept private and only shared with accepted participants through our secure chat system. 
            You control who gets your contact information.
          </p>
        </div>
      </div>

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