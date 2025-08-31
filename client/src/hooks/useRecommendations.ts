import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface TripRecommendation {
  trip: {
    id: string;
    title: string;
    fromLocation: string;
    toLocation: string;
    date: string;
    time: string;
    seatsAvailable: number;
    price: string;
    region: string;
    organizer: {
      id: string;
      name?: string;
      username?: string;
      profileImageUrl?: string;
    };
  };
  score: number;
  reasons: string[];
  features: {
    avgRating?: number;
    viewCount?: number;
    totalBookings?: number;
    tags?: string[];
    difficulty?: string;
  } | null;
}

interface UserPreferences {
  preferredRegions?: string[];
  budgetRange?: { min: number; max: number };
  preferredDays?: string[];
  preferredTimes?: string[];
  tripTypes?: string[];
  groupSize?: string;
  travelStyle?: string;
  interests?: string[];
}

interface RecommendationFilters {
  region?: string;
  minPrice?: number;
  maxPrice?: number;
  date?: string;
  limit?: number;
}

export function useRecommendations(filters?: RecommendationFilters) {
  return useQuery<TripRecommendation[]>({
    queryKey: ['/api/recommendations/trips', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.region) params.append('region', filters.region);
      if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
      if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
      if (filters?.date) params.append('date', filters.date);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      
      const response = await apiRequest('GET', `/api/recommendations/trips?${params.toString()}`);
      return response.json();
    },
    enabled: true,
  });
}

export function useUserPreferences() {
  return useQuery<UserPreferences>({
    queryKey: ['/api/user/preferences'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/user/preferences');
      return response.json();
    },
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (preferences: Partial<UserPreferences>) => {
      const response = await apiRequest('PUT', '/api/user/preferences', preferences);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/preferences'] });
      queryClient.invalidateQueries({ queryKey: ['/api/recommendations/trips'] });
    },
  });
}

export function useTrackInteraction() {
  return useMutation({
    mutationFn: async ({ 
      tripId, 
      interactionType, 
      duration 
    }: { 
      tripId: string; 
      interactionType: 'view' | 'click' | 'bookmark' | 'share' | 'join_request'; 
      duration?: number;
    }) => {
      const response = await apiRequest('POST', '/api/user/interactions', {
        tripId,
        interactionType,
        duration,
      });
      return response.json();
    },
  });
}

export function useUserInteractions() {
  return useQuery({
    queryKey: ['/api/user/interactions'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/user/interactions');
      return response.json();
    },
  });
}