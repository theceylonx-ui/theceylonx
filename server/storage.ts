import {
  users,
  userNotifications,
  userPrivacy,
  trips,
  comments,
  ratings,
  reports,
  topics,
  questions,
  answers,
  questionUpvotes,
  answerUpvotes,
  userInteractions,
  tripFeatures,
  kpiEvents,
  notifications,
  tripViews,
  authSessions,
  emailTokens,
  phoneOtps,
  tripInterestRequests,
  calendarEvents,
  savedTrips,
  chatThreads,
  chatMessages,
  chatParticipantState,
  userTripFlags,
  threadUsers,
  messages,
  type User,
  type UpsertUser,
  type InsertTrip,
  type Trip,
  type TripWithOrganizer,
  type InsertComment,
  type Comment,
  type CommentWithUser,
  type InsertTripView,
  type TripView,
  type InsertRating,
  type Rating,
  type InsertReport,
  type Report,
  type InsertTopic,
  type Topic,
  type InsertQuestion,
  type Question,
  type QuestionWithDetails,
  type InsertAnswer,
  type Answer,
  type AnswerWithUser,
  type InsertUserInteraction,
  type UserInteraction,
  type InsertTripFeatures,
  type TripFeatures,
  type InsertKpiEvent,
  type KpiEvent,
  type Notification,
  type InsertNotification,
  type TripInterestRequest,
  type InsertTripInterestRequest,
  type ChatThread,
  type InsertChatThread,
  type ChatMessage,
  type InsertChatMessage,
  chatAttachments,
  type ChatAttachment,
  type InsertChatAttachment,
  type ChatParticipantState,
  type InsertChatParticipantState,
  type CalendarEvent,
  type InsertCalendarEvent,
  type SavedTrip,
  type InsertSavedTrip,
  type SavedTripWithTrip,
  type SaveNotification,
  adminChatThreads,
  adminChatMessages,
  auditLogs,
  type AdminChatThread,
  type InsertAdminChatThread,
  type AdminChatThreadWithDetails,
  type AdminChatMessage,
  type InsertAdminChatMessage,
  type AdminChatMessageWithSender,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, ilike, desc, asc, gte, lte, count, sql, isNull, ne } from "drizzle-orm";

// Contact redaction utilities
export function redactContact<T extends { contactInfo?: string | null; whatsapp?: string | null; email?: string | null; phone?: string | null }>(userOrTrip: T): T & { contactRedacted?: boolean } {
  return {
    ...userOrTrip,
    contactInfo: undefined,
    whatsapp: undefined,
    email: undefined, 
    phone: undefined,
    contactRedacted: true
  } as T & { contactRedacted?: boolean };
}

export function shouldRedactContact(userId?: string, resourceOwnerId?: string): boolean {
  // Only show contact details to the owner themselves
  return !userId || userId !== resourceOwnerId;
}

// Permission helpers for contact sharing
export function canShareContact(userId: string, threadId: string, storage: DatabaseStorage): Promise<boolean> {
  // Check if user is the trip organizer
  return storage.isThreadOrganizer(userId, threadId);
}

export function canViewContactMessage(userId: string, threadId: string, storage: DatabaseStorage): Promise<boolean> {
  // Check if user is organizer or accepted participant of the trip's thread
  return storage.isUserInThread(threadId, userId);
}

export interface IStorage {
  // User operations (for Replit auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: Partial<UpsertUser>): Promise<User>;
  updateUser(id: string, user: Partial<UpsertUser>): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // User preferences and personalization operations
  getUserPreferences(userId: string): Promise<any>;
  updateUserPreferences(userId: string, preferences: any): Promise<any>;
  getUserPersonalization(userId: string): Promise<any>;
  updateUserPersonalization(userId: string, personalization: any): Promise<any>;
  
  // Trip operations
  createTrip(trip: InsertTrip): Promise<Trip>;
  getTrip(id: string): Promise<TripWithOrganizer | undefined>;
  updateTrip(id: string, trip: Partial<InsertTrip>): Promise<Trip>;
  deleteTrip(id: string): Promise<void>;
  getUserTrips(userId: string): Promise<TripWithOrganizer[]>;
  getTripsWithoutImages(): Promise<Trip[]>;
  updateTripImage(tripId: string, imageUrl: string): Promise<void>;
  searchTrips(filters: {
    from?: string;
    to?: string;
    date?: string;
    region?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ trips: TripWithOrganizer[], total: number }>;
  
  
  // Comment operations
  createComment(comment: InsertComment): Promise<Comment>;
  getTripComments(tripId: string): Promise<CommentWithUser[]>;
  updateComment(id: string, content: string): Promise<Comment>;
  deleteComment(id: string): Promise<void>;

  // Trip interest request operations
  createTripInterestRequest(request: InsertTripInterestRequest): Promise<TripInterestRequest>;
  getTripInterestRequestByUserAndTrip(userId: string, tripId: string): Promise<TripInterestRequest | undefined>;
  getTripInterestRequests(tripId: string): Promise<TripInterestRequest[]>;
  updateTripInterestRequestStatus(requestId: string, status: 'accepted' | 'rejected'): Promise<TripInterestRequest>;
  
  // Rating operations
  createRating(rating: InsertRating): Promise<Rating>;
  getTripRatings(tripId: string): Promise<Rating[]>;
  getUserRatings(userId: string): Promise<Rating[]>;
  
  // Report operations
  createReport(report: InsertReport): Promise<Report>;
  getReports(): Promise<Report[]>;
  updateReportStatus(reportId: string, status: string): Promise<Report>;
  
  // Community Q&A operations
  // Topics
  createTopic(topic: InsertTopic): Promise<Topic>;
  getTopics(): Promise<Topic[]>;
  getTopic(slug: string): Promise<Topic | undefined>;
  
  // Questions
  createQuestion(question: InsertQuestion): Promise<Question>;
  getUserQuestions(userId: string): Promise<QuestionWithDetails[]>;
  getQuestions(filters?: {
    search?: string;
    topic?: string;
    sort?: 'top' | 'new' | 'unanswered';
    limit?: number;
    offset?: number;
  }): Promise<{questions: QuestionWithDetails[], total: number}>;
  getQuestion(id: string): Promise<QuestionWithDetails | undefined>;
  updateQuestion(id: string, question: Partial<InsertQuestion>): Promise<Question>;
  deleteQuestion(id: string): Promise<void>;
  
  // Answers
  createAnswer(answer: InsertAnswer): Promise<Answer>;
  getQuestionAnswers(questionId: string): Promise<AnswerWithUser[]>;
  updateAnswer(id: string, answer: Partial<InsertAnswer>): Promise<Answer>;
  deleteAnswer(id: string): Promise<void>;
  acceptAnswer(questionId: string, answerId: string): Promise<void>;
  
  // Upvotes (replaced the voting system)
  toggleQuestionUpvote(userId: string, questionId: string): Promise<boolean>;
  toggleAnswerUpvote(userId: string, answerId: string): Promise<boolean>;
  
  // ML Recommendations (user preferences now in users table)
  createUserInteraction(interaction: InsertUserInteraction): Promise<UserInteraction>;
  getUserInteractions(userId: string, limit?: number): Promise<UserInteraction[]>;
  getTripFeatures(tripId: string): Promise<TripFeatures | undefined>;
  upsertTripFeatures(tripId: string, features: Partial<InsertTripFeatures>): Promise<TripFeatures>;
  
  // KPI and Analytics
  createKpiEvent(event: InsertKpiEvent): Promise<KpiEvent>;
  getKpiEvents(filters?: {
    eventType?: string;
    userId?: string;
    abTestGroup?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<KpiEvent[]>;
  
  // User Personalization (now consolidated into users table)
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string, limit?: number): Promise<Notification[]>;
  markNotificationAsRead(id: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  deleteNotification(id: string): Promise<void>;
  
  // Trip view tracking operations
  createTripView(tripView: InsertTripView): Promise<TripView>;
  getTripViewCount(tripId: string): Promise<number>;
  getTripViewCountSince(tripId: string, since: Date): Promise<number>;
  
  
  // Chat thread operations
  createChatThread(thread: InsertChatThread): Promise<ChatThread>;
  getChatThread(id: string): Promise<ChatThread | undefined>;
  getUserChatThreads(userId: string): Promise<(ChatThread & { lastMessage?: ChatMessage, unreadCount: number, otherUser?: User, trip?: Trip })[]>;
  addUserToThread(userId: string, threadId: string): Promise<void>;
  removeUserFromThread(threadId: string, userId: string): Promise<void>;
  isUserInThread(threadId: string, userId: string): Promise<boolean>;
  getOrCreateChatThread(tripId: string, user1Id: string, user2Id: string): Promise<ChatThread>;
  
  // Message operations
  createMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getThreadMessages(threadId: string, limit?: number, cursor?: string): Promise<(ChatMessage & { author: User })[]>;
  getThreadUsers(threadId: string): Promise<User[]>;
  
  // Admin/moderation operations
  getAuditLogs(filters?: {
    action?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<any[]>;
  
  // Calendar Event operations
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  getUserCalendarEvents(userId: string, startDate?: Date, endDate?: Date): Promise<CalendarEvent[]>;
  getCalendarEvent(id: string): Promise<CalendarEvent | undefined>;
  updateCalendarEvent(id: string, event: Partial<InsertCalendarEvent>): Promise<CalendarEvent>;
  deleteCalendarEvent(id: string): Promise<void>;
  
  // Saved trips operations (Pin and Interest system)
  upsertSavedTrip(userId: string, tripId: string, saveType: 'pinned' | 'interested'): Promise<SavedTrip>;
  removeSavedTrip(userId: string, tripId: string): Promise<void>;
  getSavedTrip(userId: string, tripId: string): Promise<SavedTrip | undefined>;
  getUserSavedTrips(userId: string, saveType?: 'pinned' | 'interested'): Promise<SavedTripWithTrip[]>;
  
  // Notification operations for saved trips
  createSaveNotification(userId: string, tripId: string, type: 'trip_updated' | 'trip_removed' | 'save_removed', payload?: Record<string, any>): Promise<SaveNotification>;
  getUserNotifications(userId: string, limit?: number, offset?: number): Promise<SaveNotification[]>;
  markNotificationAsRead(notificationId: string): Promise<void>;

  // Enhanced Chat System (new comprehensive chat implementation)
  getChatThreadByTripAndUsers(tripId: string, organizerId: string, userId: string): Promise<any | undefined>;
  createChatParticipantState(state: { threadId: string; userId: string; unreadCount: number }): Promise<any>;
  getChatThreadsForUser(userId: string): Promise<any[]>;
  closeChatThread(threadId: string): Promise<void>;
  createChatMessage(message: { threadId: string; senderId: string; kind: string; text?: string | null; meta?: any }): Promise<any>;
  getChatMessages(threadId: string, options: { cursor?: string; limit: number }): Promise<any[]>;
  markChatMessagesAsRead(threadId: string, userId: string): Promise<void>;
  getChatMessage(messageId: string): Promise<any | undefined>;
  muteChatThread(threadId: string, userId: string): Promise<void>;

  // Raw query execution for admin/moderation operations
  executeRawQuery(query: string, params?: any[]): Promise<any[]>;

  // Admin helper methods
  getAllUsers(): Promise<User[]>;
  getAllTrips(): Promise<Trip[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async createUser(userData: Partial<UpsertUser>): Promise<User> {
    const [user] = await db.insert(users).values(userData as any).returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    // Delete user data in correct order to respect foreign key constraints
    // Start with dependent records first
    
    // Delete notifications
    await db.delete(notifications).where(eq(notifications.userId, id));
    
    // Delete user personalization
    await db.delete(userPersonalization).where(eq(userPersonalization.userId, id));
    
    // Delete user interactions
    await db.delete(userInteractions).where(eq(userInteractions.userId, id));
    
    // Delete user preferences
    await db.delete(userPreferences).where(eq(userPreferences.userId, id));
    
    // Delete votes
    await db.delete(votes).where(eq(votes.userId, id));
    
    // Delete answers
    await db.delete(answers).where(eq(answers.userId, id));
    
    // Delete questions
    await db.delete(questions).where(eq(questions.userId, id));
    
    // Delete reports (both reported by and reported user)
    await db.delete(reports).where(or(eq(reports.reporterId, id), eq(reports.userId, id)));
    
    // Delete ratings (both given and received)
    await db.delete(ratings).where(or(eq(ratings.raterId, id), eq(ratings.ratedId, id)));
    
    // Delete comments
    await db.delete(comments).where(eq(comments.userId, id));
    
    // Delete messages
    await db.delete(messages).where(eq(messages.authorId, id));
    
    // Remove user from chat threads
    await db.delete(threadUsers).where(eq(threadUsers.userId, id));
    
    // Delete trip interest requests  
    await db.delete(tripInterestRequests).where(eq(tripInterestRequests.userId, id));
    
    // Delete trip views
    await db.delete(tripViews).where(eq(tripViews.userId, id));
    
    // Delete trips organized by user
    await db.delete(trips).where(eq(trips.organizerId, id));
    
    // Delete auth sessions
    await db.delete(authSessions).where(eq(authSessions.userId, id));
    
    // Get user data for cleaning up related records
    const userData = await db.select({ email: users.email, phone: users.phoneNumber })
      .from(users).where(eq(users.id, id));
    
    if (userData.length > 0) {
      const { email, phone } = userData[0];
      
      // Delete email tokens
      if (email) {
        await db.delete(emailTokens).where(eq(emailTokens.email, email));
      }
      
      // Delete phone OTPs
      if (phone) {
        await db.delete(phoneOtps).where(eq(phoneOtps.phone, phone));
      }
    }
    
    // Finally, delete the user record
    await db.delete(users).where(eq(users.id, id));
  }

  // Trip operations
  async createTrip(trip: InsertTrip): Promise<Trip> {
    const tripData = {
      ...trip,
      price: typeof trip.price === 'number' ? trip.price.toString() : trip.price,
      status: (trip.status as any) || 'active'
    };
    const [newTrip] = await db.insert(trips).values(tripData).returning();
    return newTrip;
  }

  async getTrip(id: string, requestingUserId?: string): Promise<TripWithOrganizer | undefined> {
    const result = await db
      .select()
      .from(trips)
      .leftJoin(users, eq(trips.organizerId, users.id))
      .where(and(eq(trips.id, id), eq(trips.isDeleted, false)));
    
    if (result.length === 0) return undefined;
    
    const { trips: trip, users: organizer } = result[0];
    
    // Apply contact redaction if not the trip organizer
    const shouldRedact = shouldRedactContact(requestingUserId, trip.organizerId);
    const redactedTrip = shouldRedact ? redactContact(trip) : trip;
    
    // Also redact organizer's contact information if not the trip organizer
    const redactedOrganizer = shouldRedact ? redactContact(organizer!) : organizer!;
    
    return { ...redactedTrip, organizer: redactedOrganizer };
  }

  async updateTrip(id: string, trip: Partial<InsertTrip>): Promise<Trip> {
    const tripData = {
      ...trip,
      price: trip.price !== undefined ? (typeof trip.price === 'number' ? trip.price.toString() : trip.price) : undefined,
      status: trip.status as any,
      updatedAt: new Date()
    };
    const [updatedTrip] = await db
      .update(trips)
      .set(tripData)
      .where(eq(trips.id, id))
      .returning();
    return updatedTrip;
  }

  async deleteTrip(id: string): Promise<void> {
    await db
      .update(trips)
      .set({ isDeleted: true, deletedAt: new Date() })
      .where(eq(trips.id, id));
  }

  async getTripsWithoutImages(): Promise<Trip[]> {
    const result = await db
      .select()
      .from(trips)
      .where(and(
        eq(trips.isDeleted, false)
        // imageUrl moved to trip_stats table
      ));
    return result;
  }

  async updateTripImage(tripId: string, imageUrl: string): Promise<void> {
    // TODO: Update trip_stats table instead of trips
    console.warn("updateTripImage temporarily disabled - imageUrl moved to trip_stats table");
  }

  async getUserTrips(userId: string): Promise<TripWithOrganizer[]> {
    const result = await db
      .select()
      .from(trips)
      .leftJoin(users, eq(trips.organizerId, users.id))
      .where(and(eq(trips.organizerId, userId), eq(trips.isDeleted, false)))
      .orderBy(desc(trips.createdAt));
    
    return result.map(({ trips: trip, users: organizer }) => ({
      ...trip,
      organizer: organizer!,
    }));
  }

  async getUserQuestions(userId: string): Promise<QuestionWithDetails[]> {
    try {
      console.log('🔍 getUserQuestions called for userId:', userId);
      
      // Simple query with only basic columns that exist
      const result = await db
        .select({
          id: questions.id,
          title: questions.title,
          body: questions.body,
          userId: questions.userId,
          topicId: questions.topicId,
          visibility: questions.visibility,
          createdAt: questions.createdAt,
          updatedAt: questions.updatedAt,
        })
        .from(questions)
        .where(and(eq(questions.userId, userId), eq(questions.isDeleted, false)))
        .orderBy(desc(questions.createdAt));

      console.log('✅ Basic questions query successful, found:', result.length);

      // Return minimal structure with defaults for missing fields
      return result.map(question => ({
        ...question,
        slug: `question-${question.id}`, // Generate slug from ID
        tags: [], // Default empty array
        isAnonymous: false, // Default value
        views: 0, // Default value
        score: 0, // Default value
        votesCount: 0, // Default value
        answersCount: 0, // Default value
        acceptedAnswerId: null, // Default value
        isDeleted: false, // Default value
        deletedAt: null, // Default value
        user: { id: userId, firstName: 'Test', lastName: 'User', displayName: null, profileImageUrl: null },
        topic: { id: question.topicId || '', name: 'General', slug: 'general', description: null, createdAt: new Date() },
        answers: [],
      }));
    } catch (error) {
      console.error('❌ Error in getUserQuestions:', error);
      throw error;
    }
  }

  async searchTrips(filters: {
    from?: string;
    to?: string;
    date?: string;
    region?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ trips: TripWithOrganizer[], total: number }> {
    const conditions = [eq(trips.status, "active"), eq(trips.isDeleted, false)];
    
    if (filters.from) {
      conditions.push(ilike(trips.fromLocation, `%${filters.from}%`));
    }
    
    if (filters.to) {
      conditions.push(ilike(trips.toLocation, `%${filters.to}%`));
    }
    
    if (filters.date) {
      conditions.push(gte(trips.date, new Date(filters.date)));
    }
    
    if (filters.region) {
      conditions.push(eq(trips.region, filters.region));
    }
    
    if (filters.minPrice) {
      conditions.push(gte(trips.price, filters.minPrice.toString()));
    }
    
    if (filters.maxPrice) {
      conditions.push(lte(trips.price, filters.maxPrice.toString()));
    }
    
    if (filters.search) {
      const searchCondition = or(
        ilike(trips.title, `%${filters.search}%`),
        ilike(trips.fromLocation, `%${filters.search}%`),
        ilike(trips.toLocation, `%${filters.search}%`)
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    // Get total count
    const [{ count: total }] = await db
      .select({ count: count() })
      .from(trips)
      .where(and(...conditions));

    // Get paginated results (including new image fields)
    const query = db
      .select({
        trips: {
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
          // Image fields for trip photos
          imageUrl: trips.imageUrl,
          mediaUrls: trips.mediaUrls,
          coverImageIndex: trips.coverImageIndex,
          createdAt: trips.createdAt,
          updatedAt: trips.updatedAt,
          isDeleted: trips.isDeleted,
          deletedAt: trips.deletedAt,
        },
        users
      })
      .from(trips)
      .leftJoin(users, eq(trips.organizerId, users.id))
      .where(and(...conditions))
      .orderBy(asc(trips.date));
    
    if (filters.limit) {
      query.limit(filters.limit);
    }
    
    if (filters.offset) {
      query.offset(filters.offset);
    }
    
    const result = await query;
    
    const tripsWithOrganizers = result.map(({ trips: trip, users: organizer }) => {
      // Apply contact redaction for search results - trips are public, no requesting user context
      const redactedTrip = redactContact(trip);
      const redactedOrganizer = redactContact(organizer!);
      
      return {
        ...redactedTrip,
        organizer: redactedOrganizer,
      };
    });
    
    return { trips: tripsWithOrganizers, total };
  }

  // Legacy join trip functionality removed - replaced with interest request system

  // Comment operations
  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    return newComment;
  }

  async getTripComments(tripId: string): Promise<CommentWithUser[]> {
    const result = await db
      .select()
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(and(eq(comments.tripId, tripId), eq(comments.isDeleted, false)))
      .orderBy(desc(comments.createdAt));
    
    return result.map(({ comments: comment, users: user }) => ({
      ...comment,
      user: user!,
    }));
  }

  async updateComment(id: string, content: string): Promise<Comment> {
    const [updatedComment] = await db
      .update(comments)
      .set({ content, updatedAt: new Date() })
      .where(eq(comments.id, id))
      .returning();
    return updatedComment;
  }

  async getComment(id: string): Promise<CommentWithUser | null> {
    const [comment] = await db
      .select({
        id: comments.id,
        content: comments.content,
        createdAt: comments.createdAt,
        tripId: comments.tripId,
        userId: comments.userId,
        updatedAt: comments.updatedAt,
        isDeleted: comments.isDeleted,
        deletedAt: comments.deletedAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(and(eq(comments.id, id), eq(comments.isDeleted, false)));
    
    return comment || null;
  }

  async deleteComment(id: string): Promise<void> {
    await db
      .update(comments)
      .set({ isDeleted: true, deletedAt: new Date() })
      .where(eq(comments.id, id));
  }

  // Rating operations
  async createRating(rating: InsertRating): Promise<Rating> {
    const [newRating] = await db.insert(ratings).values(rating).returning();
    return newRating;
  }

  async getTripRatings(tripId: string): Promise<Rating[]> {
    return await db.select().from(ratings).where(eq(ratings.tripId, tripId));
  }

  async getUserRatings(userId: string): Promise<Rating[]> {
    return await db.select().from(ratings).where(eq(ratings.ratedId, userId));
  }

  // Report operations
  async createReport(report: InsertReport): Promise<Report> {
    const [newReport] = await db.insert(reports).values(report).returning();
    return newReport;
  }

  async getReports(): Promise<Report[]> {
    return await db.select().from(reports).orderBy(desc(reports.createdAt));
  }

  async updateReportStatus(reportId: string, status: string): Promise<Report> {
    const [updatedReport] = await db
      .update(reports)
      .set({ status })
      .where(eq(reports.id, reportId))
      .returning();
    return updatedReport;
  }

  // Admin Chat Operations
  async createAdminChatThread(threadData: InsertAdminChatThread): Promise<AdminChatThread> {
    const [thread] = await db.insert(adminChatThreads).values(threadData).returning();
    return thread;
  }

  async getAdminChatThread(reportId: string): Promise<AdminChatThreadWithDetails | null> {
    // Get the thread first
    const [thread] = await db
      .select()
      .from(adminChatThreads)
      .where(eq(adminChatThreads.reportId, reportId));

    if (!thread) return null;

    // Get admin user
    const [admin] = await db
      .select()
      .from(users)
      .where(eq(users.id, thread.adminId));

    // Get organizer user  
    const [organizer] = await db
      .select()
      .from(users)
      .where(eq(users.id, thread.organizerId));

    // Get report
    const [report] = await db
      .select()
      .from(reports)
      .where(eq(reports.id, thread.reportId));

    if (!admin || !organizer || !report) return null;

    // Get message count
    const [messageCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(adminChatMessages)
      .where(eq(adminChatMessages.threadId, thread.id));

    // Get last message
    const [lastMessage] = await db
      .select()
      .from(adminChatMessages)
      .where(eq(adminChatMessages.threadId, thread.id))
      .orderBy(desc(adminChatMessages.createdAt))
      .limit(1);

    return {
      ...thread,
      admin: admin!,
      organizer: organizer!,
      report: report!,
      messageCount: messageCountResult.count,
      lastMessage,
    };
  }

  async toggleAdminChatBlock(threadId: string, adminId: string, isBlocked: boolean): Promise<AdminChatThread> {
    const [updatedThread] = await db
      .update(adminChatThreads)
      .set({
        isBlocked,
        blockedAt: isBlocked ? new Date() : null,
        blockedBy: isBlocked ? adminId : null,
        updatedAt: new Date(),
      })
      .where(eq(adminChatThreads.id, threadId))
      .returning();
    return updatedThread;
  }

  async createAdminChatMessage(messageData: InsertAdminChatMessage): Promise<AdminChatMessage> {
    const [message] = await db.insert(adminChatMessages).values(messageData).returning();
    return message;
  }

  async getAdminChatMessages(threadId: string): Promise<AdminChatMessageWithSender[]> {
    const messages = await db
      .select({
        message: adminChatMessages,
        sender: users,
      })
      .from(adminChatMessages)
      .leftJoin(users, eq(adminChatMessages.senderId, users.id))
      .where(eq(adminChatMessages.threadId, threadId))
      .orderBy(asc(adminChatMessages.createdAt));

    return messages.map((row) => ({
      ...row.message,
      sender: row.sender!,
    }));
  }

  async markAdminChatMessagesAsRead(threadId: string, userId: string): Promise<void> {
    await db
      .update(adminChatMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(adminChatMessages.threadId, threadId),
          ne(adminChatMessages.senderId, userId) // Don't mark own messages as read
        )
      );
  }

  // Community Q&A operations
  
  // Topics
  async createTopic(topicData: InsertTopic): Promise<Topic> {
    const [topic] = await db.insert(topics).values(topicData).returning();
    return topic;
  }

  async getTopics(): Promise<Topic[]> {
    return db.select().from(topics).orderBy(asc(topics.name));
  }

  async getTopic(slug: string): Promise<Topic | undefined> {
    const [topic] = await db.select().from(topics).where(eq(topics.slug, slug));
    return topic;
  }

  // Questions
  async createQuestion(questionData: InsertQuestion): Promise<Question> {
    const [question] = await db.insert(questions).values({
      ...questionData
    }).returning();
    return question;
  }

  async getQuestions(filters?: {
    search?: string;
    topic?: string;
    sort?: 'top' | 'new' | 'unanswered';
    limit?: number;
    offset?: number;
  }): Promise<{questions: QuestionWithDetails[], total: number}> {
    const limit = filters?.limit || 10;
    const offset = filters?.offset || 0;
    
    // Build where conditions - only show public questions for public listing
    const conditions = [eq(questions.isDeleted, false), eq(questions.visibility, "public")];
    
    if (filters?.search) {
      const searchCondition = or(
        ilike(questions.title, `%${filters.search}%`),
        ilike(questions.body, `%${filters.search}%`)
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }
    
    if (filters?.topic) {
      const topic = await this.getTopic(filters.topic);
      if (topic) {
        conditions.push(eq(questions.topicId, topic.id));
      }
    }
    
    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];
    
    // Build order by
    let orderBy: any;
    switch (filters?.sort) {
      case 'new':
        orderBy = [desc(questions.createdAt)];
        break;
      case 'unanswered':
        orderBy = [asc(questions.answersCount), desc(questions.createdAt)];
        break;
      default:
        orderBy = [desc(questions.score)];
    }
    
    const baseQuery = db
      .select({
        id: questions.id,
        title: questions.title,
        body: questions.body,
        slug: sql`${questions.title}`, // Generate slug from title since column doesn't exist
        tags: questions.tags,
        userId: questions.userId,
        topicId: questions.topicId,
        isAnonymous: questions.isAnonymous,
        views: sql`0`, // Default to 0 since column doesn't exist
        score: questions.score || sql`0`, // Use actual score column
        votesCount: questions.score || sql`0`, // Keep votesCount in sync with score
        answersCount: questions.answersCount,
        acceptedAnswerId: questions.acceptedAnswerId,
        isDeleted: questions.isDeleted,
        deletedAt: questions.deletedAt,
        createdAt: questions.createdAt,
        updatedAt: questions.updatedAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          displayName: users.displayName,
          profileImageUrl: users.profileImageUrl,
        },
        topic: {
          id: topics.id,
          name: topics.name,
          description: topics.description,
          createdAt: topics.createdAt,
        },
      })
      .from(questions)
      .leftJoin(users, eq(questions.userId, users.id))
      .leftJoin(topics, eq(questions.topicId, topics.id));
    
    const queryWithConditions = whereClause ? baseQuery.where(whereClause) : baseQuery;
    
    // Get total count first
    const countQuery = whereClause 
      ? db.select({ count: count() }).from(questions).leftJoin(topics, eq(questions.topicId, topics.id)).where(whereClause)
      : db.select({ count: count() }).from(questions);
    
    const [{ count: totalCount }] = await countQuery;
    
    const query = queryWithConditions
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset);
    
    const questionsData = await query;
    
    // Fetch answers for each question and apply anonymity logic
    const questionsWithAnswers = await Promise.all(
      questionsData.map(async (question) => {
        const answers = await this.getQuestionAnswers(question.id);
        
        // Apply anonymity logic: mask PII if isAnonymous is true
        const maskedQuestion = this.applyAnonymityToQuestion(question);
        
        return {
          ...maskedQuestion,
          answers,
        };
      })
    );
    
    return {
      questions: questionsWithAnswers as QuestionWithDetails[],
      total: totalCount
    };
  }

  // Helper method to apply anonymity logic to questions
  private applyAnonymityToQuestion(question: any): any {
    if (!question.isAnonymous) {
      return question; // Return as-is for non-anonymous questions
    }

    // Mask PII for anonymous questions
    return {
      ...question,
      user: {
        ...question.user,
        id: null, // Hide user ID for anonymous posts
        email: null,
        firstName: null,
        lastName: null,
        username: null,
        profileImageUrl: null, // Use generic avatar on frontend
        phoneNumber: null,
        bio: null,
        // Display name should be "Anonymous"
        displayName: "Anonymous"
      }
    };
  }

  // Helper method to apply anonymity logic to answers
  private applyAnonymityToAnswer(answer: any): any {
    if (!answer.isAnonymous) {
      return answer;
    }

    return {
      ...answer,
      user: {
        ...answer.user,
        id: null,
        email: null,
        firstName: null,
        lastName: null,
        username: null,
        profileImageUrl: null,
        phoneNumber: null,
        bio: null,
        displayName: "Anonymous"
      }
    };
  }

  async getQuestion(id: string): Promise<QuestionWithDetails | undefined> {
    const questionData = await db
      .select({
        id: questions.id,
        title: questions.title,
        body: questions.body,
        tags: questions.tags,
        userId: questions.userId,
        topicId: questions.topicId,
        isAnonymous: questions.isAnonymous,
        votesCount: questions.votesCount,
        answersCount: questions.answersCount,
        acceptedAnswerId: questions.acceptedAnswerId,
        visibility: questions.visibility,
        createdAt: questions.createdAt,
        updatedAt: questions.updatedAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          displayName: users.displayName,
          profileImageUrl: users.profileImageUrl,
        },
        topic: {
          id: topics.id,
          name: topics.name,
          slug: topics.slug,
          description: topics.description,
          createdAt: topics.createdAt,
        },
      })
      .from(questions)
      .leftJoin(users, eq(questions.userId, users.id))
      .leftJoin(topics, eq(questions.topicId, topics.id))
      .where(and(eq(questions.id, id), eq(questions.isDeleted, false)));
    
    const question = questionData[0];
    if (!question) return undefined;
    
    // Fetch answers for this question
    const answers = await this.getQuestionAnswers(question.id);
    
    // Apply anonymity logic to the question
    const maskedQuestion = this.applyAnonymityToQuestion(question);
    
    return {
      ...maskedQuestion,
      answers,
    } as QuestionWithDetails;
  }

  async updateQuestion(id: string, questionData: Partial<InsertQuestion>): Promise<Question> {
    const [question] = await db
      .update(questions)
      .set({ ...questionData, updatedAt: new Date() })
      .where(eq(questions.id, id))
      .returning();
    return question;
  }

  async deleteQuestion(id: string): Promise<void> {
    await db
      .update(questions)
      .set({ isDeleted: true, deletedAt: new Date() })
      .where(eq(questions.id, id));
  }

  async getPopularDestinations(limit: number = 5): Promise<Array<{ destination: string; count: number }>> {
    // Get destinations from trips
    const tripDestinations = await db
      .select({
        fromLocation: trips.fromLocation,
        toLocation: trips.toLocation,
      })
      .from(trips)
      .where(eq(trips.status, "active"));

    // Get locations mentioned in questions
    const questionTitles = await db
      .select({
        title: questions.title,
        body: questions.body,
      })
      .from(questions);

    // Combine and count locations
    const locationCounts: Record<string, number> = {};
    
    // Count trip locations
    tripDestinations.forEach(trip => {
      if (trip.fromLocation) {
        const location = trip.fromLocation.trim();
        locationCounts[location] = (locationCounts[location] || 0) + 1;
      }
      if (trip.toLocation) {
        const location = trip.toLocation.trim();
        locationCounts[location] = (locationCounts[location] || 0) + 1;
      }
    });

    // Extract cities from question content
    const commonCities = [
      'Colombo', 'Kandy', 'Galle', 'Nuwara Eliya', 'Sigiriya', 'Mirissa',
      'Ella', 'Anuradhapura', 'Polonnaruwa', 'Bentota', 'Negombo', 'Dambulla',
      'Trincomalee', 'Jaffna', 'Matara', 'Hikkaduwa', 'Unawatuna', 'Arugam Bay'
    ];

    questionTitles.forEach(question => {
      const content = `${question.title} ${question.body}`.toLowerCase();
      commonCities.forEach(city => {
        if (content.includes(city.toLowerCase())) {
          locationCounts[city] = (locationCounts[city] || 0) + 1;
        }
      });
    });

    // Sort by count and return top destinations
    return Object.entries(locationCounts)
      .map(([destination, count]) => ({ destination, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  // Answers
  async createAnswer(answerData: InsertAnswer): Promise<Answer> {
    const [answer] = await db.insert(answers).values(answerData).returning();
    
    // Update question answers count
    const answerCount = await db
      .select({ count: count() })
      .from(answers)
      .where(eq(answers.questionId, answerData.questionId));
    
    await db
      .update(questions)
      .set({ answersCount: answerCount[0].count })
      .where(eq(questions.id, answerData.questionId));
    
    return answer;
  }

  async getQuestionAnswers(questionId: string): Promise<AnswerWithUser[]> {
    const answersData = await db
      .select({
        id: answers.id,
        body: answers.body,
        questionId: answers.questionId,
        userId: answers.userId,
        votesCount: answers.score || sql`0`, // Keep votesCount in sync with score
        score: answers.score || sql`0`, // Use actual score column
        isAccepted: answers.isAccepted,
        isAnonymous: sql`false`.as('isAnonymous'), // Answers don't have anonymity yet, but prepare for future
        createdAt: answers.createdAt,
        updatedAt: answers.updatedAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          displayName: users.displayName,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(answers)
      .leftJoin(users, eq(answers.userId, users.id))
      .where(eq(answers.questionId, questionId))
      .orderBy(desc(answers.score));
    
    // For now, answers are not anonymous, but apply the logic for future extensibility
    const maskedAnswers = answersData.map(answer => this.applyAnonymityToAnswer(answer));
    
    return maskedAnswers as AnswerWithUser[];
  }

  async getAnswer(id: string): Promise<Answer | undefined> {
    const [answer] = await db.select().from(answers).where(eq(answers.id, id));
    return answer;
  }

  async updateAnswer(id: string, answerData: Partial<InsertAnswer>): Promise<Answer> {
    const [answer] = await db
      .update(answers)
      .set({ ...answerData, updatedAt: new Date() })
      .where(eq(answers.id, id))
      .returning();
    return answer;
  }

  async deleteAnswer(id: string): Promise<void> {
    await db.delete(answers).where(eq(answers.id, id));
  }

  async acceptAnswer(questionId: string, answerId: string): Promise<void> {
    // First, unaccept any previously accepted answer
    await db
      .update(answers)
      .set({ isAccepted: false })
      .where(eq(answers.questionId, questionId));
    
    // Accept the new answer
    await db
      .update(answers)
      .set({ isAccepted: true })
      .where(eq(answers.id, answerId));
    
    // Update question with accepted answer ID
    await db
      .update(questions)
      .set({ acceptedAnswerId: answerId })
      .where(eq(questions.id, questionId));
  }

  // Enhanced Votes API
  // New upvote system methods
  async toggleUpvote(userId: string, itemType: 'question' | 'answer', itemId: string): Promise<{ hasUpvoted: boolean; newScore: number; item: any }> {
    // Check if user already upvoted this item
    const existingUpvote = await this.getUserUpvote(userId, itemType, itemId);
    
    if (existingUpvote) {
      // Remove upvote
      await this.removeUpvote(userId, itemType, itemId);
      const newScore = await this.calculateUpvoteScore(itemType, itemId);
      await this.updateUpvoteScore(itemType, itemId, newScore);
      const item = await this.getItemWithScore(itemType, itemId);
      return { hasUpvoted: false, newScore, item };
    } else {
      // Add upvote
      await this.addUpvote(userId, itemType, itemId);
      const newScore = await this.calculateUpvoteScore(itemType, itemId);
      await this.updateUpvoteScore(itemType, itemId, newScore);
      const item = await this.getItemWithScore(itemType, itemId);
      return { hasUpvoted: true, newScore, item };
    }
  }

  // New upvote system using dedicated tables
  async toggleQuestionUpvote(userId: string, questionId: string): Promise<boolean> {
    const existing = await db
      .select()
      .from(questionUpvotes)
      .where(and(
        eq(questionUpvotes.userId, userId),
        eq(questionUpvotes.questionId, questionId)
      ));

    if (existing.length > 0) {
      // Remove upvote
      await db
        .delete(questionUpvotes)
        .where(and(
          eq(questionUpvotes.userId, userId),
          eq(questionUpvotes.questionId, questionId)
        ));
      return false;
    } else {
      // Add upvote
      await db
        .insert(questionUpvotes)
        .values({ userId, questionId });
      return true;
    }
  }

  async toggleAnswerUpvote(userId: string, answerId: string): Promise<boolean> {
    const existing = await db
      .select()
      .from(answerUpvotes)
      .where(and(
        eq(answerUpvotes.userId, userId),
        eq(answerUpvotes.answerId, answerId)
      ));

    if (existing.length > 0) {
      // Remove upvote
      await db
        .delete(answerUpvotes)
        .where(and(
          eq(answerUpvotes.userId, userId),
          eq(answerUpvotes.answerId, answerId)
        ));
      return false;
    } else {
      // Add upvote
      await db
        .insert(answerUpvotes)
        .values({ userId, answerId });
      return true;
    }
  }

  private async updateScore(votableType: 'question' | 'answer', votableId: string, score: number): Promise<void> {
    if (votableType === 'question') {
      await db.update(questions)
        .set({ 
          votesCount: score  // Just update votesCount for now
        })
        .where(eq(questions.id, votableId));
    } else {
      await db.update(answers)
        .set({ 
          votesCount: score  // Just update votesCount for now
        })
        .where(eq(answers.id, votableId));
    }
  }

  // Check if user has upvoted content
  async hasUserUpvotedQuestion(userId: string, questionId: string): Promise<boolean> {
    const existing = await db
      .select()
      .from(questionUpvotes)
      .where(and(
        eq(questionUpvotes.userId, userId),
        eq(questionUpvotes.questionId, questionId)
      ));
    return existing.length > 0;
  }

  async hasUserUpvotedAnswer(userId: string, answerId: string): Promise<boolean> {
    const existing = await db
      .select()
      .from(answerUpvotes)
      .where(and(
        eq(answerUpvotes.userId, userId),
        eq(answerUpvotes.answerId, answerId)
      ));
    return existing.length > 0;
  }

  // Legacy methods - will be removed in future versions
  
  // TODO: Fix TypeScript errors in audit logging and contact sharing
  // These errors don't affect voting functionality

  // User preferences are now part of the users table
  async getUserTravelPreferences(userId: string) {
    const [user] = await db
      .select({
        vibe: users.vibe,
        companions: users.companions,
        interests: users.interests,
        months: users.months,
        regions: users.regions,
        budgetMin: users.budgetMin,
        budgetMax: users.budgetMax,
      })
      .from(users)
      .where(eq(users.id, userId));
    return user;
  }

  async updateUserTravelPreferences(userId: string, preferences: {
    vibe?: string[];
    companions?: string[];
    interests?: string[];
    months?: string[];
    regions?: string[];
    budgetMin?: number;
    budgetMax?: number;
  }) {
    await db
      .update(users)
      .set({
        ...preferences,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  // Travel style settings are now handled through updateUserTravelPreferences

  async createUserInteraction(interaction: InsertUserInteraction): Promise<UserInteraction> {
    const [newInteraction] = await db
      .insert(userInteractions)
      .values(interaction)
      .returning();
    return newInteraction;
  }

  async getUserInteractions(userId: string, limit: number = 100): Promise<UserInteraction[]> {
    return await db
      .select()
      .from(userInteractions)
      .where(eq(userInteractions.userId, userId))
      .orderBy(desc(userInteractions.createdAt))
      .limit(limit);
  }

  async getTripFeatures(tripId: string): Promise<TripFeatures | undefined> {
    const [features] = await db
      .select()
      .from(tripFeatures)
      .where(eq(tripFeatures.tripId, tripId));
    return features;
  }

  async upsertTripFeatures(tripId: string, features: Partial<InsertTripFeatures>): Promise<TripFeatures> {
    const [tripFeatureRecord] = await db
      .insert(tripFeatures)
      .values({
        tripId,
        ...features,
      } as any)
      .onConflictDoUpdate({
        target: tripFeatures.tripId,
        set: {
          ...features,
          updatedAt: new Date(),
        } as any,
      })
      .returning();
    return tripFeatureRecord;
  }

  // KPI and Analytics implementation
  async createKpiEvent(event: InsertKpiEvent): Promise<KpiEvent> {
    const [newEvent] = await db
      .insert(kpiEvents)
      .values(event)
      .returning();
    return newEvent;
  }

  async getKpiEvents(filters?: {
    eventType?: string;
    userId?: string;
    abTestGroup?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<KpiEvent[]> {
    const conditions = [];
    
    if (filters?.eventType) {
      conditions.push(eq(kpiEvents.eventType, filters.eventType));
    }
    
    if (filters?.userId) {
      conditions.push(eq(kpiEvents.userId, filters.userId));
    }
    
    if (filters?.abTestGroup) {
      conditions.push(eq(kpiEvents.abTestGroup, filters.abTestGroup));
    }
    
    if (filters?.startDate) {
      conditions.push(gte(kpiEvents.createdAt, filters.startDate));
    }
    
    if (filters?.endDate) {
      conditions.push(lte(kpiEvents.createdAt, filters.endDate));
    }

    return await db
      .select()
      .from(kpiEvents)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(kpiEvents.createdAt));
  }

  // User personalization is now part of the users table
  async getUserPersonalizationSettings(userId: string) {
    const [user] = await db
      .select({
        isPaused: users.isPaused,
        resetAt: users.resetAt,
        abTestGroup: users.abTestGroup,
      })
      .from(users)
      .where(eq(users.id, userId));
    return user;
  }

  async updateUserPersonalizationSettings(userId: string, settings: {
    isPaused?: boolean;
    resetAt?: Date;
    abTestGroup?: string;
  }) {
    await db
      .update(users)
      .set({
        ...settings,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  // Notification implementation
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }


  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result?.count || 0;
  }

  async deleteNotification(id: string): Promise<void> {
    await db
      .delete(notifications)
      .where(eq(notifications.id, id));
  }

  // Trip view tracking implementation
  async createTripView(tripView: InsertTripView): Promise<TripView> {
    const [newTripView] = await db
      .insert(tripViews)
      .values(tripView)
      .returning();
    return newTripView;
  }

  async getTripViewCount(tripId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(tripViews)
      .where(eq(tripViews.tripId, tripId));
    return result?.count || 0;
  }

  async getTripViewCountSince(tripId: string, since: Date): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(tripViews)
      .where(and(
        eq(tripViews.tripId, tripId), 
        gte(tripViews.createdAt, since)
      ));
    return result?.count || 0;
  }


  // Chat thread implementation
  async createChatThread(thread: InsertChatThread): Promise<ChatThread> {
    const [newThread] = await db
      .insert(chatThreads)
      .values(thread)
      .returning();
    return newThread;
  }

  async getChatThread(id: string): Promise<ChatThread | undefined> {
    const [thread] = await db
      .select()
      .from(chatThreads)
      .where(eq(chatThreads.id, id));
    return thread;
  }

  async getUserChatThreads(userId: string): Promise<(ChatThread & { lastMessage?: ChatMessage, unreadCount: number, otherUser?: User, trip?: Trip })[]> {
    // Get all threads user is in
    const threadUserResult = await db
      .select()
      .from(chatParticipantState)
      .leftJoin(chatThreads, eq(chatParticipantState.threadId, chatThreads.id))
      .where(eq(chatParticipantState.userId, userId))
      .orderBy(desc(chatThreads.updatedAt));

    const threads: (ChatThread & { lastMessage?: ChatMessage, unreadCount: number, otherUser?: User, trip?: Trip })[] = [];
    
    for (const { chat_participant_state: participantState, chat_threads: thread } of threadUserResult) {
      if (!thread) continue;
      
      // Get trip information if thread is associated with a trip
      let trip: Trip | undefined;
      if (thread.tripId) {
        const [tripResult] = await db
          .select()
          .from(trips)
          .where(eq(trips.id, thread.tripId));
        trip = tripResult;
      }
      
      // Get last message
      const [lastMessage] = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.threadId, thread.id))
        .orderBy(desc(chatMessages.createdAt))
        .limit(1);

      // Get other user in thread
      const otherUsers = await db
        .select()
        .from(chatParticipantState)
        .leftJoin(users, eq(chatParticipantState.userId, users.id))
        .where(and(
          eq(chatParticipantState.threadId, thread.id),
          sql`${chatParticipantState.userId} != ${userId}`
        ));
      
      const otherUser = otherUsers[0]?.users || undefined;

      // Get unread count from participant state
      const unreadCount = participantState?.unreadCount || 0;

      threads.push({
        ...thread,
        lastMessage,
        unreadCount,
        otherUser,
        trip
      });
    }

    return threads;
  }

  async addUserToThread(userId: string, threadId: string): Promise<void> {
    // Add user to thread using chat participant state
    await db
      .insert(chatParticipantState)
      .values({
        threadId,
        userId,
        unreadCount: 0,
        lastReadAt: new Date(),
      })
      .onConflictDoNothing();
  }

  async removeUserFromThread(threadId: string, userId: string): Promise<void> {
    await db
      .delete(threadUsers)
      .where(and(
        eq(threadUsers.threadId, threadId),
        eq(threadUsers.userId, userId)
      ));
  }

  async isUserInThread(threadId: string, userId: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(threadUsers)
      .where(and(
        eq(threadUsers.threadId, threadId),
        eq(threadUsers.userId, userId)
      ));
    return !!result;
  }

  async getOrCreateChatThread(tripId: string, user1Id: string, user2Id: string): Promise<ChatThread> {
    // First, try to find existing thread for this trip between these users
    const existingThreadResult = await db
      .select()
      .from(chatThreads)
      .leftJoin(threadUsers, eq(chatThreads.id, threadUsers.threadId))
      .where(eq(chatThreads.tripId, tripId));

    // Check if both users are in any of these threads
    for (const { chat_threads: thread } of existingThreadResult) {
      if (!thread) continue;
      
      const threadUserIds = await db
        .select({ userId: threadUsers.userId })
        .from(threadUsers)
        .where(eq(threadUsers.threadId, thread.id));
      
      const userIds = threadUserIds.map(tu => tu.userId);
      if (userIds.includes(user1Id) && userIds.includes(user2Id)) {
        return thread;
      }
    }

    // Create new thread
    const [newThread] = await db
      .insert(chatThreads)
      .values({ tripId })
      .returning();

    // Add both users to the thread
    await db.insert(threadUsers).values([
      { threadId: newThread.id, userId: user1Id },
      { threadId: newThread.id, userId: user2Id }
    ]);

    return newThread;
  }

  // Message implementation
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    
    // Update thread's updatedAt timestamp
    await db
      .update(chatThreads)
      .set({ updatedAt: new Date() })
      .where(eq(chatThreads.id, message.threadId));
    
    return newMessage;
  }

  async getThreadMessages(threadId: string, limit: number = 50, cursor?: string): Promise<(Message & { author: User })[]> {
    let whereConditions = eq(messages.threadId, threadId);
    
    if (cursor) {
      whereConditions = and(
        eq(messages.threadId, threadId),
        sql`${messages.createdAt} < (SELECT created_at FROM messages WHERE id = ${cursor})`
      ) as any;
    }

    const result = await db
      .select()
      .from(messages)
      .leftJoin(users, eq(messages.authorId, users.id))
      .where(whereConditions)
      .orderBy(desc(messages.createdAt))
      .limit(limit);
    
    return result.map(({ messages: msg, users: user }) => ({
      ...msg,
      author: user!
    }));
  }

  async getThreadUsers(threadId: string): Promise<User[]> {
    const result = await db
      .select()
      .from(threadUsers)
      .leftJoin(users, eq(threadUsers.userId, users.id))
      .where(eq(threadUsers.threadId, threadId));
    
    return result.map(({ users: user }) => user!);
  }

  // Trip interest request operations
  async createTripInterestRequest(request: InsertTripInterestRequest): Promise<TripInterestRequest> {
    const [newRequest] = await db
      .insert(tripInterestRequests)
      .values(request)
      .returning();
    return newRequest;
  }

  async getTripInterestRequestByUserAndTrip(userId: string, tripId: string): Promise<TripInterestRequest | undefined> {
    const [request] = await db
      .select()
      .from(tripInterestRequests)
      .where(and(
        eq(tripInterestRequests.userId, userId),
        eq(tripInterestRequests.tripId, tripId)
      ));
    return request;
  }

  async getTripInterestRequests(tripId: string): Promise<TripInterestRequest[]> {
    const requests = await db
      .select()
      .from(tripInterestRequests)
      .where(eq(tripInterestRequests.tripId, tripId))
      .orderBy(desc(tripInterestRequests.createdAt));
    return requests;
  }

  async updateTripInterestRequestStatus(requestId: string, status: 'accepted' | 'rejected'): Promise<TripInterestRequest> {
    const [updatedRequest] = await db
      .update(tripInterestRequests)
      .set({ status, updatedAt: new Date() })
      .where(eq(tripInterestRequests.id, requestId))
      .returning();
    return updatedRequest;
  }

  async getInterestRequestsForOrganizer(userId: string): Promise<any[]> {
    const result = await db
      .select({
        id: tripInterestRequests.id,
        tripId: tripInterestRequests.tripId,
        userId: tripInterestRequests.userId,
        message: tripInterestRequests.message,
        status: tripInterestRequests.status,
        createdAt: tripInterestRequests.createdAt,
        updatedAt: tripInterestRequests.updatedAt,
        chatThreadId: tripInterestRequests.chatThreadId,
        tripTitle: trips.title,
        requesterName: users.firstName,
        requesterLastName: users.lastName,
        requesterEmail: users.email,
        requesterProfileImage: users.profileImageUrl
      })
      .from(tripInterestRequests)
      .leftJoin(trips, eq(tripInterestRequests.tripId, trips.id))
      .leftJoin(users, eq(tripInterestRequests.userId, users.id))
      .where(eq(trips.organizerId, userId))
      .orderBy(desc(tripInterestRequests.createdAt));
    
    // Add duration calculation for each request
    const currentTime = new Date();
    const requestsWithDuration = result.map(request => {
      const createdAt = request.createdAt ? new Date(request.createdAt) : currentTime;
      const durationMs = currentTime.getTime() - createdAt.getTime();
      
      // Calculate duration components
      const seconds = Math.floor(durationMs / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      
      // Format duration string
      let durationText = '';
      let waitingTimeCategory = 'recent'; // recent, moderate, long, urgent
      
      if (days > 0) {
        durationText = days === 1 ? '1 day ago' : `${days} days ago`;
        waitingTimeCategory = days >= 7 ? 'urgent' : days >= 3 ? 'long' : 'moderate';
      } else if (hours > 0) {
        durationText = hours === 1 ? '1 hour ago' : `${hours} hours ago`;
        waitingTimeCategory = hours >= 12 ? 'moderate' : 'recent';
      } else if (minutes > 0) {
        durationText = minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
        waitingTimeCategory = 'recent';
      } else {
        durationText = 'Just now';
        waitingTimeCategory = 'recent';
      }
      
      return {
        ...request,
        requestTimestamp: request.createdAt,
        durationSinceRequest: durationText,
        waitingTimeMs: durationMs,
        waitingTimeCategory,
        daysWaiting: days,
        hoursWaiting: hours,
        minutesWaiting: minutes
      };
    });
    
    return requestsWithDuration;
  }

  async updateInterestRequestStatus(requestId: string, status: 'accepted' | 'rejected', organizerId: string): Promise<TripInterestRequest> {
    // First verify the organizer owns the trip
    const [request] = await db
      .select()
      .from(tripInterestRequests)
      .leftJoin(trips, eq(tripInterestRequests.tripId, trips.id))
      .where(and(
        eq(tripInterestRequests.id, requestId),
        eq(trips.organizerId, organizerId)
      ));

    if (!request) {
      throw new Error("Interest request not found or you don't have permission to update it");
    }

    const requestData = request.trip_interest_requests;
    let chatThreadId = requestData.chatThreadId;

    // If accepting the request and no chat thread exists, create one
    if (status === 'accepted' && !chatThreadId) {
      console.log('🆕 Creating chat thread for accepted interest request');
      console.log('🔍 Trip ID:', requestData.tripId);
      
      const newThread = await this.createChatThread({
        tripId: requestData.tripId
      });
      
      console.log('✅ Chat thread created:', newThread);
      chatThreadId = newThread.id;
      console.log('📋 Thread ID:', chatThreadId);
      console.log('👥 Adding users:', { organizerId, userId: requestData.userId });
      
      // Add both organizer and requester as participants
      await this.addUserToThread({ threadId: chatThreadId, userId: organizerId });
      console.log('✅ Organizer added to thread');
      await this.addUserToThread({ threadId: chatThreadId, userId: requestData.userId });
      console.log('✅ Requester added to thread');
      
      console.log('✅ Chat thread created with participants:', chatThreadId);
    }

    const [updatedRequest] = await db
      .update(tripInterestRequests)
      .set({ 
        status, 
        chatThreadId: chatThreadId || requestData.chatThreadId,
        updatedAt: new Date() 
      })
      .where(eq(tripInterestRequests.id, requestId))
      .returning();
    
    console.log('🔄 Interest request updated:', { requestId, status, chatThreadId });
    return updatedRequest;
  }

  // Calendar Event operations
  async createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent> {
    const [calendarEvent] = await db.insert(calendarEvents).values(event).returning();
    return calendarEvent;
  }

  async getUserCalendarEvents(userId: string, startDate?: Date, endDate?: Date): Promise<CalendarEvent[]> {
    try {
      let query = db.select().from(calendarEvents).where(eq(calendarEvents.userId, userId));
      
      if (startDate && endDate) {
        const additionalConditions = and(
          gte(calendarEvents.eventDate, startDate),
          lte(calendarEvents.eventDate, endDate)
        );
        query = db.select().from(calendarEvents).where(
          and(
            eq(calendarEvents.userId, userId),
            additionalConditions
          )
        );
      }
      
      const events = await query.orderBy(asc(calendarEvents.eventDate));
      return events;
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      return [];
    }
  }

  async getCalendarEvent(id: string): Promise<CalendarEvent | undefined> {
    const [event] = await db.select().from(calendarEvents).where(eq(calendarEvents.id, id));
    return event;
  }

  async updateCalendarEvent(id: string, eventData: Partial<InsertCalendarEvent>): Promise<CalendarEvent> {
    const [updatedEvent] = await db
      .update(calendarEvents)
      .set({ ...eventData, updatedAt: new Date() })
      .where(eq(calendarEvents.id, id))
      .returning();
    return updatedEvent;
  }

  async deleteCalendarEvent(id: string): Promise<void> {
    await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
  }

  // Saved trips operations (Pin and Interest system)
  async upsertSavedTrip(userId: string, tripId: string, saveType: 'pinned' | 'interested'): Promise<SavedTrip> {
    try {
      const [savedTrip] = await db
        .insert(savedTrips)
        .values({
          userId,
          tripId,
          saveType,
          updatedAt: new Date()
        })
        .onConflictDoUpdate({
          target: [savedTrips.userId, savedTrips.tripId],
          set: {
            saveType,
            updatedAt: new Date()
          }
        })
        .returning();
      
      return savedTrip;
    } catch (error) {
      console.error('Error upserting saved trip (table may not exist):', error);
      throw new Error('Database not ready - please try again in a moment');
    }
  }

  async removeSavedTrip(userId: string, tripId: string): Promise<void> {
    await db.delete(savedTrips)
      .where(and(eq(savedTrips.userId, userId), eq(savedTrips.tripId, tripId)));
  }

  async getSavedTrip(userId: string, tripId: string): Promise<SavedTrip | undefined> {
    try {
      const [savedTrip] = await db
        .select()
        .from(savedTrips)
        .where(and(eq(savedTrips.userId, userId), eq(savedTrips.tripId, tripId)));
      return savedTrip;
    } catch (error) {
      console.error('Error getting saved trip (table may not exist):', error);
      return undefined;
    }
  }

  async getUserSavedTrips(userId: string, saveType?: 'pinned' | 'interested'): Promise<SavedTripWithTrip[]> {
    const baseQuery = db
      .select({
        savedTrip: savedTrips,
        trip: trips,
        organizer: users,
      })
      .from(savedTrips)
      .innerJoin(trips, eq(savedTrips.tripId, trips.id))
      .innerJoin(users, eq(trips.organizerId, users.id));

    // Build conditions
    const conditions = [eq(savedTrips.userId, userId)];
    if (saveType) {
      conditions.push(eq(savedTrips.saveType, saveType));
    }

    const results = await baseQuery
      .where(and(...conditions))
      .orderBy(desc(savedTrips.updatedAt));

    return results.map(({ savedTrip, trip, organizer }) => ({
      ...savedTrip,
      trip: {
        ...trip,
        organizer,
      },
    }));
  }

  // Notification operations for saved trips
  async createSaveNotification(
    userId: string, 
    tripId: string, 
    type: 'trip_updated' | 'trip_removed' | 'save_removed', 
    payload: Record<string, any> = {}
  ): Promise<SaveNotification> {
    const [notification] = await db
      .insert(notifications)
      .values({
        userId,
        tripId,
        type,
        category: 'trips',
        priority: 'normal',
        title: this.getNotificationTitle(type),
        message: this.getNotificationMessage(type, payload),
        payload,
        isRead: false,
      })
      .returning();

    return {
      id: notification.id,
      userId: notification.userId,
      tripId: notification.tripId || null,
      type: notification.type as 'trip_updated' | 'trip_removed' | 'save_removed',
      payload: notification.payload as Record<string, any>,
      isRead: notification.isRead || false,
      createdAt: notification.createdAt || new Date(),
    };
  }

  async getUserNotifications(userId: string, limit: number = 20, offset: number = 0): Promise<SaveNotification[]> {
    // For now, return empty array until database is properly migrated
    try {
      const results = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset);

      return results.map(notification => ({
        id: notification.id,
        userId: notification.userId,
        tripId: notification.tripId || null,
        type: (notification.type as 'trip_updated' | 'trip_removed' | 'save_removed') || 'trip_updated',
        category: notification.category || 'trips',
        priority: notification.priority || 'normal',
        title: notification.title || '',
        message: notification.message || '',
        payload: (notification.payload as Record<string, any>) || {},
        isRead: notification.isRead || false,
        actionUrl: notification.actionUrl || null,
        primaryActionLabel: notification.primaryActionLabel || null,
        primaryActionUrl: notification.primaryActionUrl || null,
        secondaryActionLabel: notification.secondaryActionLabel || null,
        secondaryActionUrl: notification.secondaryActionUrl || null,
        relatedTripId: notification.relatedTripId || null,
        relatedUserId: notification.relatedUserId || null,
        metadata: notification.metadata || {},
        commentId: notification.commentId || null,
        threadId: notification.threadId || null,
        createdAt: notification.createdAt || new Date(),
        updatedAt: notification.updatedAt || new Date(),
      }));
    } catch (error) {
      console.error('Error fetching notifications (database may not be migrated):', error);
      return [];
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true, updatedAt: new Date() })
      .where(eq(notifications.id, notificationId));
  }

  private getNotificationTitle(type: 'trip_updated' | 'trip_removed' | 'save_removed'): string {
    switch (type) {
      case 'trip_updated':
        return 'Saved Trip Updated';
      case 'trip_removed':
        return 'Saved Trip Removed';
      case 'save_removed':
        return 'Trip Save Removed';
      default:
        return 'Trip Notification';
    }
  }

  private getNotificationMessage(type: 'trip_updated' | 'trip_removed' | 'save_removed', payload: Record<string, any>): string {
    switch (type) {
      case 'trip_updated':
        const changedFields = Object.keys(payload);
        return `A trip you saved has been updated. Changes: ${changedFields.join(', ')}`;
      case 'trip_removed':
        return 'A trip you saved has been removed by the organizer.';
      case 'save_removed':
        return 'Your saved trip has been removed from your list.';
      default:
        return 'You have a new notification about a saved trip.';
    }
  }

  // Additional chat-related methods for Chat Buddy functionality
  async getAcceptedTripParticipants(tripId: string): Promise<User[]> {
    const result = await db
      .select()
      .from(tripInterestRequests)
      .leftJoin(users, eq(tripInterestRequests.userId, users.id))
      .where(and(
        eq(tripInterestRequests.tripId, tripId),
        eq(tripInterestRequests.status, 'accepted')
      ));
    
    return result.map(({ users: user }) => user!).filter(Boolean);
  }

  async getTripChatThread(tripId: string, user1Id: string, user2Id: string): Promise<ChatThread | undefined> {
    // Find existing thread for this trip between these users
    const existingThreadResult = await db
      .select()
      .from(chatThreads)
      .where(eq(chatThreads.tripId, tripId));

    for (const thread of existingThreadResult) {
      const threadUserIds = await db
        .select({ userId: threadUsers.userId })
        .from(threadUsers)
        .where(eq(threadUsers.threadId, thread.id));
      
      const userIds = threadUserIds.map(tu => tu.userId);
      if (userIds.includes(user1Id) && userIds.includes(user2Id)) {
        return thread;
      }
    }

    return undefined;
  }

  async incrementUnreadCount(threadId: string, userId: string): Promise<void> {
    await db
      .update(threadUsers)
      .set({ 
        unreadCount: sql`${threadUsers.unreadCount} + 1`
      })
      .where(and(
        eq(threadUsers.threadId, threadId),
        eq(threadUsers.userId, userId)
      ));
  }

  async resetUnreadCount(threadId: string, userId: string): Promise<void> {
    await db
      .update(threadUsers)
      .set({ 
        unreadCount: 0,
        lastReadAt: new Date()
      })
      .where(and(
        eq(threadUsers.threadId, threadId),
        eq(threadUsers.userId, userId)
      ));
  }

  // Legacy vote methods removed - replaced with upvote system

  // Contact sharing feature deprecated - removed from Ceylon Expand

  // Admin/moderation methods for contact sharing oversight
  async getContactSharesForAdmin(filters?: {
    threadId?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<(ContactShare & { user: User, threadDetails?: any })[]> {
    const conditions = [];
    
    if (filters?.threadId) {
      conditions.push(eq(contactShares.threadId, filters.threadId));
    }
    
    if (filters?.userId) {
      conditions.push(eq(contactShares.sharedBy, filters.userId));
    }
    
    if (filters?.startDate) {
      conditions.push(gte(contactShares.sharedAt, filters.startDate));
    }
    
    if (filters?.endDate) {
      conditions.push(lte(contactShares.sharedAt, filters.endDate));
    }

    const query = db
      .select()
      .from(contactShares)
      .leftJoin(users, eq(contactShares.sharedBy, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(contactShares.sharedAt));
      
    if (filters?.limit) {
      query.limit(filters.limit);
    }

    const result = await query;
    
    return result.map(({ contact_shares: share, users: user }) => ({
      ...share,
      user: user!
    }));
  }

  async getAuditLogs(filters?: {
    action?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<AuditLog[]> {
    const conditions = [];
    
    if (filters?.action) {
      conditions.push(eq(auditLogs.action, filters.action));
    }
    
    if (filters?.userId) {
      conditions.push(eq(auditLogs.actorUserId, filters.userId));
    }
    
    if (filters?.startDate) {
      conditions.push(gte(auditLogs.createdAt, filters.startDate));
    }
    
    if (filters?.endDate) {
      conditions.push(lte(auditLogs.createdAt, filters.endDate));
    }

    const query = db
      .select()
      .from(auditLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(auditLogs.createdAt));
      
    if (filters?.limit) {
      query.limit(filters.limit);
    }

    return await query;
  }

  // Calendar-specific methods for enhanced calendar functionality
  async getTripsInDateRange(startDate: Date, endDate: Date): Promise<TripWithOrganizer[]> {
    const result = await db
      .select()
      .from(trips)
      .leftJoin(users, eq(trips.organizerId, users.id))
      .where(
        and(
          eq(trips.isDeleted, false),
          gte(trips.date, startDate),
          lte(trips.date, endDate)
        )
      )
      .orderBy(trips.date, trips.time);
    
    return result.map(({ trips: trip, users: organizer }) => ({
      ...trip,
      organizer: organizer!,
    }));
  }

  async getUserPinnedTrips(userId: string): Promise<TripWithOrganizer[]> {
    const pinnedTripsWithDetails = await db
      .select({
        trip: trips,
        organizer: users,
      })
      .from(userTripFlags)
      .innerJoin(trips, eq(userTripFlags.tripId, trips.id))
      .innerJoin(users, eq(trips.organizerId, users.id))
      .where(and(eq(userTripFlags.userId, userId), eq(userTripFlags.pinned, true)))
      .orderBy(desc(userTripFlags.updatedAt));

    return pinnedTripsWithDetails.map(({ trip, organizer }) => ({
      ...trip,
      organizer,
    }));
  }

  async getUserInterestedTrips(userId: string): Promise<TripWithOrganizer[]> {
    const interestedTripsWithDetails = await db
      .select({
        trip: trips,
        organizer: users,
      })
      .from(userTripFlags)
      .innerJoin(trips, eq(userTripFlags.tripId, trips.id))
      .innerJoin(users, eq(trips.organizerId, users.id))
      .where(and(eq(userTripFlags.userId, userId), eq(userTripFlags.interested, true)))
      .orderBy(desc(userTripFlags.updatedAt));

    return interestedTripsWithDetails.map(({ trip, organizer }) => ({
      ...trip,
      organizer,
    }));
  }

  // ===== ENHANCED CHAT SYSTEM IMPLEMENTATION =====
  // New comprehensive chat system with organizer approval workflow

  async getChatThreadByTripAndUsers(tripId: string, organizerId: string, userId: string): Promise<any | undefined> {
    const [thread] = await db
      .select()
      .from(chatThreads)
      .where(
        and(
          eq(chatThreads.tripId, tripId),
          eq(chatThreads.organizerId, organizerId),
          eq(chatThreads.userId, userId)
        )
      );
    return thread;
  }

  async createChatParticipantState(state: { threadId: string; userId: string; unreadCount: number }): Promise<any> {
    const [participantState] = await db
      .insert(chatParticipantState)
      .values({
        threadId: state.threadId,
        userId: state.userId,
        unreadCount: state.unreadCount,
        lastReadAt: null,
        muted: false,
        joinedAt: new Date()
      })
      .returning();
    return participantState;
  }

  async getChatThreadsForUser(userId: string): Promise<any[]> {
    // Get threads where user is either organizer or participant
    const threadsAsOrganizer = await db
      .select({
        thread: chatThreads,
        trip: trips,
        otherUser: users
      })
      .from(chatThreads)
      .leftJoin(trips, eq(chatThreads.tripId, trips.id))
      .leftJoin(users, eq(chatThreads.userId, users.id))
      .where(eq(chatThreads.organizerId, userId));

    const threadsAsParticipant = await db
      .select({
        thread: chatThreads,
        trip: trips,
        otherUser: users
      })
      .from(chatThreads)
      .leftJoin(trips, eq(chatThreads.tripId, trips.id))
      .leftJoin(users, eq(chatThreads.organizerId, users.id))
      .where(eq(chatThreads.userId, userId));

    // Get participant state for unread counts
    const allThreads = [...threadsAsOrganizer, ...threadsAsParticipant];
    const threadsWithState = await Promise.all(
      allThreads.map(async ({ thread, trip, otherUser }) => {
        const [state] = await db
          .select()
          .from(chatParticipantState)
          .where(
            and(
              eq(chatParticipantState.threadId, thread.id),
              eq(chatParticipantState.userId, userId)
            )
          );

        return {
          ...thread,
          trip,
          otherUser,
          unreadCount: state?.unreadCount || 0
        };
      })
    );

    return threadsWithState;
  }

  async closeChatThread(threadId: string): Promise<void> {
    // Update thread status to closed
    await db
      .update(chatThreads)
      .set({ 
        status: 'closed',
        updatedAt: new Date()
      })
      .where(eq(chatThreads.id, threadId));

    // Delete all messages and attachments (purge content as per spec)
    await db
      .delete(chatMessages)
      .where(eq(chatMessages.threadId, threadId));

    // Keep participant state for audit purposes but reset unread counts
    await db
      .update(chatParticipantState)
      .set({ unreadCount: 0 })
      .where(eq(chatParticipantState.threadId, threadId));
  }

  async createChatMessage(message: { 
    threadId: string; 
    senderId: string; 
    kind: string; 
    text?: string | null; 
    meta?: any 
  }): Promise<any> {
    const [chatMessage] = await db
      .insert(chatMessages)
      .values({
        id: sql`gen_random_uuid()`,
        threadId: message.threadId,
        senderId: message.senderId,
        kind: message.kind as any,
        text: message.text,
        meta: message.meta,
        createdAt: new Date()
      })
      .returning();
    return chatMessage;
  }

  async getChatMessages(
    threadId: string, 
    options: { cursor?: string; limit: number }
  ): Promise<any[]> {
    let query = db
      .select({
        message: chatMessages,
        sender: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
          profileImageUrl: users.profileImageUrl
        }
      })
      .from(chatMessages)
      .leftJoin(users, eq(chatMessages.senderId, users.id))
      .where(eq(chatMessages.threadId, threadId))
      .orderBy(asc(chatMessages.createdAt)) // 🔥 CEYLONX CHALLENGE FIX: WhatsApp-style chronological order 🔥
      .limit(options.limit);

    if (options.cursor) {
      query = query.where(
        and(
          eq(chatMessages.threadId, threadId),
          sql`${chatMessages.createdAt} < ${new Date(options.cursor)}`
        )
      );
    }

    const results = await query;
    
    return results.map(({ message, sender }) => ({
      ...message,
      sender
    }));
  }

  async markChatMessagesAsRead(threadId: string, userId: string): Promise<void> {
    // Reset unread count for the user in this thread
    await db
      .update(chatParticipantState)
      .set({ 
        unreadCount: 0,
        lastReadAt: new Date()
      })
      .where(
        and(
          eq(chatParticipantState.threadId, threadId),
          eq(chatParticipantState.userId, userId)
        )
      );
  }

  async getChatMessage(messageId: string): Promise<any | undefined> {
    const [message] = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.id, messageId));
    return message;
  }

  async muteChatThread(threadId: string, userId: string): Promise<void> {
    await db
      .update(chatParticipantState)
      .set({ muted: true })
      .where(
        and(
          eq(chatParticipantState.threadId, threadId),
          eq(chatParticipantState.userId, userId)
        )
      );
  }

  // New upvote helper methods
  async getUserUpvote(userId: string, itemType: 'question' | 'answer', itemId: string): Promise<any | undefined> {
    if (itemType === 'question') {
      const [upvote] = await db
        .select()
        .from(questionUpvotes)
        .where(and(
          eq(questionUpvotes.userId, userId),
          eq(questionUpvotes.questionId, itemId)
        ));
      return upvote;
    } else {
      const [upvote] = await db
        .select()
        .from(answerUpvotes)
        .where(and(
          eq(answerUpvotes.userId, userId),
          eq(answerUpvotes.answerId, itemId)
        ));
      return upvote;
    }
  }

  async addUpvote(userId: string, itemType: 'question' | 'answer', itemId: string): Promise<void> {
    if (itemType === 'question') {
      await db.insert(questionUpvotes).values({
        userId,
        questionId: itemId,
      });
    } else {
      await db.insert(answerUpvotes).values({
        userId,
        answerId: itemId,
      });
    }
  }

  async removeUpvote(userId: string, itemType: 'question' | 'answer', itemId: string): Promise<void> {
    if (itemType === 'question') {
      await db
        .delete(questionUpvotes)
        .where(and(
          eq(questionUpvotes.userId, userId),
          eq(questionUpvotes.questionId, itemId)
        ));
    } else {
      await db
        .delete(answerUpvotes)
        .where(and(
          eq(answerUpvotes.userId, userId),
          eq(answerUpvotes.answerId, itemId)
        ));
    }
  }

  async calculateUpvoteScore(itemType: 'question' | 'answer', itemId: string): Promise<number> {
    if (itemType === 'question') {
      const result = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(questionUpvotes)
        .where(eq(questionUpvotes.questionId, itemId));
      return result[0]?.count || 0;
    } else {
      const result = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(answerUpvotes)
        .where(eq(answerUpvotes.answerId, itemId));
      return result[0]?.count || 0;
    }
  }

  async updateUpvoteScore(itemType: 'question' | 'answer', itemId: string, score: number): Promise<void> {
    if (itemType === 'question') {
      await db
        .update(questions)
        .set({ score })
        .where(eq(questions.id, itemId));
    } else {
      await db
        .update(answers)
        .set({ score })
        .where(eq(answers.id, itemId));
    }
  }

  async getItemWithScore(itemType: 'question' | 'answer', itemId: string): Promise<any> {
    if (itemType === 'question') {
      const [question] = await db
        .select()
        .from(questions)
        .where(eq(questions.id, itemId));
      return question;
    } else {
      const [answer] = await db
        .select()
        .from(answers)
        .where(eq(answers.id, itemId));
      return answer;
    }
  }

  // Raw query execution for admin/moderation operations
  async executeRawQuery(query: string, params: any[] = []): Promise<any[]> {
    try {
      // For parameterized queries, we need to construct the SQL properly
      let processedQuery = query;
      
      // Replace $1, $2, etc. with actual values for now (simple implementation)
      if (params && params.length > 0) {
        params.forEach((param, index) => {
          const placeholder = `$${index + 1}`;
          const value = typeof param === 'string' ? `'${param.replace(/'/g, "''")}'` : 
                       param === null ? 'NULL' : 
                       param === undefined ? 'NULL' : 
                       String(param);
          processedQuery = processedQuery.replace(placeholder, value);
        });
      }
      
      const result = await db.execute(sql.raw(processedQuery));
      return Array.isArray(result) ? result : result.rows || [];
    } catch (error) {
      console.error('Raw query execution error:', error);
      console.error('Query:', query);
      console.error('Params:', params);
      throw error;
    }
  }

  // Admin helper methods
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getAllTrips(): Promise<Trip[]> {
    return await db.select().from(trips);
  }

  // User preferences operations (from users table)
  async getUserPreferences(userId: string): Promise<any> {
    const [user] = await db
      .select({
        vibe: users.vibe,
        companions: users.companions,
        interests: users.interests,
        months: users.months,
        regions: users.regions,
        budgetMin: users.budgetMin,
        budgetMax: users.budgetMax,
      })
      .from(users)
      .where(eq(users.id, userId));
    
    return user || {
      vibe: [],
      companions: [],
      interests: [],
      months: [],
      regions: [],
      budgetMin: null,
      budgetMax: null,
    };
  }

  async updateUserPreferences(userId: string, preferences: any): Promise<any> {
    const updateData: any = {};
    
    if (preferences.vibe !== undefined) updateData.vibe = preferences.vibe;
    if (preferences.companions !== undefined) updateData.companions = preferences.companions;
    if (preferences.interests !== undefined) updateData.interests = preferences.interests;
    if (preferences.months !== undefined) updateData.months = preferences.months;
    if (preferences.regions !== undefined) updateData.regions = preferences.regions;
    if (preferences.budgetMin !== undefined) updateData.budgetMin = preferences.budgetMin;
    if (preferences.budgetMax !== undefined) updateData.budgetMax = preferences.budgetMax;
    
    updateData.updatedAt = new Date();

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning({
        vibe: users.vibe,
        companions: users.companions,
        interests: users.interests,
        months: users.months,
        regions: users.regions,
        budgetMin: users.budgetMin,
        budgetMax: users.budgetMax,
      });

    return updatedUser;
  }

  // User personalization operations (from users table)
  async getUserPersonalization(userId: string): Promise<any> {
    const [user] = await db
      .select({
        isPaused: users.isPaused,
        resetAt: users.resetAt,
        abTestGroup: users.abTestGroup,
      })
      .from(users)
      .where(eq(users.id, userId));
    
    return user || {
      isPaused: false,
      resetAt: null,
      abTestGroup: 'personalized',
    };
  }

  async updateUserPersonalization(userId: string, personalization: any): Promise<any> {
    const updateData: any = {};
    
    if (personalization.isPaused !== undefined) updateData.isPaused = personalization.isPaused;
    if (personalization.resetAt !== undefined) updateData.resetAt = personalization.resetAt;
    if (personalization.abTestGroup !== undefined) updateData.abTestGroup = personalization.abTestGroup;
    
    updateData.updatedAt = new Date();

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning({
        isPaused: users.isPaused,
        resetAt: users.resetAt,
        abTestGroup: users.abTestGroup,
      });

    return updatedUser;
  }
}

export const storage = new DatabaseStorage();
