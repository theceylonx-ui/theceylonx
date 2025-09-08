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
  
  // Debounce state changes for API calls - increased for better performance
  const debouncedState = useDebounce(calendarState, 300)
  
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
  
  // Handle filter toggles with auth gating and optimistic updates
  const handleFilterToggle = useCallback((filterType: keyof CalendarState['filters']) => {
    // Check if user is authenticated for user-specific filters
    if (!isAuthenticated && ['pinned', 'interested', 'my'].includes(filterType)) {
      // Could show a toast here about needing to sign in
      return
    }
    
    // Optimistic update - immediately update UI
    setCalendarState(prev => {
      // Special handling for "all" filter - if toggled on, turn off other filters
      let newFilters = { ...prev.filters }
      
      if (filterType === 'all' && !prev.filters.all) {
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
          ...prev.filters,
          all: false,
          [filterType]: !prev.filters[filterType]
        }
      } else {
        // Toggling "all" off
        newFilters[filterType] = !prev.filters[filterType]
      }
      
      const newState = { ...prev, filters: newFilters }
      
      // Debounced persistence to avoid excessive storage/URL updates
      setTimeout(() => {
        saveStateToStorage(newState)
        updateURLFromState(newState)
      }, 100)
      
      return newState
    })
  }, [isAuthenticated])
  
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
  
  // Get day events with proper error handling and caching
  const { data: dayResponse, isLoading: isDayLoading, error: dayError } = useQuery<CalendarResponse>({
    queryKey: ['calendar-day', debouncedState.selectedDate, buildFiltersString(debouncedState.filters), debouncedState.region || '', debouncedState.tags.join(',')],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('date', debouncedState.selectedDate);
      
      const filtersString = buildFiltersString(debouncedState.filters);
      if (filtersString) params.set('filters', filtersString);
      
      if (debouncedState.region) params.set('region', debouncedState.region);
      if (debouncedState.tags.length > 0) params.set('tags', debouncedState.tags.join(','));
      
      const response = await fetch(`/api/calendar/day?${params.toString()}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: true,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
        return false
      }
      return failureCount < 2
    }
  })
  
  // Get monthly day counts for calendar display with better caching
  const currentMonth = format(new Date(calendarState.selectedDate + 'T00:00:00'), 'yyyy-MM')
  const { data: monthCounts } = useQuery<DayCountsResponse>({
    queryKey: ['calendar-month', currentMonth, buildFiltersString(debouncedState.filters), debouncedState.region || '', debouncedState.tags.join(',')],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('month', currentMonth);
      params.set('summary', 'true'); // Request day counts format
      
      const filtersString = buildFiltersString(debouncedState.filters);
      if (filtersString) params.set('filters', filtersString);
      
      if (debouncedState.region) params.set('region', debouncedState.region);
      if (debouncedState.tags.length > 0) params.set('tags', debouncedState.tags.join(','));
      
      const response = await fetch(`/api/calendar/month?${params.toString()}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: true,
    staleTime: 5 * 60 * 1000, // Cache monthly data for 5 minutes
    retry: false
  })
  
  // Create day counts lookup for calendar cells
  const dayCountsMap = new Map(monthCounts?.days.map(day => [day.date, day.count]) || [])
  
  // Day cell renderer with counts and accessibility
  const dayRenderer = (date: Date, displayMonth: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const count = dayCountsMap.get(dateStr) || 0
    const isSelected = dateStr === calendarState.selectedDate
    const hasEvents = count > 0
    const isOutsideMonth = date.getMonth() !== displayMonth.getMonth()
    
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
          isSelected ? 'text-white' : 
          isOutsideMonth ? 'text-gray-400' : 
          hasEvents ? 'text-ceylon-green' : 'text-gray-700'
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
  
  // Enhanced Trip card component with better mobile design
  const TripCard = ({ trip }: { trip: CalendarTrip }) => (
    <div className="relative group overflow-hidden bg-white border-2 border-gray-100 rounded-xl p-4 hover:border-emerald-200 hover:shadow-lg transition-all duration-300 hover:scale-[1.01]" data-testid={`trip-card-${trip.id}`}>
      {/* Status flags */}
      {trip.flags && (
        <div className="absolute top-3 right-3 flex gap-1">
          {trip.flags.mine && (
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-3 w-3 text-blue-600" />
            </div>
          )}
          {trip.flags.pinned && (
            <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
              <Pin className="h-3 w-3 text-orange-600" />
            </div>
          )}
          {trip.flags.interested && (
            <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
              <Star className="h-3 w-3 text-yellow-600" />
            </div>
          )}
        </div>
      )}
      
      {/* Trip title */}
      <div className="mb-3 pr-12">
        <h4 className="font-semibold text-base text-gray-900 line-clamp-2 leading-tight">
          {trip.title}
        </h4>
      </div>
      
      {/* Route information - prominent display */}
      <div className="mb-4 p-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg border border-emerald-100">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-800 truncate">
              {trip.fromLocation}
            </div>
            <div className="text-xs text-gray-600 mt-1">to</div>
            <div className="text-sm font-medium text-gray-800 truncate">
              {trip.toLocation}
            </div>
          </div>
        </div>
      </div>
      
      {/* Trip details grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-gray-500">Time</div>
            <div className="text-sm font-medium text-gray-800">{trip.time}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
            <Users className="h-4 w-4 text-purple-600" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-gray-500">Seats</div>
            <div className="text-sm font-medium text-gray-800">{trip.seatsAvailable}</div>
          </div>
        </div>
      </div>
      
      {/* Price section */}
      <div className="mb-4">
        {trip.price && Number(trip.price) > 0 ? (
          <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Price</div>
              <div className="text-sm font-semibold text-orange-700">LKR {trip.price}</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Heart className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Price</div>
              <div className="text-sm font-semibold text-green-700">Free Trip</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <Badge variant="outline" className="text-xs bg-gray-50 border-gray-200 text-gray-600">
          {trip.region}
        </Badge>
        
        <Link href={`/trips/${trip.id}`}>
          <Button 
            size="sm" 
            className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
          >
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
              className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm min-h-[60px] sm:min-h-[44px] rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg scale-105' 
                  : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-emerald-300 hover:bg-emerald-50'
              } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
              data-testid={`filter-${filterKey}`}
            >
              <Icon className="h-4 w-4 sm:h-3 sm:w-3 flex-shrink-0" />
              <span className="text-center sm:text-left font-medium">{label}</span>
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
    <div className={`w-full space-y-4 sm:space-y-6 ${className}`}>
      {/* Enhanced Filter Controls */}
      <Card className="overflow-hidden border-2 border-gray-100 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 pb-4">
          <CardTitle className="text-xl font-semibold flex items-center justify-between">
            <span className="bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
              Trip Filters
            </span>
            <Badge 
              variant="outline" 
              className="bg-emerald-50 border-emerald-200 text-emerald-700 font-medium px-3 py-1"
            >
              {Object.values(calendarState.filters).filter(Boolean).length} active
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
            <FilterToggle filterKey="all" icon={MapPin} label="All Trips" />
            <FilterToggle filterKey="free" icon={Heart} label="Free Trips" />
            <FilterToggle filterKey="pinned" icon={Pin} label="Pinned" requiresAuth />
            <FilterToggle filterKey="interested" icon={Star} label="Interested" requiresAuth />
            <FilterToggle filterKey="my" icon={User} label="My Trips" requiresAuth />
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Enhanced Calendar View */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-950/30 dark:to-blue-950/30">
            <CardTitle className="text-xl font-semibold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">Calendar</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-4">
            <style>{`
              .enhanced-calendar {
                --rdp-cell-size: 48px;
                --rdp-accent-color: #059669;
                --rdp-background-color: #f0fdf4;
                --rdp-accent-color-dark: #065f46;
                --rdp-background-color-dark: #064e3b;
                --rdp-outline: 2px solid var(--rdp-accent-color);
                --rdp-outline-selected: 3px solid var(--rdp-accent-color);
                font-size: 14px;
              }
              
              @media (max-width: 640px) {
                .enhanced-calendar {
                  --rdp-cell-size: 44px;
                  font-size: 13px;
                }
              }
              
              .enhanced-calendar .rdp-table {
                width: 100%;
                max-width: none;
              }
              
              .enhanced-calendar .rdp-cell {
                padding: 2px;
                position: relative;
              }
              
              .enhanced-calendar .rdp-button {
                width: var(--rdp-cell-size);
                height: var(--rdp-cell-size);
                border-radius: 12px;
                font-weight: 500;
                border: 2px solid transparent;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
              }
              
              .enhanced-calendar .rdp-button:hover {
                background-color: #f0fdf4;
                border-color: #a7f3d0;
                transform: scale(1.05);
                box-shadow: 0 4px 12px rgba(6, 95, 70, 0.15);
              }
              
              .enhanced-calendar .rdp-button.rdp-day_selected {
                background: linear-gradient(135deg, #059669, #0891b2);
                color: white;
                border-color: #047857;
                box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
                transform: scale(1.1);
              }
              
              .enhanced-calendar .rdp-button.rdp-day_today {
                border-color: #fbbf24;
                background-color: #fef3c7;
                color: #92400e;
                font-weight: 600;
              }
              
              .enhanced-calendar .rdp-head_cell {
                font-weight: 600;
                color: #374151;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                padding: 8px 0;
              }
              
              .enhanced-calendar .day-badge {
                position: absolute;
                top: -2px;
                right: -2px;
                min-width: 18px;
                height: 18px;
                border-radius: 10px;
                background: linear-gradient(135deg, #dc2626, #ef4444);
                color: white;
                font-size: 10px;
                font-weight: 600;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px solid white;
                box-shadow: 0 2px 8px rgba(220, 38, 38, 0.4);
                z-index: 10;
                animation: pulse 2s infinite;
              }
              
              @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.8; }
              }
              
              .enhanced-calendar .day-content {
                position: relative;
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              
              .enhanced-calendar .rdp-button.rdp-day_outside {
                color: #9ca3af !important;
                opacity: 0.6;
              }
              
              .enhanced-calendar .rdp-button.rdp-day_outside:hover {
                background-color: #f9fafb;
                color: #6b7280 !important;
              }
              
              .enhanced-calendar .rdp-nav {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 16px;
              }
              
              .enhanced-calendar .rdp-caption {
                display: flex;
                align-items: center;
                justify-content: center;
                flex: 1;
                margin: 0;
              }
              
              .enhanced-calendar .rdp-caption_label {
                font-size: 18px;
                font-weight: 600;
                color: #374151;
                margin: 0;
              }
              
              .enhanced-calendar .rdp-nav_button {
                width: 40px;
                height: 40px;
                border-radius: 8px;
                border: 1px solid #d1d5db;
                background: white;
                color: #374151;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                margin: 0 8px;
              }
              
              .enhanced-calendar .rdp-nav_button:hover {
                background: #f3f4f6;
                border-color: #9ca3af;
                transform: scale(1.05);
              }
              
              .enhanced-calendar .rdp-nav_button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
              }
            `}</style>
            <DayPicker
              mode="single"
              selected={new Date(calendarState.selectedDate + 'T00:00:00')}
              onSelect={handleDateSelect}
              className="enhanced-calendar w-full"
              showOutsideDays={true}
              components={{
                Day: ({ date, displayMonth, ...props }) => (
                  <div 
                    {...props} 
                    onClick={() => handleDateSelect(date)}
                    className="day-content"
                  >
                    {dayRenderer(date, displayMonth)}
                  </div>
                )
              }}
            />
          </CardContent>
        </Card>
        
        {/* Enhanced Day Preview Panel */}
        {isDayPreviewOpen && (
          <Card className="overflow-hidden shadow-lg border-2 border-gradient">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-950/30 dark:to-emerald-950/30 pb-4">
              <CardTitle className="text-xl font-semibold">
                <div className="flex flex-col">
                  <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                    {format(new Date(calendarState.selectedDate + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
                  </span>
                  {dayResponse?.total && (
                    <span className="text-sm font-normal text-gray-600 mt-1">
                      {dayResponse.total} trip{dayResponse.total !== 1 ? 's' : ''} available
                    </span>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {isDayLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-3 border-emerald-200 border-t-emerald-500 mx-auto mb-4"></div>
                  <p className="text-gray-600 font-medium">Loading trips...</p>
                </div>
              ) : dayError?.message?.includes('401') ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Sign in Required</h3>
                  <p className="text-gray-500 mb-6">Sign in to see filtered trips and personalized content</p>
                  <Button asChild className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600">
                    <Link href="/login">Sign In</Link>
                  </Button>
                </div>
              ) : !dayResponse?.items.length ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="h-10 w-10 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No Trips Found</h3>
                  <p className="text-gray-500 mb-6">No trips on this day with your current filters</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button asChild variant="outline" className="border-emerald-200 text-emerald-600 hover:bg-emerald-50">
                      <Link href="/browse-trips">Browse All Trips</Link>
                    </Button>
                    <Button asChild className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600">
                      <Link href={`/post?date=${calendarState.selectedDate}`}>Post a Trip</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Available Trips</h3>
                      <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-700">
                        {dayResponse.items.length} of {dayResponse.total}
                      </Badge>
                    </div>
                  </div>
                  <ScrollArea className="h-[400px] sm:h-[450px] pr-4">
                    <div className="space-y-4">
                      {dayResponse.items.map((trip, index) => (
                        <div 
                          key={trip.id} 
                          className="transform transition-all duration-200 hover:scale-[1.02]"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <TripCard trip={trip} />
                        </div>
                      ))}
                    </div>
                    {dayResponse.total > dayResponse.items.length && (
                      <div className="text-center mt-6 pt-4 border-t border-gray-100">
                        <Button variant="outline" size="sm" className="border-emerald-200 text-emerald-600 hover:bg-emerald-50">
                          Load More Trips
                        </Button>
                      </div>
                    )}
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