import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ExternalLink, Shield, AlertTriangle, Info, BookOpen } from "lucide-react";

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
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  data-testid="safety-help-link"
                >
                  View Guide <BookOpen className="h-3 w-3 ml-1" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    Trip Safety Guidelines
                  </DialogTitle>
                  <DialogDescription>
                    Essential safety information for organizing and participating in trips
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 text-sm">
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-green-700">🛡️ Trip Organizer Responsibilities</h3>
                    <ul className="space-y-2 list-disc pl-6">
                      <li><strong>Emergency Planning:</strong> Have a clear emergency contact plan and share it with participants</li>
                      <li><strong>Route Planning:</strong> Research your route thoroughly and have backup plans for weather/road issues</li>
                      <li><strong>Insurance Verification:</strong> Ensure your vehicle insurance covers passengers and trip activities</li>
                      <li><strong>Medical Information:</strong> Collect relevant medical conditions and emergency contacts from participants</li>
                      <li><strong>Communication:</strong> Maintain regular communication with participants before and during the trip</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-blue-700">🚗 Vehicle and Transportation Safety</h3>
                    <ul className="space-y-2 list-disc pl-6">
                      <li><strong>Vehicle Condition:</strong> Ensure your vehicle is roadworthy with recent service and valid insurance</li>
                      <li><strong>Driver Fitness:</strong> Only drive when well-rested and avoid alcohol before and during the trip</li>
                      <li><strong>Capacity Limits:</strong> Never exceed vehicle passenger or weight limits</li>
                      <li><strong>Seat Belts:</strong> Ensure all passengers use seat belts throughout the journey</li>
                      <li><strong>Weather Awareness:</strong> Adjust driving for weather conditions and road safety</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-purple-700">⚡ Activity-Specific Safety</h3>
                    <ul className="space-y-2 list-disc pl-6">
                      <li><strong>Physical Requirements:</strong> Clearly communicate fitness levels required for activities</li>
                      <li><strong>Equipment Safety:</strong> Provide lists of required safety gear and equipment</li>
                      <li><strong>Environmental Hazards:</strong> Brief participants on potential risks (weather, terrain, wildlife)</li>
                      <li><strong>Local Guidelines:</strong> Follow all local regulations and park/site safety rules</li>
                      <li><strong>Group Management:</strong> Keep groups together and establish buddy systems for activities</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-orange-700">📱 Communication and Emergency Protocols</h3>
                    <ul className="space-y-2 list-disc pl-6">
                      <li><strong>Emergency Contacts:</strong> Share emergency contact information with all participants</li>
                      <li><strong>Local Emergency Services:</strong> Know local emergency numbers and nearest hospitals</li>
                      <li><strong>Communication Plan:</strong> Establish check-in times and communication methods</li>
                      <li><strong>Weather Updates:</strong> Monitor weather conditions and adjust plans accordingly</li>
                      <li><strong>Itinerary Sharing:</strong> Share detailed itineraries with emergency contacts</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-red-700">🏥 Health and Medical Considerations</h3>
                    <ul className="space-y-2 list-disc pl-6">
                      <li><strong>Medical Conditions:</strong> Be aware of participant medical conditions and limitations</li>
                      <li><strong>First Aid:</strong> Carry a basic first aid kit and know how to use it</li>
                      <li><strong>Medications:</strong> Ensure participants bring necessary medications</li>
                      <li><strong>Allergies:</strong> Be aware of food allergies and environmental sensitivities</li>
                      <li><strong>Medical Access:</strong> Know the location of nearest medical facilities</li>
                    </ul>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-2 text-yellow-800">⚠️ Important Reminders</h3>
                    <ul className="space-y-1 text-yellow-800">
                      <li>• Always prioritize safety over schedule or activities</li>
                      <li>• Trust your instincts - if something feels unsafe, don't proceed</li>
                      <li>• Maintain open communication with all participants</li>
                      <li>• Have contingency plans for weather and emergencies</li>
                      <li>• Remember: participant safety is your primary responsibility</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-2 text-green-800">📞 Sri Lankan Emergency Numbers</h3>
                    <div className="grid grid-cols-2 gap-4 text-green-800">
                      <div>
                        <strong>Police Emergency:</strong> 119 or 118
                      </div>
                      <div>
                        <strong>Ambulance/Fire:</strong> 110
                      </div>
                      <div>
                        <strong>Tourist Police:</strong> 1912
                      </div>
                      <div>
                        <strong>Accident Service:</strong> 1969
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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