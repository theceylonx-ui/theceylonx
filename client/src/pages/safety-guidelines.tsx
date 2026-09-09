import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertTriangle, Phone, MapPin, Heart, Users, MessageCircle, Camera, Calendar, UserPlus } from "lucide-react";

export default function SafetyGuidelines() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <Shield className="w-16 h-16 text-ceylon-green mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Safety Guidelines
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Your safety is our priority. Follow these guidelines for a safe and enjoyable journey in Sri Lanka.
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-6 h-6 text-ceylon-green mr-3" />
                Travel Companion Safety
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Before Joining a Trip:</h4>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                  <li>• Review the organizer's profile completeness and trip history</li>
                  <li>• Read trip details carefully and ask questions if unclear</li>
                  <li>• Check the organizer's ratings and reviews from previous trips</li>
                  <li>• Use our Chat Buddy system to communicate before meeting</li>
                  <li>• Review trip photos and verify authenticity</li>
                  <li>• Share your travel plans with trusted friends or family</li>
                  <li>• Trust your instincts - if something feels off, don't join</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">During the Trip:</h4>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                  <li>• Stay with the group and follow the agreed itinerary</li>
                  <li>• Keep emergency contacts and trip organizer's contact handy</li>
                  <li>• Don't share personal financial information or valuables</li>
                  <li>• Report any concerning behavior immediately</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-6 h-6 text-ceylon-green mr-3" />
                General Travel Safety in Sri Lanka
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Transportation:</h4>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                  <li>• Use licensed taxis, ride-sharing apps, or registered tour operators</li>
                  <li>• Wear seatbelts and helmets when available</li>
                  <li>• Avoid traveling at night on unfamiliar roads</li>
                  <li>• Keep copies of important documents separate from originals</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Accommodation:</h4>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                  <li>• Choose reputable accommodations with good reviews</li>
                  <li>• Lock valuables in hotel safes when available</li>
                  <li>• Check emergency exits and safety procedures</li>
                  <li>• Keep room keys secure and don't share room numbers</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Heart className="w-6 h-6 text-ceylon-green mr-3" />
                Health & Wellness
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Health Precautions:</h4>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                  <li>• Drink bottled or properly filtered water</li>
                  <li>• Eat at clean, reputable restaurants</li>
                  <li>• Use sunscreen and insect repellent</li>
                  <li>• Carry a basic first aid kit</li>
                  <li>• Have travel insurance with medical coverage</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Medical Emergencies:</h4>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                  <li>• Emergency services: 119 (Police), 110 (Ambulance), 110 (Fire)</li>
                  <li>• Tourist Hotline: 1912</li>
                  <li>• Know the location of nearest hospitals</li>
                  <li>• Keep emergency contacts readily available</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="w-6 h-6 text-ceylon-blue mr-3" />
                Chat Buddy & Communication Safety
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Using Chat Buddy Safely:</h4>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                  <li>• Your contact information is kept private by default</li>
                  <li>• Only share personal details when you feel comfortable</li>
                  <li>• Use the in-platform messaging for initial conversations</li>
                  <li>• Report any inappropriate messages immediately</li>
                  <li>• Block users who make you uncomfortable</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Photo Sharing Guidelines:</h4>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                  <li>• Only share photos relevant to your trip</li>
                  <li>• Avoid sharing photos with personal information visible</li>
                  <li>• Be cautious about location data in shared images</li>
                  <li>• Respect privacy of other travelers in photos</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-6 h-6 text-ceylon-green mr-3" />
                Trip Planning & Calendar Safety
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Using Calendar Features:</h4>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                  <li>• Keep your travel schedule private until you join a trip</li>
                  <li>• Use calendar filters to find active, highly-rated organizers</li>
                  <li>• Check trip status and updates regularly</li>
                  <li>• Confirm trip details 24 hours before departure</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Pinned & Interested Trips:</h4>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                  <li>• Pin trips only from trusted organizers</li>
                  <li>• Review pinned trips regularly for updates</li>
                  <li>• Use interest notifications to stay informed</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserPlus className="w-6 h-6 text-ceylon-green mr-3" />
                Community & Q&A Safety
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">HiBowan Tribes Safety:</h4>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                  <li>• Verify information from community posts independently</li>
                  <li>• Report misleading or dangerous advice</li>
                  <li>• Follow community guidelines when posting</li>
                  <li>• Respect other members' privacy and opinions</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Information Sharing:</h4>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                  <li>• Don't share personal contact details publicly</li>
                  <li>• Use our private messaging for sensitive information</li>
                  <li>• Be cautious of unsolicited advice or offers</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="w-6 h-6 text-amber-500 mr-3" />
                Warning Signs & Red Flags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                <p className="text-amber-800 dark:text-amber-200 font-medium mb-2">
                  Be cautious and report immediately if you encounter:
                </p>
                <ul className="space-y-2 text-amber-700 dark:text-amber-300 ml-4">
                  <li>• Requests for upfront payments without proper booking</li>
                  <li>• Pressure to change meeting locations last minute</li>
                  <li>• Unwillingness to provide proper identification</li>
                  <li>• Suspicious or inappropriate behavior from other travelers</li>
                  <li>• Trips that seem too good to be true</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Phone className="w-6 h-6 text-ceylon-green mr-3" />
                Emergency Contacts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Sri Lanka Emergency Services:</h4>
                  <div className="space-y-2 text-gray-600 dark:text-gray-300">
                    <p><strong>Police Emergency:</strong> 119</p>
                    <p><strong>Ambulance:</strong> 110</p>
                    <p><strong>Fire & Rescue:</strong> 110</p>
                    <p><strong>Tourist Hotline:</strong> 1912</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">HiBowan Support:</h4>
                  <div className="space-y-2 text-gray-600 dark:text-gray-300">
                    <p><strong>Report Issues:</strong> Use our report feature.</p>
                    <p><strong>Safety Concerns:</strong> Contact us immediately.</p>
                    <p><strong>24/7 Support:</strong> Available through the app.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-ceylon-green/10 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-ceylon-green mb-2">
              Remember: Safety First, Always!
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              When in doubt, prioritize your safety over any trip or experience. 
              Report suspicious activities and help keep our community safe.
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}