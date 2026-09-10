import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Users, MessageCircle, HelpCircle, Heart, Globe } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <section className="bg-gradient-to-br from-ceylon-green/10 via-white to-orange-100/40 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            About <span className="text-ceylon-green">HiBowan</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            A community-driven travel platform built for exploring the beauty of Sri Lanka — together.
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 text-lg leading-relaxed mb-8">
              HiBowan is designed for people visiting Sri Lanka — solo travelers looking for companions, or groups seeking to split costs on an adventure. Post the trip you're planning, or find one already forming, and connect with fellow travelers heading the same way.
            </p>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">What We Do</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16">
            <Card className="border-l-4 border-l-ceylon-green shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-ceylon-green/10 rounded-lg flex-shrink-0">
                    <MapPin className="h-6 w-6 text-ceylon-green" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-2">Find Travel Buddies</h3>
                    <p className="text-gray-600">Browse trips posted by fellow travelers and join ones that match your plans — from beach getaways in the south to cultural journeys through the hill country.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-orange-50 rounded-lg flex-shrink-0">
                    <Globe className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-2">Post Your Own Trips</h3>
                    <p className="text-gray-600">Share your upcoming journey and invite others to join. Choose between a detailed trip listing or a Quick Trip for spontaneous, last-minute plans.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                    <MessageCircle className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-2">Connect & Chat</h3>
                    <p className="text-gray-600">Once matched, chat directly with your travel companions to coordinate details, share tips, and build friendships before you even hit the road.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-purple-50 rounded-lg flex-shrink-0">
                    <HelpCircle className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-2">Community Q&A</h3>
                    <p className="text-gray-600">Got questions about traveling in Sri Lanka? Ask the HiBowan Tribes community — real travelers sharing real experiences.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-gradient-to-br from-ceylon-green/5 to-orange-100/30 rounded-2xl p-8 sm:p-12 mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Why HiBowan?</h2>
            <p className="text-gray-700 text-lg leading-relaxed">
              Sri Lanka is a small island with enormous diversity — ancient temples, pristine beaches, lush tea plantations, and vibrant wildlife. But navigating it alone can be daunting and expensive. We believe travel is better when shared. HiBowan makes it easy to find companions who share your interests, split costs, and create unforgettable memories across this incredible island.
            </p>
          </div>

          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 bg-ceylon-green/10 px-6 py-4 rounded-xl">
              <Heart className="h-6 w-6 text-ceylon-green" />
              <div className="text-left">
                <h3 className="font-bold text-gray-900 text-lg">Our Mission</h3>
                <p className="text-gray-700">To make Sri Lanka accessible, affordable, and enjoyable for every traveler — by bringing people together through shared journeys.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
