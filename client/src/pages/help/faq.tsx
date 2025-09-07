import { useState, useMemo } from "react";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Search, 
  MessageCircle, 
  Users, 
  Shield, 
  Phone, 
  XCircle, 
  CheckCircle, 
  MapPin, 
  DollarSign,
  Calendar,
  Star,
  Pin,
  Camera,
  Settings,
  Bell,
  HelpCircle,
  User,
  Heart,
  Filter,
  Clock
} from "lucide-react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
  icon: JSX.Element;
}

export default function HelpFAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const faqs: FAQItem[] = [
    // Getting Started
    {
      id: "getting-started",
      question: "How do I get started with Ceylon Expand?",
      answer: "Getting started is easy! Create an account by clicking 'Sign In' and completing your profile. Add your travel preferences, profile photo, and contact information. Then you can start browsing trips, posting your own trips, or using our calendar to plan your journeys across Sri Lanka.",
      category: "Getting Started",
      keywords: ["signup", "account", "profile", "start", "begin", "register"],
      icon: <Users className="h-5 w-5 text-ceylon-blue" />
    },
    {
      id: "profile-setup",
      question: "What should I include in my profile?",
      answer: "Complete your profile with: a clear profile photo, your travel preferences (adventure, relaxation, cultural), contact information, and a brief bio. This helps other travelers understand your travel style and builds trust in the community. Verified profiles get priority in recommendations.",
      category: "Getting Started",
      keywords: ["profile", "photo", "preferences", "bio", "verification", "complete"],
      icon: <User className="h-5 w-5 text-ceylon-green" />
    },

    // Trip Management
    {
      id: "posting-trips",
      question: "How do I post a trip on Ceylon Expand?",
      answer: "Click 'Post Trip' in the navigation menu. Fill in your route (from/to locations), travel date and time, number of available seats, price per person, and contact information. You can add trip photos, describe your travel style, and include special notes. Your trip will be visible to other travelers immediately after posting.",
      category: "Trip Management",
      keywords: ["post", "create", "trip", "route", "seats", "price", "photos"],
      icon: <MapPin className="h-5 w-5 text-ceylon-blue" />
    },
    {
      id: "trip-photos",
      question: "How do I add photos to my trips?",
      answer: "When posting or editing a trip, click the camera icon to upload photos. You can add multiple images showing your planned route, destinations, or vehicle. Photos help other travelers better understand your trip and increase engagement. Supported formats: JPG, PNG, up to 10MB per image.",
      category: "Trip Management",
      keywords: ["photos", "images", "upload", "camera", "pictures", "media"],
      icon: <Camera className="h-5 w-5 text-ceylon-green" />
    },
    {
      id: "trip-editing",
      question: "Can I edit or cancel my posted trips?",
      answer: "Yes! Go to your Dashboard > My Trips to edit trip details, update photos, change dates, or cancel trips. If people have already shown interest in your trip, they'll be notified of changes. You can mark trips as complete when you've found travel companions.",
      category: "Trip Management",
      keywords: ["edit", "cancel", "update", "modify", "change", "dashboard"],
      icon: <Settings className="h-5 w-5 text-ceylon-blue" />
    },

    // Calendar & Planning
    {
      id: "calendar-usage",
      question: "How does the Calendar feature work?",
      answer: "The Calendar shows all available trips by date. Click any date to see trips for that day. Use filters like 'All Trips', 'Free Trips', 'Pinned', 'Interested', or 'My Trips' to customize your view. Bold dates with green badges indicate days with available trips. Use keyboard arrows to navigate dates quickly.",
      category: "Calendar & Planning",
      keywords: ["calendar", "dates", "filters", "schedule", "planning", "navigation"],
      icon: <Calendar className="h-5 w-5 text-ceylon-blue" />
    },
    {
      id: "pinned-interested",
      question: "What are Pinned and Interested trips?",
      answer: "Pin trips (📌) you're seriously considering to save them for later. Mark trips as Interested (⭐) when you want to join. Pinned trips are private bookmarks, while Interested shows your intent to the organizer. When you mark a trip as Interested, it automatically unpins if it was pinned before.",
      category: "Calendar & Planning",
      keywords: ["pin", "pinned", "interested", "bookmark", "save", "favorite"],
      icon: <Pin className="h-5 w-5 text-orange-500" />
    },
    {
      id: "calendar-filters",
      question: "How do I use Calendar filters effectively?",
      answer: "Calendar filters help you find relevant trips: 'All Trips' shows everything, 'Free Trips' shows cost-free journeys, 'Pinned' shows your saved trips, 'Interested' shows trips you want to join, and 'My Trips' shows trips you've posted. Combine with region and date filters for precise results.",
      category: "Calendar & Planning",
      keywords: ["filters", "free", "region", "search", "organize", "view"],
      icon: <Filter className="h-5 w-5 text-ceylon-green" />
    },

    // Communication & Chat
    {
      id: "chat-system",
      question: "How does the Chat Buddy system work?",
      answer: "Click 'Chat' in the navigation to access your message threads. You can start conversations with trip organizers or participants. The system supports text messages, photo sharing, and trip-specific discussions. Your chat history is preserved, and you'll get notifications for new messages.",
      category: "Communication",
      keywords: ["chat", "messages", "communication", "conversation", "buddy"],
      icon: <MessageCircle className="h-5 w-5 text-ceylon-green" />
    },
    {
      id: "contacting-organizers",
      question: "How do I contact trip organizers?",
      answer: "Click the 'Contact' button on any trip details page. This opens WhatsApp for phone numbers or your email app for email addresses. You can also use our built-in chat system or leave public comments on trip posts. All organizers must provide verified contact information.",
      category: "Communication",
      keywords: ["contact", "organizer", "whatsapp", "email", "phone", "communicate"],
      icon: <Phone className="h-5 w-5 text-ceylon-blue" />
    },
    {
      id: "chat-photos",
      question: "Can I send photos through the chat system?",
      answer: "Yes! Click the camera icon in any chat conversation to share photos. This is perfect for sharing location updates, trip photos, or coordinating meetup points. Photos are securely stored and only visible to conversation participants.",
      category: "Communication",
      keywords: ["chat", "photos", "share", "camera", "images", "location"],
      icon: <Camera className="h-5 w-5 text-ceylon-green" />
    },

    // Community & Q&A
    {
      id: "community-qa",
      question: "How does the Community Q&A system work?",
      answer: "Visit the Community page to ask travel-related questions or answer others' questions. You can ask about destinations, travel tips, local recommendations, or route advice. Other travelers vote on the best answers, building a knowledge base for everyone.",
      category: "Community",
      keywords: ["community", "questions", "answers", "qa", "help", "advice"],
      icon: <HelpCircle className="h-5 w-5 text-ceylon-blue" />
    },
    {
      id: "asking-questions",
      question: "What kind of questions can I ask in the Community?",
      answer: "Ask anything travel-related: destination recommendations, route planning, accommodation tips, local customs, best times to visit places, transportation advice, or travel costs. Keep questions clear and specific to get the best answers from the community.",
      category: "Community",
      keywords: ["questions", "destinations", "recommendations", "travel", "tips", "local"],
      icon: <MessageCircle className="h-5 w-5 text-ceylon-green" />
    },

    // Recommendations & Discovery
    {
      id: "recommendations",
      question: "How do the trip recommendations work?",
      answer: "Our AI-powered recommendation system analyzes your travel preferences, past interactions, and travel style to suggest relevant trips. It considers factors like your preferred destinations, travel companions, budget, and activity preferences to show you the most suitable trips first.",
      category: "Recommendations",
      keywords: ["recommendations", "ai", "suggestions", "personalized", "discover"],
      icon: <Star className="h-5 w-5 text-yellow-500" />
    },
    {
      id: "improving-recommendations",
      question: "How can I improve my trip recommendations?",
      answer: "Complete your profile thoroughly, set your travel preferences (adventure, relaxation, cultural), interact with trips you're interested in, and keep your preferences updated. The more you use the platform, the better our recommendations become at matching your travel style.",
      category: "Recommendations",
      keywords: ["improve", "recommendations", "preferences", "profile", "travel style"],
      icon: <Settings className="h-5 w-5 text-ceylon-blue" />
    },

    // Safety & Security
    {
      id: "safety-traveling",
      question: "Is it safe to travel with people I don't know?",
      answer: "Ceylon Expand promotes safe travel practices. Every user must create a complete profile with verified contact information. Review organizers' profiles, read comments from other travelers, and communicate directly before committing. Always meet in public places, share trip details with family/friends, and trust your instincts.",
      category: "Safety & Security",
      keywords: ["safety", "security", "strangers", "trust", "verification", "meeting"],
      icon: <Shield className="h-5 w-5 text-red-500" />
    },
    {
      id: "reporting-issues",
      question: "How do I report inappropriate behavior or issues?",
      answer: "Use the report feature on trip posts or user profiles to report inappropriate behavior, spam, or safety concerns. Our moderation team reviews all reports promptly. You can also contact support directly for urgent safety issues. We take community safety seriously.",
      category: "Safety & Security",
      keywords: ["report", "inappropriate", "behavior", "spam", "safety", "moderation"],
      icon: <XCircle className="h-5 w-5 text-red-500" />
    },

    // Account & Settings
    {
      id: "travel-preferences",
      question: "How do I set my travel preferences?",
      answer: "Go to your Profile Menu > Travel Settings to set your preferences. Choose your travel style (adventure, relaxation, cultural), preferred regions, budget range, and travel companion preferences. These settings help customize your trip recommendations and calendar filters.",
      category: "Account & Settings",
      keywords: ["preferences", "settings", "travel style", "profile", "customize"],
      icon: <Settings className="h-5 w-5 text-ceylon-blue" />
    },
    {
      id: "notifications",
      question: "How do notifications work?",
      answer: "You'll receive notifications for: new messages in chats, updates to trips you're interested in, responses to your questions, and relevant trip recommendations. Manage your notification preferences in your account settings to control what alerts you receive.",
      category: "Account & Settings",
      keywords: ["notifications", "alerts", "messages", "updates", "settings"],
      icon: <Bell className="h-5 w-5 text-yellow-500" />
    },

    // Costs & Pricing
    {
      id: "platform-costs",
      question: "Is Ceylon Expand free to use? Are there any hidden fees?",
      answer: "Yes, Ceylon Expand is completely free! No registration fees, membership costs, or service charges. We don't take commission from trip costs. The prices in trip posts are actual travel sharing costs (fuel, tolls) that participants split. You pay your share directly to the trip organizer - never to Ceylon Expand.",
      category: "Costs & Pricing",
      keywords: ["free", "cost", "fees", "pricing", "commission", "charges"],
      icon: <DollarSign className="h-5 w-5 text-ceylon-green" />
    },
    {
      id: "trip-pricing",
      question: "How is trip pricing determined?",
      answer: "Trip organizers set prices based on shared costs like fuel, tolls, parking, and sometimes accommodation. Prices are per person and split fairly among participants. Many trips are completely free (marked with 💚). Always clarify what's included in the price when contacting organizers.",
      category: "Costs & Pricing",
      keywords: ["pricing", "costs", "fuel", "tolls", "split", "per person"],
      icon: <DollarSign className="h-5 w-5 text-ceylon-blue" />
    },

    // Trip Changes & Cancellation
    {
      id: "trip-cancellation",
      question: "What happens if a trip gets cancelled or changes?",
      answer: "Trip organizers can update details or cancel trips from their dashboard. If you've shown interest in a trip, you'll be notified of changes via chat or email. Stay in touch with organizers as travel dates approach. If an organizer behaves inappropriately, use the report feature.",
      category: "Trip Changes",
      keywords: ["cancellation", "changes", "updates", "modify", "notify"],
      icon: <XCircle className="h-5 w-5 text-orange-500" />
    },
    {
      id: "marking-completed",
      question: "How do I mark my trip as completed?",
      answer: "Once you've found travel companions, go to Dashboard > My Trips and click the green 'Mark Complete' button. This removes your trip from search results. You can reactivate completed trips anytime if your plans change or you need more travel companions.",
      category: "Trip Changes",
      keywords: ["complete", "finished", "mark", "dashboard", "reactivate"],
      icon: <CheckCircle className="h-5 w-5 text-ceylon-green" />
    },

    // Regional Coverage
    {
      id: "sri-lanka-coverage",
      question: "What regions of Sri Lanka does Ceylon Expand cover?",
      answer: "Ceylon Expand covers all provinces and regions of Sri Lanka! Filter trips by Western Province (Colombo, Gampaha), Central Province (Kandy, Nuwara Eliya), Southern Province (Galle, Matara), and all other provinces. Find travel companions for journeys between major cities or to destinations like Sigiriya, Ella, or Yala National Park.",
      category: "Regional Coverage",
      keywords: ["regions", "provinces", "colombo", "kandy", "galle", "coverage", "destinations"],
      icon: <MapPin className="h-5 w-5 text-ceylon-blue" />
    }
  ];

  const categories = ["all", ...Array.from(new Set(faqs.map(faq => faq.category)))];

  const filteredFAQs = useMemo(() => {
    let filtered = faqs;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(faq => faq.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(faq => 
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        faq.keywords.some(keyword => keyword.toLowerCase().includes(query)) ||
        faq.category.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [searchQuery, selectedCategory]);

  const clearSearch = () => {
    setSearchQuery("");
    setSelectedCategory("all");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-ceylon-blue to-ceylon-green bg-clip-text text-transparent mb-4">
              Help Center & FAQ
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Find answers to common questions about using Ceylon Expand for your travel adventures across Sri Lanka
            </p>
          </div>

          {/* Search and Filter Section */}
          <Card className="border-2 border-ceylon-blue/20">
            <CardHeader className="bg-gradient-to-r from-ceylon-blue/5 to-ceylon-green/5">
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-ceylon-blue" />
                Search FAQs
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by keywords, categories, or questions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 text-base"
                    data-testid="faq-search-input"
                  />
                </div>

                {/* Category Filter Buttons */}
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className={`transition-all duration-200 ${
                        selectedCategory === category
                          ? "bg-gradient-to-r from-ceylon-blue to-ceylon-green text-white"
                          : "hover:border-ceylon-blue hover:text-ceylon-blue"
                      }`}
                      data-testid={`category-filter-${category}`}
                    >
                      {category === "all" ? "All Categories" : category}
                    </Button>
                  ))}
                </div>

                {/* Search Results Summary */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-ceylon-green/10 border-ceylon-green/30 text-ceylon-green">
                      {filteredFAQs.length} result{filteredFAQs.length !== 1 ? 's' : ''}
                    </Badge>
                    {(searchQuery || selectedCategory !== "all") && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={clearSearch}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        Clear filters
                      </Button>
                    )}
                  </div>
                  <Badge variant="outline" className="text-ceylon-blue border-ceylon-blue/30">
                    {faqs.length} total FAQs
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FAQ Results */}
          {filteredFAQs.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-ceylon-green" />
                  {selectedCategory === "all" ? "All Questions" : selectedCategory}
                  {searchQuery && (
                    <Badge variant="outline" className="ml-2">
                      "{searchQuery}"
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {filteredFAQs.map((faq) => (
                    <AccordionItem key={faq.id} value={faq.id} data-testid={`faq-item-${faq.id}`}>
                      <AccordionTrigger className="text-left hover:no-underline">
                        <div className="flex items-start gap-3 text-left">
                          <div className="mt-1 flex-shrink-0">
                            {faq.icon}
                          </div>
                          <div className="space-y-1">
                            <span className="font-medium text-gray-800 text-base">
                              {faq.question}
                            </span>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {faq.category}
                              </Badge>
                            </div>
                          </div>
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
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No FAQs found</h3>
                <p className="text-gray-500 mb-4">
                  Try different keywords or browse all categories
                </p>
                <Button onClick={clearSearch} variant="outline">
                  View All FAQs
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Quick Help Section */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-2 border-ceylon-green/20">
              <CardHeader className="bg-gradient-to-br from-ceylon-green/5 to-ceylon-green/10">
                <CardTitle className="flex items-center gap-2 text-ceylon-green">
                  <MessageCircle className="h-5 w-5" />
                  Popular Topics
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2">
                  {["calendar filters", "chat system", "pinned trips", "safety tips", "free trips"].map((topic) => (
                    <Button
                      key={topic}
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchQuery(topic)}
                      className="w-full justify-start text-left hover:bg-ceylon-green/10"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      {topic.charAt(0).toUpperCase() + topic.slice(1)}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-ceylon-blue/20">
              <CardHeader className="bg-gradient-to-br from-ceylon-blue/5 to-ceylon-blue/10">
                <CardTitle className="flex items-center gap-2 text-ceylon-blue">
                  <HelpCircle className="h-5 w-5" />
                  Still Need Help?
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-gray-600 mb-4">
                  Can't find what you're looking for? Get help from our community or contact support.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <MessageCircle className="h-4 w-4 text-ceylon-green" />
                    <span><strong>Community Q&A:</strong> Ask travel questions</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-ceylon-blue" />
                    <span><strong>Response Time:</strong> Within 24 hours</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}