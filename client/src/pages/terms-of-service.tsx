import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <FileText className="w-16 h-16 text-ceylon-green mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Terms of Service
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Last updated: September 2026
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>1. Acceptance of Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                By accessing and using HiBowan ("the Service"), you accept and agree to be bound by the terms and provision of this agreement.
                If you do not agree to abide by the above, please do not use this service.
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                HiBowan is a comprehensive travel platform that connects travelers for shared trips and experiences in Sri Lanka.
                We facilitate connections between users through trip sharing, Chat Buddy messaging, community Q&A forums (HiBowan Tribes),
                calendar features, photo sharing capabilities, and content sharing but do not directly provide travel services.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. User Accounts and Registration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Account Requirements:</h4>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                  <li>• You must be at least 18 years old to create an account</li>
                  <li>• You must provide accurate and complete information</li>
                  <li>• You are responsible for maintaining the security of your account</li>
                  <li>• One account per person - no duplicate accounts allowed</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Account Termination:</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  We reserve the right to suspend or terminate accounts that violate these terms, 
                  engage in fraudulent activity, or compromise the safety of our community.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Trip Posting and Participation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Trip Organizers:</h4>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                  <li>• Must provide accurate trip information including dates, costs, and itinerary</li>
                  <li>• Are responsible for the safety and coordination of their trips</li>
                  <li>• Must not discriminate based on race, gender, religion, or nationality</li>
                  <li>• Cannot use the platform for commercial tour operations without proper licensing</li>
                  <li>• Must communicate clearly with participants about trip changes</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Trip Participants:</h4>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                  <li>• Must follow trip guidelines and respect other participants</li>
                  <li>• Are responsible for their own travel insurance and documentation</li>
                  <li>• Should communicate any special needs or requirements in advance</li>
                  <li>• Must pay agreed fees and respect cancellation policies</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Quick Trips:</h4>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                  <li>• Quick Trips are short, informal trip listings meant for spontaneous plans</li>
                  <li>• They are automatically removed 3 days after posting, whether or not they found participants</li>
                  <li>• Other travelers show interest by sending a request, which the organizer accepts or declines</li>
                  <li>• The same posting standards, safety expectations, and community guidelines apply as for regular trips</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Chat Buddy and Messaging</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Chat Buddy Features:</h4>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                  <li>• Contact information remains private by default</li>
                  <li>• Users may choose to share contact details at their discretion</li>
                  <li>• All messages are subject to community guidelines</li>
                  <li>• Report inappropriate messaging through the platform</li>
                  <li>• Block users who make you uncomfortable</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Photo Sharing:</h4>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                  <li>• Upload and share trip-related photos responsibly</li>
                  <li>• Respect privacy of other travelers in shared images</li>
                  <li>• No inappropriate, offensive, or misleading photos</li>
                  <li>• You retain ownership of your uploaded content</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Calendar and Trip Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Calendar Features:</h4>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                  <li>• Filter and search trips based on dates and preferences</li>
                  <li>• Pin and track trips of interest</li>
                  <li>• Receive notifications for trip updates</li>
                  <li>• Calendar data is used to improve recommendations</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Trip Status Management:</h4>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                  <li>• Track trip status (active, completed, cancelled)</li>
                  <li>• Update trip availability and participant limits</li>
                  <li>• Manage interested and confirmed participants</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. HiBowan Tribes and Community Q&A</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Community Participation:</h4>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                  <li>• Ask and answer travel-related questions</li>
                  <li>• Share knowledge and experiences responsibly</li>
                  <li>• Vote on helpful answers to build community trust</li>
                  <li>• Follow topic-specific guidelines</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Content Quality:</h4>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                  <li>• Provide accurate and helpful information</li>
                  <li>• Cite sources when sharing factual information</li>
                  <li>• Respect different opinions and experiences</li>
                  <li>• Report misinformation or harmful advice</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Community Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Prohibited Activities:</h4>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                  <li>• Posting false, misleading, or fraudulent trip information</li>
                  <li>• Harassment, discrimination, or inappropriate behavior toward other users</li>
                  <li>• Spam, promotional content, or commercial solicitation</li>
                  <li>• Attempting to circumvent platform fees or direct payment requests</li>
                  <li>• Sharing personal contact information in public posts (use Chat Buddy instead)</li>
                  <li>• Uploading inappropriate or misleading photos</li>
                  <li>• Providing false information in community Q&A</li>
                  <li>• Creating fake reviews or manipulating the rating system</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Content Guidelines:</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  All content posted on HiBowan must be respectful, relevant, and comply with Sri Lankan laws.
                  We reserve the right to remove content that violates these guidelines.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Payment and Fees</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                HiBowan facilitates connections between travelers but does not process payments between users.
                Payment arrangements are made directly between trip organizers and participants.
              </p>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Important Notes:</h4>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                  <li>• We do not guarantee trip completion or quality</li>
                  <li>• Disputes over payments must be resolved between users</li>
                  <li>• We recommend using secure payment methods with buyer protection</li>
                  <li>• Platform usage is free for travelers, indefinitely</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                <p className="text-amber-800 dark:text-amber-200 font-medium mb-2">
                  Important Disclaimer:
                </p>
                <p className="text-amber-700 dark:text-amber-300">
                  HiBowan is a platform that connects travelers. We are not responsible for the actions,
                  conduct, or safety of users. Travelers participate in trips at their own risk and should 
                  take appropriate precautions including travel insurance and safety measures.
                </p>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300">
                We do not guarantee the accuracy of trip information, the completion of trips, 
                or the conduct of other users. Our liability is limited to the maximum extent permitted by law.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>10. Privacy and Data Protection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                Your privacy is important to us. Please review our Privacy Policy to understand how we collect, 
                use, and protect your personal information. By using our service, you consent to our data practices 
                as described in the Privacy Policy.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>11. Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                We reserve the right to modify these terms at any time. Changes will be posted on this page 
                with an updated revision date. Continued use of the service after changes constitutes 
                acceptance of the new terms.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>12. Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                For questions about these Terms of Service, please contact us through the platform's 
                support system or report feature. We aim to respond to all inquiries within 48 hours.
              </p>
            </CardContent>
          </Card>

          <div className="bg-ceylon-green/10 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-ceylon-green mb-2">
              Questions About These Terms?
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              If you have any questions or concerns about these Terms of Service, 
              please don't hesitate to contact our support team.
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}