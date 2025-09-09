import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  DollarSign, 
  Shield, 
  Camera,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import type { TripFormData } from "@shared/schema";

interface StepPreviewProps {
  form: UseFormReturn<TripFormData>;
}

export function StepPreview({ form }: StepPreviewProps) {
  const formData = form.watch();
  
  // Pre-publish validation
  const requiredFields = [
    { field: 'title', label: 'Trip title' },
    { field: 'description', label: 'Description' },
    { field: 'fromLocation', label: 'Departure location' },
    { field: 'toLocation', label: 'Destination' },
    { field: 'date', label: 'Trip date' },
    { field: 'time', label: 'Departure time' },
    { field: 'seatsAvailable', label: 'Available seats' },
    { field: 'termsAccepted', label: 'Terms acceptance' },
  ];
  
  const missingFields = requiredFields.filter(({ field }) => {
    const value = formData[field as keyof TripFormData];
    if (field === 'termsAccepted') return !value;
    return !value || (typeof value === 'string' && value.trim() === '');
  });

  // Separate contact validation - check if at least phone OR email is provided
  const hasPhone = formData.organizerPhone && formData.organizerPhone.length >= 9;
  const hasEmail = formData.organizerEmail && formData.organizerEmail.length > 0;
  const hasLegacyContact = formData.contactInfo && formData.contactInfo.length > 0;
  const hasContactInfo = hasPhone || hasEmail || hasLegacyContact;
  
  if (!hasContactInfo) {
    missingFields.push({ field: 'contact', label: 'Contact information' });
  }
  
  const isReadyToPublish = missingFields.length === 0;
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const formatTime = (timeStr: string) => {
    return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="space-y-6">
      {/* Pre-publish Checklist */}
      <Card className={isReadyToPublish ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isReadyToPublish ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            )}
            Pre-publish Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isReadyToPublish ? (
            <div className="text-green-800">
              <p className="font-medium mb-2">✅ All required fields completed!</p>
              <p className="text-sm">Your trip is ready to be published.</p>
            </div>
          ) : (
            <div className="text-red-800">
              <p className="font-medium mb-2">❌ Missing required information:</p>
              <ul className="text-sm space-y-1">
                {missingFields.map(({ label }) => (
                  <li key={label}>• {label}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trip Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Trip Preview
          </CardTitle>
          <p className="text-sm text-gray-600">This is how your trip will appear to potential participants</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cover Image */}
          {formData.mediaUrls && formData.mediaUrls.length > 0 && (
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={formData.mediaUrls[formData.coverImageIndex || 0]}
                alt="Trip cover"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* Title and Category */}
          <div>
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-xl font-bold text-gray-900">{formData.title || 'Trip Title'}</h3>
              {formData.category && (
                <Badge variant="secondary" className="ml-2">
                  {formData.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              )}
            </div>
            {formData.buddyFriendly && (
              <Badge variant="outline" className="text-pink-600 border-pink-300">
                Solo Traveler Friendly
              </Badge>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-700">{formData.description || 'Trip description will appear here...'}</p>

          {/* Key Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date & Time */}
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <div className="font-medium">
                  {formData.date ? formatDate(formData.date) : 'Date TBD'}
                </div>
                <div className="text-sm text-gray-600 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formData.time ? formatTime(formData.time) : 'Time TBD'}
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-gray-500" />
              <div>
                <div className="font-medium">
                  {formData.fromLocation || 'Departure'} → {formData.toLocation || 'Destination'}
                </div>
                <div className="text-sm text-gray-600">
                  {formData.region && `${formData.region.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Province`}
                </div>
              </div>
            </div>

            {/* Capacity */}
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-gray-500" />
              <div>
                <div className="font-medium">
                  {formData.seatsAvailable || 0} seats available
                </div>
                <div className="text-sm text-gray-600">Duration: {formData.duration || 'TBD'}</div>
              </div>
            </div>

            {/* Pricing */}
            <div className="flex items-center gap-3">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <div>
                <div className="font-medium">
                  {formData.price ? (
                    `LKR ${formData.price} per person`
                  ) : formData.priceMin && formData.priceMax ? (
                    `LKR ${formData.priceMin} - ${formData.priceMax}`
                  ) : (
                    'Price TBD'
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  {formData.price === 0 ? 'Free trip!' : 'Per person'}
                </div>
              </div>
            </div>
          </div>

          {/* Safety Flags */}
          {formData.safetyFlags && formData.safetyFlags.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-amber-600" />
                <span className="font-medium text-amber-900">Safety Considerations</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.safetyFlags.map((flag) => (
                  <Badge key={flag} variant="outline" className="text-amber-700 border-amber-300">
                    {flag.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {formData.notes && (
            <div>
              <h4 className="font-medium mb-2">Additional Information</h4>
              <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">{formData.notes}</p>
            </div>
          )}


          {/* Contact Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Organizer Contact</h4>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">🔒 Contact details are private</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Shared through secure chat
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Participants will see your contact info only after you approve their trip requests
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Final Review Alert */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Please review all information carefully. Once published, your trip will be visible to all users. 
          You can edit details later, but changes may affect existing bookings.
        </AlertDescription>
      </Alert>
    </div>
  );
}