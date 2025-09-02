import { EventCalendar } from "@/components/EventCalendar";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarPlus, TrendingUp, Clock, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format, addDays } from "date-fns";
import { Link } from "wouter";

export default function CalendarPage() {
  // Get upcoming events for quick preview
  const { data: upcomingEvents = [] } = useQuery({
    queryKey: ['/api/calendar/aggregate', format(new Date(), 'yyyy-MM-dd'), format(addDays(new Date(), 7), 'yyyy-MM-dd')],
    queryFn: async () => {
      const response = await fetch(
        `/api/calendar/aggregate?startDate=${format(new Date(), 'yyyy-MM-dd')}&endDate=${format(addDays(new Date(), 7), 'yyyy-MM-dd')}`,
        { credentials: 'include' }
      );
      if (!response.ok) {
        if (response.status === 401) return [];
        throw new Error('Failed to fetch upcoming events');
      }
      const data = await response.json();
      return data.slice(0, 3); // Show only next 3 events
    },
  });

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
                  <Link href="/post-trip">
                    <Button variant="secondary" size="lg" className="text-ceylon-green">
                      <CalendarPlus className="w-5 h-5 mr-2" />
                      Add Trip
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Upcoming Events Preview */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-ceylon-green" />
                    Upcoming This Week
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingEvents.length > 0 ? (
                    <div className="space-y-3">
                      {upcomingEvents.map((event: any, index: number) => (
                        <div
                          key={event.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          data-testid={`upcoming-event-${index}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-ceylon-green rounded-full"></div>
                            <div>
                              <h4 className="font-medium text-sm">{event.title}</h4>
                              <p className="text-xs text-gray-600 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(event.eventDate), 'MMM d, yyyy')}
                                {event.startTime && ` at ${event.startTime}`}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {event.eventType.replace('_', ' ')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <CalendarPlus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm">No upcoming events this week</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Post a trip or ask a question to get started
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/post-trip">
                    <Button className="w-full justify-start text-left" variant="outline" data-testid="quick-action-post-trip">
                      <MapPin className="w-4 h-4 mr-2" />
                      Post a Trip
                    </Button>
                  </Link>
                  <Link href="/community">
                    <Button className="w-full justify-start text-left" variant="outline" data-testid="quick-action-ask-question">
                      <CalendarPlus className="w-4 h-4 mr-2" />
                      Ask Question
                    </Button>
                  </Link>
                  <Link href="/browse-trips">
                    <Button className="w-full justify-start text-left" variant="outline" data-testid="quick-action-browse-trips">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Browse Trips
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Calendar */}
          <EventCalendar />
          
          {/* Help Text */}
          <div className="mt-8 text-center">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <h3 className="font-semibold text-blue-900 mb-2">How to Use Your Calendar</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• <strong>Green highlights</strong> indicate dates with events</p>
                  <p>• <strong>Click any date</strong> to see events for that day</p>
                  <p>• <strong>Trip events</strong> show your posted and joined trips</p>
                  <p>• <strong>Community events</strong> show your Q&A activity</p>
                  <p>• <strong>Click "View Details"</strong> to navigate to the full page</p>
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