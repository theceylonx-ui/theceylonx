import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Clock, Users, MessageCircle, Calendar as CalendarIcon, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format, isSameDay, startOfMonth, endOfMonth } from "date-fns";
import { Link } from "wouter";

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  eventDate: Date;
  eventType: 'trip' | 'community_event' | 'personal_plan' | 'reminder';
  entityId?: string;
  entityType?: 'trip' | 'question' | 'custom';
  location?: string;
  isAllDay: boolean;
  startTime?: string;
  metadata?: any;
}

interface EventCalendarProps {
  className?: string;
}

const eventTypeColors = {
  trip: "bg-ceylon-green text-white",
  community_event: "bg-blue-500 text-white", 
  personal_plan: "bg-purple-500 text-white",
  reminder: "bg-orange-500 text-white"
};

const eventTypeIcons = {
  trip: MapPin,
  community_event: MessageCircle,
  personal_plan: CalendarIcon,
  reminder: Clock
};

export function EventCalendar({ className }: EventCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Fetch calendar events for the current month
  const { data: events = [], isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ['/api/calendar/aggregate', format(startOfMonth(currentMonth), 'yyyy-MM-dd'), format(endOfMonth(currentMonth), 'yyyy-MM-dd')],
    queryFn: async () => {
      const response = await fetch(
        `/api/calendar/aggregate?startDate=${format(startOfMonth(currentMonth), 'yyyy-MM-dd')}&endDate=${format(endOfMonth(currentMonth), 'yyyy-MM-dd')}`,
        { credentials: 'include' }
      );
      if (!response.ok) {
        throw new Error('Failed to fetch calendar events');
      }
      const data = await response.json();
      return data.map((event: any) => ({
        ...event,
        eventDate: new Date(event.eventDate)
      }));
    },
  });

  // Get events for selected date
  const selectedDateEvents = events.filter(event => 
    isSameDay(event.eventDate, selectedDate)
  );

  // Get dates that have events for calendar highlighting
  const eventDates = events.map(event => event.eventDate);

  const getEventNavigationUrl = (event: CalendarEvent): string => {
    if (event.entityType === 'trip' && event.entityId) {
      return `/trips/${event.entityId}`;
    }
    if (event.entityType === 'question' && event.entityId) {
      return `/questions/${event.entityId}`;
    }
    return '#';
  };

  const EventCard = ({ event }: { event: CalendarEvent }) => {
    const IconComponent = eventTypeIcons[event.eventType];
    const navigationUrl = getEventNavigationUrl(event);
    
    return (
      <Card className="mb-3 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <IconComponent className="w-4 h-4 text-gray-600" />
              <Badge className={`text-xs ${eventTypeColors[event.eventType]}`}>
                {event.eventType.replace('_', ' ')}
              </Badge>
            </div>
            {!event.isAllDay && event.startTime && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {event.startTime}
              </span>
            )}
          </div>
          
          <h4 className="font-semibold text-sm mb-1" data-testid={`event-title-${event.id}`}>
            {event.title}
          </h4>
          
          {event.description && (
            <p className="text-xs text-gray-600 mb-2">{event.description}</p>
          )}
          
          {event.location && (
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
              <MapPin className="w-3 h-3" />
              {event.location}
            </div>
          )}
          
          {event.metadata && (
            <div className="flex flex-wrap gap-1 mb-2">
              {event.metadata.price && (
                <Badge variant="outline" className="text-xs">
                  LKR {event.metadata.price}
                </Badge>
              )}
              {event.metadata.seatsAvailable && (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {event.metadata.seatsAvailable}
                </Badge>
              )}
              {event.metadata.votesCount !== undefined && (
                <Badge variant="outline" className="text-xs">
                  {event.metadata.votesCount} votes
                </Badge>
              )}
            </div>
          )}
          
          {navigationUrl !== '#' && (
            <Link href={navigationUrl}>
              <Button size="sm" variant="outline" className="w-full text-xs" data-testid={`event-view-${event.id}`}>
                View Details
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${className}`}>
      {/* Calendar */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-ceylon-green" />
              Event Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              onMonthChange={setCurrentMonth}
              modifiers={{
                hasEvents: eventDates
              }}
              modifiersStyles={{
                hasEvents: {
                  backgroundColor: 'hsl(var(--ceylon-green) / 0.2)',
                  borderColor: 'hsl(var(--ceylon-green))',
                  fontWeight: 'bold'
                }
              }}
              className="w-full"
              data-testid="event-calendar"
            />
          </CardContent>
        </Card>
      </div>

      {/* Events for Selected Date */}
      <div>
        <Card className="sticky top-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {format(selectedDate, 'MMMM d, yyyy')}
            </CardTitle>
            <p className="text-sm text-gray-600">
              {selectedDateEvents.length} event{selectedDateEvents.length !== 1 ? 's' : ''}
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="h-[400px]">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="text-sm text-gray-500">Loading events...</div>
                </div>
              ) : selectedDateEvents.length > 0 ? (
                selectedDateEvents.map(event => (
                  <EventCard key={event.id} event={event} />
                ))
              ) : (
                <div className="text-center py-8">
                  <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No events on this date</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Select a date with events highlighted in green
                  </p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}