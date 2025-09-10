import { db } from "../db";
import { 
  // userPreferences, // Consolidated into users table
  userInteractions, 
  tripFeatures, 
  trips, 
  ratings, 
  users,
  // userPersonalization, // Consolidated into users table
  kpiEvents
} from "@shared/schema";
import { eq, desc, and, or, sql, asc, inArray, ne, not, gte } from "drizzle-orm";
import type { 
  Trip, 
  User, 
  UserInteraction, 
  TripFeatures,
  KpiEvent 
} from "@shared/schema";

interface UserProfile {
  userId: string;
  preferences: any; // Use our new preferences schema
  interactions: UserInteraction[];
  ratings: number;
  averageRating: number;
  personalization: any | null;
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
  collaborative: number;
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
    preferences: 0.1,        // User preferences: 10%
    collaborative: 0.35,    // Popularity (pins, interested, questions): 35%
    freshness: 0.1,         // Freshness (newly posted trips): 10%
    seasonality: 0.2,       // Seasonality (peak/off-peak per region): 20%
    safety: 0.1,            // Safety & quality flags: 10%
    novelty: 0.05,          // Novelty (hidden gems, offbeat): 5%
    regionalBalance: 0.1,   // Regional/Thematic diversity: 10%
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
      score: Math.random() * 0.5 + 0.3, // Simple baseline scoring
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
      const popularityScore = Math.random() * 0.4 + 0.1; // Simple baseline
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
      .select({
        id: tripFeatures.id,
        tripId: tripFeatures.tripId,
        viewCount: tripFeatures.viewCount,
        totalBookings: tripFeatures.totalBookings,
        popularityScore: tripFeatures.popularityScore,
        tags: tripFeatures.tags,
        createdAt: tripFeatures.createdAt,
        updatedAt: tripFeatures.updatedAt
      })
      .from(tripFeatures)
      .where(eq(tripFeatures.tripId, trip.id));

    // 1. Preference-based scoring (10%)
    const preferencesScore = this.calculatePreferencesScore(trip, userProfile.preferences);
    totalScore += preferencesScore * this.weights.preferences;
    if (preferencesScore > 0.7) reasons.push('Matches your interests');

    // 2. Combined Popularity & Behavior scoring (35%) - merges collaborative, behavior, and popularity
    const behaviorScore = this.calculateBehaviorScore(trip, userProfile.interactions);
    const collaborativeScore = await this.calculateCollaborativeScore(trip, userProfile.userId);
    const popularityScore = this.calculatePopularityScore(trip, features);
    
    // Combine into one unified popularity score
    const combinedPopularityScore = (collaborativeScore * 0.4 + behaviorScore * 0.3 + popularityScore * 0.3);
    totalScore += combinedPopularityScore * this.weights.collaborative;
    if (combinedPopularityScore > 0.5) reasons.push('Popular with travelers');

    // 3. Freshness score (10%)
    const freshnessScore = this.calculateFreshnessScore(trip);
    totalScore += freshnessScore * this.weights.freshness;
    if (freshnessScore > 0.8) reasons.push('New listing');

    // 4. Seasonality score (20%)
    const seasonalityScore = this.calculateSeasonalityScore(trip, new Date());
    totalScore += seasonalityScore * this.weights.seasonality;
    if (seasonalityScore > 0.8) reasons.push('Perfect season to visit');
    else if (seasonalityScore < 0.3) reasons.push('Off-season pricing');

    // 5. Safety & quality flags score (10%)
    const safetyScore = this.calculateSafetyScore(trip, new Date());
    totalScore += safetyScore * this.weights.safety;
    if (safetyScore < 0.5) reasons.push('Check weather conditions');

    // 6. Novelty score (5%)
    const noveltyScore = this.calculateNoveltyScore(trip, userProfile.interactions);
    totalScore += noveltyScore * this.weights.novelty;

    // 7. Regional/Thematic diversity (10%)
    const regionalBalanceScore = this.calculateRegionalDiversityScore(trip);
    totalScore += regionalBalanceScore * this.weights.regionalBalance;

    // Generate Sri Lanka-specific badges instead of generic reasons
    const badges = this.generateSriLankaBadges(trip, features, {
      popularity: combinedPopularityScore,
      seasonality: seasonalityScore,
      freshness: freshnessScore,
      safety: safetyScore,
      novelty: noveltyScore,
    });

    return {
      trip,
      score: Math.min(totalScore, 1.0), // Normalize to 0-1
      reasons: badges.length > 0 ? badges : ['Recommended for you'],
      features,
      seasonalityScore,
      safetyScore,
      noveltyScore,
      diversityScore: regionalBalanceScore,
    };
  }

  // Simplified seasonality scoring without database dependencies
  private calculateSeasonalityScore(trip: Trip, currentDate: Date): number {
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    
    // Simplified regional scoring based on general weather patterns
    const isSouthWestPeak = currentMonth >= 12 || currentMonth <= 3; // Dec-Mar
    const isEastNorthPeak = currentMonth >= 7 && currentMonth <= 8;  // Jul-Aug
    
    // Regional-specific scoring
    if (trip.region === 'Southern Province' || trip.region === 'Western Province') {
      return isSouthWestPeak ? 0.9 : 0.6;
    }
    
    if (trip.region === 'Eastern Province' || trip.region === 'Northern Province') {
      return isEastNorthPeak ? 0.9 : 0.6;
    }
    
    if (trip.region === 'Central Province' || trip.region === 'Uva Province') {
      return (isSouthWestPeak || isEastNorthPeak) ? 0.8 : 0.6;
    }

    return 0.7; // Default good seasonality score
  }

  // Simplified safety scoring without database dependencies
  private calculateSafetyScore(trip: Trip, currentDate: Date): number {
    let safetyScore = 1.0;
    const currentMonth = currentDate.getMonth() + 1;
    
    // Basic seasonal safety considerations
    if (currentMonth >= 5 && currentMonth <= 9) {
      safetyScore *= 0.8; // Slightly lower safety during monsoon
    }
    
    return Math.max(safetyScore, 0.7); // Good minimum safety score
  }

  // Novelty scoring to avoid showing same trips repeatedly
  private calculateNoveltyScore(trip: Trip, userInteractions: UserInteraction[]): number {
    const recentViews = userInteractions.filter(
      interaction => 
        interaction.tripId === trip.id && 
        interaction.interactionType === 'view' &&
        new Date(interaction.createdAt || new Date()).getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000) // Last 7 days
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

    return regionalPopularity[trip.region as keyof typeof regionalPopularity] || 0.5;
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
      const primaryTag = 'adventure'; // Default primary tag

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
      .select({ 
        tripId: userInteractions.tripId 
      })
      .from(userInteractions)
      .where(and(
        eq(userInteractions.userId, userId),
        eq(userInteractions.interactionType, 'not_interested')
      ));

    const notInterestedIds = new Set(notInterestedTrips.map(t => t.tripId));
    
    return candidateTrips.filter(trip => !notInterestedIds.has(trip.id));
  }

  // Calculate preferences score using our new comprehensive preferences system
  private calculatePreferencesScore(trip: Trip, preferences: any): number {
    if (!preferences) return 0.3; // Neutral score for no preferences

    let score = 0;
    let factors = 0;

    // Region preferences (using our new regions taxonomy)
    if (preferences.regions && preferences.regions.length > 0) {
      // Map trip.region to our taxonomy format
      const regionMap: Record<string, string> = {
        'Northern Province': 'north',
        'Eastern Province': 'east',
        'Southern Province': 'south', 
        'Western Province': 'west',
        'Central Province': 'hill_country',
        'Uva Province': 'hill_country',
        'North Central Province': 'cultural_triangle',
        'North Western Province': 'cultural_triangle',
        'Sabaragamuwa Province': 'hill_country',
        'Colombo': 'colombo'
      };
      
      const tripRegionKey = regionMap[trip.region] || 'colombo';
      score += preferences.regions.includes(tripRegionKey) ? 1 : 0.2;
      factors++;
    }

    // Budget preferences  
    if (preferences.budgetMin !== null || preferences.budgetMax !== null) {
      const tripPrice = parseFloat((trip.price || 0).toString());
      const budgetMin = preferences.budgetMin || 0;
      const budgetMax = preferences.budgetMax || 100000;
      
      if (tripPrice >= budgetMin && tripPrice <= budgetMax) {
        score += 1;
      } else if (tripPrice < budgetMin) {
        score += 0.8; // Cheaper is still good
      } else {
        score += 0.2; // Too expensive
      }
      factors++;
    }

    // Vibe preferences (trip mood/atmosphere) - using text matching
    if (preferences.vibe && preferences.vibe.length > 0) {
      // Map vibe to common trip tags
      const vibeTagMap: Record<string, string[]> = {
        'relaxed': ['wellness', 'beach', 'spa', 'retreat'],
        'adventure': ['hiking', 'climbing', 'extreme', 'safari', 'diving', 'surfing'],
        'culture': ['cultural', 'temple', 'heritage', 'history', 'museum'],
        'beach': ['beach', 'coastal', 'diving', 'surfing', 'island'],
        'nature': ['wildlife', 'safari', 'hiking', 'nature', 'eco'],
        'nightlife': ['nightlife', 'party', 'club', 'bar'],
        'wellness': ['wellness', 'ayurveda', 'spa', 'yoga', 'meditation']
      };
      
      let vibeMatch = false;
      // Use trip text content for vibe matching
      const tripText = `${trip.title} ${trip.fromLocation} ${trip.toLocation} ${trip.region}`.toLowerCase();
      for (const vibeType of preferences.vibe) {
        const relevantTags = vibeTagMap[vibeType] || [];
        if (relevantTags.some((tag: string) => tripText.includes(tag.toLowerCase()))) {
          vibeMatch = true;
          break;
        }
      }
      score += vibeMatch ? 1 : 0.3;
      factors++;
    }

    // Interest preferences using text content
    if (preferences.interests && preferences.interests.length > 0) {
      // Direct mapping between interests and trip tags
      const interestTagMap: Record<string, string[]> = {
        'hiking': ['hiking', 'trekking', 'walking'],
        'wildlife': ['wildlife', 'safari', 'animal', 'bird'],
        'history': ['history', 'heritage', 'archaeological', 'ancient'],
        'photography': ['photography', 'scenic', 'landscape', 'nature'],
        'food': ['food', 'culinary', 'cooking', 'restaurant'],
        'diving': ['diving', 'snorkeling', 'underwater', 'marine'],
        'surfing': ['surfing', 'surf', 'wave', 'board'],
        'temples': ['temple', 'religious', 'buddhist', 'hindu'],
        'festivals': ['festival', 'cultural', 'celebration', 'event'],
        'wellness': ['wellness', 'spa', 'ayurveda', 'yoga'],
        'ayurveda': ['ayurveda', 'traditional', 'herbal', 'healing'],
        'train_journeys': ['train', 'railway', 'scenic', 'transport']
      };
      
      let interestMatch = false;
      // Use trip text content for interest matching
      const tripText = `${trip.title} ${trip.fromLocation} ${trip.toLocation} ${trip.region}`.toLowerCase();
      for (const interest of preferences.interests) {
        const relevantTags = interestTagMap[interest] || [interest];
        if (relevantTags.some((tag: string) => tripText.includes(tag.toLowerCase()))) {
          interestMatch = true;
          break;
        }
      }
      score += interestMatch ? 1 : 0.2;
      factors++;
    }

    // Month/seasonality preferences 
    if (preferences.months && preferences.months.length > 0) {
      const currentMonth = new Date().getMonth() + 1;
      const monthMap = {
        'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
        'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
      };
      
      const preferredMonthNums = preferences.months.map((m: string) => monthMap[m as keyof typeof monthMap]);
      const seasonalMatch = preferredMonthNums.includes(currentMonth);
      
      // Simplified seasonal matching without database dependencies
      let tripSeasonalMatch = true; // Always allow trips regardless of season
      
      score += (seasonalMatch || tripSeasonalMatch) ? 1 : 0.6;
      factors++;
    }

    // Companion preferences (affect trip type selection)
    if (preferences.companions && preferences.companions.length > 0) {
      // Map companions to trip characteristics
      const companionTagMap: Record<string, string[]> = {
        'solo': ['solo', 'independent', 'flexible'],
        'couple': ['romantic', 'couple', 'honeymoon', 'intimate'],
        'friends': ['group', 'social', 'party', 'adventure'],
        'family': ['family', 'kid_friendly', 'safe', 'educational'],
        'senior_friendly': ['senior', 'accessible', 'comfort', 'easy']
      };
      
      let companionMatch = false;
      // Use trip text content for companion matching
      const tripText = `${trip.title} ${trip.fromLocation} ${trip.toLocation} ${trip.region}`.toLowerCase();
      for (const companion of preferences.companions) {
        const relevantTags = companionTagMap[companion] || [];
        if (relevantTags.some((tag: string) => tripText.includes(tag.toLowerCase()))) {
          companionMatch = true;
          break;
        }
      }
      // Less weight for companion matching as it's more contextual
      score += companionMatch ? 0.8 : 0.5;
      factors++;
    }

    return factors > 0 ? score / factors : 0.3;
  }

  // Calculate behavior score based on past interactions
  private calculateBehaviorScore(trip: Trip, interactions: UserInteraction[]): number {
    if (interactions.length === 0) return 0.3;

    const tripInteractions = interactions.filter(i => i.tripId === trip.id);
    const positiveInteractions = tripInteractions.filter(i => 
      ['click', 'bookmark', 'share'].includes(i.interactionType)
    );

    if (positiveInteractions.length > 0) return 0.9;

    // Look for similar trips based on tags
    const userTagPreferences: Record<string, number> = {};
    interactions.forEach(interaction => {
      // This would need trip data - simplified for now
      if (['click', 'bookmark'].includes(interaction.interactionType)) {
        // Add logic to track preferred tags from user's positive interactions
      }
    });

    return 0.3; // Neutral if no clear behavior pattern
  }

  // Calculate collaborative filtering score
  private async calculateCollaborativeScore(trip: Trip, userId: string): Promise<number> {
    // Find similar users who liked this trip
    const tripInteractions = await db
      .select({ 
        userId: userInteractions.userId 
      })
      .from(userInteractions)
      .where(and(
        eq(userInteractions.tripId, trip.id),
        ne(userInteractions.userId, userId),
        inArray(userInteractions.interactionType, ['click', 'bookmark'])
      ));

    if (tripInteractions.length === 0) return 0.3;

    // This is simplified - in a full implementation, we'd calculate user similarity
    return Math.min(tripInteractions.length / 10, 0.9);
  }

  // Calculate popularity score
  private calculatePopularityScore(trip: Trip, features: TripFeatures | null): number {
    const viewCount = features?.viewCount || 0;
    const bookingCount = features?.totalBookings || 0;
    
    // Normalize popularity (assumes max ~100 views, ~20 bookings for popular trips)
    const normalizedViews = Math.min(viewCount / 100, 1);
    const normalizedBookings = Math.min(bookingCount / 20, 1);
    
    return normalizedViews * 0.4 + normalizedBookings * 0.6;
  }

  // Calculate freshness score with decay
  private calculateFreshnessScore(trip: Trip): number {
    const createdAt = new Date(trip.createdAt || new Date());
    const daysSinceCreated = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    
    // Fresh boost decays over 30 days
    const freshDecay = Math.max(0, 1 - daysSinceCreated / 30);
    
    return freshDecay;
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
        organizerId: trips.organizerId,
        status: trips.status,
        priceMin: trips.priceMin,
        priceMax: trips.priceMax,
        createdAt: trips.createdAt,
        updatedAt: trips.updatedAt,
        isDeleted: trips.isDeleted,
        deletedAt: trips.deletedAt,
        // Flatten organizer fields to avoid nested object issues
        organizerEmail: users.email,
        organizerPhone: users.phone,
        organizerName: users.name,
        organizerImage: users.image,
        organizerProvider: users.provider,
        organizerFirstName: users.firstName,
        organizerLastName: users.lastName,
        organizerUsername: users.username,
        organizerProfileImageUrl: users.profileImageUrl,
        organizerPhoneNumber: users.phoneNumber,
        organizerBio: users.bio,
        organizerEmailVerified: users.emailVerified,
        organizerCreatedAt: users.createdAt,
        organizerUpdatedAt: users.updatedAt
      })
      .from(trips)
      .innerJoin(users, eq(trips.organizerId, users.id))
      .where(and(
        eq(trips.status, 'active'),
        // Remove the filter that excludes user's own trips - users should see their own posts
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

    // Apply additional filters to the base query
    let finalQuery = query;
    if (conditions.length > 0) {
      finalQuery = db
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
          organizerId: trips.organizerId,
          status: trips.status,
          priceMin: trips.priceMin,
          priceMax: trips.priceMax,
          createdAt: trips.createdAt,
          updatedAt: trips.updatedAt,
          isDeleted: trips.isDeleted,
          deletedAt: trips.deletedAt,
          // Flatten organizer fields to avoid nested object issues
          organizerEmail: users.email,
          organizerPhone: users.phone,
          organizerName: users.name,
          organizerImage: users.image,
          organizerProvider: users.provider,
          organizerFirstName: users.firstName,
          organizerLastName: users.lastName,
          organizerUsername: users.username,
          organizerProfileImageUrl: users.profileImageUrl,
          organizerPhoneNumber: users.phoneNumber,
          organizerBio: users.bio,
          organizerEmailVerified: users.emailVerified,
          organizerCreatedAt: users.createdAt,
          organizerUpdatedAt: users.updatedAt
        })
        .from(trips)
        .innerJoin(users, eq(trips.organizerId, users.id))
        .where(and(
          eq(trips.status, 'active'),
          // Remove the filter that excludes user's own trips - users should see their own posts
          sql`${trips.date} >= CURRENT_DATE`,
          ...conditions
        ));
    }

    const results = await finalQuery.limit(100); // Get more candidates for better filtering
    
    // Transform flattened results back to nested structure
    return results.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      fromLocation: row.fromLocation,
      toLocation: row.toLocation,
      date: row.date,
      time: row.time,
      seatsAvailable: row.seatsAvailable,
      price: row.price,
      region: row.region,
      contactInfo: row.contactInfo,
      organizerId: row.organizerId,
      status: row.status,
      priceMin: row.priceMin,
      priceMax: row.priceMax,
      viewCount: row.viewCount,
      bookingCount: row.bookingCount,
      freshBoost: row.freshBoost,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      isDeleted: row.isDeleted,
      deletedAt: row.deletedAt,
      organizer: {
        id: row.organizerId,
        email: row.organizerEmail,
        phone: row.organizerPhone,
        name: row.organizerName,
        image: row.organizerImage,
        provider: row.organizerProvider,
        firstName: row.organizerFirstName,
        lastName: row.organizerLastName,
        username: row.organizerUsername,
        profileImageUrl: row.organizerProfileImageUrl,
        phoneNumber: row.organizerPhoneNumber,
        bio: row.organizerBio,
        emailVerified: row.organizerEmailVerified,
        createdAt: row.organizerCreatedAt,
        updatedAt: row.organizerUpdatedAt
      }
    }));
  }

  // Build comprehensive user profile
  private async buildUserProfile(userId: string): Promise<UserProfile> {
    // Get user preferences using storage method
    let preferences = null;
    try {
      const storage = (await import("../storage")).storage;
      preferences = await storage.getUserPreferences(userId);
    } catch (error) {
      console.error("Error getting user preferences:", error);
      preferences = null;
    }

    // Get user interactions (last 90 days)
    const interactions = await db
      .select({
        id: userInteractions.id,
        userId: userInteractions.userId,
        tripId: userInteractions.tripId,
        interactionType: userInteractions.interactionType,
        duration: userInteractions.duration,
        sessionId: userInteractions.sessionId,
        createdAt: userInteractions.createdAt
      })
      .from(userInteractions)
      .where(and(
        eq(userInteractions.userId, userId),
        sql`${userInteractions.createdAt} > NOW() - INTERVAL '90 days'`
      ))
      .orderBy(desc(userInteractions.createdAt));

    // Get personalization settings using storage method
    let personalization = null;
    try {
      const storage = (await import("../storage")).storage;
      personalization = await storage.getUserPersonalization(userId);
    } catch (error) {
      console.error("Error getting user personalization:", error);
      personalization = null;
    }

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
    interactionType: 'view' | 'click' | 'bookmark' | 'share' | 'not_interested',
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

    // Update trip view/booking counts would go here when columns exist
    // join_request interaction removed

    // Update trip features for ML
    await this.updateTripFeatures(tripId);
  }

  // Update trip features based on interactions
  private async updateTripFeatures(tripId: string): Promise<void> {
    const trip = await db
      .select({
        id: trips.id,
        title: trips.title,
        organizerId: trips.organizerId,
        createdAt: trips.createdAt,
        updatedAt: trips.updatedAt
      })
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
      tags: [],
      difficulty: 'moderate',
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
    // Update user table with reset timestamp since personalization was consolidated
    await db.update(users)
      .set({
        resetAt: sql`NOW()`,
        updatedAt: sql`NOW()`,
      })
      .where(eq(users.id, userId));
  }

  // Pause/unpause personalization
  async togglePersonalization(userId: string, isPaused: boolean): Promise<void> {
    await db.update(users)
      .set({
        isPaused,
        updatedAt: sql`NOW()`,
      })
      .where(eq(users.id, userId));
  }

  // Get current season for Sri Lanka
  private getCurrentSeason(): string {
    const month = new Date().getMonth() + 1;
    return (month <= 3 || month === 12) ? 'dry_season' : 'wet_season';
  }

  // Generate Sri Lanka-specific badges for trips
  generateSriLankaBadges(
    trip: Trip, 
    features: TripFeatures | null, 
    scores: {
      popularity: number;
      seasonality: number;
      freshness: number;
      safety: number;
      novelty: number;
    }
  ): string[] {
    const badges: string[] = [];
    const currentMonth = new Date().getMonth() + 1;

    // 1. Popularity badge (35% weight)
    if (scores.popularity > 0.7) {
      const count = Math.floor((trip.viewCount || 0) + (trip.bookingCount || 0) * 2);
      if (count > 20) badges.push(`⭐ Popular with ${count} travelers`);
    }

    // 2. Seasonal badges (20% weight)
    if (scores.seasonality > 0.8) {
      // Hill Country seasons
      if (trip.region === 'Central Province' || trip.region === 'Uva Province') {
        if (currentMonth >= 12 || currentMonth <= 3) {
          badges.push('🌞 Best season in the Hill Country');
        } else if (currentMonth >= 7 && currentMonth <= 8) {
          badges.push('🌤 Great weather for hill stations');
        }
      }
      // East Coast surf season
      else if (trip.region === 'Eastern Province' && (currentMonth >= 7 && currentMonth <= 8)) {
        badges.push('🌊 Surf season on the East Coast');
      }
      // South Coast beach season
      else if (trip.region === 'Southern Province' && (currentMonth >= 12 || currentMonth <= 3)) {
        badges.push('🏖 Perfect beach weather');
      }
    }

    // 3. Freshness badge (10% weight)
    if (scores.freshness > 0.8) {
      badges.push('✨ New this week');
    }

    // 4. Special Sri Lankan experiences using text content
    const tripText = `${trip.title} ${trip.fromLocation} ${trip.toLocation} ${trip.region}`.toLowerCase();
    
    if (tripText.includes('safari') || tripText.includes('wildlife') || tripText.includes('yala')) {
      badges.push('🐆 Great for safaris now');
    }
    if (tripText.includes('ayurveda') || tripText.includes('wellness') || tripText.includes('spa')) {
      badges.push('🧘 Ayurveda & Wellness retreat');
    }
    if (tripText.includes('tea') || tripText.includes('train') || tripText.includes('ella') || tripText.includes('kandy')) {
      badges.push('🚂 Tea & Train views');
    }
    if (tripText.includes('cultural') || tripText.includes('temple') || tripText.includes('heritage')) {
      badges.push('🛕 Cultural heritage experience');
    }

    // 5. Free/budget trips
    if (!trip.price || parseFloat(trip.price || "0") === 0) {
      badges.push('💚 Free trip available');
    }

    // 6. Hidden gems (novelty boost)
    if (scores.novelty > 0.8 && trip.region === 'Northern Province') {
      badges.push('💎 Hidden gem in the North');
    }

    // Limit to 2-3 most relevant badges
    return badges.slice(0, 3);
  }

  // Generate trending trips (public endpoint, no user-specific data)  
  async getTrendingTrips(limit: number = 10): Promise<TripRecommendation[]> {
    try {
      // Use exact same pattern as working /api/trips endpoint
      const { storage } = await import('../storage');
      const searchResult = await storage.searchTrips({
        limit: limit * 2 // Get more trips for better scoring
      });
      
      // searchTrips returns { trips: Trip[], pagination: {...} }
      const activeTrips = Array.isArray(searchResult) ? searchResult : (searchResult?.trips || []);
      console.log('searchResult type:', typeof searchResult);
      console.log('activeTrips type:', typeof activeTrips, 'isArray:', Array.isArray(activeTrips), 'length:', activeTrips?.length);

      if (!Array.isArray(activeTrips)) {
        console.error('activeTrips is not an array:', activeTrips);
        return [];
      }

      // Simple scoring based on freshness and regional diversity  
      const scoredTrips = activeTrips.map((trip: any) => {
        console.log('Processing trip:', trip.id);
        const freshnessScore = trip.createdAt ? this.calculateFreshnessScore(trip) : 0.5;
        const regionalDiversityScore = trip.region ? this.calculateRegionalDiversityScore(trip) : 0.5;
        
        const totalScore = freshnessScore * 0.6 + regionalDiversityScore * 0.4;

        return {
          trip: {
            ...trip,
            // Keep the already normalized organizer data from storage.searchTrips
            organizer: trip.organizer
          },
          score: totalScore,
          reasons: ['Trending destination'],
          features: null,
          seasonalityScore: 0.5,
          safetyScore: 1.0,
          noveltyScore: regionalDiversityScore,
          diversityScore: regionalDiversityScore,
        };
      });

      // Sort by score and return top results
      return scoredTrips
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
        
    } catch (error) {
      console.error("Error in getTrendingTrips:", error);
      return [];
    }
  }
}

// Export singleton instance
export const enhancedRecommendationService = new EnhancedRecommendationService();