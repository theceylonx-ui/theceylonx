import EnhancedEventCalendar from "@/components/EnhancedEventCalendar";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarPlus } from "lucide-react";
import { Link } from "wouter";

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
                    <Button variant="secondary" size="lg" className="text-ceylon-green">
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
          
          {/* Help Text */}
          <div className="mt-8 text-center">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <h3 className="font-semibold text-blue-900 mb-2">How to Use Your Calendar</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• <strong>Filter toggles:</strong> Use "All Trips", "Free Trips", "Pinned", "Interested", or "My Trips" to filter what you see</p>
                  <p>• <strong>Bold dates:</strong> Calendar dates appear bold with green count badges when trips are available</p>
                  <p>• <strong>Free Trips filter:</strong> Shows only trips with no cost (marked with 💚 Free Trip badge)</p>
                  <p>• <strong>Click any date:</strong> View all trips for that specific day in the day preview panel</p>
                  <p>• <strong>View Details button:</strong> Click to see full trip information, comments, and join options</p>
                  <p>• <strong>Keyboard navigation:</strong> Use arrow keys to navigate dates, Enter to toggle day panel</p>
                  <p>• <strong>Trip status icons:</strong> ⭐ Interested, 📌 Pinned, 👤 Your Trip, 💚 Free Trip</p>
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