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
                  <p>• <strong>Use filter toggles</strong> to show Pinned, Interested, Your Trips, or Free Trips only</p>
                  <p>• <strong>Click any date</strong> on the calendar to see trips for that specific day</p>
                  <p>• <strong>Use keyboard arrows</strong> to navigate dates, Enter to toggle day panel</p>
                  <p>• <strong>Trip icons</strong> show status: ⭐ Interested, 📌 Pinned, 👤 Your Trip, 💚 Free</p>
                  <p>• <strong>Day counts</strong> appear on calendar dates showing number of available trips</p>
                  <p>• <strong>Filters persist</strong> across page refreshes and are saved in your browser</p>
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