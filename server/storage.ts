import {
  users,
  trips,
  tripParticipants,
  comments,
  ratings,
  reports,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, ilike, desc, asc, gte, lte, count } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
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
  }): Promise<TripWithOrganizer[]>;
  
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
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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
  }): Promise<TripWithOrganizer[]> {
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
      conditions.push(
        or(
          ilike(trips.title, `%${filters.search}%`),
          ilike(trips.fromLocation, `%${filters.search}%`),
          ilike(trips.toLocation, `%${filters.search}%`)
        )
      );
    }

    const result = await db
      .select()
      .from(trips)
      .leftJoin(users, eq(trips.organizerId, users.id))
      .where(and(...conditions))
      .orderBy(asc(trips.date));
    
    return result.map(({ trips: trip, users: organizer }) => ({
      ...trip,
      organizer: organizer!,
    }));
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
}

export const storage = new DatabaseStorage();
