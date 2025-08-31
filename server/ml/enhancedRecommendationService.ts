import { db } from "../db";
import { 
  userPreferences, 
  userInteractions, 
  tripFeatures, 
  trips, 
  ratings, 
  users,
  userPersonalization,
  kpiEvents
} from "@shared/schema";
import { eq, desc, and, or, sql, asc, inArray, ne, not } from "drizzle-orm";
import type { 
  Trip, 
  User, 
  UserPreferences, 
  UserInteraction, 
  TripFeatures,
  UserPersonalization,
  KpiEvent 
} from "@shared/schema";

interface UserProfile {
  userId: string;
  preferences: UserPreferences | null;
  interactions: UserInteraction[];
  ratings: number;
  averageRating: number;
  personalization: UserPersonalization | null;
  isNewUser: boolean;
}

interface TripRecommendation {
  trip: Trip & { organizer: User };
  score: number;
  reasons: string[];
  features: TripFeatures | null;
  seasonalityScore: number;
  safetyScore: number;
  noveltyScore: number;
  diversityScore: number;
}

interface RecommendationWeights {
  preferences: number;
  behavior: number;
  collaborative: number;
  popularity: number;
  freshness: number;
  seasonality: number;
  safety: number;
  novelty: number;
  regionalBalance: number;
}

interface RecommendationFilters {
  region?: string;
  minPrice?: number;
  maxPrice?: number;
  date?: Date;
  abTestGroup?: 'baseline' | 'personalized';
}

export class EnhancedRecommendationService {
  private weights: RecommendationWeights = {
    preferences: 0.25,
    behavior: 0.2,
    collaborative: 0.15,
    popularity: 0.1,
    freshness: 0.1,
    seasonality: 0.08,
    safety: 0.07,
    novelty: 0.03,
    regionalBalance: 0.02,
  };

  private readonly SRI_LANKAN_REGIONS = [
    "Western Province", "Central Province", "Southern Province",
    "Northern Province", "Eastern Province", "North Western Province",
    "North Central Province", "Uva Province", "Sabaragamuwa Province"
  ];

  // Main recommendation entry point with all enhancements
  async getPersonalizedRecommendations(
    userId: string,
    limit: number = 10,
    filters?: RecommendationFilters
  ): Promise<TripRecommendation[]> {
    // Check user personalization settings
    const userProfile = await this.buildUserProfile(userId);
    
    // Handle A/B testing
    const abTestGroup = filters?.abTestGroup || userProfile.personalization?.abTestGroup || 'personalized';
    
    if (abTestGroup === 'baseline' || userProfile.personalization?.isPaused) {
      return this.getBaselineRecommendations(userId, limit, filters);
    }

    // Cold start handling for new users
    if (userProfile.isNewUser) {
      return this.getColdStartRecommendations(userId, limit, filters);
    }

    // Get candidate trips with enhanced filtering
    const candidateTrips = await this.getCandidateTrips(userId, filters);
    
    // Apply negative feedback filtering
    const filteredTrips = await this.applyNegativeFeedbackFilter(userId, candidateTrips);
    
    // Score each trip with all enhancement factors
    const scoredTrips = await Promise.all(
      filteredTrips.map(trip => this.scoreTrip(trip, userProfile, filters))
    );

    // Apply diversity and novelty constraints
    const diversifiedRecommendations = this.applyDiversityConstraints(scoredTrips, limit);
    const finalRecommendations = this.applyNoveltyBoost(userId, diversifiedRecommendations);
    
    // Ensure regional balance
    const balancedRecommendations = this.ensureRegionalBalance(finalRecommendations, limit);

    // Track KPI for top-5 CTR
    if (balancedRecommendations.length >= 5) {
      await this.trackKpiEvent({
        userId,
        eventType: 'ctr_top5',
        eventData: { 
          tripIds: balancedRecommendations.slice(0, 5).map(r => r.trip.id),
          abTestGroup 
        }
      });
    }

    return balancedRecommendations.slice(0, limit);
  }

  // Baseline recommendations for A/B testing
  private async getBaselineRecommendations(
    userId: string,
    limit: number,
    filters?: RecommendationFilters
  ): Promise<TripRecommendation[]> {
    const candidateTrips = await this.getCandidateTrips(userId, filters);
    
    // Simple popularity-based ranking for baseline
    const scoredTrips = candidateTrips.map(trip => ({
      trip,
      score: (trip.viewCount || 0) * 0.6 + (trip.bookingCount || 0) * 0.4,
      reasons: ['Popular destination'],
      features: null,
      seasonalityScore: 1,
      safetyScore: 1,
      noveltyScore: 1,
      diversityScore: 1,
    }));

    return scoredTrips
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // Cold start recommendations for new users
  private async getColdStartRecommendations(
    userId: string,
    limit: number,
    filters?: RecommendationFilters
  ): Promise<TripRecommendation[]> {
    const candidateTrips = await this.getCandidateTrips(userId, filters);
    
    // Mix of popularity, freshness, and regional diversity
    const scoredTrips = candidateTrips.map(trip => {
      const popularityScore = ((trip.viewCount || 0) + (trip.bookingCount || 0) * 2) / 100;
      const freshnessScore = this.calculateFreshnessScore(trip);
      const regionalDiversityScore = this.calculateRegionalDiversityScore(trip);
      
      const totalScore = popularityScore * 0.5 + freshnessScore * 0.3 + regionalDiversityScore * 0.2;
      
      return {
        trip,
        score: totalScore,
        reasons: ['Popular with travelers', 'Great for first-time visitors'],
        features: null,
        seasonalityScore: 1,
        safetyScore: 1,
        noveltyScore: 1,
        diversityScore: regionalDiversityScore,
      };
    });

    // Ensure good regional representation
    const diversified = this.ensureRegionalBalance(scoredTrips, limit * 2);
    
    return diversified.slice(0, limit);
  }

  // Enhanced trip scoring with all factors
  private async scoreTrip(
    trip: Trip & { organizer: User }, 
    userProfile: UserProfile,
    filters?: RecommendationFilters
  ): Promise<TripRecommendation> {
    const reasons: string[] = [];
    let totalScore = 0;

    // Get trip features
    const [features] = await db
      .select()
      .from(tripFeatures)
      .where(eq(tripFeatures.tripId, trip.id));

    // 1. Preference-based scoring
    const preferencesScore = this.calculatePreferencesScore(trip, userProfile.preferences);
    totalScore += preferencesScore * this.weights.preferences;
    if (preferencesScore > 0.7) reasons.push('Matches your interests');

    // 2. Behavior-based scoring
    const behaviorScore = this.calculateBehaviorScore(trip, userProfile.interactions);
    totalScore += behaviorScore * this.weights.behavior;
    if (behaviorScore > 0.6) reasons.push('Similar to trips you enjoyed');

    // 3. Collaborative filtering
    const collaborativeScore = await this.calculateCollaborativeScore(trip, userProfile.userId);
    totalScore += collaborativeScore * this.weights.collaborative;
    if (collaborativeScore > 0.5) reasons.push('Popular with similar travelers');

    // 4. Popularity score
    const popularityScore = this.calculatePopularityScore(trip, features);
    totalScore += popularityScore * this.weights.popularity;

    // 5. Freshness score (new listing boost)
    const freshnessScore = this.calculateFreshnessScore(trip);
    totalScore += freshnessScore * this.weights.freshness;
    if (freshnessScore > 0.8) reasons.push('New listing');

    // 6. Seasonality score
    const seasonalityScore = this.calculateSeasonalityScore(trip, new Date());
    totalScore += seasonalityScore * this.weights.seasonality;
    if (seasonalityScore > 0.8) reasons.push('Perfect season to visit');
    else if (seasonalityScore < 0.3) reasons.push('Off-season pricing');

    // 7. Safety score
    const safetyScore = this.calculateSafetyScore(trip, new Date());
    totalScore += safetyScore * this.weights.safety;
    if (safetyScore < 0.5) reasons.push('Check weather conditions');

    // 8. Novelty score
    const noveltyScore = this.calculateNoveltyScore(trip, userProfile.interactions);
    totalScore += noveltyScore * this.weights.novelty;

    // 9. Regional balance
    const regionalBalanceScore = this.calculateRegionalDiversityScore(trip);
    totalScore += regionalBalanceScore * this.weights.regionalBalance;

    return {
      trip,
      score: Math.min(totalScore, 1.0), // Normalize to 0-1
      reasons: reasons.length > 0 ? reasons : ['Recommended for you'],
      features,
      seasonalityScore,
      safetyScore,
      noveltyScore,
      diversityScore: regionalBalanceScore,
    };
  }

  // Seasonality scoring based on current date
  private calculateSeasonalityScore(trip: Trip, currentDate: Date): number {
    if (!trip.seasonality || trip.seasonality.length === 0) return 0.5; // Neutral if no data

    const currentMonth = currentDate.getMonth() + 1; // 1-12
    
    // Sri Lankan seasons:
    // Dry season: December-March (12, 1, 2, 3)
    // Wet season: April-November (4, 5, 6, 7, 8, 9, 10, 11)
    const isDrySeason = currentMonth <= 3 || currentMonth === 12;
    const isWetSeason = !isDrySeason;

    if (trip.seasonality.includes('year_round')) return 0.9;
    if (trip.seasonality.includes('dry_season') && isDrySeason) return 1.0;
    if (trip.seasonality.includes('wet_season') && isWetSeason) return 1.0;
    if (trip.seasonality.includes('dry_season') && isWetSeason) return 0.3;
    if (trip.seasonality.includes('wet_season') && isDrySeason) return 0.3;

    return 0.5;
  }

  // Safety scoring based on current conditions
  private calculateSafetyScore(trip: Trip, currentDate: Date): number {
    if (!trip.safetyFlags || trip.safetyFlags.length === 0) return 1.0; // Safe if no flags

    let safetyScore = 1.0;
    const currentMonth = currentDate.getMonth() + 1;
    
    // Penalize weather-dependent activities during monsoon (May-September)
    if (trip.safetyFlags.includes('weather_dependent') && currentMonth >= 5 && currentMonth <= 9) {
      safetyScore *= 0.4;
    }
    
    // Road conditions warning during heavy rain periods
    if (trip.safetyFlags.includes('road_conditions') && currentMonth >= 5 && currentMonth <= 9) {
      safetyScore *= 0.6;
    }
    
    // Equipment required reduces accessibility
    if (trip.safetyFlags.includes('equipment_required')) {
      safetyScore *= 0.8;
    }

    return Math.max(safetyScore, 0.1); // Minimum score
  }

  // Novelty scoring to avoid showing same trips repeatedly
  private calculateNoveltyScore(trip: Trip, userInteractions: UserInteraction[]): number {
    const recentViews = userInteractions.filter(
      interaction => 
        interaction.tripId === trip.id && 
        interaction.interactionType === 'view' &&
        new Date(interaction.createdAt).getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000) // Last 7 days
    );

    if (recentViews.length === 0) return 1.0;
    if (recentViews.length === 1) return 0.7;
    if (recentViews.length === 2) return 0.4;
    return 0.1; // Heavy penalty for repeatedly viewed trips
  }

  // Regional diversity scoring
  private calculateRegionalDiversityScore(trip: Trip): number {
    // Boost underrepresented regions
    const regionalPopularity = {
      'Western Province': 0.3, // Very popular (Colombo)
      'Southern Province': 0.6, // Popular beaches
      'Central Province': 0.8, // Hill country - boost
      'Northern Province': 1.0, // Underrepresented - max boost
      'Eastern Province': 0.9, // Underrepresented
      'North Western Province': 0.7,
      'North Central Province': 0.8,
      'Uva Province': 0.9,
      'Sabaragamuwa Province': 0.8,
    };

    return regionalPopularity[trip.region] || 0.5;
  }

  // Apply diversity constraints to prevent too many similar trips
  private applyDiversityConstraints(
    scoredTrips: TripRecommendation[], 
    limit: number
  ): TripRecommendation[] {
    const diversified: TripRecommendation[] = [];
    const regionCounts: Record<string, number> = {};
    const tagCounts: Record<string, number> = {};
    
    const maxPerRegion = Math.max(2, Math.ceil(limit / 3)); // At most 1/3 from same region
    const maxPerTag = Math.max(2, Math.ceil(limit / 4)); // At most 1/4 with same primary tag

    const sortedTrips = scoredTrips.sort((a, b) => b.score - a.score);

    for (const recommendation of sortedTrips) {
      const trip = recommendation.trip;
      const region = trip.region;
      const primaryTag = trip.tags?.[0];

      // Check region diversity
      if ((regionCounts[region] || 0) >= maxPerRegion) continue;
      
      // Check tag diversity
      if (primaryTag && (tagCounts[primaryTag] || 0) >= maxPerTag) continue;

      diversified.push(recommendation);
      regionCounts[region] = (regionCounts[region] || 0) + 1;
      if (primaryTag) {
        tagCounts[primaryTag] = (tagCounts[primaryTag] || 0) + 1;
      }

      if (diversified.length >= limit * 1.5) break; // Get enough for further filtering
    }

    return diversified;
  }

  // Apply novelty boost and penalize recently ignored items
  private applyNoveltyBoost(
    userId: string, 
    recommendations: TripRecommendation[]
  ): TripRecommendation[] {
    return recommendations.map(rec => ({
      ...rec,
      score: rec.score * rec.noveltyScore,
      reasons: rec.noveltyScore < 0.5 
        ? [...rec.reasons, 'Seen recently'] 
        : rec.reasons
    }));
  }

  // Ensure regional balance for fair exposure
  private ensureRegionalBalance(
    recommendations: TripRecommendation[], 
    limit: number
  ): TripRecommendation[] {
    const regionGroups: Record<string, TripRecommendation[]> = {};
    
    // Group by region
    recommendations.forEach(rec => {
      const region = rec.trip.region;
      if (!regionGroups[region]) regionGroups[region] = [];
      regionGroups[region].push(rec);
    });

    // Sort each region group by score
    Object.keys(regionGroups).forEach(region => {
      regionGroups[region].sort((a, b) => b.score - a.score);
    });

    const balanced: TripRecommendation[] = [];
    const regions = Object.keys(regionGroups);
    let regionIndex = 0;

    // Round-robin through regions
    while (balanced.length < limit && regions.length > 0) {
      const currentRegion = regions[regionIndex];
      const regionRecs = regionGroups[currentRegion];
      
      if (regionRecs.length > 0) {
        balanced.push(regionRecs.shift()!);
      }
      
      if (regionRecs.length === 0) {
        regions.splice(regionIndex, 1);
        if (regionIndex >= regions.length) regionIndex = 0;
      } else {
        regionIndex = (regionIndex + 1) % regions.length;
      }
    }

    return balanced;
  }

  // Filter out trips user marked as "not interested"
  private async applyNegativeFeedbackFilter(
    userId: string, 
    candidateTrips: (Trip & { organizer: User })[]
  ): Promise<(Trip & { organizer: User })[]> {
    const notInterestedTrips = await db
      .select({ tripId: userInteractions.tripId })
      .from(userInteractions)
      .where(and(
        eq(userInteractions.userId, userId),
        eq(userInteractions.interactionType, 'not_interested')
      ));

    const notInterestedIds = new Set(notInterestedTrips.map(t => t.tripId));
    
    return candidateTrips.filter(trip => !notInterestedIds.has(trip.id));
  }

  // Calculate preferences score
  private calculatePreferencesScore(trip: Trip, preferences: UserPreferences | null): number {
    if (!preferences) return 0.3; // Neutral score for no preferences

    let score = 0;
    let factors = 0;

    // Region preferences
    if (preferences.preferredRegions && preferences.preferredRegions.length > 0) {
      score += preferences.preferredRegions.includes(trip.region) ? 1 : 0;
      factors++;
    }

    // Budget preferences  
    if (preferences.budgetRange) {
      const tripPrice = parseFloat(trip.price.toString());
      if (tripPrice >= preferences.budgetRange.min && tripPrice <= preferences.budgetRange.max) {
        score += 1;
      } else if (tripPrice < preferences.budgetRange.min) {
        score += 0.8; // Cheaper is still good
      } else {
        score += 0.2; // Too expensive
      }
      factors++;
    }

    // Trip type preferences
    if (preferences.tripTypes && preferences.tripTypes.length > 0 && trip.tags) {
      const matchingTags = trip.tags.filter(tag => preferences.tripTypes!.includes(tag));
      score += matchingTags.length > 0 ? 1 : 0.2;
      factors++;
    }

    return factors > 0 ? score / factors : 0.3;
  }

  // Calculate behavior score based on past interactions
  private calculateBehaviorScore(trip: Trip, interactions: UserInteraction[]): number {
    if (interactions.length === 0) return 0.3;

    const tripInteractions = interactions.filter(i => i.tripId === trip.id);
    const positiveInteractions = tripInteractions.filter(i => 
      ['click', 'bookmark', 'share', 'join_request'].includes(i.interactionType)
    );

    if (positiveInteractions.length > 0) return 0.9;

    // Look for similar trips based on tags
    const userTagPreferences: Record<string, number> = {};
    interactions.forEach(interaction => {
      // This would need trip data - simplified for now
      if (['click', 'bookmark', 'join_request'].includes(interaction.interactionType)) {
        // Add logic to track preferred tags from user's positive interactions
      }
    });

    return 0.3; // Neutral if no clear behavior pattern
  }

  // Calculate collaborative filtering score
  private async calculateCollaborativeScore(trip: Trip, userId: string): Promise<number> {
    // Find similar users who liked this trip
    const tripInteractions = await db
      .select({ userId: userInteractions.userId })
      .from(userInteractions)
      .where(and(
        eq(userInteractions.tripId, trip.id),
        ne(userInteractions.userId, userId),
        inArray(userInteractions.interactionType, ['click', 'bookmark', 'join_request'])
      ));

    if (tripInteractions.length === 0) return 0.3;

    // This is simplified - in a full implementation, we'd calculate user similarity
    return Math.min(tripInteractions.length / 10, 0.9);
  }

  // Calculate popularity score
  private calculatePopularityScore(trip: Trip, features: TripFeatures | null): number {
    const viewCount = trip.viewCount || features?.viewCount || 0;
    const bookingCount = trip.bookingCount || features?.totalBookings || 0;
    
    // Normalize popularity (assumes max ~100 views, ~20 bookings for popular trips)
    const normalizedViews = Math.min(viewCount / 100, 1);
    const normalizedBookings = Math.min(bookingCount / 20, 1);
    
    return normalizedViews * 0.4 + normalizedBookings * 0.6;
  }

  // Calculate freshness score with decay
  private calculateFreshnessScore(trip: Trip): number {
    const createdAt = new Date(trip.createdAt);
    const daysSinceCreated = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    
    // Fresh boost decays over 30 days
    const freshDecay = Math.max(0, 1 - daysSinceCreated / 30);
    const boostMultiplier = parseFloat(trip.freshBoost?.toString() || '1.0');
    
    return freshDecay * boostMultiplier;
  }

  // Get candidate trips with enhanced filtering
  private async getCandidateTrips(
    userId: string, 
    filters?: RecommendationFilters
  ): Promise<(Trip & { organizer: User })[]> {
    let query = db
      .select({
        id: trips.id,
        title: trips.title,
        fromLocation: trips.fromLocation,
        toLocation: trips.toLocation,
        date: trips.date,
        time: trips.time,
        seatsAvailable: trips.seatsAvailable,
        price: trips.price,
        region: trips.region,
        contactInfo: trips.contactInfo,
        notes: trips.notes,
        organizerId: trips.organizerId,
        status: trips.status,
        tags: trips.tags,
        priceMin: trips.priceMin,
        priceMax: trips.priceMax,
        duration: trips.duration,
        difficulty: trips.difficulty,
        buddyFriendly: trips.buddyFriendly,
        seasonality: trips.seasonality,
        safetyFlags: trips.safetyFlags,
        viewCount: trips.viewCount,
        bookingCount: trips.bookingCount,
        freshBoost: trips.freshBoost,
        createdAt: trips.createdAt,
        updatedAt: trips.updatedAt,
        organizer: {
          id: users.id,
          email: users.email,
          name: users.name,
          image: users.image,
          provider: users.provider,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
          profileImageUrl: users.profileImageUrl,
          phoneNumber: users.phoneNumber,
          bio: users.bio,
          googleId: users.googleId,
          microsoftId: users.microsoftId,
          appleId: users.appleId,
          emailVerified: users.emailVerified,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        }
      })
      .from(trips)
      .innerJoin(users, eq(trips.organizerId, users.id))
      .where(and(
        eq(trips.status, 'active'),
        ne(trips.organizerId, userId), // Don't recommend user's own trips
        sql`${trips.date} >= CURRENT_DATE` // Only future trips
      ));

    // Apply filters
    const conditions = [];
    if (filters?.region) {
      conditions.push(eq(trips.region, filters.region));
    }
    if (filters?.minPrice) {
      conditions.push(sql`${trips.price} >= ${filters.minPrice}`);
    }
    if (filters?.maxPrice) {
      conditions.push(sql`${trips.price} <= ${filters.maxPrice}`);
    }
    if (filters?.date) {
      conditions.push(sql`DATE(${trips.date}) = DATE(${filters.date.toISOString()})`);
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.limit(100); // Get more candidates for better filtering
  }

  // Build comprehensive user profile
  private async buildUserProfile(userId: string): Promise<UserProfile> {
    // Get user preferences
    const [preferences] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));

    // Get user interactions (last 90 days)
    const interactions = await db
      .select()
      .from(userInteractions)
      .where(and(
        eq(userInteractions.userId, userId),
        sql`${userInteractions.createdAt} > NOW() - INTERVAL '90 days'`
      ))
      .orderBy(desc(userInteractions.createdAt));

    // Get personalization settings
    const [personalization] = await db
      .select()
      .from(userPersonalization)
      .where(eq(userPersonalization.userId, userId));

    // Calculate if user is new (less than 5 interactions)
    const isNewUser = interactions.length < 5;

    return {
      userId,
      preferences: preferences || null,
      interactions,
      ratings: 0, // Simplified
      averageRating: 0, // Simplified  
      personalization: personalization || null,
      isNewUser,
    };
  }

  // Track user interaction with enhanced data
  async trackUserInteraction(
    userId: string, 
    tripId: string, 
    interactionType: 'view' | 'click' | 'bookmark' | 'share' | 'join_request' | 'not_interested',
    duration?: number,
    sessionId?: string,
    abTestGroup?: string
  ): Promise<void> {
    await db.insert(userInteractions).values({
      userId,
      tripId,
      interactionType,
      duration,
      sessionId,
      abTestGroup,
    });

    // Update trip view/booking counts
    if (interactionType === 'view') {
      await db
        .update(trips)
        .set({ viewCount: sql`${trips.viewCount} + 1` })
        .where(eq(trips.id, tripId));
    } else if (interactionType === 'join_request') {
      await db
        .update(trips)
        .set({ bookingCount: sql`${trips.bookingCount} + 1` })
        .where(eq(trips.id, tripId));
    }

    // Update trip features for ML
    await this.updateTripFeatures(tripId);
  }

  // Update trip features based on interactions
  private async updateTripFeatures(tripId: string): Promise<void> {
    const trip = await db
      .select()
      .from(trips)
      .where(eq(trips.id, tripId))
      .limit(1);

    if (trip.length === 0) return;

    const tripData = trip[0];
    
    // Calculate popularity score
    const viewCount = tripData.viewCount || 0;
    const bookingCount = tripData.bookingCount || 0;
    const popularityScore = (viewCount * 0.3 + bookingCount * 0.7) / 10;

    // Upsert trip features
    await db.insert(tripFeatures).values({
      tripId,
      viewCount,
      totalBookings: bookingCount,
      popularityScore: popularityScore.toString(),
      tags: tripData.tags || [],
      difficulty: tripData.difficulty,
      season: this.getCurrentSeason(),
    }).onConflictDoUpdate({
      target: tripFeatures.tripId,
      set: {
        viewCount,
        totalBookings: bookingCount,
        popularityScore: popularityScore.toString(),
        updatedAt: sql`NOW()`,
      },
    });
  }

  // Track KPI events for metrics
  async trackKpiEvent(event: {
    userId?: string;
    sessionId?: string;
    eventType: string;
    tripId?: string;
    abTestGroup?: string;
    eventData?: any;
  }): Promise<void> {
    await db.insert(kpiEvents).values({
      userId: event.userId,
      sessionId: event.sessionId,
      eventType: event.eventType,
      tripId: event.tripId,
      abTestGroup: event.abTestGroup,
      eventData: event.eventData,
    });
  }

  // Reset user recommendations
  async resetUserRecommendations(userId: string): Promise<void> {
    // Update personalization settings
    await db.insert(userPersonalization).values({
      userId,
      resetAt: sql`NOW()`,
      isPaused: false,
    }).onConflictDoUpdate({
      target: userPersonalization.userId,
      set: {
        resetAt: sql`NOW()`,
        updatedAt: sql`NOW()`,
      },
    });
  }

  // Pause/unpause personalization
  async togglePersonalization(userId: string, isPaused: boolean): Promise<void> {
    await db.insert(userPersonalization).values({
      userId,
      isPaused,
    }).onConflictDoUpdate({
      target: userPersonalization.userId,
      set: {
        isPaused,
        updatedAt: sql`NOW()`,
      },
    });
  }

  // Get current season for Sri Lanka
  private getCurrentSeason(): string {
    const month = new Date().getMonth() + 1;
    return (month <= 3 || month === 12) ? 'dry_season' : 'wet_season';
  }
}

// Export singleton instance
export const enhancedRecommendationService = new EnhancedRecommendationService();