// 🚀 PERFORMANCE: Optimized database queries and utilities
import { db } from '../db';
import { trips, users, comments, userInteractions, chatMessages, questions, answers } from '@shared/schema';
import { eq, and, or, desc, asc, count, sql, inArray, isNull, gte, lte, like, ilike } from 'drizzle-orm';
import { cache, CACHE_TTL } from '../cache/cacheService';

// Query optimization utilities
export class QueryOptimizer {
  
  // 🚀 PERFORMANCE: Optimized trip listing with proper indexing
  static async getTripsOptimized(params: {
    page?: number;
    limit?: number;
    category?: string;
    fromLocation?: string;
    toLocation?: string;
    priceMin?: number;
    priceMax?: number;
    departureDate?: string;
    userId?: string;
  }) {
    const {
      page = 1,
      limit = 20,
      category,
      fromLocation,
      toLocation,
      priceMin,
      priceMax,
      departureDate,
      userId
    } = params;
    
    const offset = (page - 1) * limit;
    const cacheKey = `trips:optimized:${JSON.stringify(params)}`;
    
    return cache.getOrSet(cacheKey, async () => {
      // Build optimized query with proper joins and filtering
      const conditions = [eq(trips.status, 'active')];
      if (category) conditions.push(eq(trips.category, category as typeof trips.category.enumValues[number]));
      if (fromLocation) conditions.push(ilike(trips.fromLocation, `%${fromLocation}%`));
      if (toLocation) conditions.push(ilike(trips.toLocation, `%${toLocation}%`));
      if (priceMin !== undefined) conditions.push(gte(trips.price, priceMin.toString()));
      if (priceMax !== undefined) conditions.push(lte(trips.price, priceMax.toString()));
      if (departureDate) conditions.push(gte(trips.date, new Date(departureDate)));
      if (userId) conditions.push(eq(trips.organizerId, userId));

      const query = db
        .select({
          id: trips.id,
          title: trips.title,
          fromLocation: trips.fromLocation,
          toLocation: trips.toLocation,
          price: trips.price,
          seatsAvailable: trips.seatsAvailable,
          departureDate: trips.date,
          endDate: trips.date,
          status: trips.status,
          imageUrl: trips.imageUrl,
          category: trips.category,
          tags: trips.tags,
          createdAt: trips.createdAt,
          // Join user data efficiently
          organizer: {
            id: users.id,
            displayName: users.displayName,
            username: users.username,
            profileImageUrl: users.profileImageUrl,
            initials: sql<string>`COALESCE(${users.displayName}, ${users.name}, ${users.username}, 'U')`
          }
        })
        .from(trips)
        .leftJoin(users, eq(trips.organizerId, users.id))
        .where(and(...conditions))
        .orderBy(desc(trips.createdAt))
        .limit(limit)
        .offset(offset);
      
      const results = await query;
      
      // Get total count for pagination (optimized with separate query)
      const [{ totalCount }] = await db
        .select({ totalCount: count() })
        .from(trips)
        .where(and(...conditions));
      
      return {
        trips: results,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      };
    }, CACHE_TTL.TRIP_LISTINGS);
  }
  
  // 🚀 PERFORMANCE: Optimized user recommendations with batching
  static async getUserRecommendationsOptimized(userId: string, limit = 10) {
    const cacheKey = `recommendations:user:${userId}:${limit}`;
    
    return cache.getOrSet(cacheKey, async () => {
      // Batch fetch user preferences and interactions
      const [userPrefs, interactionRows] = await Promise.all([
        db.select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1),
        db.select({ tripId: userInteractions.tripId })
          .from(userInteractions)
          .where(and(
            eq(userInteractions.userId, userId),
            inArray(userInteractions.interactionType, ['view', 'bookmark'])
          ))
      ]);
      
      if (!userPrefs.length) return [];
      
      const user = userPrefs[0];
      const viewedTripIds = interactionRows.map(i => i.tripId);
      
      // Optimized recommendation query
      let query = db
        .select({
          id: trips.id,
          title: trips.title,
          fromLocation: trips.fromLocation,
          toLocation: trips.toLocation,
          price: trips.price,
          category: trips.category,
           departureDate: trips.date,
          tags: trips.tags,
          score: sql<number>`
            CASE 
              WHEN ${trips.category} = ANY(${user.interests || []}) THEN 3
              WHEN ${trips.fromLocation} ILIKE ANY(${user.regions || []}) THEN 2
              WHEN ${trips.toLocation} ILIKE ANY(${user.regions || []}) THEN 2
              ELSE 1
            END
          `
        })
        .from(trips)
        .where(and(
          eq(trips.status, 'active'),
          gte(trips.date, new Date()),
          gte(trips.seatsAvailable, 1),
          viewedTripIds.length > 0 ? sql`NOT ${inArray(trips.id, viewedTripIds)}` : sql`1=1`
        ))
        .orderBy(desc(sql`score`), desc(trips.createdAt))
        .limit(limit);
      
      return await query;
    }, CACHE_TTL.RECOMMENDATIONS);
  }
  
  // 🚀 PERFORMANCE: Optimized chat queries with message batching
  static async getChatMessagesOptimized(threadId: string, page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    const cacheKey = `chat:messages:${threadId}:${page}:${limit}`;
    
    return cache.getOrSet(cacheKey, async () => {
      const messages = await db
        .select({
          id: chatMessages.id,
          threadId: chatMessages.threadId,
          senderId: chatMessages.senderId,
          kind: chatMessages.kind,
          text: chatMessages.text,
          meta: chatMessages.meta,
          createdAt: chatMessages.createdAt,
          sender: {
            id: users.id,
            displayName: users.displayName,
            username: users.username,
            avatarUrl: users.profileImageUrl,
            initials: sql<string>`
              COALESCE(
                SUBSTRING(${users.displayName} FROM 1 FOR 1),
                SUBSTRING(${users.name} FROM 1 FOR 1),
                SUBSTRING(${users.username} FROM 1 FOR 1),
                'U'
              )
            `
          }
        })
        .from(chatMessages)
        .leftJoin(users, eq(chatMessages.senderId, users.id))
        .where(eq(chatMessages.threadId, threadId))
        .orderBy(desc(chatMessages.createdAt))
        .limit(limit)
        .offset(offset);
      
      return messages;
    }, CACHE_TTL.CHAT_THREADS);
  }
  
  // 🚀 PERFORMANCE: Optimized search with full-text capabilities
  static async searchTripsOptimized(query: string, filters: any = {}) {
    const cacheKey = `search:trips:${query}:${JSON.stringify(filters)}`;
    
    return cache.getOrSet(cacheKey, async () => {
      // Use PostgreSQL full-text search for better performance
      const searchResults = await db
        .select({
          id: trips.id,
          title: trips.title,
          fromLocation: trips.fromLocation,
          toLocation: trips.toLocation,
          price: trips.price,
          category: trips.category,
          tags: trips.tags,
          relevance: sql<number>`
            ts_rank_cd(
              to_tsvector('english', ${trips.title} || ' ' || ${trips.fromLocation} || ' ' || ${trips.toLocation}),
              plainto_tsquery('english', ${query})
            )
          `
        })
        .from(trips)
        .where(and(
          eq(trips.status, 'active'),
          sql`
            to_tsvector('english', ${trips.title} || ' ' || ${trips.fromLocation} || ' ' || ${trips.toLocation})
            @@ plainto_tsquery('english', ${query})
          `
        ))
        .orderBy(desc(sql`relevance`), desc(trips.createdAt))
        .limit(20);
      
      return searchResults;
    }, CACHE_TTL.SEARCH_RESULTS);
  }
  
  // 🚀 PERFORMANCE: Optimized dashboard stats for admin
  static async getAdminStatsOptimized() {
    const cacheKey = 'admin:stats:dashboard';
    
    return cache.getOrSet(cacheKey, async () => {
      // Batch all stat queries for efficiency
      const [
        totalTrips,
        activeTrips,
        totalUsers,
        totalComments,
        totalQuestions,
        recentActivity
      ] = await Promise.all([
        db.select({ count: count() }).from(trips),
        db.select({ count: count() }).from(trips).where(eq(trips.status, 'active')),
        db.select({ count: count() }).from(users),
        db.select({ count: count() }).from(comments),
        db.select({ count: count() }).from(questions),
        
        // Recent activity in last 24 hours
        db.select({
          type: sql<string>`'trip'`,
          count: count(),
          date: sql<string>`DATE(${trips.createdAt})`
        })
        .from(trips)
        .where(gte(trips.createdAt, sql`NOW() - INTERVAL '7 days'`))
        .groupBy(sql`DATE(${trips.createdAt})`)
        .orderBy(desc(sql`DATE(${trips.createdAt})`))
        .limit(7)
      ]);
      
      return {
        trips: {
          total: totalTrips[0]?.count || 0,
          active: activeTrips[0]?.count || 0
        },
        users: {
          total: totalUsers[0]?.count || 0
        },
        engagement: {
          comments: totalComments[0]?.count || 0,
          questions: totalQuestions[0]?.count || 0
        },
        activity: recentActivity
      };
    }, CACHE_TTL.ADMIN_STATS);
  }
  
  // 🚀 PERFORMANCE: Optimized user profile with related data
  static async getUserProfileOptimized(userId: string) {
    const cacheKey = `user:profile:${userId}`;
    
    return cache.getOrSet(cacheKey, async () => {
      // Batch fetch user and related data
      const [user, tripCount, questionCount] = await Promise.all([
        db.select().from(users).where(eq(users.id, userId)).limit(1),
         db.select({ count: count() }).from(trips).where(eq(trips.organizerId, userId)),
        db.select({ count: count() }).from(questions).where(eq(questions.userId, userId))
      ]);
      
      if (!user.length) return null;
      
      return {
        ...user[0],
        stats: {
          tripsCreated: tripCount[0]?.count || 0,
          questionsAsked: questionCount[0]?.count || 0
        }
      };
    }, CACHE_TTL.USER_PROFILES);
  }
}

// Database connection health monitoring
export class DatabaseHealthMonitor {
  private static connectionMetrics = {
    queries: 0,
    errors: 0,
    slowQueries: 0,
    avgResponseTime: 0
  };
  
  static async checkHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    metrics: typeof DatabaseHealthMonitor.connectionMetrics;
    tests: Record<string, boolean>;
  }> {
    const tests: Record<string, boolean> = {};
    
    try {
      // Test basic connectivity
      const start = Date.now();
      await db.select({ test: sql`1` });
      const responseTime = Date.now() - start;
      tests.connectivity = true;
      
      // Test table access
      await db.select({ count: count() }).from(users).limit(1);
      tests.tableAccess = true;
      
      // Update metrics
      this.connectionMetrics.avgResponseTime = responseTime;
      
      const status = responseTime > 1000 ? 'degraded' : 'healthy';
      
      return {
        status,
        metrics: this.connectionMetrics,
        tests
      };
    } catch (error) {
      tests.connectivity = false;
      tests.tableAccess = false;
      
      return {
        status: 'down',
        metrics: this.connectionMetrics,
        tests
      };
    }
  }
}