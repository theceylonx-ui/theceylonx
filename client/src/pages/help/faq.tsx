import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function HelpFAQPage() {
  const faqs = [
    {
      id: "getting-started",
      question: "How do I get started with Ceylon Expand?",
      answer: "Getting started is easy! Simply create an account, complete your profile, and start browsing trips or post your own. You can search for trips by destination, date, or travel style to find the perfect travel buddy."
    },
    {
      id: "safety",
      question: "How do you ensure user safety?",
      answer: "Safety is our top priority. We verify user profiles, provide safety guidelines, and have a comprehensive reporting system. Always meet in public places, share your travel plans with trusted contacts, and trust your instincts."
    },
    {
      id: "payment",
      question: "How does payment work?",
      answer: "Ceylon Expand is completely free to use! There are no booking fees, cancellation charges, or hidden costs. Payment arrangements for shared expenses (like fuel, accommodation) are made directly between travelers."
    },
    {
      id: "communication",
      question: "How do I communicate with other travelers?",
      answer: "Use our built-in chat system to communicate securely with trip organizers and participants. Your phone number remains private until you choose to share it through our platform."
    },
    {
      id: "trip-types",
      question: "What types of trips can I find?",
      answer: "You'll find all kinds of trips across Sri Lanka - from day trips to the beach, cultural tours to ancient cities, hiking adventures in the mountains, and multi-day explorations. Filter by region, duration, and travel style to find what suits you."
    },
    {
      id: "cancellation",
      question: "What if I need to cancel my trip?",
      answer: "Since Ceylon Expand is a free platform, there are no cancellation fees. However, please be respectful and notify other participants as early as possible if you need to cancel. This helps maintain trust in our community."
    },
    {
      id: "disputes",
      question: "What if there's an issue with my trip?",
      answer: "If you experience any issues, please contact our support team immediately. We have a dispute resolution process and take all reports seriously. You can also leave reviews to help other users make informed decisions."
    },
    {
      id: "profile-verification",
      question: "How do I verify my profile?",
      answer: "Complete your profile with accurate information, add a clear profile photo, and provide your travel preferences. Verified profiles receive a badge and are more likely to be trusted by other travelers."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800">Frequently Asked Questions</h1>
            <p className="text-gray-600 mt-2">
              Find answers to common questions about using Ceylon Expand
            </p>
          </div>

          {/* FAQ Accordion */}
          <Card>
            <CardHeader>
              <CardTitle>Help & Support</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* Contact Support */}
          <Card>
            <CardHeader>
              <CardTitle>Still Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <div className="space-y-2">
                <p><strong>Email:</strong> support@ceylonexpand.com</p>
                <p><strong>Response Time:</strong> Within 24 hours</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}