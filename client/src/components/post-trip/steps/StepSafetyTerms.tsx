import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SafetyChecklist } from "../SafetyChecklist";
import type { TripFormData } from "@shared/schema";
import { Phone, Mail, Globe } from "lucide-react";
import { useState } from "react";

interface StepSafetyTermsProps {
  form: UseFormReturn<TripFormData>;
}

// Comprehensive country codes - major countries plus custom option
const COUNTRY_CODES = [
  { code: "+94", label: "+94 🇱🇰 Sri Lanka", flag: "🇱🇰" },
  { code: "+91", label: "+91 🇮🇳 India", flag: "🇮🇳" },
  { code: "+92", label: "+92 🇵🇰 Pakistan", flag: "🇵🇰" },
  { code: "+880", label: "+880 🇧🇩 Bangladesh", flag: "🇧🇩" },
  { code: "+1", label: "+1 🇺🇸 United States", flag: "🇺🇸" },
  { code: "+1", label: "+1 🇨🇦 Canada", flag: "🇨🇦" },
  { code: "+44", label: "+44 🇬🇧 United Kingdom", flag: "🇬🇧" },
  { code: "+61", label: "+61 🇦🇺 Australia", flag: "🇦🇺" },
  { code: "+49", label: "+49 🇩🇪 Germany", flag: "🇩🇪" },
  { code: "+33", label: "+33 🇫🇷 France", flag: "🇫🇷" },
  { code: "+39", label: "+39 🇮🇹 Italy", flag: "🇮🇹" },
  { code: "+34", label: "+34 🇪🇸 Spain", flag: "🇪🇸" },
  { code: "+31", label: "+31 🇳🇱 Netherlands", flag: "🇳🇱" },
  { code: "+46", label: "+46 🇸🇪 Sweden", flag: "🇸🇪" },
  { code: "+47", label: "+47 🇳🇴 Norway", flag: "🇳🇴" },
  { code: "+45", label: "+45 🇩🇰 Denmark", flag: "🇩🇰" },
  { code: "+41", label: "+41 🇨🇭 Switzerland", flag: "🇨🇭" },
  { code: "+43", label: "+43 🇦🇹 Austria", flag: "🇦🇹" },
  { code: "+32", label: "+32 🇧🇪 Belgium", flag: "🇧🇪" },
  { code: "+351", label: "+351 🇵🇹 Portugal", flag: "🇵🇹" },
  { code: "+353", label: "+353 🇮🇪 Ireland", flag: "🇮🇪" },
  { code: "+81", label: "+81 🇯🇵 Japan", flag: "🇯🇵" },
  { code: "+82", label: "+82 🇰🇷 South Korea", flag: "🇰🇷" },
  { code: "+86", label: "+86 🇨🇳 China", flag: "🇨🇳" },
  { code: "+852", label: "+852 🇭🇰 Hong Kong", flag: "🇭🇰" },
  { code: "+886", label: "+886 🇹🇼 Taiwan", flag: "🇹🇼" },
  { code: "+65", label: "+65 🇸🇬 Singapore", flag: "🇸🇬" },
  { code: "+60", label: "+60 🇲🇾 Malaysia", flag: "🇲🇾" },
  { code: "+66", label: "+66 🇹🇭 Thailand", flag: "🇹🇭" },
  { code: "+84", label: "+84 🇻🇳 Vietnam", flag: "🇻🇳" },
  { code: "+62", label: "+62 🇮🇩 Indonesia", flag: "🇮🇩" },
  { code: "+63", label: "+63 🇵🇭 Philippines", flag: "🇵🇭" },
  { code: "+971", label: "+971 🇦🇪 UAE", flag: "🇦🇪" },
  { code: "+966", label: "+966 🇸🇦 Saudi Arabia", flag: "🇸🇦" },
  { code: "+974", label: "+974 🇶🇦 Qatar", flag: "🇶🇦" },
  { code: "+965", label: "+965 🇰🇼 Kuwait", flag: "🇰🇼" },
  { code: "+973", label: "+973 🇧🇭 Bahrain", flag: "🇧🇭" },
  { code: "+968", label: "+968 🇴🇲 Oman", flag: "🇴🇲" },
  { code: "+90", label: "+90 🇹🇷 Turkey", flag: "🇹🇷" },
  { code: "+7", label: "+7 🇷🇺 Russia", flag: "🇷🇺" },
  { code: "+64", label: "+64 🇳🇿 New Zealand", flag: "🇳🇿" },
  { code: "+27", label: "+27 🇿🇦 South Africa", flag: "🇿🇦" },
  { code: "+234", label: "+234 🇳🇬 Nigeria", flag: "🇳🇬" },
  { code: "+254", label: "+254 🇰🇪 Kenya", flag: "🇰🇪" },
  { code: "+20", label: "+20 🇪🇬 Egypt", flag: "🇪🇬" },
  { code: "+212", label: "+212 🇲🇦 Morocco", flag: "🇲🇦" },
  { code: "+55", label: "+55 🇧🇷 Brazil", flag: "🇧🇷" },
  { code: "+52", label: "+52 🇲🇽 Mexico", flag: "🇲🇽" },
  { code: "+54", label: "+54 🇦🇷 Argentina", flag: "🇦🇷" },
  { code: "+56", label: "+56 🇨🇱 Chile", flag: "🇨🇱" },
  { code: "+57", label: "+57 🇨🇴 Colombia", flag: "🇨🇴" },
  { code: "+51", label: "+51 🇵🇪 Peru", flag: "🇵🇪" },
  { code: "custom", label: "🌍 Other Country (Enter Code)", flag: "🌍" },
];

export function StepSafetyTerms({ form }: StepSafetyTermsProps) {
  const [isCustomCountryCode, setIsCustomCountryCode] = useState(false);
  const [customCountryCode, setCustomCountryCode] = useState("");
  
  const handleCountryCodeChange = (value: string) => {
    if (value === "custom") {
      setIsCustomCountryCode(true);
      // Don't set form value yet - wait for custom input
    } else {
      setIsCustomCountryCode(false);
      setCustomCountryCode("");
      form.setValue("organizerCountryCode", value);
    }
  };
  
  const handleCustomCodeChange = (value: string) => {
    setCustomCountryCode(value);
    // Set form value with + prefix if not already present
    const code = value.startsWith("+") ? value : `+${value}`;
    form.setValue("organizerCountryCode", code);
  };
  
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
                  {!isCustomCountryCode ? (
                    <Select value={field.value || "+94"} onValueChange={handleCountryCodeChange} data-testid="country-code-select">
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
                  ) : (
                    <div className="space-y-2">
                      <Input
                        placeholder="Enter country code (e.g. +977)"
                        value={customCountryCode}
                        onChange={(e) => handleCustomCodeChange(e.target.value)}
                        className="w-48"
                        data-testid="custom-country-code-input"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomCountryCode(false);
                          setCustomCountryCode("");
                          form.setValue("organizerCountryCode", "+94");
                        }}
                        className="text-sm text-accent hover:underline"
                      >
                        ← Back to country list
                      </button>
                    </div>
                  )}
                </FormControl>
                <FormMessage />
                {isCustomCountryCode && (
                  <p className="text-xs text-gray-500">
                    Enter your country code with + (e.g. +977 for Nepal, +975 for Bhutan)
                  </p>
                )}
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
        <div className="bg-accent-subtle border border-accent/20 rounded-lg p-4">
          <p className="text-sm text-accent font-medium mb-2">🔒 Your Privacy is Protected</p>
          <p className="text-sm text-text-secondary">
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