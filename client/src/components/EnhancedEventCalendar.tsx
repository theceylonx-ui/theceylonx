import React, { useState, useEffect, useCallback } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Toggle } from '@/components/ui/toggle'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Link, useLocation } from 'wouter'
import { useAuth } from '@/hooks/useAuth'
import { MapPin, Clock, Users, DollarSign, Pin, Star, User, Heart, Lock } from 'lucide-react'

// Calendar state interface for comprehensive state management
interface CalendarState {
  selectedDate: string // YYYY-MM-DD format in Asia/Colombo
  view: 'month' | 'week' | 'day'
  filters: {
    all: boolean
    pinned: boolean
    interested: boolean
    my: boolean
    free: boolean
  }
  region: string | null
  tags: string[]
}

// Trip data structure from new API
interface CalendarTrip {
  id: string
  title: string
  fromLocation: string
  toLocation: string
  date: string
  time: string
  seatsAvailable: number
  price: string | null
  region: string
  tags: string[]
  status: string
  flags?: {
    pinned: boolean
    interested: boolean
    mine: boolean
    free: boolean
  }
  organizer: {
    id: string
  }
}

interface CalendarResponse {
  items: CalendarTrip[]
  total: number
  page: number
  limit: number
}

interface DayCountsResponse {
  days: Array<{
    date: string
    count: number
  }>
}

interface EnhancedEventCalendarProps {
  className?: string
}

const COLOMBO_TIMEZONE = 'Asia/Colombo'

// Utility functions for state management
const getInitialState = (): CalendarState => {
  // Try to get state from URL first, then localStorage, then defaults
  const params = new URLSearchParams(window.location.search)
  const today = new Date()
  const todayInColombo = new Date() // We'll format it directly
  
  return {
    selectedDate: params.get('date') || localStorage.getItem('calendar_date') || format(todayInColombo, 'yyyy-MM-dd'),
    view: (params.get('view') as any) || (localStorage.getItem('calendar_view') as any) || 'month',
    filters: {
      all: params.get('filters')?.includes('all') || localStorage.getItem('calendar_filters_all') === 'true' || true,
      pinned: params.get('filters')?.includes('pinned') || localStorage.getItem('calendar_filters_pinned') === 'true' || false,
      interested: params.get('filters')?.includes('interested') || localStorage.getItem('calendar_filters_interested') === 'true' || false,
      my: params.get('filters')?.includes('my') || localStorage.getItem('calendar_filters_my') === 'true' || false,
      free: params.get('filters')?.includes('free') || localStorage.getItem('calendar_filters_free') === 'true' || false,
    },
    region: params.get('region') || localStorage.getItem('calendar_region') || null,
    tags: params.get('tags')?.split(',').filter(Boolean) || (localStorage.getItem('calendar_tags')?.split(',').filter(Boolean)) || []
  }
}

const saveStateToStorage = (state: CalendarState) => {
  localStorage.setItem('calendar_date', state.selectedDate)
  localStorage.setItem('calendar_view', state.view)
  localStorage.setItem('calendar_filters_all', state.filters.all.toString())
  localStorage.setItem('calendar_filters_pinned', state.filters.pinned.toString())
  localStorage.setItem('calendar_filters_interested', state.filters.interested.toString())
  localStorage.setItem('calendar_filters_my', state.filters.my.toString())
  localStorage.setItem('calendar_filters_free', state.filters.free.toString())
  localStorage.setItem('calendar_region', state.region || '')
  localStorage.setItem('calendar_tags', state.tags.join(','))
}

const updateURLFromState = (state: CalendarState) => {
  const params = new URLSearchParams()
  params.set('date', state.selectedDate)
  params.set('view', state.view)
  
  // Build filters string
  const activeFilters = []
  if (state.filters.all) activeFilters.push('all')
  if (state.filters.pinned) activeFilters.push('pinned')
  if (state.filters.interested) activeFilters.push('interested')
  if (state.filters.my) activeFilters.push('my')
  if (state.filters.free) activeFilters.push('free')
  if (activeFilters.length > 0) {
    params.set('filters', activeFilters.join(','))
  }
  
  if (state.region) params.set('region', state.region)
  if (state.tags.length > 0) params.set('tags', state.tags.join(','))
  
  const newUrl = `${window.location.pathname}?${params.toString()}`
  window.history.replaceState({}, '', newUrl)
}

// Build filters string for API calls
const buildFiltersString = (filters: CalendarState['filters']) => {
  const activeFilters = []
  if (filters.all) activeFilters.push('all')
  if (filters.pinned) activeFilters.push('pinned')
  if (filters.interested) activeFilters.push('interested')  
  if (filters.my) activeFilters.push('my')
  if (filters.free) activeFilters.push('truly_free')
  return activeFilters.join(',')
}

// Debounce hook for API calls
const useDebounce = (value: any, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value)
  
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  
  return debouncedValue
}

// Define the enhanced event calendar component
const EnhancedEventCalendar = ({ className }: EnhancedEventCalendarProps) => {
  const { user, isAuthenticated } = useAuth()
  const [location, setLocation] = useLocation()
  const [calendarState, setCalendarState] = useState<CalendarState>(getInitialState)
  const [isDayPreviewOpen, setIsDayPreviewOpen] = useState(true)
  
  // Debounce state changes for API calls
  const debouncedState = useDebounce(calendarState, 150)
  
  // Update state and persist to storage/URL
  const updateCalendarState = useCallback((updates: Partial<CalendarState>) => {
    setCalendarState(prev => {
      const newState = { ...prev, ...updates }
      saveStateToStorage(newState)
      updateURLFromState(newState)
      return newState
    })
  }, [])
  
  // Handle date selection with keyboard support
  const handleDateSelect = useCallback((date: Date | undefined) => {
    if (date) {
      const dateStr = format(date, 'yyyy-MM-dd')
      updateCalendarState({ selectedDate: dateStr })
    }
  }, [updateCalendarState])
  
  // Handle filter toggles with auth gating
  const handleFilterToggle = useCallback((filterType: keyof CalendarState['filters']) => {
    // Check if user is authenticated for user-specific filters
    if (!isAuthenticated && ['pinned', 'interested', 'my'].includes(filterType)) {
      // Could show a toast here about needing to sign in
      return
    }
    
    // Special handling for "all" filter - if toggled on, turn off other filters
    let newFilters = { ...calendarState.filters }
    
    if (filterType === 'all' && !calendarState.filters.all) {
      // Turn on "all" and turn off others
      newFilters = {
        all: true,
        pinned: false,
        interested: false,
        my: false,
        free: false
      }
    } else if (filterType !== 'all') {
      // If any other filter is turned on, turn off "all"
      newFilters = {
        ...calendarState.filters,
        all: false,
        [filterType]: !calendarState.filters[filterType]
      }
    } else {
      // Toggling "all" off
      newFilters[filterType] = !calendarState.filters[filterType]
    }
    
    updateCalendarState({ filters: newFilters })
  }, [calendarState.filters, isAuthenticated, updateCalendarState])
  
  // Keyboard navigation handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.target !== document.body) return // Only handle when no input is focused
    
    const currentDate = new Date(calendarState.selectedDate + 'T00:00:00')
    let newDate: Date | null = null
    
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault()
        newDate = new Date(currentDate)
        newDate.setDate(currentDate.getDate() - 1)
        break
      case 'ArrowRight':
        event.preventDefault()
        newDate = new Date(currentDate)
        newDate.setDate(currentDate.getDate() + 1)
        break
      case 'ArrowUp':
        event.preventDefault()
        newDate = new Date(currentDate)
        newDate.setDate(currentDate.getDate() - 7)
        break
      case 'ArrowDown':
        event.preventDefault()
        newDate = new Date(currentDate)
        newDate.setDate(currentDate.getDate() + 7)
        break
      case 'Enter':
        event.preventDefault()
        // Toggle day preview or focus on the selected date
        setIsDayPreviewOpen(!isDayPreviewOpen)
        break
    }
    
    if (newDate) {
      handleDateSelect(newDate)
    }
  }, [calendarState.selectedDate, isDayPreviewOpen, handleDateSelect])
  
  // Set up keyboard navigation
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
  
  // Get day events with proper error handling
  const { data: dayResponse, isLoading: isDayLoading, error: dayError } = useQuery<CalendarResponse>({
    queryKey: [`/api/calendar/day?date=${debouncedState.selectedDate}&filters=${buildFiltersString(debouncedState.filters)}&region=${debouncedState.region || ''}&tags=${debouncedState.tags.join(',')}`],
    enabled: true,
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
        return false
      }
      return failureCount < 2
    }
  })
  
  // Get monthly day counts for calendar display
  const currentMonth = format(new Date(calendarState.selectedDate + 'T00:00:00'), 'yyyy-MM')
  const { data: monthCounts } = useQuery<DayCountsResponse>({
    queryKey: [`/api/calendar/month?month=${currentMonth}&summary=true&filters=${buildFiltersString(debouncedState.filters)}&region=${debouncedState.region || ''}&tags=${debouncedState.tags.join(',')}`],
    enabled: true,
    retry: false
  })
  
  // Create day counts lookup for calendar cells
  const dayCountsMap = new Map(monthCounts?.days.map(day => [day.date, day.count]) || [])
  
  // Day cell renderer with counts and accessibility
  const dayRenderer = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const count = dayCountsMap.get(dateStr) || 0
    const isSelected = dateStr === calendarState.selectedDate
    const hasEvents = count > 0
    
    return (
      <div 
        className={`relative w-full h-full flex flex-col items-center justify-center p-1 transition-colors ${
          isSelected ? 'bg-ceylon-green text-white rounded-md' : 'hover:bg-gray-100'
        }`}
        aria-label={`${format(date, 'MMMM d, yyyy')} — ${count} trips`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleDateSelect(date)
          }
        }}
      >
        <span className={`text-sm ${hasEvents ? 'font-bold' : 'font-normal'} ${
          isSelected ? 'text-white' : hasEvents ? 'text-ceylon-green' : 'text-gray-700'
        }`}>
          {format(date, 'd')}
        </span>
        {count > 0 && (
          <Badge variant="secondary" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center bg-ceylon-green text-white">
            {count > 9 ? '9+' : count}
          </Badge>
        )}
      </div>
    )
  }
  
  // Trip card component with proper privacy handling
  const TripCard = ({ trip }: { trip: CalendarTrip }) => (
    <div className="border rounded-lg p-3 hover:bg-gray-50 transition-colors" data-testid={`trip-card-${trip.id}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-medium text-sm flex-1 truncate">
          {trip.flags && (
            <span className="mr-2">
              {trip.flags.interested && '⭐'}
              {trip.flags.pinned && !trip.flags.interested && '📌'}
              {trip.flags.mine && '👤'}
              {trip.flags.free && '💚'}
            </span>
          )}
          {trip.title}
        </h4>
      </div>
      
      <div className="space-y-1 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{trip.fromLocation} → {trip.toLocation}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{trip.time}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          <span>{trip.seatsAvailable} seats</span>
        </div>
        
        {trip.price && Number(trip.price) > 0 ? (
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            <span>LKR {trip.price}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-green-600">
            <Heart className="h-3 w-3" />
            <span>Free Trip</span>
          </div>
        )}
      </div>
      
      <div className="mt-2 flex items-center justify-between">
        <Badge variant="outline" className="text-xs">
          {trip.region}
        </Badge>
        
        <Link href={`/trips/${trip.id}`}>
          <Button size="sm" variant="outline" className="h-6 text-xs">
            View Details
          </Button>
        </Link>
      </div>
    </div>
  )
  
  // Filter toggle component
  const FilterToggle = ({ 
    filterKey, 
    icon: Icon, 
    label, 
    requiresAuth = false 
  }: { 
    filterKey: keyof CalendarState['filters']
    icon: any
    label: string
    requiresAuth?: boolean 
  }) => {
    const isActive = calendarState.filters[filterKey]
    const isDisabled = requiresAuth && !isAuthenticated
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              pressed={isActive}
              onPressedChange={() => handleFilterToggle(filterKey)}
              disabled={isDisabled}
              className={`flex items-center gap-2 text-xs ${
                isActive ? 'bg-ceylon-green text-white' : ''
              } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              data-testid={`filter-${filterKey}`}
            >
              <Icon className="h-3 w-3" />
              {label}
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>
            {isDisabled ? 'Sign in to use this filter' : `Toggle ${label.toLowerCase()}`}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }
  
  return (
    <div className={`w-full space-y-6 ${className}`}>
      {/* Filter Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            Calendar Filters
            <Badge variant="outline" className="ml-auto">
              {Object.values(calendarState.filters).filter(Boolean).length} active
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <FilterToggle filterKey="all" icon={MapPin} label="All Trips" />
            <FilterToggle filterKey="free" icon={Heart} label="Free Trips" />
            <FilterToggle filterKey="pinned" icon={Pin} label="Pinned" requiresAuth />
            <FilterToggle filterKey="interested" icon={Star} label="Interested" requiresAuth />
            <FilterToggle filterKey="my" icon={User} label="My Trips" requiresAuth />
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar View */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <DayPicker
              mode="single"
              selected={new Date(calendarState.selectedDate + 'T00:00:00')}
              onSelect={handleDateSelect}
              className="w-full"
              components={{
                Day: ({ date, ...props }) => (
                  <div {...props} onClick={() => handleDateSelect(date)}>
                    {dayRenderer(date)}
                  </div>
                )
              }}
            />
          </CardContent>
        </Card>
        
        {/* Day Agenda Panel */}
        {isDayPreviewOpen && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>
                  {format(new Date(calendarState.selectedDate + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsDayPreviewOpen(false)}
                  data-testid="close-day-preview"
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isDayLoading ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ceylon-green mx-auto mb-2"></div>
                  Loading trips...
                </div>
              ) : dayError?.message?.includes('401') ? (
                <div className="text-center py-8">
                  <Lock className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 mb-4">Sign in to see filtered trips</p>
                  <Button asChild size="sm">
                    <Link href="/login">Sign In</Link>
                  </Button>
                </div>
              ) : !dayResponse?.items.length ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No trips on this day with current filters.</p>
                  <div className="flex gap-2 justify-center">
                    <Button asChild variant="outline" size="sm">
                      <Link href="/trips">Browse Trips</Link>
                    </Button>
                    <Button asChild size="sm">
                      <Link href="/post">Post a Trip</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-4 text-sm text-gray-600">
                    Showing {dayResponse.items.length} of {dayResponse.total} trips
                  </div>
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {dayResponse.items.map((trip) => (
                        <TripCard key={trip.id} trip={trip} />
                      ))}
                    </div>
                  </ScrollArea>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default EnhancedEventCalendar