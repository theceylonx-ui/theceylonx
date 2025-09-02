import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Clock, Users, MessageCircle, Calendar as CalendarIcon, ArrowRight, Plus, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format, isSameDay, startOfMonth, endOfMonth } from "date-fns";
import { Link } from "wouter";

// New interface for the filtered calendar API
interface FilteredCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location: string;
  icons: string[];
  meta: {
    price_amount: number;
    created_by_user_id: string;
    user_flags: { pinned: boolean; interested: boolean };
  };
}

// Keep the old interface for backward compatibility with aggregate API
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

type ViewType = 'upcoming' | 'pinned' | 'interested' | 'mine' | 'free';

const viewLabels: Record<ViewType, string> = {
  upcoming: 'Upcoming Events',
  pinned: 'Pinned Trips',
  interested: 'Interested Trips', 
  mine: 'My Trips',
  free: 'Free Trips'
};

const emptyStateConfig: Record<ViewType, { message: string; ctaText: string; ctaLink: string }> = {
  upcoming: { message: 'No upcoming events this week.', ctaText: 'Browse Trips', ctaLink: '/trips' },
  pinned: { message: 'No pinned trips yet.', ctaText: 'Browse Trips', ctaLink: '/trips' },
  interested: { message: 'No trips marked as interested yet.', ctaText: 'Browse Trips', ctaLink: '/trips' },
  mine: { message: 'No trips created yet.', ctaText: 'Post a Trip', ctaLink: '/post-trip' },
  free: { message: 'No free trips available.', ctaText: 'Post a Trip', ctaLink: '/post-trip' }
};

interface EventCalendarProps {
  className?: string;
}

const eventTypeColors = {
  trip: "bg-ceylon-green text-white",
  tripInterested: "bg-yellow-500 text-white",
  tripPinned: "bg-orange-500 text-white", 
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
  const [selectedView, setSelectedView] = useState<ViewType>('upcoming');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Fetch filtered calendar events based on view
  const { data: filteredEvents = [], isLoading: isLoadingFiltered } = useQuery<FilteredCalendarEvent[]>({
    queryKey: ['/api/calendar', selectedView],
    queryFn: async () => {
      const response = await fetch(
        `/api/calendar?view=${selectedView}&tz=${Intl.DateTimeFormat().resolvedOptions().timeZone}`,
        { credentials: 'include' }
      );
      if (!response.ok) {
        throw new Error('Failed to fetch calendar events');
      }
      return response.json();
    },
  });

  // Still fetch aggregate events for calendar highlighting (legacy)
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

  // New component for filtered events
  const FilteredEventCard = ({ event }: { event: FilteredCalendarEvent }) => {
    const tripId = event.id.replace('trip_', '');
    const navigationUrl = `/trips/${tripId}`;
    
    // Safely parse date and handle invalid dates
    let eventDate: Date;
    let eventTime: string;
    let displayDate: string;
    
    try {
      eventDate = new Date(event.start);
      if (isNaN(eventDate.getTime())) {
        throw new Error('Invalid date');
      }
      eventTime = format(eventDate, 'HH:mm');
      displayDate = format(eventDate, 'MMM dd, yyyy');
    } catch (error) {
      // Fallback for invalid dates
      eventDate = new Date();
      eventTime = 'TBD';
      displayDate = 'TBD';
      console.warn('Invalid date in event:', event.start, error);
    }
    
    return (
      <Card className="mb-3 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-600" />
              <div className="flex items-center gap-1">
                {event.icons.map((icon, index) => (
                  <span key={index} className="text-sm">{icon}</span>
                ))}
              </div>
              <Badge className="text-xs bg-ceylon-green text-white">
                Trip
              </Badge>
            </div>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {eventTime}
            </span>
          </div>
          
          <h4 className="font-semibold text-sm mb-1" data-testid={`event-title-${event.id}`}>
            {event.title}
          </h4>
          
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
            <MapPin className="w-3 h-3" />
            {event.location}
          </div>
          
          <div className="flex flex-wrap gap-1 mb-2">
            <Badge variant="outline" className="text-xs">
              LKR {event.meta.price_amount}/person
            </Badge>
            <Badge variant="outline" className="text-xs">
              {displayDate}
            </Badge>
          </div>
          
          <Link href={navigationUrl}>
            <Button size="sm" variant="outline" className="w-full text-xs" data-testid={`event-view-${event.id}`}>
              View Details
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  };

  // Legacy EventCard for backward compatibility with selected date events
  const EventCard = ({ event }: { event: CalendarEvent }) => {
    const IconComponent = eventTypeIcons[event.eventType];
    const navigationUrl = getEventNavigationUrl(event);
    
    // Determine the appropriate color and badge text based on trip flags
    const getEventDisplayProps = () => {
      if (event.eventType === 'trip' && event.metadata) {
        if (event.metadata.isInterested) {
          return {
            colorClass: eventTypeColors.tripInterested,
            badgeText: "trip (interested)"
          };
        } else if (event.metadata.isPinned) {
          return {
            colorClass: eventTypeColors.tripPinned,
            badgeText: "trip (pinned)"
          };
        }
      }
      return {
        colorClass: eventTypeColors[event.eventType as keyof typeof eventTypeColors],
        badgeText: event.eventType.replace('_', ' ')
      };
    };
    
    const { colorClass, badgeText } = getEventDisplayProps();
    
    return (
      <Card className="mb-3 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <IconComponent className="w-4 h-4 text-gray-600" />
              <Badge className={`text-xs ${colorClass}`}>
                {badgeText}
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

  // Empty state component
  const EmptyState = () => {
    const config = emptyStateConfig[selectedView];
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <CalendarIcon className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No items to show yet</h3>
        <p className="text-sm text-gray-500 mb-4">{config.message}</p>
        <Link href={config.ctaLink}>
          <Button size="sm" className="bg-ceylon-green text-white hover:bg-ceylon-green/90">
            <Plus className="w-4 h-4 mr-2" />
            {config.ctaText}
          </Button>
        </Link>
      </div>
    );
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${className}`}>
      {/* Calendar */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-ceylon-green" />
                Event Calendar
              </div>
              
              {/* View Selector */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">View:</span>
                <Select value={selectedView} onValueChange={(value: ViewType) => setSelectedView(value)}>
                  <SelectTrigger className="w-48" data-testid="calendar-view-selector">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming Events</SelectItem>
                    <SelectItem value="pinned">Pinned Trips</SelectItem>
                    <SelectItem value="interested">Interested Trips</SelectItem>
                    <SelectItem value="mine">My Trips</SelectItem>
                    <SelectItem value="free">Free Trips</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardTitle>
            
            {/* Optional Legend */}
            <div className="flex items-center gap-4 text-xs text-gray-500 pt-2">
              <span className="flex items-center gap-1">📌 Pinned</span>
              <span className="flex items-center gap-1">⭐ Interested</span>
              <span className="flex items-center gap-1">👤 My Trip</span>
              <span className="flex items-center gap-1">💚 Free</span>
            </div>
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

      {/* Events Display */}
      <div>
        <Card className="sticky top-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {viewLabels[selectedView]}
            </CardTitle>
            <p className="text-sm text-gray-600">
              {filteredEvents.length} trip{filteredEvents.length !== 1 ? 's' : ''}
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="h-[400px]">
              {isLoadingFiltered ? (
                <div className="text-center py-8">
                  <div className="text-sm text-gray-500">Loading events...</div>
                </div>
              ) : filteredEvents.length > 0 ? (
                filteredEvents.map(event => (
                  <FilteredEventCard key={event.id} event={event} />
                ))
              ) : (
                <EmptyState />
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}