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
  Clock,
  Plane,
  Sun,
  Wallet,
  Bus,
  Wifi,
  HandCoins,
  Shirt,
  Droplet,
  Syringe,
  Languages,
  Plug
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
      question: "How do I get started with HiBowan?",
      answer: "Getting started is easy! Sign in with your Google or Facebook account — that's currently the only way to sign up. Complete your profile with travel preferences, profile photo, and contact information. You can immediately start browsing trips (no signup required for viewing), but you'll need an account to post trips, chat with organizers, or save favorites.",
      category: "Getting Started",
      keywords: ["signup", "account", "profile", "start", "begin", "register", "google", "facebook", "oauth"],
      icon: <Users className="h-5 w-5 text-ceylon-blue" />
    },
    {
      id: "profile-setup",
      question: "What should I include in my profile?",
      answer: "Complete your profile with: a clear profile photo, your travel preferences (adventure, relaxation, cultural), contact information, and a brief bio. Add your interests and travel style details. Complete profiles get verification badges and priority in recommendations. Other users can follow you to see your latest trips.",
      category: "Getting Started",
      keywords: ["profile", "photo", "preferences", "bio", "verification", "complete", "follow", "badges"],
      icon: <User className="h-5 w-5 text-ceylon-green" />
    },

    // Trip Management
    {
      id: "posting-trips",
      question: "How do I post a trip on HiBowan?",
      answer: "Click 'Post Trip' in the navigation menu, then choose between a full trip post or a Quick Trip. A full trip post lets you fill in your route (from/to locations), travel date and time, number of available seats, price per person, contact information, photos, and special notes. Your trip will be visible to other travelers immediately after posting.",
      category: "Trip Management",
      keywords: ["post", "create", "trip", "route", "seats", "price", "photos"],
      icon: <MapPin className="h-5 w-5 text-ceylon-blue" />
    },
    {
      id: "quick-trips",
      question: "What's a Quick Trip and how is it different from a regular trip?",
      answer: "Quick Trip is the fast, 3-step way to post a spontaneous or last-minute plan — just the essentials (route, date/time, seats, and a short description), no photos or detailed itinerary required. Quick Trips automatically disappear 3 days after posting. Interested travelers send a request instead of joining directly, and you accept or decline it just like a regular trip. You can see, and delete, your own Quick Trips from your Profile > Trips tab.",
      category: "Trip Management",
      keywords: ["quick trip", "spontaneous", "fast", "expire", "3 days", "last minute"],
      icon: <Clock className="h-5 w-5 text-orange-500" />
    },
    {
      id: "trip-photos",
      question: "How do I add photos to my trips?",
      answer: "When posting or editing a trip, click the camera icon to upload photos. You can add multiple images showing your planned route, destinations, or vehicle. Photos are automatically compressed for optimal loading. Set a cover image that represents your trip best. Common image formats like JPG and PNG are supported.",
      category: "Trip Management",
      keywords: ["photos", "images", "upload", "camera", "pictures", "media", "cover"],
      icon: <Camera className="h-5 w-5 text-ceylon-green" />
    },
    {
      id: "trip-details-info",
      question: "What additional information can I see about trips?",
      answer: "Each trip has a 'Show More' tab with detailed information including: trip duration (e.g., '3 days 2 nights'), difficulty level (easy/moderate/challenging), whether it's solo traveler friendly, price ranges, hashtag-style tags, safety requirements, and best seasonal recommendations. This helps you make informed decisions about joining trips.",
      category: "Trip Management",
      keywords: ["details", "duration", "difficulty", "solo", "tags", "safety", "season", "show more"],
      icon: <HelpCircle className="h-5 w-5 text-ceylon-blue" />
    },
    {
      id: "trip-editing",
      question: "Can I edit or cancel my posted trips?",
      answer: "Yes! Go to your Profile > Trips tab to edit trip details, update photos, or change dates. There's no automatic notification when you change a trip's details today, so message anyone who's shown interest directly through Chat Buddy to keep them updated. You can also hide a trip from search results at any time without deleting it, and make it visible again later.",
      category: "Trip Management",
      keywords: ["edit", "cancel", "update", "modify", "change", "dashboard"],
      icon: <Settings className="h-5 w-5 text-ceylon-blue" />
    },

    // Calendar & Planning
    {
      id: "calendar-usage",
      question: "How does the Calendar feature work?",
      answer: "The Calendar shows all available trips by date. Click any date to see trips for that day. Use filters like 'All Trips', 'Free Trips', 'Pinned', 'Interested', or 'My Trips' to customize your view. Dates with a small badge indicate days with available trips. Use keyboard arrows to navigate dates quickly.",
      category: "Calendar & Planning",
      keywords: ["calendar", "dates", "filters", "schedule", "planning", "navigation"],
      icon: <Calendar className="h-5 w-5 text-ceylon-blue" />
    },
    {
      id: "pinned-interested",
      question: "What are Pinned and Request Sent trips?",
      answer: "Pin trips (📌) you're seriously considering to save them for later viewing. When you're ready to join, send an interest request which moves the trip to 'Request Sent' status. Pinned trips are private bookmarks, while Request Sent means the organizer has been notified of your interest and can approve or decline your request through the chat system.",
      category: "Calendar & Planning",
      keywords: ["pin", "pinned", "request", "interest", "bookmark", "save", "approve", "decline"],
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
      answer: "Access your chats by clicking 'Chat Buddy' in the navigation. The WhatsApp-style interface supports text messages, photo sharing, contact sharing, and trip-specific discussions. Chat threads are automatically created when you send interest requests. You can see message delivery status, typing indicators, and unread counts.",
      category: "Communication",
      keywords: ["chat", "messages", "communication", "conversation", "buddy", "whatsapp", "delivery"],
      icon: <MessageCircle className="h-5 w-5 text-ceylon-green" />
    },
    {
      id: "contacting-organizers",
      question: "How do I contact trip organizers?",
      answer: "Send an interest request on any trip to start a private chat thread with the organizer. Use the Chat Buddy system for secure messaging. Organizers can share their contact details (WhatsApp, email) directly through the chat system once you've established communication. You can also leave public comments on trip posts for general questions.",
      category: "Communication",
      keywords: ["contact", "organizer", "chat", "private", "secure", "communicate", "interest", "request"],
      icon: <Phone className="h-5 w-5 text-ceylon-blue" />
    },
    {
      id: "chat-photos",
      question: "Can I send photos and share contact info through chat?",
      answer: "Yes! Click the camera icon to share photos and the contact icon to share your contact details. Photos are perfect for location updates, trip coordination, or sharing experiences. Contact sharing lets you securely exchange WhatsApp numbers or email addresses with trip participants when you're ready to move to direct communication.",
      category: "Communication",
      keywords: ["chat", "photos", "share", "camera", "images", "location", "contact", "whatsapp"],
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
      answer: "Our recommendation system matches trips to your travel preferences and past activity. It considers factors like your preferred destinations, travel companions, budget, and activity preferences to show you the most suitable trips first.",
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
      answer: "HiBowan promotes safe travel practices. Every user creates a complete profile with a confirmed email address. Review organizers' profiles, read comments from other travelers, and communicate directly before committing. Always meet in public places, share trip details with family/friends, and trust your instincts.",
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
      answer: "Go to your Profile Menu > Travel Settings to set your preferences. Choose your travel style (adventure, relaxation, cultural), preferred regions, budget range, and travel companion preferences. These settings help customize your trip recommendations and calendar filters. You can also enable notifications for specific types of trips.",
      category: "Account & Settings",
      keywords: ["preferences", "settings", "travel style", "profile", "customize"],
      icon: <Settings className="h-5 w-5 text-ceylon-blue" />
    },
    {
      id: "user-verification",
      question: "How do I get verified and what are verification badges?",
      answer: "Verification badges are earned through active platform participation: completing your profile, posting quality trips, receiving positive feedback, and contributing to the community. Verified users get priority in search results and recommendations. There's no manual verification process - badges are automatically awarded based on your activity.",
      category: "Account & Settings",
      keywords: ["verification", "badges", "verified", "trust", "quality", "priority"],
      icon: <CheckCircle className="h-5 w-5 text-green-500" />
    },
    {
      id: "following-users",
      question: "How does the follow system work?",
      answer: "You can follow other travelers to see their latest trips and activities. Click the follow button on any user's profile. Following someone shows their trips prominently in your recommendations and helps you stay updated with trusted organizers. Followers get notified when you post new trips.",
      category: "Account & Settings",
      keywords: ["follow", "followers", "following", "users", "updates", "notifications"],
      icon: <Heart className="h-5 w-5 text-red-500" />
    },
    {
      id: "notifications",
      question: "How do notifications work?",
      answer: "You'll receive notifications for: new chat messages, interest requests on your trips, trip updates from organizers, new followers, community Q&A responses, and personalized trip recommendations. View all notifications in your notification center and manage preferences in your account settings.",
      category: "Account & Settings",
      keywords: ["notifications", "alerts", "messages", "updates", "settings", "interest", "followers"],
      icon: <Bell className="h-5 w-5 text-yellow-500" />
    },

    // Costs & Pricing
    {
      id: "platform-costs",
      question: "Is HiBowan free to use? Are there any hidden fees?",
      answer: "Yes, HiBowan is completely free! No registration fees, membership costs, or service charges. We don't take commission from trip costs. The prices in trip posts are actual travel sharing costs (fuel, tolls) that participants split. You pay your share directly to the trip organizer - never to HiBowan.",
      category: "Costs & Pricing",
      keywords: ["free", "cost", "fees", "pricing", "commission", "charges"],
      icon: <DollarSign className="h-5 w-5 text-ceylon-green" />
    },
    {
      id: "trip-pricing",
      question: "How is trip pricing determined?",
      answer: "Trip organizers set prices based on shared costs like fuel, tolls, parking, and sometimes accommodation. Prices are per person and split fairly among participants. Many trips are completely free (marked with a \"Free Trip\" badge). Always clarify what's included in the price when contacting organizers.",
      category: "Costs & Pricing",
      keywords: ["pricing", "costs", "fuel", "tolls", "split", "per person"],
      icon: <DollarSign className="h-5 w-5 text-ceylon-blue" />
    },

    // Trip Changes & Cancellation
    {
      id: "trip-cancellation",
      question: "What happens if a trip gets cancelled or changes?",
      answer: "Trip organizers can update details or cancel trips from their Profile > Trips tab. There's no automatic notification when a trip changes today, so stay in touch with organizers directly through Chat Buddy as travel dates approach. If an organizer behaves inappropriately, use the report feature.",
      category: "Trip Changes",
      keywords: ["cancellation", "changes", "updates", "modify", "notify"],
      icon: <XCircle className="h-5 w-5 text-orange-500" />
    },
    {
      id: "marking-completed",
      question: "How do I mark my trip as completed?",
      answer: "Once you've found travel companions, go to your Profile > Trips tab and click 'Mark Complete'. This notifies anyone who'd shown interest that the trip is filled, and removes it from search results. Changed plans? Click 'Reopen Trip' on a completed trip to make it active again.",
      category: "Trip Changes",
      keywords: ["complete", "finished", "mark", "reopen", "notify"],
      icon: <CheckCircle className="h-5 w-5 text-ceylon-green" />
    },

    // Regional Coverage
    {
      id: "sri-lanka-coverage",
      question: "What regions of Sri Lanka does HiBowan cover?",
      answer: "HiBowan covers all provinces and regions of Sri Lanka! Filter trips by Western Province (Colombo, Gampaha), Central Province (Kandy, Nuwara Eliya), Southern Province (Galle, Matara), and all other provinces including Northern, Eastern, North Western, North Central, Uva, and Sabaragamuwa. Find travel companions for journeys between major cities or to destinations like Sigiriya, Ella, or Yala National Park.",
      category: "Regional Coverage",
      keywords: ["regions", "provinces", "colombo", "kandy", "galle", "coverage", "destinations", "northern", "eastern"],
      icon: <MapPin className="h-5 w-5 text-ceylon-blue" />
    },

    // Sri Lanka Travel Basics
    {
      id: "sl-visa",
      question: "Do I need a visa to visit Sri Lanka?",
      answer: "Most nationalities need an Electronic Travel Authorization (ETA) before arriving — a short online form usually approved within 24–48 hours. Depending on your nationality it's free or paid, and covers a double-entry stay of up to 30 days, extendable by up to 90 more days from the Department of Immigration in Colombo. Apply only through the official ETA portal — third-party sites charge more for the same thing.",
      category: "Sri Lanka Travel Basics",
      keywords: ["visa", "eta", "entry", "immigration", "travel authorization"],
      icon: <Plane className="h-5 w-5 text-ceylon-blue" />
    },
    {
      id: "sl-best-time",
      question: "When's the best time to visit Sri Lanka?",
      answer: "Sri Lanka has two monsoons that hit opposite coasts at different times, so it's less about a \"good month\" and more about picking the right region. The south and west coasts (Colombo, Galle, Bentota) are driest December–April; the north and east (Trincomalee, Jaffna) are best May–September. If you're unsure, April, May, and September are quieter shoulder months with decent weather almost everywhere.",
      category: "Sri Lanka Travel Basics",
      keywords: ["weather", "monsoon", "season", "best time", "climate"],
      icon: <Sun className="h-5 w-5 text-yellow-500" />
    },
    {
      id: "sl-currency",
      question: "What currency should I use, and do cards work?",
      answer: "Sri Lanka uses the Rupee (LKR) — you can't get it before you land, so exchange cash or use an ATM on arrival. Cards are widely accepted in hotels, restaurants, and shops in cities and tourist areas, but tuk-tuks, local eateries, and rural guesthouses are cash-only. Carry enough rupees before heading off the beaten path, and tell your bank you're traveling so your card doesn't get blocked.",
      category: "Sri Lanka Travel Basics",
      keywords: ["currency", "rupee", "lkr", "atm", "cash", "card", "money"],
      icon: <Wallet className="h-5 w-5 text-ceylon-green" />
    },
    {
      id: "sl-safety",
      question: "Is Sri Lanka safe, including for solo and female travelers?",
      answer: "Yes — violent crime against tourists is rare, and Sri Lanka is consistently rated one of Asia's more manageable solo destinations, including for women traveling alone. Most issues are practical rather than dangerous (overcharging, unlicensed taxis, staring), but normal travel vigilance still applies: stick to reputable transport and accommodation, and trust your instincts.",
      category: "Sri Lanka Travel Basics",
      keywords: ["safety", "solo travel", "female travel", "security", "safe"],
      icon: <Shield className="h-5 w-5 text-red-500" />
    },
    {
      id: "sl-transport",
      question: "How do I get around the island?",
      answer: "Trains (the Kandy–Ella line especially), buses, tuk-tuks, and hired cars with drivers are all common. Trains are the scenic, budget option; a car and driver is the easiest way to cover ground comfortably; tuk-tuks work well for short local trips — though self-drive tuk-tuk rentals got harder to arrange after new permit rules in late 2025.",
      category: "Sri Lanka Travel Basics",
      keywords: ["transport", "train", "tuk-tuk", "bus", "getting around", "driver"],
      icon: <Bus className="h-5 w-5 text-ceylon-blue" />
    },
    {
      id: "sl-sim",
      question: "Do I need a local SIM card?",
      answer: "Most travelers grab an eSIM before arrival or pick up a tourist SIM at the airport — Dialog, Mobitel, and Hutch all run arrivals-hall counters and just need your passport. A tourist SIM typically gets 15–30GB of data for about 30 days for a few dollars, with solid coverage along the main travel routes.",
      category: "Sri Lanka Travel Basics",
      keywords: ["sim card", "esim", "internet", "data", "mobile network"],
      icon: <Wifi className="h-5 w-5 text-ceylon-green" />
    },
    {
      id: "sl-tipping",
      question: "Is tipping expected?",
      answer: "Appreciated, not obligatory. Check your bill first — many hotels and restaurants already add a service charge. Where it's not included, round up or tip around 10% for good service. Drivers and guides are usually tipped per day rather than per ride, and small rupee notes make it easiest.",
      category: "Sri Lanka Travel Basics",
      keywords: ["tipping", "tips", "service charge", "etiquette"],
      icon: <HandCoins className="h-5 w-5 text-ceylon-green" />
    },
    {
      id: "sl-temple-dress",
      question: "What should I wear when visiting temples?",
      answer: "Cover your shoulders and knees, and remove shoes and any hat before entering. Beachwear and tight or sheer clothing aren't appropriate at Buddhist or Hindu sites. Loose, breathable cotton or linen works well in the heat while keeping you covered — and always ask before photographing statues or monks.",
      category: "Sri Lanka Travel Basics",
      keywords: ["temple", "dress code", "etiquette", "buddhist", "hindu", "clothing"],
      icon: <Shirt className="h-5 w-5 text-ceylon-blue" />
    },
    {
      id: "sl-water",
      question: "Can I drink the tap water?",
      answer: "Not safely, in most places — stick to bottled or filtered water, even in cities, since your stomach isn't used to what locals tolerate fine. Ice at smaller local restaurants and street stalls is often made from tap water too, so it's worth asking before you accept it.",
      category: "Sri Lanka Travel Basics",
      keywords: ["tap water", "drinking water", "bottled water", "food safety"],
      icon: <Droplet className="h-5 w-5 text-ceylon-blue" />
    },
    {
      id: "sl-vaccinations",
      question: "Do I need any vaccinations before I go?",
      answer: "There's no vaccination requirement for short tourist stays, unless you're arriving from a Yellow Fever risk country. Typhoid and hepatitis A are commonly recommended given local food and water conditions — check with a travel clinic a few weeks out, and pack mosquito repellent regardless.",
      category: "Sri Lanka Travel Basics",
      keywords: ["vaccination", "health", "typhoid", "hepatitis", "travel clinic"],
      icon: <Syringe className="h-5 w-5 text-red-500" />
    },
    {
      id: "sl-budget",
      question: "How much should I budget per day?",
      answer: "Budget travelers using public transport, local food, and hostels typically spend $25–40 a day; add a private driver or nicer hotels and that climbs toward $80+. Major sites like Sigiriya charge separate entrance fees — often $30+ for foreign visitors — so budget those on top of your daily spend, not inside it.",
      category: "Sri Lanka Travel Basics",
      keywords: ["budget", "cost", "daily spend", "money", "price"],
      icon: <DollarSign className="h-5 w-5 text-ceylon-green" />
    },
    {
      id: "sl-language",
      question: "What language do people speak? Will English get me by?",
      answer: "Sinhala and Tamil are the official languages, but English is widely spoken in hotels, restaurants, and tourist areas — enough to get by comfortably as a visitor. It gets patchier in rural villages and local markets, where a few basic Sinhala or Tamil phrases go a long way.",
      category: "Sri Lanka Travel Basics",
      keywords: ["language", "sinhala", "tamil", "english"],
      icon: <Languages className="h-5 w-5 text-ceylon-blue" />
    },
    {
      id: "sl-trip-length",
      question: "How many days do I need to see Sri Lanka properly?",
      answer: "A week covers the highlights if your route stays tight; 10–14 days lets you take in the ancient cities, hill country, and coast without rushing. Short on time? Even 5 days is enough for a focused look at one or two regions rather than trying to circle the whole island.",
      category: "Sri Lanka Travel Basics",
      keywords: ["itinerary", "how many days", "trip length", "planning"],
      icon: <Calendar className="h-5 w-5 text-ceylon-green" />
    },
    {
      id: "sl-plug",
      question: "What kind of plug adapter do I need?",
      answer: "Sri Lanka runs on 230V and mostly uses the UK-style three-pin (type G) socket, so UK visitors often don't need an adapter at all. Types D and M also turn up, especially in older buildings, so a universal adapter is the safest bet coming from North America or continental Europe.",
      category: "Sri Lanka Travel Basics",
      keywords: ["plug", "adapter", "electricity", "voltage", "socket"],
      icon: <Plug className="h-5 w-5 text-ceylon-blue" />
    },
    {
      id: "sl-meet-travelers",
      question: "What's the easiest way to meet other travelers while I'm here?",
      answer: "That's what HiBowan is for — post the trip you're planning or browse ones already forming, and connect directly with fellow travelers heading the same way. No bookings, no commissions: you coordinate everything yourselves once you've matched.",
      category: "Sri Lanka Travel Basics",
      keywords: ["meet travelers", "hibowan", "connect", "find companions"],
      icon: <Users className="h-5 w-5 text-ceylon-green" />
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
              Find answers to common questions about using HiBowan for your travel adventures across Sri Lanka
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