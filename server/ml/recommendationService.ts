import { db } from "../db";
import { userPreferences, userInteractions, tripFeatures, trips, ratings, users } from "@shared/schema";
import { eq, desc, and, or, sql, asc, inArray } from "drizzle-orm";
import type { Trip, User, UserPreferences, UserInteraction, TripFeatures } from "@shared/schema";

interface UserProfile {
  userId: string;
  preferences: UserPreferences | null;
  interactions: UserInteraction[];
  ratings: number;
  averageRating: number;
}

interface TripRecommendation {
  trip: Trip & { organizer: User };
  score: number;
  reasons: string[];
  features: TripFeatures | null;
}

interface RecommendationWeights {
  preferences: number;
  behavior: number;
  collaborative: number;
  popularity: number;
  freshness: number;
}

export class RecommendationService {
  private weights: RecommendationWeights = {
    preferences: 0.3,
    behavior: 0.25,
    collaborative: 0.2,
    popularity: 0.15,
    freshness: 0.1,
  };

  // Get personalized trip recommendations for a user
  async getPersonalizedRecommendations(
    userId: string,
    limit: number = 10,
    filters?: {
      region?: string;
      minPrice?: number;
      maxPrice?: number;
      date?: Date;
    }
  ): Promise<TripRecommendation[]> {
    // Build user profile
    const userProfile = await this.buildUserProfile(userId);
    
    // Get candidate trips
    const candidateTrips = await this.getCandidateTrips(userId, filters);
    
    // Score each trip
    const scoredTrips = await Promise.all(
      candidateTrips.map(trip => this.scoreTrip(trip, userProfile))
    );

    // Sort by score and return top recommendations
    return scoredTrips
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // Get similar users based on preferences and behavior
  async findSimilarUsers(userId: string, limit: number = 20): Promise<string[]> {
    const userProfile = await this.buildUserProfile(userId);
    if (!userProfile.preferences) {
      return [];
    }

    // Find users with similar preferences
    const similarUsers = await db
      .select({
        userId: userPreferences.userId,
        preferences: userPreferences,
      })
      .from(userPreferences)
      .where(and(
        sql`${userPreferences.userId} != ${userId}`,
        sql`${userPreferences.preferredRegions} && ${JSON.stringify(userProfile.preferences.preferredRegions)}`
      ))
      .limit(limit);

    // Calculate similarity scores
    const userSimilarities = similarUsers.map(user => ({
      userId: user.userId,
      similarity: this.calculateUserSimilarity(userProfile.preferences!, user.preferences)
    }));

    return userSimilarities
      .sort((a, b) => b.similarity - a.similarity)
      .map(u => u.userId);
  }

  // Build comprehensive user profile for recommendations
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

    // Get user ratings given and received
    const ratingsGiven = await db
      .select({ rating: ratings.rating })
      .from(ratings)
      .where(eq(ratings.raterId, userId));

    const ratingsReceived = await db
      .select({ rating: ratings.rating })
      .from(ratings)
      .where(eq(ratings.ratedId, userId));

    const avgRatingGiven = ratingsGiven.length > 0 
      ? ratingsGiven.reduce((sum, r) => sum + r.rating, 0) / ratingsGiven.length 
      : 3;

    const avgRatingReceived = ratingsReceived.length > 0 
      ? ratingsReceived.reduce((sum, r) => sum + r.rating, 0) / ratingsReceived.length 
      : 3;

    return {
      userId,
      preferences: preferences || null,
      interactions,
      ratings: ratingsGiven.length,
      averageRating: (avgRatingGiven + avgRatingReceived) / 2,
    };
  }

  // Get candidate trips for scoring (exclude user's own trips and already joined)
  private async getCandidateTrips(
    userId: string,
    filters?: {
      region?: string;
      minPrice?: number;
      maxPrice?: number;
      date?: Date;
    }
  ): Promise<Array<Trip & { organizer: User }>> {
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
        createdAt: trips.createdAt,
        updatedAt: trips.updatedAt,
        organizer: users,
      })
      .from(trips)
      .innerJoin(users, eq(trips.organizerId, users.id))
      .where(and(
        sql`${trips.organizerId} != ${userId}`,
        eq(trips.status, "active"),
        sql`${trips.date} > NOW()`
      ));

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
      query = query.where(and(...conditions)) as any;
    }

    return await query.orderBy(desc(trips.createdAt)).limit(100);
  }

  // Score a trip for a user based on multiple factors
  private async scoreTrip(
    trip: Trip & { organizer: User },
    userProfile: UserProfile
  ): Promise<TripRecommendation> {
    let totalScore = 0;
    const reasons: string[] = [];

    // Get trip features
    const [features] = await db
      .select()
      .from(tripFeatures)
      .where(eq(tripFeatures.tripId, trip.id));

    // 1. Preference-based scoring
    const prefScore = this.calculatePreferenceScore(trip, userProfile.preferences, features);
    totalScore += prefScore * this.weights.preferences;
    if (prefScore > 0.6) {
      reasons.push("Matches your travel preferences");
    }

    // 2. Behavioral scoring
    const behaviorScore = this.calculateBehaviorScore(trip, userProfile.interactions);
    totalScore += behaviorScore * this.weights.behavior;
    if (behaviorScore > 0.5) {
      reasons.push("Similar to trips you've viewed before");
    }

    // 3. Collaborative filtering
    const collabScore = await this.calculateCollaborativeScore(trip, userProfile.userId);
    totalScore += collabScore * this.weights.collaborative;
    if (collabScore > 0.4) {
      reasons.push("Popular with similar travelers");
    }

    // 4. Popularity scoring
    const popularityScore = this.calculatePopularityScore(features);
    totalScore += popularityScore * this.weights.popularity;
    if (popularityScore > 0.7) {
      reasons.push("Highly rated and popular");
    }

    // 5. Freshness scoring (boost newer trips)
    const freshnessScore = this.calculateFreshnessScore(trip);
    totalScore += freshnessScore * this.weights.freshness;
    if (freshnessScore > 0.8) {
      reasons.push("Recently posted");
    }

    return {
      trip,
      score: Math.min(Math.max(totalScore, 0), 1), // Clamp between 0-1
      reasons,
      features: features || null,
    };
  }

  // Calculate score based on user preferences
  private calculatePreferenceScore(
    trip: Trip,
    preferences: UserPreferences | null,
    features: TripFeatures | null
  ): number {
    if (!preferences) return 0.5; // Default neutral score

    let score = 0;
    let factors = 0;

    // Region preference
    if (preferences.preferredRegions && preferences.preferredRegions.length > 0) {
      if (preferences.preferredRegions.includes(trip.region)) {
        score += 1;
      }
      factors += 1;
    }

    // Budget preference
    if (preferences.budgetRange) {
      const price = parseFloat(trip.price.toString());
      if (price >= preferences.budgetRange.min && price <= preferences.budgetRange.max) {
        score += 1;
      } else {
        const range = preferences.budgetRange.max - preferences.budgetRange.min;
        const distance = Math.min(
          Math.abs(price - preferences.budgetRange.min),
          Math.abs(price - preferences.budgetRange.max)
        );
        score += Math.max(0, 1 - (distance / range));
      }
      factors += 1;
    }

    // Trip type preference
    if (preferences.tripTypes && preferences.tripTypes.length > 0 && features?.tags && features.tags.length > 0) {
      const matchingTags = preferences.tripTypes.filter(type => 
        features.tags!.includes(type)
      );
      score += matchingTags.length / preferences.tripTypes.length;
      factors += 1;
    }

    // Travel style preference
    if (preferences.travelStyle && features?.difficulty) {
      const styleMatch = this.matchTravelStyle(preferences.travelStyle, features.difficulty);
      score += styleMatch;
      factors += 1;
    }

    return factors > 0 ? score / factors : 0.5;
  }

  // Calculate score based on user behavior patterns
  private calculateBehaviorScore(trip: Trip, interactions: UserInteraction[]): number {
    if (interactions.length === 0) return 0.5;

    let score = 0;
    let relevantInteractions = 0;

    // Analyze past interaction patterns
    for (const interaction of interactions) {
      if (interaction.interactionType === 'view' || interaction.interactionType === 'click') {
        // Check if this trip is similar to previously viewed trips
        if (this.areTripsSimilar(trip, interaction.tripId)) {
          score += interaction.interactionType === 'view' ? 0.3 : 0.5;
          relevantInteractions++;
        }
      } else if (interaction.interactionType === 'bookmark') {
        if (this.areTripsSimilar(trip, interaction.tripId)) {
          score += 0.8;
          relevantInteractions++;
        }
      }
    }

    // Bonus for users with high engagement
    const engagementBonus = Math.min(interactions.length / 20, 0.2);
    
    return relevantInteractions > 0 
      ? Math.min((score / relevantInteractions) + engagementBonus, 1)
      : 0.5;
  }

  // Calculate collaborative filtering score
  private async calculateCollaborativeScore(trip: Trip, userId: string): Promise<number> {
    // Find similar users
    const similarUsers = await this.findSimilarUsers(userId, 10);
    
    if (similarUsers.length === 0) return 0.5;

    // Check how many similar users interacted with this trip
    const interactions = await db
      .select()
      .from(userInteractions)
      .where(and(
        inArray(userInteractions.userId, similarUsers),
        eq(userInteractions.tripId, trip.id),
        inArray(userInteractions.interactionType, ['view', 'bookmark'])
      ));

    const positiveInteractions = interactions.filter(i => 
      i.interactionType === 'bookmark'
    ).length;

    const totalInteractions = interactions.length;
    
    if (totalInteractions === 0) return 0.3;

    // Score based on interaction quality and frequency
    const qualityScore = positiveInteractions / totalInteractions;
    const frequencyScore = Math.min(totalInteractions / similarUsers.length, 1);
    
    return (qualityScore * 0.7) + (frequencyScore * 0.3);
  }

  // Calculate popularity score based on trip features
  private calculatePopularityScore(features: TripFeatures | null): number {
    if (!features) return 0.5;

    let score = 0;
    let factors = 0;

    // View count popularity
    if (features.viewCount !== null) {
      score += Math.min(features.viewCount / 100, 1); // Normalize to 0-1
      factors += 1;
    }

    // Rating score
    if (features.avgRating !== null) {
      score += (parseFloat(features.avgRating.toString()) - 1) / 4; // Convert 1-5 to 0-1
      factors += 1;
    }

    // Booking popularity
    if (features.totalBookings !== null) {
      score += Math.min(features.totalBookings / 20, 1);
      factors += 1;
    }

    // Overall popularity score
    if (features.popularityScore !== null) {
      score += parseFloat(features.popularityScore.toString()) / 100;
      factors += 1;
    }

    return factors > 0 ? score / factors : 0.5;
  }

  // Calculate freshness score (newer trips get higher scores)
  private calculateFreshnessScore(trip: Trip): number {
    const now = new Date();
    const tripDate = trip.createdAt ? new Date(trip.createdAt) : new Date();
    const daysDiff = (now.getTime() - tripDate.getTime()) / (1000 * 60 * 60 * 24);
    
    // Fresh trips (0-7 days) get full score, older trips get lower scores
    if (daysDiff <= 7) return 1;
    if (daysDiff <= 30) return 0.8;
    if (daysDiff <= 90) return 0.5;
    return 0.3;
  }

  // Calculate similarity between users based on preferences
  private calculateUserSimilarity(prefs1: UserPreferences, prefs2: UserPreferences): number {
    let similarity = 0;
    let factors = 0;

    // Region similarity
    if (prefs1.preferredRegions && prefs2.preferredRegions) {
      const commonRegions = prefs1.preferredRegions.filter(r => 
        prefs2.preferredRegions!.includes(r)
      );
      similarity += commonRegions.length / Math.max(prefs1.preferredRegions.length, prefs2.preferredRegions.length);
      factors += 1;
    }

    // Trip type similarity
    if (prefs1.tripTypes && prefs2.tripTypes) {
      const commonTypes = prefs1.tripTypes.filter(t => 
        prefs2.tripTypes!.includes(t)
      );
      similarity += commonTypes.length / Math.max(prefs1.tripTypes.length, prefs2.tripTypes.length);
      factors += 1;
    }

    // Travel style similarity
    if (prefs1.travelStyle && prefs2.travelStyle) {
      similarity += prefs1.travelStyle === prefs2.travelStyle ? 1 : 0;
      factors += 1;
    }

    // Group size similarity
    if (prefs1.groupSize && prefs2.groupSize) {
      similarity += prefs1.groupSize === prefs2.groupSize ? 1 : 0;
      factors += 1;
    }

    return factors > 0 ? similarity / factors : 0;
  }

  // Helper function to match travel style with difficulty
  private matchTravelStyle(style: string, difficulty: string): number {
    const matches: Record<string, string[]> = {
      budget: ['easy'],
      comfort: ['easy', 'moderate'],
      luxury: ['moderate', 'challenging'],
    };

    return matches[style]?.includes(difficulty) ? 1 : 0.3;
  }

  // Simple similarity check for trips (can be enhanced with ML models)
  private areTripsSimilar(trip1: Trip, trip2Id: string): boolean {
    // This is a simplified version - in production, you'd use more sophisticated matching
    return trip1.region === trip1.region; // Placeholder logic
  }

  // Track user interaction for future recommendations
  async trackUserInteraction(
    userId: string,
    tripId: string,
    interactionType: 'view' | 'click' | 'bookmark' | 'share',
    duration?: number
  ): Promise<void> {
    await db.insert(userInteractions).values({
      userId,
      tripId,
      interactionType,
      duration,
    });

    // Update trip view count if it's a view interaction
    if (interactionType === 'view') {
      await db
        .insert(tripFeatures)
        .values({
          tripId,
          viewCount: 1,
        })
        .onConflictDoUpdate({
          target: tripFeatures.tripId,
          set: {
            viewCount: sql`${tripFeatures.viewCount} + 1`,
            updatedAt: new Date(),
          },
        });
    }
  }

  // Update user preferences
  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<void> {
    await db
      .insert(userPreferences)
      .values({
        userId,
        ...preferences,
      })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          ...preferences,
          updatedAt: new Date(),
        },
      });
  }
}

export const recommendationService = new RecommendationService();