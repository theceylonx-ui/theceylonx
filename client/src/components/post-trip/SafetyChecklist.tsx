import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, Shield, AlertTriangle, Info } from "lucide-react";

const SAFETY_ITEMS = [
  {
    id: "weather_dependent",
    label: "Weather dependent activity",
    description: "This trip may be affected by weather conditions",
    required: false,
  },
  {
    id: "road_conditions",
    label: "Challenging road conditions",
    description: "Route includes difficult or unpaved roads",
    required: false,
  },
  {
    id: "equipment_required",
    label: "Special equipment needed",
    description: "Participants need to bring specific gear",
    required: false,
  },
  {
    id: "fitness_required",
    label: "Physical fitness required",
    description: "Trip involves physical activity or endurance",
    required: false,
  },
  {
    id: "swimming_ability",
    label: "Swimming ability required",
    description: "Participants should know how to swim",
    required: false,
  },
  {
    id: "medical_considerations",
    label: "Medical considerations",
    description: "May not be suitable for certain medical conditions",
    required: false,
  },
];

const REQUIRED_CONFIRMATIONS = [
  {
    id: "emergency_contact",
    label: "Emergency contact information provided",
    description: "I have provided valid emergency contact details",
    required: true,
  },
  {
    id: "accurate_description",
    label: "Accurate trip description",
    description: "I confirm the trip details are accurate and complete",
    required: true,
  },
  {
    id: "safety_responsibility",
    label: "Safety responsibility acknowledged",
    description: "I understand my responsibility for participant safety",
    required: true,
  },
  {
    id: "platform_terms",
    label: "Platform terms accepted",
    description: "I agree to use this free platform responsibly and ethically",
    required: true,
  },
];

interface SafetyChecklistProps {
  value: string[];
  onChange: (flags: string[]) => void;
  onTermsChange?: (accepted: boolean) => void;
  termsAccepted?: boolean;
  error?: string;
  className?: string;
}

export function SafetyChecklist({ value, onChange, onTermsChange, termsAccepted, error, className }: SafetyChecklistProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set(value));
  
  const handleItemChange = (itemId: string, checked: boolean) => {
    const newCheckedItems = new Set(checkedItems);
    
    if (checked) {
      newCheckedItems.add(itemId);
    } else {
      newCheckedItems.delete(itemId);
    }
    
    setCheckedItems(newCheckedItems);
    onChange(Array.from(newCheckedItems));
  };
  
  const handleTermsChange = (itemId: string, checked: boolean) => {
    if (itemId === 'platform_terms' && onTermsChange) {
      onTermsChange(checked);
    }
  };
  
  const requiredItems = REQUIRED_CONFIRMATIONS.filter(item => item.id !== 'platform_terms').map(item => item.id);
  const allRequiredChecked = requiredItems.every(id => checkedItems.has(id)) && (termsAccepted || false);
  
  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Safety Flags Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Safety Considerations
            </CardTitle>
            <CardDescription>
              Select any conditions that apply to your trip to help participants prepare appropriately.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {SAFETY_ITEMS.map((item) => (
              <div key={item.id} className="flex items-start space-x-3">
                <Checkbox
                  id={`safety-${item.id}`}
                  checked={checkedItems.has(item.id)}
                  onCheckedChange={(checked) => handleItemChange(item.id, !!checked)}
                  data-testid={`safety-checkbox-${item.id}`}
                />
                <div className="flex-1">
                  <Label
                    htmlFor={`safety-${item.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {item.label}
                  </Label>
                  <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        
        {/* Required Confirmations Section */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Required Confirmations
            </CardTitle>
            <CardDescription>
              These confirmations are mandatory before publishing your trip.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {REQUIRED_CONFIRMATIONS.map((item) => (
              <div key={item.id} className="flex items-start space-x-3">
                <Checkbox
                  id={`required-${item.id}`}
                  checked={item.id === 'platform_terms' ? (termsAccepted || false) : checkedItems.has(item.id)}
                  onCheckedChange={(checked) => {
                    if (item.id === 'platform_terms') {
                      handleTermsChange(item.id, !!checked);
                    } else {
                      handleItemChange(item.id, !!checked);
                    }
                  }}
                  required
                  data-testid={`required-checkbox-${item.id}`}
                />
                <div className="flex-1">
                  <Label
                    htmlFor={`required-${item.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {item.label} <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        
        {/* Help Link */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Need help understanding safety requirements?</span>
            <Button 
              variant="outline" 
              size="sm" 
              asChild
              data-testid="safety-help-link"
            >
              <a href="/help/trips#posting" target="_blank" rel="noopener noreferrer">
                View Guide <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
          </AlertDescription>
        </Alert>
        
        {!allRequiredChecked && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please complete all required confirmations before proceeding.
            </AlertDescription>
          </Alert>
        )}
        
        {error && (
          <p className="text-sm text-red-600" data-testid="safety-checklist-error">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}