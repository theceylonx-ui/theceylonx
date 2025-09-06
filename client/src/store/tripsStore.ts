import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FilterState } from '@/utils/searchParams';

interface TripDraft {
  id?: string;
  title: string;
  from: string;
  to: string;
  startDate?: string;
  endDate?: string;
  timezone: string;
  description: string;
  maxPassengers: number;
  pricePerPerson: number;
  currency: string;
  contactPreference: 'whatsapp' | 'email' | 'both';
  updatedAt: Date;
}

interface TripsStore {
  // Filter state
  filters: FilterState;
  setFilters: (filters: Partial<FilterState>) => void;
  clearFilters: () => void;
  
  // Current draft
  currentDraft: TripDraft | null;
  setCurrentDraft: (draft: TripDraft | null) => void;
  updateDraft: (updates: Partial<TripDraft>) => void;
  clearDraft: () => void;
  
  // Date selection state for calendar
  selectedDates: {
    startDate: Date | null;
    endDate: Date | null;
  };
  setSelectedDates: (dates: { startDate: Date | null; endDate: Date | null }) => void;
  clearSelectedDates: () => void;
  
  // Navigation state
  returnPath: string | null;
  setReturnPath: (path: string | null) => void;
}

const defaultFilters: FilterState = {
  from: '',
  to: '',
  date: '',
  region: '',
  minPrice: '',
  maxPrice: '',
  search: '',
  view: 'list',
  page: 1
};

export const useTripsStore = create<TripsStore>()(
  persist(
    (set, get) => ({
      // Filter state
      filters: defaultFilters,
      setFilters: (newFilters) => set((state) => ({
        filters: { ...state.filters, ...newFilters }
      })),
      clearFilters: () => set({ filters: defaultFilters }),
      
      // Draft state
      currentDraft: null,
      setCurrentDraft: (draft) => set({ currentDraft: draft }),
      updateDraft: (updates) => set((state) => ({
        currentDraft: state.currentDraft 
          ? { ...state.currentDraft, ...updates, updatedAt: new Date() }
          : null
      })),
      clearDraft: () => set({ currentDraft: null }),
      
      // Date selection
      selectedDates: {
        startDate: null,
        endDate: null
      },
      setSelectedDates: (dates) => set({ selectedDates: dates }),
      clearSelectedDates: () => set({
        selectedDates: { startDate: null, endDate: null }
      }),
      
      // Navigation
      returnPath: null,
      setReturnPath: (path) => set({ returnPath: path })
    }),
    {
      name: 'ceylon-trips-store',
      partialize: (state) => ({
        filters: state.filters,
        currentDraft: state.currentDraft,
        returnPath: state.returnPath
      })
    }
  )
);

// Helper functions for date validation
export const validateDateRange = (startDate: Date | null, endDate: Date | null) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const errors: string[] = [];
  
  if (!startDate) {
    errors.push('Start date is required');
  } else if (startDate < today) {
    errors.push('Start date must be today or later');
  }
  
  if (!endDate) {
    errors.push('End date is required');
  } else if (startDate && endDate < startDate) {
    errors.push('End date must be after start date');
  }
  
  // Max span validation (30 days)
  if (startDate && endDate) {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 30) {
      errors.push('Trip duration cannot exceed 30 days');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Helper to format date range display
export const formatDateRange = (startDate: Date | null, endDate: Date | null): string => {
  if (!startDate || !endDate) return '';
  
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Colombo'
  };
  
  const start = startDate.toLocaleDateString('en-US', options);
  const end = endDate.toLocaleDateString('en-US', options);
  
  // Calculate nights
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const nights = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (startDate.getFullYear() === endDate.getFullYear()) {
    if (startDate.getMonth() === endDate.getMonth()) {
      // Same month: "Sep 22–24, 2025"
      const startDay = startDate.getDate();
      const endFormatted = endDate.toLocaleDateString('en-US', options);
      return `${startDate.toLocaleDateString('en-US', { month: 'short' })} ${startDay}–${endFormatted} · ${nights} ${nights === 1 ? 'night' : 'nights'}`;
    } else {
      // Same year, different months: "Sep 22 – Oct 24, 2025"
      const startFormatted = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${startFormatted} – ${end} · ${nights} ${nights === 1 ? 'night' : 'nights'}`;
    }
  }
  
  // Different years: "Dec 22, 2024 – Jan 24, 2025"
  return `${start} – ${end} · ${nights} ${nights === 1 ? 'night' : 'nights'}`;
};