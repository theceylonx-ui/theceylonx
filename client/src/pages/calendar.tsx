import EnhancedEventCalendar from "@/components/EnhancedEventCalendar";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarPlus } from "lucide-react";
import { Link } from "wouter";
import { TipsBox } from "@/components/TipsBox";

export default function CalendarPage() {

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-ceylon-green to-ceylon-blue rounded-2xl p-8 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <CalendarPlus className="w-8 h-8" />
                    <h1 className="text-3xl md:text-4xl font-bold">Your Calendar</h1>
                  </div>
                  <p className="text-lg opacity-90">
                    View all your trips, events, and plans in one place
                  </p>
                </div>
                <div className="hidden md:block">
                  <Link href="/post">
                    <Button variant="secondary" size="lg" className="bg-white/20 text-white hover:bg-white/30 hover:text-white border-white/30">
                      <CalendarPlus className="w-5 h-5 mr-2" />
                      Add Trip
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>


          {/* Main Calendar */}
          <EnhancedEventCalendar />
          
          {/* Tips Section */}
          <div className="mt-16">
            <TipsBox
              title="📅 Master Your Travel Calendar"
              tips={[
                "Use <strong>filter toggles</strong> to view All Trips, Free Trips, Pinned, or My Trips", 
                "Look for <strong>bold dates with coral badges</strong> - they show trip counts",
                "Click any <strong>date</strong> to see all available trips in the preview panel",
                "Use <strong>keyboard arrows</strong> to navigate dates quickly, Enter to toggle panel",
                "Pin interesting trips with <strong>📌</strong> to easily find them later",
                "Free trips show a <strong>Free Trip</strong> badge - perfect for budget travel"
              ]}
            />
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}