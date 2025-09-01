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
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, ilike, desc, asc, gte, lte, count, sql } from "drizzle-orm";

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
  
  // Join request operations
  createJoinRequest(joinRequest: InsertJoinRequest): Promise<JoinRequest>;
  getJoinRequest(id: string): Promise<JoinRequest | undefined>;
  getTripJoinRequests(tripId: string): Promise<(JoinRequest & { requester: User })[]>;
  getUserJoinRequests(userId: string): Promise<(JoinRequest & { trip: Trip })[]>;
  updateJoinRequestStatus(id: string, status: "pending" | "accepted" | "declined" | "cancelled"): Promise<JoinRequest>;
  getExistingJoinRequest(tripId: string, requesterId: string): Promise<JoinRequest | undefined>;
  
  // Chat thread operations
  createChatThread(thread: InsertChatThread): Promise<ChatThread>;
  getChatThread(id: string): Promise<ChatThread | undefined>;
  getUserChatThreads(userId: string): Promise<(ChatThread & { lastMessage?: Message, unreadCount: number, otherUser?: User })[]>;
  addUserToThread(threadUser: InsertThreadUser): Promise<ThreadUser>;
  removeUserFromThread(threadId: string, userId: string): Promise<void>;
  isUserInThread(threadId: string, userId: string): Promise<boolean>;
  getOrCreateChatThread(tripId: string, user1Id: string, user2Id: string): Promise<ChatThread>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getThreadMessages(threadId: string, limit?: number, cursor?: string): Promise<(Message & { author: User })[]>;
  getThreadUsers(threadId: string): Promise<User[]>;
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
    
    // Delete join requests
    await db.delete(joinRequests).where(eq(joinRequests.requesterId, id));
    
    // Delete trip participants
    await db.delete(tripParticipants).where(eq(tripParticipants.userId, id));
    
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
    const [newTrip] = await db.insert(trips).values(trip).returning();
    return newTrip;
  }

  async getTrip(id: string): Promise<TripWithOrganizer | undefined> {
    const result = await db
      .select()
      .from(trips)
      .leftJoin(users, eq(trips.organizerId, users.id))
      .where(eq(trips.id, id));
    
    if (result.length === 0) return undefined;
    
    const { trips: trip, users: organizer } = result[0];
    return { ...trip, organizer: organizer! };
  }

  async updateTrip(id: string, trip: Partial<InsertTrip>): Promise<Trip> {
    const [updatedTrip] = await db
      .update(trips)
      .set({ ...trip, updatedAt: new Date() })
      .where(eq(trips.id, id))
      .returning();
    return updatedTrip;
  }

  async deleteTrip(id: string): Promise<void> {
    await db.delete(trips).where(eq(trips.id, id));
  }

  async getUserTrips(userId: string): Promise<TripWithOrganizer[]> {
    const result = await db
      .select()
      .from(trips)
      .leftJoin(users, eq(trips.organizerId, users.id))
      .where(eq(trips.organizerId, userId))
      .orderBy(desc(trips.createdAt));
    
    return result.map(({ trips: trip, users: organizer }) => ({
      ...trip,
      organizer: organizer!,
    }));
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
    const conditions = [eq(trips.status, "active")];
    
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
    
    const tripsWithOrganizers = result.map(({ trips: trip, users: organizer }) => ({
      ...trip,
      organizer: organizer!,
    }));
    
    return { trips: tripsWithOrganizers, total };
  }

  // Trip participation operations
  async joinTrip(participation: InsertTripParticipant): Promise<TripParticipant> {
    const [newParticipation] = await db
      .insert(tripParticipants)
      .values(participation)
      .returning();
    return newParticipation;
  }

  async getTripParticipants(tripId: string): Promise<(TripParticipant & { user: User })[]> {
    const result = await db
      .select()
      .from(tripParticipants)
      .leftJoin(users, eq(tripParticipants.userId, users.id))
      .where(eq(tripParticipants.tripId, tripId));
    
    return result.map(({ trip_participants, users: user }) => ({
      ...trip_participants,
      user: user!,
    }));
  }

  async getUserParticipations(userId: string): Promise<(TripParticipant & { trip: TripWithOrganizer })[]> {
    const result = await db
      .select()
      .from(tripParticipants)
      .leftJoin(trips, eq(tripParticipants.tripId, trips.id))
      .leftJoin(users, eq(trips.organizerId, users.id))
      .where(eq(tripParticipants.userId, userId));
    
    return result.map(({ trip_participants, trips: trip, users: organizer }) => ({
      ...trip_participants,
      trip: { ...trip!, organizer: organizer! },
    }));
  }

  async updateParticipationStatus(id: string, status: string): Promise<TripParticipant> {
    const [updatedParticipation] = await db
      .update(tripParticipants)
      .set({ status })
      .where(eq(tripParticipants.id, id))
      .returning();
    return updatedParticipation;
  }

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
      .where(eq(comments.tripId, tripId))
      .orderBy(desc(comments.createdAt));
    
    return result.map(({ comments: comment, users: user }) => ({
      ...comment,
      user: user!,
    }));
  }

  async deleteComment(id: string): Promise<void> {
    await db.delete(comments).where(eq(comments.id, id));
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
    const [question] = await db.insert(questions).values(questionData).returning();
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
    const conditions = [];
    
    if (filters?.search) {
      conditions.push(
        or(
          ilike(questions.title, `%${filters.search}%`),
          ilike(questions.body, `%${filters.search}%`)
        )
      );
    }
    
    if (filters?.topic) {
      const topic = await this.getTopic(filters.topic);
      if (topic) {
        conditions.push(eq(questions.topicId, topic.id));
      }
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
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
        tags: questions.tags,
        userId: questions.userId,
        topicId: questions.topicId,
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
      .where(eq(questions.id, id));
    
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
    await db.delete(questions).where(eq(questions.id, id));
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

  // Votes
  async createVote(voteData: InsertVote): Promise<Vote> {
    const [vote] = await db.insert(votes).values(voteData).returning();
    
    // Update vote counts
    if (voteData.questionId) {
      const upVoteCount = await db
        .select({ count: count() })
        .from(votes)
        .where(and(
          eq(votes.questionId, voteData.questionId),
          eq(votes.voteType, 'up')
        ));
      
      const downVoteCount = await db
        .select({ count: count() })
        .from(votes)
        .where(and(
          eq(votes.questionId, voteData.questionId),
          eq(votes.voteType, 'down')
        ));
      
      await db
        .update(questions)
        .set({ votesCount: upVoteCount[0].count - downVoteCount[0].count })
        .where(eq(questions.id, voteData.questionId));
    }
    
    if (voteData.answerId) {
      const upVoteCount = await db
        .select({ count: count() })
        .from(votes)
        .where(and(
          eq(votes.answerId, voteData.answerId),
          eq(votes.voteType, 'up')
        ));
      
      const downVoteCount = await db
        .select({ count: count() })
        .from(votes)
        .where(and(
          eq(votes.answerId, voteData.answerId),
          eq(votes.voteType, 'down')
        ));
      
      await db
        .update(answers)
        .set({ votesCount: upVoteCount[0].count - downVoteCount[0].count })
        .where(eq(answers.id, voteData.answerId));
    }
    
    return vote;
  }

  async getUserVote(userId: string, questionId?: string, answerId?: string): Promise<Vote | undefined> {
    const conditions = [eq(votes.userId, userId)];
    
    if (questionId) {
      conditions.push(eq(votes.questionId, questionId));
    }
    
    if (answerId) {
      conditions.push(eq(votes.answerId, answerId));
    }
    
    const [vote] = await db
      .select()
      .from(votes)
      .where(and(...conditions));
    
    return vote;
  }

  async updateVote(userId: string, questionId: string | undefined, answerId: string | undefined, voteType: 'up' | 'down'): Promise<Vote> {
    const conditions = [eq(votes.userId, userId)];
    
    if (questionId) {
      conditions.push(eq(votes.questionId, questionId));
    }
    
    if (answerId) {
      conditions.push(eq(votes.answerId, answerId));
    }
    
    const [vote] = await db
      .update(votes)
      .set({ voteType })
      .where(and(...conditions))
      .returning();
    
    return vote;
  }

  async deleteVote(userId: string, questionId?: string, answerId?: string): Promise<void> {
    const conditions = [eq(votes.userId, userId)];
    
    if (questionId) {
      conditions.push(eq(votes.questionId, questionId));
    }
    
    if (answerId) {
      conditions.push(eq(votes.answerId, answerId));
    }
    
    await db.delete(votes).where(and(...conditions));
  }

  // ML Recommendations implementation
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const [preferences] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    return preferences;
  }

  async upsertUserPreferences(userId: string, prefs: Partial<InsertUserPreferences>): Promise<UserPreferences> {
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

  async getUserChatThreads(userId: string): Promise<(ChatThread & { lastMessage?: Message, unreadCount: number, otherUser?: User })[]> {
    // Get all threads user is in
    const threadUserResult = await db
      .select()
      .from(threadUsers)
      .leftJoin(chatThreads, eq(threadUsers.threadId, chatThreads.id))
      .where(eq(threadUsers.userId, userId))
      .orderBy(desc(chatThreads.updatedAt));

    const threads: (ChatThread & { lastMessage?: Message, unreadCount: number, otherUser?: User })[] = [];
    
    for (const { thread_users: tu, chat_threads: thread } of threadUserResult) {
      if (!thread) continue;
      
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
        otherUser
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
}

export const storage = new DatabaseStorage();
