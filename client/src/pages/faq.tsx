import { useState } from "react";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Users, Shield, Phone, XCircle, CheckCircle, MapPin } from "lucide-react";

export default function FAQ() {
  const faqs = [
    {
      id: "posting-trips",
      question: "How do I post a trip on Ceylon Expand?",
      answer: "To post a trip, you need to sign up and log in first. Once logged in, click on 'Post Trip' in the navigation menu. Fill in all the required details including your route (from and to locations), travel date and time, number of available seats, price per person, and contact information. You can also add optional notes about your trip. After submitting, your trip will appear in the browse section for other travelers to find.",
      icon: <Users className="h-5 w-5 text-ceylon-blue" />
    },
    {
      id: "joining-trips",
      question: "How can I join someone else's trip?",
      answer: "Browse available trips on the 'Browse Trips' page - no signup required to view them! Use the filters to find trips by location, date, region, or price range. When you find a suitable trip, click on it to view full details. If you want to join, you'll need to log in first. Then you can contact the trip organizer directly via WhatsApp or email, or leave a comment on their trip post to ask questions.",
      icon: <MessageCircle className="h-5 w-5 text-ceylon-green" />
    },
    {
      id: "safety-traveling",
      question: "Is it safe to travel with people I don't know?",
      answer: "Ceylon Expand promotes safe travel practices. Every user must create a complete profile with verified contact information. You can see trip organizers' profiles, read comments from other travelers, and communicate directly before committing to any trip. We recommend meeting in public places, sharing trip details with family/friends, and trusting your instincts. You can also report any inappropriate behavior using the report feature on trip posts.",
      icon: <Shield className="h-5 w-5 text-ceylon-blue" />
    },
    {
      id: "contacting-organizers",
      question: "How do I contact trip organizers?",
      answer: "Every trip post shows the organizer's contact information. Click the 'Contact' button on the trip details page, and it will automatically open WhatsApp for phone numbers or your email app for email addresses. You can also leave public comments on trip posts to ask questions that other travelers might find helpful. All communication happens directly between you and the trip organizer - we don't store or monitor messages.",
      icon: <Phone className="h-5 w-5 text-ceylon-green" />
    },
    {
      id: "trip-cancellation",
      question: "What happens if a trip gets cancelled or changes?",
      answer: "Trip organizers can update their trip details or delete trips entirely from their dashboard. If you've already contacted an organizer about joining their trip, they'll communicate any changes directly with you via WhatsApp or email. We recommend staying in touch with your trip organizer as the travel date approaches. If a trip organizer behaves inappropriately, you can report them using the report feature.",
      icon: <XCircle className="h-5 w-5 text-red-500" />
    },
    {
      id: "marking-completed",
      question: "How do I mark my trip as completed when I find travel partners?",
      answer: "Once you've found your travel companions and no longer need additional participants, go to your dashboard and click on 'My Trips'. You'll see a green 'Mark Complete' button next to each active trip. Clicking this will mark your trip as completed, remove it from search results, and prevent new people from trying to join. You can reactivate completed trips anytime if your plans change.",
      icon: <CheckCircle className="h-5 w-5 text-ceylon-green" />
    },
    {
      id: "sri-lanka-coverage",
      question: "What regions of Sri Lanka does Ceylon Expand cover?",
      answer: "Ceylon Expand covers all provinces and regions of Sri Lanka! You can filter trips by major regions including Western Province (Colombo, Gampaha), Central Province (Kandy, Nuwara Eliya), Southern Province (Galle, Matara), and all other provinces. Whether you're traveling between major cities like Colombo to Kandy, or exploring destinations like Sigiriya, Ella, or Yala National Park, you'll find travel companions for your journey across the beautiful island.",
      icon: <MapPin className="h-5 w-5 text-ceylon-blue" />
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4" data-testid="faq-title">
            Frequently Asked Questions
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto" data-testid="faq-subtitle">
            Everything you need to know about using Ceylon Expand to find travel companions and share your journeys across Sri Lanka.
          </p>
        </div>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageCircle className="h-6 w-6 text-ceylon-green" />
              <span>Common Questions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id} data-testid={`faq-item-${faq.id}`}>
                  <AccordionTrigger className="text-left hover:no-underline">
                    <div className="flex items-center space-x-3">
                      {faq.icon}
                      <span className="font-medium text-gray-800">{faq.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pt-2 pb-4 pl-8 text-gray-700 leading-relaxed">
                      {faq.answer}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Additional Help Section */}
        <Card className="mt-8">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Still have questions?</h3>
            <p className="text-gray-600 mb-4">
              Can't find what you're looking for? Join our community and ask questions directly on trip posts or contact trip organizers.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge variant="outline" className="text-ceylon-green border-ceylon-green">
                Safe Travel Community
              </Badge>
              <Badge variant="outline" className="text-ceylon-blue border-ceylon-blue">
                Direct Communication
              </Badge>
              <Badge variant="outline" className="text-gray-600 border-gray-400">
                Island-wide Coverage
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}