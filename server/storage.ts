import {
  users,
  trips,
  tripParticipants,
  comments,
  ratings,
  reports,
  topics,
  questions,
  answers,
  votes,
  type User,
  type UpsertUser,
  type InsertTrip,
  type Trip,
  type TripWithOrganizer,
  type InsertTripParticipant,
  type TripParticipant,
  type InsertComment,
  type Comment,
  type CommentWithUser,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, ilike, desc, asc, gte, lte, count } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
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
  
  // Trip participation operations
  joinTrip(participation: InsertTripParticipant): Promise<TripParticipant>;
  getTripParticipants(tripId: string): Promise<(TripParticipant & { user: User })[]>;
  getUserParticipations(userId: string): Promise<(TripParticipant & { trip: TripWithOrganizer })[]>;
  updateParticipationStatus(id: string, status: string): Promise<TripParticipant>;
  
  // Comment operations
  createComment(comment: InsertComment): Promise<Comment>;
  getTripComments(tripId: string): Promise<CommentWithUser[]>;
  deleteComment(id: string): Promise<void>;
  
  // Rating operations
  createRating(rating: InsertRating): Promise<Rating>;
  getTripRatings(tripId: string): Promise<Rating[]>;
  getUserRatings(userId: string): Promise<Rating[]>;
  
  // Report operations
  createReport(report: InsertReport): Promise<Report>;
  getReports(): Promise<Report[]>;
  
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
}

export const storage = new DatabaseStorage();
