import {
  users,
  trips,
  comments,
  ratings,
  reports,
  topics,
  questions,
  answers,
  votes,
  userPreferences,
  userInteractions,
  tripFeatures,
  kpiEvents,
  userPersonalization,
  notifications,
  tripViews,
  authSessions,
  emailTokens,
  phoneOtps,
  tripInterestRequests,
  calendarEvents,
  pinnedTrips,
  userTripFlags,
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
  type InsertVote,
  type Vote,
  type InsertUserPreferences,
  type UserPreferences,
  type InsertUserInteraction,
  type UserInteraction,
  type InsertTripFeatures,
  type TripFeatures,
  type InsertKpiEvent,
  type KpiEvent,
  type InsertUserPersonalization,
  type UserPersonalization,
  type Notification,
  type InsertNotification,
  type TripInterestRequest,
  type InsertTripInterestRequest,
  chatThreads,
  type ChatThread,
  type InsertChatThread,
  threadUsers,
  type ThreadUser,
  type InsertThreadUser,
  messages,
  type Message,
  type InsertMessage,
  type CalendarEvent,
  type InsertCalendarEvent,
  type PinnedTrip,
  type InsertPinnedTrip,
  type UserTripFlags,
  type InsertUserTripFlags,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, ilike, desc, asc, gte, lte, count, sql, isNull } from "drizzle-orm";

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
  
  // Votes
  createVote(vote: InsertVote): Promise<Vote>;
  getUserVote(userId: string, questionId?: string, answerId?: string): Promise<Vote | undefined>;
  updateVote(userId: string, questionId: string | undefined, answerId: string | undefined, voteType: 'up' | 'down'): Promise<Vote>;
  deleteVote(userId: string, questionId?: string, answerId?: string): Promise<void>;

  // ML Recommendations
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  upsertUserPreferences(userId: string, preferences: Partial<InsertUserPreferences>): Promise<UserPreferences>;
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
  
  // User Personalization
  getUserPersonalization(userId: string): Promise<UserPersonalization | undefined>;
  upsertUserPersonalization(userId: string, settings: Partial<InsertUserPersonalization>): Promise<UserPersonalization>;
  
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
  getUserChatThreads(userId: string): Promise<(ChatThread & { lastMessage?: Message, unreadCount: number, otherUser?: User, trip?: Trip })[]>;
  addUserToThread(threadUser: InsertThreadUser): Promise<ThreadUser>;
  removeUserFromThread(threadId: string, userId: string): Promise<void>;
  isUserInThread(threadId: string, userId: string): Promise<boolean>;
  getOrCreateChatThread(tripId: string, user1Id: string, user2Id: string): Promise<ChatThread>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getThreadMessages(threadId: string, limit?: number, cursor?: string): Promise<(Message & { author: User })[]>;
  getThreadUsers(threadId: string): Promise<User[]>;
  
  // Contact sharing operations
  isThreadOrganizer(userId: string, threadId: string): Promise<boolean>;
  createContactShare(contactShare: InsertContactShare): Promise<ContactShare>;
  createAuditLog(action: string, actorUserId: string, metadata?: any): Promise<void>;
  getRecentContactShares(threadId: string, hoursBack?: number): Promise<ContactShare[]>;
  
  // Admin/moderation operations
  getContactSharesForAdmin(filters?: {
    threadId?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<(ContactShare & { user: User, threadDetails?: any })[]>;
  getAuditLogs(filters?: {
    action?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<AuditLog[]>;
  
  // Calendar Event operations
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  getUserCalendarEvents(userId: string, startDate?: Date, endDate?: Date): Promise<CalendarEvent[]>;
  getCalendarEvent(id: string): Promise<CalendarEvent | undefined>;
  updateCalendarEvent(id: string, event: Partial<InsertCalendarEvent>): Promise<CalendarEvent>;
  deleteCalendarEvent(id: string): Promise<void>;
  
  // Pinned trips operations  
  pinTrip(userId: string, tripId: string): Promise<PinnedTrip>;
  unpinTrip(userId: string, tripId: string): Promise<void>;
  getUserPinnedTrips(userId: string): Promise<TripWithOrganizer[]>;
  getTripPinStatus(userId: string, tripId: string): Promise<boolean>;
  
  // User trip flags operations (unified pinned/interested state)
  upsertUserTripFlags(userId: string, tripId: string, flags: Partial<Pick<UserTripFlags, 'pinned' | 'interested'>>): Promise<UserTripFlags>;
  getUserTripFlags(userId: string, tripId: string): Promise<UserTripFlags | undefined>;
  getUserInterestedTrips(userId: string): Promise<TripWithOrganizer[]>;
  getUserPinnedTripsOnly(userId: string): Promise<TripWithOrganizer[]>;
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
        eq(trips.isDeleted, false),
        or(
          isNull(trips.imageUrl),
          eq(trips.imageUrl, '')
        )
      ));
    return result;
  }

  async updateTripImage(tripId: string, imageUrl: string): Promise<void> {
    await db
      .update(trips)
      .set({ imageUrl, updatedAt: new Date() })
      .where(eq(trips.id, tripId));
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
      
      // Ultra-simple query to test
      const result = await db
        .select()
        .from(questions)
        .where(and(eq(questions.userId, userId), eq(questions.isDeleted, false)))
        .orderBy(desc(questions.createdAt));

      console.log('✅ Basic questions query successful, found:', result.length);

      // Return minimal structure
      return result.map(question => ({
        ...question,
        user: { id: userId, name: 'Test User', email: null, phone: null, image: null, provider: null, firstName: 'Test', lastName: 'User', username: null, profileImageUrl: null, phoneNumber: null, bio: null, googleId: null, facebookId: null, microsoftId: null, appleId: null, emailVerified: false, createdAt: new Date(), updatedAt: new Date() },
        topic: { id: question.topicId || '', name: 'General', slug: 'general', description: null, createdAt: new Date() },
        answers: [],
        votesCount: 0,
        answersCount: 0,
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

    // Get paginated results
    const query = db
      .select()
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
      ...questionData,
      slug: questionData.slug || questionData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
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
    
    // Build where conditions
    const conditions = [eq(questions.isDeleted, false)];
    
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
        orderBy = [desc(questions.votesCount)];
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
        score: sql`0`, // Default to 0 since column doesn't exist
        votesCount: questions.votesCount,
        answersCount: questions.answersCount,
        acceptedAnswerId: questions.acceptedAnswerId,
        isDeleted: questions.isDeleted,
        deletedAt: questions.deletedAt,
        createdAt: questions.createdAt,
        updatedAt: questions.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
          profileImageUrl: users.profileImageUrl,
          phoneNumber: users.phoneNumber,
          bio: users.bio,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
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
    
    // Fetch answers for each question
    const questionsWithAnswers = await Promise.all(
      questionsData.map(async (question) => {
        const answers = await this.getQuestionAnswers(question.id);
        return {
          ...question,
          answers,
        };
      })
    );
    
    return {
      questions: questionsWithAnswers as QuestionWithDetails[],
      total: totalCount
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
        createdAt: questions.createdAt,
        updatedAt: questions.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
          profileImageUrl: users.profileImageUrl,
          phoneNumber: users.phoneNumber,
          bio: users.bio,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
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
    
    return {
      ...question,
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
        votesCount: answers.votesCount,
        isAccepted: answers.isAccepted,
        createdAt: answers.createdAt,
        updatedAt: answers.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
          profileImageUrl: users.profileImageUrl,
          phoneNumber: users.phoneNumber,
          bio: users.bio,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(answers)
      .leftJoin(users, eq(answers.userId, users.id))
      .where(eq(answers.questionId, questionId))
      .orderBy(desc(answers.votesCount));
    
    return answersData as AnswerWithUser[];
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
  async upsertVote(userId: string, votableType: 'question' | 'answer', votableId: string, value: number): Promise<{ vote: Vote | null; score: number }> {
    // First, try to find existing vote
    const existingVote = await this.getUserVote(userId, votableType, votableId);
    
    if (value === 0) {
      // Clear vote (delete if exists)
      if (existingVote) {
        await db.delete(votes).where(and(
          eq(votes.userId, userId),
          eq(votes.votableType, votableType),
          eq(votes.votableId, votableId)
        ));
      }
    } else {
      // Create or update vote
      if (existingVote) {
        await db.update(votes)
          .set({ value, updatedAt: new Date() })
          .where(eq(votes.id, existingVote.id));
      } else {
        await db.insert(votes).values({
          userId,
          votableType,
          votableId,
          value
        });
      }
    }
    
    // Calculate new score and update denormalized counter
    const newScore = await this.calculateScore(votableType, votableId);
    await this.updateScore(votableType, votableId, newScore);
    
    // Get current vote after upsert
    const currentVote = value === 0 ? null : await this.getUserVote(userId, votableType, votableId);
    
    return { vote: currentVote || null, score: newScore };
  }

  private async calculateScore(votableType: 'question' | 'answer', votableId: string): Promise<number> {
    const result = await db
      .select({ totalScore: sql<number>`COALESCE(SUM(${votes.value}), 0)` })
      .from(votes)
      .where(and(
        eq(votes.votableType, votableType),
        eq(votes.votableId, votableId)
      ));
    
    return result[0]?.totalScore || 0;
  }

  private async updateScore(votableType: 'question' | 'answer', votableId: string, score: number): Promise<void> {
    if (votableType === 'question') {
      await db.update(questions)
        .set({ score, votesCount: Math.abs(score) }) // Keep backward compatibility
        .where(eq(questions.id, votableId));
    } else {
      await db.update(answers)
        .set({ score, votesCount: Math.abs(score) }) // Keep backward compatibility
        .where(eq(answers.id, votableId));
    }
  }

  async getUserVote(userId: string, votableType: 'question' | 'answer', votableId: string): Promise<Vote | undefined> {
    const [vote] = await db
      .select()
      .from(votes)
      .where(and(
        eq(votes.userId, userId),
        eq(votes.votableType, votableType),
        eq(votes.votableId, votableId)
      ));
    
    return vote;
  }

  // Legacy method for backward compatibility
  async getUserVoteLegacy(userId: string, questionId?: string, answerId?: string): Promise<Vote | undefined> {
    const votableType = questionId ? 'question' : 'answer';
    const votableId = questionId || answerId;
    
    if (!votableId) return undefined;
    
    return this.getUserVote(userId, votableType, votableId);
  }

  // Legacy methods - will be removed in future versions

  // ML Recommendations implementation
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    try {
      const [preferences] = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId));
      return preferences;
    } catch (error) {
      console.error("Error getting user preferences:", error);
      return undefined; // Return undefined if table/column doesn't exist yet
    }
  }

  async upsertUserPreferences(userId: string, prefs: Partial<InsertUserPreferences>): Promise<UserPreferences> {
    try {
      const [preferences] = await db
        .insert(userPreferences)
        .values({
          userId,
          ...prefs,
        } as any)
        .onConflictDoUpdate({
          target: userPreferences.userId,
          set: {
            ...prefs,
            updatedAt: new Date(),
          } as any,
        })
        .returning();
      return preferences;
    } catch (error) {
      console.error("Error saving user preferences:", error);
      // Return a fallback object if database columns don't exist yet
      return {
        id: `temp-${userId}`,
        userId,
        preferredRegions: prefs.preferredRegions || [],
        budgetRange: prefs.budgetRange || { min: 0, max: 1000 },
        preferredDays: prefs.preferredDays || [],
        preferredTimes: prefs.preferredTimes || [],
        tripTypes: prefs.tripTypes || [],
        groupSize: prefs.groupSize || "",
        travelStyle: prefs.travelStyle || "",
        interests: prefs.interests || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
    }
  }

  // New Travel Style Settings implementation
  async updateTravelStyleSettings(userId: string, settings: any): Promise<UserPreferences> {
    try {
      const [preferences] = await db
        .insert(userPreferences)
        .values({
          userId,
          vibe: settings.vibe,
          when: settings.when,
          companions: settings.companions,
          interests: settings.interests,
          updatedAt: new Date(),
        } as any)
        .onConflictDoUpdate({
          target: userPreferences.userId,
          set: {
            vibe: settings.vibe,
            when: settings.when,
            companions: settings.companions,
            interests: settings.interests,
            updatedAt: new Date(),
          } as any,
        })
        .returning();
      
      return preferences;
    } catch (error) {
      console.error("Error updating travel style settings:", error);
      // Return a fallback object
      return {
        id: `temp-${userId}`,
        userId,
        vibe: settings.vibe || [],
        when: settings.when || [],
        companions: settings.companions || [],
        interests: settings.interests || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
    }
  }

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

  // User Personalization implementation
  async getUserPersonalization(userId: string): Promise<UserPersonalization | undefined> {
    const [personalization] = await db
      .select()
      .from(userPersonalization)
      .where(eq(userPersonalization.userId, userId));
    return personalization;
  }

  async upsertUserPersonalization(userId: string, settings: Partial<InsertUserPersonalization>): Promise<UserPersonalization> {
    const [personalization] = await db
      .insert(userPersonalization)
      .values({
        userId,
        ...settings,
      } as any)
      .onConflictDoUpdate({
        target: userPersonalization.userId,
        set: {
          ...settings,
          updatedAt: new Date(),
        } as any,
      })
      .returning();
    return personalization;
  }

  // Notification implementation
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async getUserNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    const userNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
    return userNotifications;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
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

  async getUserChatThreads(userId: string): Promise<(ChatThread & { lastMessage?: Message, unreadCount: number, otherUser?: User, trip?: Trip })[]> {
    // Get all threads user is in
    const threadUserResult = await db
      .select()
      .from(threadUsers)
      .leftJoin(chatThreads, eq(threadUsers.threadId, chatThreads.id))
      .where(eq(threadUsers.userId, userId))
      .orderBy(desc(chatThreads.updatedAt));

    const threads: (ChatThread & { lastMessage?: Message, unreadCount: number, otherUser?: User, trip?: Trip })[] = [];
    
    for (const { thread_users: tu, chat_threads: thread } of threadUserResult) {
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
        .from(messages)
        .where(eq(messages.threadId, thread.id))
        .orderBy(desc(messages.createdAt))
        .limit(1);

      // Get other user in thread
      const otherUsers = await db
        .select()
        .from(threadUsers)
        .leftJoin(users, eq(threadUsers.userId, users.id))
        .where(and(
          eq(threadUsers.threadId, thread.id),
          sql`${threadUsers.userId} != ${userId}`
        ));
      
      const otherUser = otherUsers[0]?.users || undefined;

      // Simple unread count (in real app, you'd track read status per user)
      const [unreadResult] = await db
        .select({ count: count() })
        .from(messages)
        .where(and(
          eq(messages.threadId, thread.id),
          sql`${messages.authorId} != ${userId}`
        ));

      threads.push({
        ...thread,
        lastMessage,
        unreadCount: unreadResult?.count || 0,
        otherUser,
        trip
      });
    }

    return threads;
  }

  async addUserToThread(threadUser: InsertThreadUser): Promise<ThreadUser> {
    const [newThreadUser] = await db
      .insert(threadUsers)
      .values(threadUser)
      .returning();
    return newThreadUser;
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

  // Pinned trips operations
  async pinTrip(userId: string, tripId: string): Promise<PinnedTrip> {
    const [pinnedTrip] = await db.insert(pinnedTrips)
      .values({ userId, tripId })
      .returning();
    return pinnedTrip;
  }

  async unpinTrip(userId: string, tripId: string): Promise<void> {
    await db.delete(pinnedTrips)
      .where(and(eq(pinnedTrips.userId, userId), eq(pinnedTrips.tripId, tripId)));
  }

  async getUserPinnedTrips(userId: string): Promise<TripWithOrganizer[]> {
    const pinnedTripsWithDetails = await db
      .select({
        trip: trips,
        organizer: users,
      })
      .from(pinnedTrips)
      .innerJoin(trips, eq(pinnedTrips.tripId, trips.id))
      .innerJoin(users, eq(trips.organizerId, users.id))
      .where(eq(pinnedTrips.userId, userId))
      .orderBy(desc(pinnedTrips.createdAt));

    return pinnedTripsWithDetails.map(({ trip, organizer }) => ({
      ...trip,
      organizer,
    }));
  }

  async getTripPinStatus(userId: string, tripId: string): Promise<boolean> {
    const [pinnedTrip] = await db
      .select()
      .from(pinnedTrips)
      .where(and(eq(pinnedTrips.userId, userId), eq(pinnedTrips.tripId, tripId)))
      .limit(1);
    return !!pinnedTrip;
  }
  
  // User trip flags operations (unified pinned/interested state)
  async upsertUserTripFlags(userId: string, tripId: string, flags: Partial<Pick<UserTripFlags, 'pinned' | 'interested'>>): Promise<UserTripFlags> {
    // Handle precedence rule: if interested is true, force pinned to false
    const updatedFlags = { ...flags };
    if (updatedFlags.interested === true) {
      updatedFlags.pinned = false;
    }
    
    const [tripFlags] = await db
      .insert(userTripFlags)
      .values({
        userId,
        tripId,
        pinned: updatedFlags.pinned ?? false,
        interested: updatedFlags.interested ?? false,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: [userTripFlags.userId, userTripFlags.tripId],
        set: {
          ...updatedFlags,
          updatedAt: new Date()
        }
      })
      .returning();
    
    return tripFlags;
  }

  async getUserTripFlags(userId: string, tripId: string): Promise<UserTripFlags | undefined> {
    const [tripFlags] = await db
      .select()
      .from(userTripFlags)
      .where(and(eq(userTripFlags.userId, userId), eq(userTripFlags.tripId, tripId)));
    return tripFlags;
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

  async getUserPinnedTripsOnly(userId: string): Promise<TripWithOrganizer[]> {
    const pinnedOnlyTripsWithDetails = await db
      .select({
        trip: trips,
        organizer: users,
      })
      .from(userTripFlags)
      .innerJoin(trips, eq(userTripFlags.tripId, trips.id))
      .innerJoin(users, eq(trips.organizerId, users.id))
      .where(and(
        eq(userTripFlags.userId, userId), 
        eq(userTripFlags.pinned, true), 
        eq(userTripFlags.interested, false) // Only pinned, not interested
      ))
      .orderBy(desc(userTripFlags.updatedAt));

    return pinnedOnlyTripsWithDetails.map(({ trip, organizer }) => ({
      ...trip,
      organizer,
    }));
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

  // Missing vote methods for interface compliance
  async createVote(vote: InsertVote): Promise<Vote> {
    const [newVote] = await db.insert(votes).values(vote).returning();
    return newVote;
  }

  async updateVote(userId: string, questionId: string | undefined, answerId: string | undefined, voteType: 'up' | 'down'): Promise<Vote> {
    const value = voteType === 'up' ? 1 : -1;
    const votableType = questionId ? 'question' : 'answer';
    const votableId = questionId || answerId!;
    
    const [updatedVote] = await db
      .update(votes)
      .set({ value, updatedAt: new Date() })
      .where(and(
        eq(votes.userId, userId),
        eq(votes.votableType, votableType),
        eq(votes.votableId, votableId)
      ))
      .returning();
    
    return updatedVote;
  }

  async deleteVote(userId: string, questionId?: string, answerId?: string): Promise<void> {
    const votableType = questionId ? 'question' : 'answer';
    const votableId = questionId || answerId!;
    
    await db
      .delete(votes)
      .where(and(
        eq(votes.userId, userId),
        eq(votes.votableType, votableType),
        eq(votes.votableId, votableId)
      ));
  }

  // Contact sharing operations
  async isThreadOrganizer(userId: string, threadId: string): Promise<boolean> {
    const thread = await this.getChatThread(threadId);
    if (!thread?.tripId) return false;
    
    const trip = await this.getTrip(thread.tripId);
    return trip?.organizerId === userId;
  }

  async createContactShare(contactShare: InsertContactShare): Promise<ContactShare> {
    const [newContactShare] = await db
      .insert(contactShares)
      .values(contactShare)
      .returning();
    return newContactShare;
  }

  async createAuditLog(action: string, actorUserId: string, metadata?: any): Promise<void> {
    await db
      .insert(auditLogs)
      .values({
        action,
        actorUserId,
        targetType: 'contact_share',
        targetId: metadata?.threadId || '',
        metadata,
      });
  }

  async getRecentContactShares(threadId: string, hoursBack: number = 1): Promise<ContactShare[]> {
    const hoursAgo = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    return await db
      .select()
      .from(contactShares)
      .where(and(
        eq(contactShares.threadId, threadId),
        gte(contactShares.sharedAt, hoursAgo)
      ))
      .orderBy(desc(contactShares.sharedAt));
  }

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
}

export const storage = new DatabaseStorage();
