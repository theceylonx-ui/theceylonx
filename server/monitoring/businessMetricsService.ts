// 🚀 BUSINESS METRICS MONITORING - Operational insights and conversion tracking
import { Request, Response } from 'express';

// Business event types
export type BusinessEventType = 
  | 'user_registration'
  | 'user_login'
  | 'user_profile_update'
  | 'trip_created'
  | 'trip_viewed'
  | 'trip_interested'
  | 'trip_search'
  | 'question_asked'
  | 'answer_provided'
  | 'chat_message_sent'
  | 'chat_conversation_started'
  | 'recommendation_viewed'
  | 'recommendation_clicked'
  | 'notification_sent'
  | 'email_opened'
  | 'feature_used'
  | 'error_encountered'
  | 'page_view'
  | 'session_started'
  | 'session_ended';

// Business event interface
interface BusinessEvent {
  id: string;
  type: BusinessEventType;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  metadata: Record<string, any>;
  value?: number; // Monetary value or numeric metric
  category: string;
  source: 'web' | 'mobile' | 'api' | 'system';
  environment: string;
}

// Conversion funnel stages
type ConversionStage = 
  | 'landing'
  | 'browse_trips'
  | 'trip_view'
  | 'show_interest'
  | 'chat_initiated'
  | 'booking_completed';

// Funnel tracking
interface ConversionFunnel {
  sessionId: string;
  userId?: string;
  startTime: Date;
  lastActivity: Date;
  stages: {
    stage: ConversionStage;
    timestamp: Date;
    metadata?: Record<string, any>;
  }[];
  completed: boolean;
  value?: number;
}

// Aggregated metrics
interface MetricsSummary {
  timeRange: { start: Date; end: Date };
  users: {
    newRegistrations: number;
    activeUsers: number;
    returningUsers: number;
    churnRate: number;
  };
  trips: {
    created: number;
    viewed: number;
    interestShown: number;
    conversionRate: number;
  };
  community: {
    questionsAsked: number;
    answersProvided: number;
    chatMessages: number;
    engagementRate: number;
  };
  platform: {
    pageViews: number;
    sessionDuration: number;
    bounceRate: number;
    errorRate: number;
  };
  revenue: {
    totalValue: number;
    averageOrderValue: number;
    revenuePerUser: number;
  };
  conversionFunnels: {
    started: number;
    completed: number;
    conversionRate: number;
    dropoffByStage: Record<ConversionStage, number>;
  };
}

// Alert thresholds for business metrics
interface BusinessMetricThresholds {
  userChurnRate: number;
  errorRateThreshold: number;
  conversionRateThreshold: number;
  engagementDropThreshold: number;
  revenueDropThreshold: number;
}

// Business health score
interface BusinessHealthScore {
  overall: number; // 0-100
  categories: {
    userGrowth: number;
    engagement: number;
    conversion: number;
    retention: number;
    monetization: number;
  };
  trends: {
    category: string;
    trend: 'up' | 'down' | 'stable';
    change: number; // percentage
  }[];
  recommendations: string[];
}

class BusinessMetricsService {
  private events: BusinessEvent[] = [];
  private funnels: Map<string, ConversionFunnel> = new Map();
  private aggregatedMetrics: Map<string, MetricsSummary> = new Map();
  private thresholds: BusinessMetricThresholds;
  private aggregationInterval?: NodeJS.Timeout;
  
  // Real-time counters
  private realTimeCounters = {
    activeUsers: new Set<string>(),
    activeSessions: new Set<string>(),
    hourlyEvents: 0,
    dailyRevenue: 0
  };

  constructor(thresholds: Partial<BusinessMetricThresholds> = {}) {
    this.thresholds = {
      userChurnRate: 0.2, // 20%
      errorRateThreshold: 0.05, // 5%
      conversionRateThreshold: 0.1, // 10%
      engagementDropThreshold: 0.3, // 30%
      revenueDropThreshold: 0.2, // 20%
      ...thresholds
    };

    this.startAggregation();
    this.startRealTimeTracking();
    console.log('📊 Business Metrics Service initialized');
  }

  // Track business events
  trackEvent(
    type: BusinessEventType,
    metadata: Record<string, any> = {},
    userId?: string,
    sessionId?: string,
    value?: number,
    source: BusinessEvent['source'] = 'web'
  ): string {
    const event: BusinessEvent = {
      id: this.generateEventId(),
      type,
      timestamp: new Date(),
      userId,
      sessionId,
      metadata,
      value,
      category: this.categorizeEvent(type),
      source,
      environment: process.env.NODE_ENV || 'development'
    };

    this.events.push(event);
    this.updateRealTimeCounters(event);
    this.updateConversionFunnel(event);
    
    // Trim events to prevent memory issues
    if (this.events.length > 50000) {
      this.events = this.events.slice(-50000);
    }

    return event.id;
  }

  // User lifecycle tracking
  trackUserRegistration(userId: string, metadata: Record<string, any> = {}): void {
    this.trackEvent('user_registration', {
      source: 'registration_form',
      ...metadata
    }, userId);
  }

  trackUserLogin(userId: string, method: string, sessionId: string): void {
    this.trackEvent('user_login', {
      loginMethod: method,
      timestamp: new Date().toISOString()
    }, userId, sessionId);
  }

  trackUserActivity(userId: string, activity: string, sessionId: string, metadata: Record<string, any> = {}): void {
    this.trackEvent('feature_used', {
      activity,
      ...metadata
    }, userId, sessionId);
  }

  // Trip-related metrics
  trackTripCreation(userId: string, tripId: string, tripData: Record<string, any>): void {
    this.trackEvent('trip_created', {
      tripId,
      destination: tripData.destination,
      category: tripData.category,
      duration: tripData.duration,
      groupSize: tripData.groupSize
    }, userId);
  }

  trackTripView(tripId: string, userId?: string, sessionId?: string): void {
    this.trackEvent('trip_viewed', {
      tripId,
      viewType: 'detailed'
    }, userId, sessionId);
  }

  trackTripInterest(tripId: string, userId: string, sessionId: string): void {
    this.trackEvent('trip_interested', {
      tripId,
      action: 'show_interest'
    }, userId, sessionId, 1); // Assign value of 1 for conversion tracking
  }

  trackTripSearch(query: string, filters: Record<string, any>, userId?: string, sessionId?: string): void {
    this.trackEvent('trip_search', {
      query,
      filters,
      resultCount: filters.resultCount || 0
    }, userId, sessionId);
  }

  // Community engagement metrics
  trackQuestionAsked(userId: string, questionId: string, category: string): void {
    this.trackEvent('question_asked', {
      questionId,
      category,
      timestamp: new Date().toISOString()
    }, userId);
  }

  trackAnswerProvided(userId: string, questionId: string, answerId: string): void {
    this.trackEvent('answer_provided', {
      questionId,
      answerId,
      timestamp: new Date().toISOString()
    }, userId);
  }

  trackChatActivity(userId: string, conversationId: string, action: 'start' | 'message' | 'end'): void {
    const eventType = action === 'start' ? 'chat_conversation_started' : 'chat_message_sent';
    this.trackEvent(eventType, {
      conversationId,
      action,
      timestamp: new Date().toISOString()
    }, userId);
  }

  // Recommendation system metrics
  trackRecommendationViewed(userId: string, recommendationId: string, type: string): void {
    this.trackEvent('recommendation_viewed', {
      recommendationId,
      type,
      timestamp: new Date().toISOString()
    }, userId);
  }

  trackRecommendationClicked(userId: string, recommendationId: string, targetId: string): void {
    this.trackEvent('recommendation_clicked', {
      recommendationId,
      targetId,
      timestamp: new Date().toISOString()
    }, userId, undefined, 1); // Value for conversion tracking
  }

  // Page view and session tracking
  trackPageView(path: string, userId?: string, sessionId?: string, metadata: Record<string, any> = {}): void {
    this.trackEvent('page_view', {
      path,
      ...metadata
    }, userId, sessionId);
  }

  trackSessionStart(sessionId: string, userId?: string): void {
    this.trackEvent('session_started', {
      sessionId,
      timestamp: new Date().toISOString()
    }, userId, sessionId);
  }

  trackSessionEnd(sessionId: string, duration: number, userId?: string): void {
    this.trackEvent('session_ended', {
      sessionId,
      duration,
      timestamp: new Date().toISOString()
    }, userId, sessionId);
  }

  // Error and performance tracking
  trackError(errorType: string, severity: string, userId?: string, metadata: Record<string, any> = {}): void {
    this.trackEvent('error_encountered', {
      errorType,
      severity,
      ...metadata
    }, userId);
  }

  // Conversion funnel management
  private updateConversionFunnel(event: BusinessEvent): void {
    if (!event.sessionId) return;

    let funnel = this.funnels.get(event.sessionId);
    
    if (!funnel) {
      funnel = {
        sessionId: event.sessionId,
        userId: event.userId,
        startTime: event.timestamp,
        lastActivity: event.timestamp,
        stages: [],
        completed: false
      };
      this.funnels.set(event.sessionId, funnel);
    }

    // Update last activity
    funnel.lastActivity = event.timestamp;
    if (event.userId && !funnel.userId) {
      funnel.userId = event.userId;
    }

    // Map events to funnel stages
    const stage = this.mapEventToFunnelStage(event);
    if (stage) {
      // Check if this stage is already recorded
      const existingStage = funnel.stages.find(s => s.stage === stage);
      if (!existingStage) {
        funnel.stages.push({
          stage,
          timestamp: event.timestamp,
          metadata: event.metadata
        });
      }

      // Check if funnel is completed
      if (stage === 'booking_completed') {
        funnel.completed = true;
        funnel.value = event.value;
      }
    }
  }

  private mapEventToFunnelStage(event: BusinessEvent): ConversionStage | null {
    switch (event.type) {
      case 'page_view':
        if (event.metadata.path === '/') return 'landing';
        if (event.metadata.path === '/trips') return 'browse_trips';
        return null;
      case 'trip_viewed':
        return 'trip_view';
      case 'trip_interested':
        return 'show_interest';
      case 'chat_conversation_started':
        return 'chat_initiated';
      default:
        return null;
    }
  }

  // Real-time counter updates
  private updateRealTimeCounters(event: BusinessEvent): void {
    this.realTimeCounters.hourlyEvents++;
    
    if (event.userId) {
      this.realTimeCounters.activeUsers.add(event.userId);
    }
    
    if (event.sessionId) {
      this.realTimeCounters.activeSessions.add(event.sessionId);
    }
    
    if (event.value) {
      this.realTimeCounters.dailyRevenue += event.value;
    }
  }

  // Start real-time tracking
  private startRealTimeTracking(): void {
    // Reset hourly counters
    setInterval(() => {
      this.realTimeCounters.hourlyEvents = 0;
    }, 3600000); // Every hour

    // Reset daily counters
    setInterval(() => {
      this.realTimeCounters.dailyRevenue = 0;
    }, 86400000); // Every day

    // Clear old active users/sessions
    setInterval(() => {
      this.realTimeCounters.activeUsers.clear();
      this.realTimeCounters.activeSessions.clear();
    }, 1800000); // Every 30 minutes
  }

  // Metrics aggregation
  private startAggregation(): void {
    this.aggregationInterval = setInterval(() => {
      this.aggregateMetrics();
    }, 300000); // Every 5 minutes
  }

  private aggregateMetrics(): void {
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 3600000);
    const dayAgo = new Date(now.getTime() - 86400000);
    
    // Aggregate hourly metrics
    const hourlyMetrics = this.calculateMetrics(hourAgo, now);
    this.aggregatedMetrics.set('hourly', hourlyMetrics);
    
    // Aggregate daily metrics
    const dailyMetrics = this.calculateMetrics(dayAgo, now);
    this.aggregatedMetrics.set('daily', dailyMetrics);
  }

  private calculateMetrics(startTime: Date, endTime: Date): MetricsSummary {
    const eventsInRange = this.events.filter(
      e => e.timestamp >= startTime && e.timestamp <= endTime
    );

    const uniqueUsers = new Set(eventsInRange.filter(e => e.userId).map(e => e.userId)).size;
    const registrations = eventsInRange.filter(e => e.type === 'user_registration').length;
    const tripViews = eventsInRange.filter(e => e.type === 'trip_viewed').length;
    const tripInterests = eventsInRange.filter(e => e.type === 'trip_interested').length;
    const tripsCreated = eventsInRange.filter(e => e.type === 'trip_created').length;
    const questionsAsked = eventsInRange.filter(e => e.type === 'question_asked').length;
    const answersProvided = eventsInRange.filter(e => e.type === 'answer_provided').length;
    const chatMessages = eventsInRange.filter(e => e.type === 'chat_message_sent').length;
    const pageViews = eventsInRange.filter(e => e.type === 'page_view').length;
    const errors = eventsInRange.filter(e => e.type === 'error_encountered').length;
    
    const totalRevenue = eventsInRange
      .filter(e => e.value)
      .reduce((sum, e) => sum + (e.value || 0), 0);

    // Calculate conversion funnel metrics
    const funnelMetrics = this.calculateFunnelMetrics(startTime, endTime);

    return {
      timeRange: { start: startTime, end: endTime },
      users: {
        newRegistrations: registrations,
        activeUsers: uniqueUsers,
        returningUsers: 0, // Calculate based on previous periods
        churnRate: 0 // Calculate based on user activity patterns
      },
      trips: {
        created: tripsCreated,
        viewed: tripViews,
        interestShown: tripInterests,
        conversionRate: tripViews > 0 ? (tripInterests / tripViews) * 100 : 0
      },
      community: {
        questionsAsked,
        answersProvided,
        chatMessages,
        engagementRate: uniqueUsers > 0 ? ((questionsAsked + answersProvided + chatMessages) / uniqueUsers) : 0
      },
      platform: {
        pageViews,
        sessionDuration: 0, // Calculate from session events
        bounceRate: 0, // Calculate from single-page sessions
        errorRate: pageViews > 0 ? (errors / pageViews) * 100 : 0
      },
      revenue: {
        totalValue: totalRevenue,
        averageOrderValue: tripInterests > 0 ? totalRevenue / tripInterests : 0,
        revenuePerUser: uniqueUsers > 0 ? totalRevenue / uniqueUsers : 0
      },
      conversionFunnels: funnelMetrics
    };
  }

  private calculateFunnelMetrics(startTime: Date, endTime: Date) {
    const relevantFunnels = Array.from(this.funnels.values()).filter(
      f => f.startTime >= startTime && f.startTime <= endTime
    );

    const started = relevantFunnels.length;
    const completed = relevantFunnels.filter(f => f.completed).length;
    
    // Calculate dropoff by stage
    const dropoffByStage: Record<ConversionStage, number> = {
      landing: 0,
      browse_trips: 0,
      trip_view: 0,
      show_interest: 0,
      chat_initiated: 0,
      booking_completed: 0
    };

    relevantFunnels.forEach(funnel => {
      const stages = funnel.stages.map(s => s.stage);
      if (!stages.includes('browse_trips') && stages.includes('landing')) dropoffByStage.landing++;
      if (!stages.includes('trip_view') && stages.includes('browse_trips')) dropoffByStage.browse_trips++;
      if (!stages.includes('show_interest') && stages.includes('trip_view')) dropoffByStage.trip_view++;
      if (!stages.includes('chat_initiated') && stages.includes('show_interest')) dropoffByStage.show_interest++;
      if (!stages.includes('booking_completed') && stages.includes('chat_initiated')) dropoffByStage.chat_initiated++;
    });

    return {
      started,
      completed,
      conversionRate: started > 0 ? (completed / started) * 100 : 0,
      dropoffByStage
    };
  }

  // Business health scoring
  calculateBusinessHealthScore(): BusinessHealthScore {
    const dailyMetrics = this.aggregatedMetrics.get('daily');
    if (!dailyMetrics) {
      return {
        overall: 50,
        categories: {
          userGrowth: 50,
          engagement: 50,
          conversion: 50,
          retention: 50,
          monetization: 50
        },
        trends: [],
        recommendations: ['Insufficient data for health assessment']
      };
    }

    // Calculate category scores (0-100)
    const userGrowth = Math.min(100, (dailyMetrics.users.newRegistrations / 10) * 100);
    const engagement = Math.min(100, dailyMetrics.community.engagementRate * 20);
    const conversion = Math.min(100, dailyMetrics.trips.conversionRate * 10);
    const retention = Math.max(0, 100 - (dailyMetrics.users.churnRate * 100));
    const monetization = Math.min(100, (dailyMetrics.revenue.revenuePerUser / 100) * 100);

    const overall = (userGrowth + engagement + conversion + retention + monetization) / 5;

    const recommendations = [];
    if (conversion < 50) recommendations.push('Focus on improving trip conversion rates');
    if (engagement < 50) recommendations.push('Increase community engagement initiatives');
    if (userGrowth < 50) recommendations.push('Enhance user acquisition strategies');
    if (retention < 50) recommendations.push('Implement user retention programs');
    if (monetization < 50) recommendations.push('Optimize revenue generation strategies');

    return {
      overall,
      categories: {
        userGrowth,
        engagement,
        conversion,
        retention,
        monetization
      },
      trends: [
        { category: 'User Growth', trend: 'stable', change: 0 },
        { category: 'Engagement', trend: 'stable', change: 0 },
        { category: 'Conversion', trend: 'stable', change: 0 }
      ],
      recommendations
    };
  }

  // Express middleware for automatic page view tracking
  createTrackingMiddleware() {
    return (req: Request, res: Response, next: Function) => {
      const userId = (req as any).user?.id;
      const sessionId = req.sessionID;
      
      // Track page views for frontend routes
      if (req.path.startsWith('/') && !req.path.startsWith('/api/')) {
        this.trackPageView(req.path, userId, sessionId, {
          userAgent: req.get('User-Agent'),
          referer: req.get('Referer'),
          ip: req.ip
        });
      }
      
      next();
    };
  }

  // Utility methods
  private categorizeEvent(type: BusinessEventType): string {
    if (['user_registration', 'user_login', 'user_profile_update'].includes(type)) {
      return 'user_lifecycle';
    }
    if (['trip_created', 'trip_viewed', 'trip_interested', 'trip_search'].includes(type)) {
      return 'trip_management';
    }
    if (['question_asked', 'answer_provided', 'chat_message_sent', 'chat_conversation_started'].includes(type)) {
      return 'community_engagement';
    }
    if (['page_view', 'session_started', 'session_ended'].includes(type)) {
      return 'platform_usage';
    }
    return 'other';
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  getMetricsSummary(period: 'hourly' | 'daily' = 'daily'): MetricsSummary | null {
    return this.aggregatedMetrics.get(period) || null;
  }

  getRealTimeStats() {
    return {
      activeUsers: this.realTimeCounters.activeUsers.size,
      activeSessions: this.realTimeCounters.activeSessions.size,
      hourlyEvents: this.realTimeCounters.hourlyEvents,
      dailyRevenue: this.realTimeCounters.dailyRevenue
    };
  }

  getConversionFunnelAnalysis() {
    const funnels = Array.from(this.funnels.values());
    const last24Hours = new Date(Date.now() - 86400000);
    
    const recentFunnels = funnels.filter(f => f.startTime >= last24Hours);
    
    return {
      totalFunnels: recentFunnels.length,
      completedFunnels: recentFunnels.filter(f => f.completed).length,
      conversionRate: recentFunnels.length > 0 ? 
        (recentFunnels.filter(f => f.completed).length / recentFunnels.length) * 100 : 0,
      averageTimeToConversion: this.calculateAverageConversionTime(recentFunnels.filter(f => f.completed)),
      dropoffAnalysis: this.calculateFunnelMetrics(last24Hours, new Date())
    };
  }

  private calculateAverageConversionTime(completedFunnels: ConversionFunnel[]): number {
    if (completedFunnels.length === 0) return 0;
    
    const totalTime = completedFunnels.reduce((sum, funnel) => {
      return sum + (funnel.lastActivity.getTime() - funnel.startTime.getTime());
    }, 0);
    
    return totalTime / completedFunnels.length / 1000 / 60; // Convert to minutes
  }

  // Cleanup
  destroy(): void {
    if (this.aggregationInterval) {
      clearInterval(this.aggregationInterval);
    }
    console.log('📊 Business Metrics Service destroyed');
  }
}

// Global business metrics instance
export const businessMetricsService = new BusinessMetricsService();

// Export types for use in other modules
export type {
  BusinessEvent,
  ConversionFunnel,
  ConversionStage,
  MetricsSummary,
  BusinessHealthScore,
  BusinessMetricThresholds
};

export default businessMetricsService;