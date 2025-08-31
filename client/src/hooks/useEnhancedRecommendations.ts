import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface EnhancedRecommendation {
  trip: any;
  score: number;
  reasons: string[];
  features: any;
  seasonalityScore: number;
  safetyScore: number;
  noveltyScore: number;
  diversityScore: number;
}

interface RecommendationFilters {
  limit?: number;
  region?: string;
  minPrice?: number;
  maxPrice?: number;
  date?: string;
  abTestGroup?: 'baseline' | 'personalized';
}

interface PersonalizationSettings {
  isPaused: boolean;
  abTestGroup: 'baseline' | 'personalized';
  resetAt?: string;
}

export function useEnhancedRecommendations(filters?: RecommendationFilters) {
  return useQuery({
    queryKey: ['/api/recommendations/enhanced', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.region) params.append('region', filters.region);
      if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
      if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
      if (filters?.date) params.append('date', filters.date);
      if (filters?.abTestGroup) params.append('abTestGroup', filters.abTestGroup);
      
      const response = await apiRequest('GET', `/api/recommendations/enhanced?${params}`);
      return await response.json() as EnhancedRecommendation[];
    },
    enabled: true,
  });
}

export function usePersonalizationSettings() {
  return useQuery({
    queryKey: ['/api/user/personalization'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/user/personalization');
      return await response.json() as PersonalizationSettings;
    },
  });
}

export function useTogglePersonalization() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (isPaused: boolean) => {
      const response = await apiRequest('PUT', '/api/user/personalization/toggle', { isPaused });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/personalization'] });
      queryClient.invalidateQueries({ queryKey: ['/api/recommendations/enhanced'] });
    },
  });
}

export function useResetRecommendations() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/user/personalization/reset');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/personalization'] });
      queryClient.invalidateQueries({ queryKey: ['/api/recommendations/enhanced'] });
      queryClient.invalidateQueries({ queryKey: ['/api/recommendations/trips'] });
    },
  });
}

export function useTrackEnhancedInteraction() {
  return useMutation({
    mutationFn: async ({
      tripId,
      interactionType,
      duration,
      sessionId,
      abTestGroup,
    }: {
      tripId: string;
      interactionType: 'view' | 'click' | 'bookmark' | 'share' | 'join_request' | 'not_interested';
      duration?: number;
      sessionId?: string;
      abTestGroup?: string;
    }) => {
      const response = await apiRequest('POST', '/api/user/interactions/enhanced', {
        tripId,
        interactionType,
        duration,
        sessionId,
        abTestGroup,
      });
      return await response.json();
    },
  });
}

export function useTrackKpiEvent() {
  return useMutation({
    mutationFn: async ({
      eventType,
      tripId,
      abTestGroup,
      eventData,
      sessionId,
    }: {
      eventType: string;
      tripId?: string;
      abTestGroup?: string;
      eventData?: any;
      sessionId?: string;
    }) => {
      const response = await apiRequest('POST', '/api/kpi/event', {
        eventType,
        tripId,
        abTestGroup,
        eventData,
        sessionId,
      });
      return await response.json();
    },
  });
}

export function useKpiAnalytics(filters?: {
  eventType?: string;
  abTestGroup?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ['/api/analytics/kpi', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.eventType) params.append('eventType', filters.eventType);
      if (filters?.abTestGroup) params.append('abTestGroup', filters.abTestGroup);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      
      const response = await apiRequest('GET', `/api/analytics/kpi?${params}`);
      return await response.json();
    },
  });
}

// Generate session ID for tracking
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get AB test group - could be based on user ID hash or random assignment
export function getABTestGroup(userId?: string): 'baseline' | 'personalized' {
  if (!userId) return 'baseline';
  
  // Simple hash-based assignment for consistent grouping
  const hash = userId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return Math.abs(hash) % 2 === 0 ? 'baseline' : 'personalized';
}