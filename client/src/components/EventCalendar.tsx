import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Clock, Plus, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Link } from "wouter";

// Day-specific calendar event interface
interface DayCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location: string;
  flags: {
    pinned: boolean;
    interested: boolean;
    mine: boolean;
    free: boolean;
  };
}

type ViewType = 'all' | 'pinned' | 'interested' | 'mine' | 'free';

const viewLabels: Record<ViewType, string> = {
  all: 'All Events',
  pinned: 'Pinned Trips',
  interested: 'Interested Trips', 
  mine: 'My Trips',
  free: 'Free Trips'
};

const emptyStateConfig: Record<ViewType, { message: string; ctaText: string; ctaLink: string }> = {
  all: { message: 'No events for this date.', ctaText: 'Browse Trips', ctaLink: '/trips' },
  pinned: { message: 'No pinned trips for this date.', ctaText: 'Browse Trips', ctaLink: '/trips' },
  interested: { message: 'No interested trips for this date.', ctaText: 'Browse Trips', ctaLink: '/trips' },
  mine: { message: 'No trips you created for this date.', ctaText: 'Post a Trip', ctaLink: '/post-trip' },
  free: { message: 'No free trips for this date.', ctaText: 'Post a Trip', ctaLink: '/post-trip' }
};

interface EventCalendarProps {
  className?: string;
}

const EventCalendar = ({ className }: EventCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedView, setSelectedView] = useState<ViewType>('all');
  const [isDayPreviewOpen, setIsDayPreviewOpen] = useState(true);
  
  // Fetch events for selected date and view
  const { data: dayEvents = [], isLoading } = useQuery<DayCalendarEvent[]>({
    queryKey: ['/api/calendar/day', selectedDate.toISOString().split('T')[0], selectedView],
    enabled: true
  });
  
  // Helper function to get event icons in priority order
  const getEventIcons = (flags: DayCalendarEvent['flags']) => {
    const icons: string[] = [];
    if (flags.interested) icons.push('⭐');
    if (flags.pinned && !flags.interested) icons.push('📌'); // Only show pin if not interested
    if (flags.mine) icons.push('👤');
    if (flags.free) icons.push('💚');
    return icons;
  };
  
  // Format event time range
  const formatTimeRange = (start: string, end: string) => {
    try {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const startTime = format(startDate, 'HH:mm');
      const endTime = format(endDate, 'HH:mm');
      return `${startTime}–${endTime}`;
    } catch {
      return 'TBD';
    }
  };
  
  // Day Preview Panel Component
  const DayPreviewPanel = () => {
    const dateDisplay = format(selectedDate, 'EEEE, dd MMM yyyy');
    
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Events on {dateDisplay}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">
              Loading events...
            </div>
          ) : dayEvents.length > 0 ? (
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {dayEvents.map((event: DayCalendarEvent) => {
                  const tripId = event.id.replace('trip_', '');
                  const icons = getEventIcons(event.flags);
                  
                  return (
                    <div key={event.id} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-medium text-sm line-clamp-2">
                          {icons.length > 0 && (
                            <span className="mr-2">{icons.join(' ')}</span>
                          )}
                          {event.title}
                        </h4>
                      </div>
                      
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeRange(event.start, event.end)}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </div>
                        )}
                      </div>
                      
                      <Link href={`/trips/${tripId}`}>
                        <Button size="sm" variant="outline" className="w-full mt-2 text-xs" 
                                data-testid={`event-view-${event.id}`}>
                          View Details
                        </Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                {emptyStateConfig[selectedView].message}
              </p>
              <Link href={emptyStateConfig[selectedView].ctaLink}>
                <Button size="sm" variant="outline">
                  {emptyStateConfig[selectedView].ctaText}
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };
  
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setIsDayPreviewOpen(true);
    }
  };
  
  const handleViewChange = (view: ViewType) => {
    setSelectedView(view);
  };
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Quick Actions - unchanged */}
      <Card>
        <CardHeader>
          <CardTitle>Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Link href="/trips">
              <Button size="sm" variant="outline" className="flex items-center gap-2" data-testid="quick-browse-trips">
                <Search className="w-4 h-4" />
                Browse Trips
              </Button>
            </Link>
            <Link href="/post-trip">
              <Button size="sm" variant="outline" className="flex items-center gap-2" data-testid="quick-post-trip">
                <Plus className="w-4 h-4" />
                Post a Trip
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
      
      {/* View Dropdown and Legend Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">View:</span>
          <Select value={selectedView} onValueChange={handleViewChange}>
            <SelectTrigger className="w-40" data-testid="view-selector">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(viewLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">⭐ Interested</span>
          <span className="flex items-center gap-1">📌 Pinned</span>
          <span className="flex items-center gap-1">👤 My Trip</span>
          <span className="flex items-center gap-1">💚 Free</span>
        </div>
      </div>
      
      {/* Month Calendar and Day Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Month Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Date</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              className="rounded-md border"
              data-testid="month-calendar"
            />
          </CardContent>
        </Card>
        
        {/* Day Preview Panel */}
        {isDayPreviewOpen && (
          <div>
            <DayPreviewPanel />
          </div>
        )}
      </div>
    </div>
  );
};

export default EventCalendar;