import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table for multi-provider auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  phone: varchar("phone").unique(),
  name: varchar("name"),
  image: varchar("image"),
  provider: varchar("provider"), // 'google' | 'facebook' | 'microsoft' | 'apple' | 'email' | 'phone'
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  username: varchar("username").unique(),
  profileImageUrl: varchar("profile_image_url"),
  phoneNumber: varchar("phone_number").unique(),
  bio: text("bio"),
  googleId: varchar("google_id").unique(),
  facebookId: varchar("facebook_id").unique(),
  microsoftId: varchar("microsoft_id").unique(),
  appleId: varchar("apple_id").unique(),
  emailVerified: boolean("email_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// JWT refresh token sessions
export const authSessions = pgTable("auth_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  refreshToken: varchar("refresh_token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Email magic link tokens
export const emailTokens = pgTable("email_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  tokenHash: varchar("token_hash").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [index("IDX_email_tokens_email").on(table.email)]);

// Phone OTP codes
export const phoneOtps = pgTable("phone_otps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phone: varchar("phone").notNull().unique(),
  codeHash: varchar("code_hash").notNull(),
  attempts: integer("attempts").default(0),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Trips table
export const trips = pgTable("trips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  fromLocation: varchar("from_location").notNull(),
  toLocation: varchar("to_location").notNull(),
  date: timestamp("date").notNull(),
  time: varchar("time").notNull(),
  seatsAvailable: integer("seats_available").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  region: varchar("region").notNull(),
  contactInfo: varchar("contact_info").notNull(),
  notes: text("notes"),
  organizerId: varchar("organizer_id").notNull(),
  status: varchar("status").default("active"), // active, full, completed, cancelled
  
  // Optional enhanced fields for better recommendations
  tags: text("tags").array(), // Optional: trip type tags like 'adventure', 'cultural', 'beach'
  priceMin: decimal("price_min", { precision: 10, scale: 2 }), // Optional: minimum price range
  priceMax: decimal("price_max", { precision: 10, scale: 2 }), // Optional: maximum price range
  duration: varchar("duration"), // Optional: duration like '1 day', '2-3 days', '1 week'
  difficulty: varchar("difficulty"), // Optional: 'easy', 'moderate', 'challenging'
  buddyFriendly: boolean("buddy_friendly").default(false), // Optional: suitable for solo travelers
  
  // Seasonality and safety
  seasonality: text("seasonality").array(), // Optional: ['dry_season', 'wet_season', 'year_round']
  safetyFlags: text("safety_flags").array(), // Optional: ['weather_dependent', 'road_conditions', 'equipment_required']
  
  // Exposure and ranking metrics
  viewCount: integer("view_count").default(0),
  bookingCount: integer("booking_count").default(0),
  freshBoost: decimal("fresh_boost", { precision: 3, scale: 2 }).default('1.0'), // New listing boost that decays
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});


// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // who receives the notification
  type: varchar("type").notNull(), // expanded notification types below
  category: varchar("category").notNull(), // "trips", "social", "safety", "system"
  priority: varchar("priority").notNull(), // "critical", "normal", "info"
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  relatedTripId: varchar("related_trip_id"), // optional: related trip
  relatedUserId: varchar("related_user_id"), // optional: who triggered the notification
  actionUrl: varchar("action_url"), // optional: where to navigate when clicked
  metadata: jsonb("metadata").default({}), // additional data for weather alerts, view counts, etc.
  // Deep-link context for notifications
  commentId: varchar("comment_id"), // For comment-related notifications
  threadId: varchar("thread_id"), // For chat message notifications
  createdAt: timestamp("created_at").defaultNow(),
});

// Comments table
export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id").notNull(),
  userId: varchar("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Trip Views table for tracking views and generating notifications
export const tripViews = pgTable("trip_views", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id").notNull(),
  userId: varchar("user_id"), // Optional - can be null for anonymous views
  viewerIp: varchar("viewer_ip"), // For anonymous tracking
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});


// Chat Threads table for private messaging
export const chatThreads = pgTable("chat_threads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id"), // Optional - link to trip that created this chat
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Thread Users junction table (many-to-many between users and threads)
export const threadUsers = pgTable("thread_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  threadId: varchar("thread_id").notNull(),
  userId: varchar("user_id").notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => ({
  // Unique constraint to prevent duplicate memberships
  uniqueThreadUser: unique().on(table.threadId, table.userId),
}));

// Messages table for chat conversations
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  threadId: varchar("thread_id").notNull(),
  authorId: varchar("author_id").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Ratings table
export const ratings = pgTable("ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id").notNull(),
  raterId: varchar("rater_id").notNull(),
  ratedId: varchar("rated_id").notNull(),
  rating: integer("rating").notNull(), // 1-5
  review: text("review"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reports table
export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id"),
  userId: varchar("user_id"),
  reporterId: varchar("reporter_id").notNull(),
  reason: varchar("reason").notNull(),
  description: text("description"),
  status: varchar("status").default("pending"), // pending, resolved, dismissed
  createdAt: timestamp("created_at").defaultNow(),
});

// Community Q&A Tables

// Topics table for categorizing questions
export const topics = pgTable("topics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  slug: varchar("slug").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Questions table
export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  body: text("body").notNull(),
  tags: text("tags").array(),
  userId: varchar("user_id").notNull(),
  topicId: varchar("topic_id"),
  votesCount: integer("votes_count").default(0),
  answersCount: integer("answers_count").default(0),
  acceptedAnswerId: varchar("accepted_answer_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Answers table
export const answers = pgTable("answers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  body: text("body").notNull(),
  questionId: varchar("question_id").notNull(),
  userId: varchar("user_id").notNull(),
  votesCount: integer("votes_count").default(0),
  isAccepted: boolean("is_accepted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Votes table for questions and answers
export const votes = pgTable("votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  questionId: varchar("question_id"),
  answerId: varchar("answer_id"),
  voteType: varchar("vote_type").notNull(), // 'up' or 'down'
  createdAt: timestamp("created_at").defaultNow(),
});

// User preferences table for ML recommendations
export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  preferredRegions: jsonb("preferred_regions").$type<string[]>().default([]),
  budgetRange: jsonb("budget_range").$type<{min: number, max: number}>(),
  preferredDays: jsonb("preferred_days").$type<string[]>().default([]), // ['weekday', 'weekend']
  preferredTimes: jsonb("preferred_times").$type<string[]>().default([]), // ['morning', 'afternoon', 'evening']
  tripTypes: jsonb("trip_types").$type<string[]>().default([]), // ['adventure', 'cultural', 'beach', 'nature']
  groupSize: varchar("group_size"), // 'solo', 'couple', 'small_group', 'large_group'
  travelStyle: varchar("travel_style"), // 'budget', 'comfort', 'luxury'
  interests: jsonb("interests").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User interactions table for tracking behavior
export const userInteractions = pgTable("user_interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  tripId: varchar("trip_id").notNull(),
  interactionType: varchar("interaction_type").notNull(), // 'view', 'click', 'bookmark', 'share', 'not_interested'
  duration: integer("duration"), // Duration in seconds for views (dwell_ms for quality signals)
  sessionId: varchar("session_id"), // anon_session_id for first-time visitors
  abTestGroup: varchar("ab_test_group"), // 'baseline' | 'personalized' for A/B testing
  createdAt: timestamp("created_at").defaultNow(),
});

// Trip features table for ML analysis
export const tripFeatures = pgTable("trip_features", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id").notNull().unique(),
  distanceKm: integer("distance_km"),
  popularityScore: decimal("popularity_score", { precision: 5, scale: 2 }).default("0"),
  avgRating: decimal("avg_rating", { precision: 3, scale: 2 }),
  totalBookings: integer("total_bookings").default(0),
  viewCount: integer("view_count").default(0),
  tags: jsonb("tags").$type<string[]>().default([]),
  difficulty: varchar("difficulty"), // 'easy', 'moderate', 'challenging'
  season: varchar("season"), // 'all_year', 'dry_season', 'wet_season'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// KPI tracking table for metrics and A/B testing
export const kpiEvents = pgTable("kpi_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  sessionId: varchar("session_id"),
  eventType: varchar("event_type").notNull(), // 'ctr_top5', 'save_session', 'chat_start', 'booking_start', 'return_7d'
  tripId: varchar("trip_id"),
  abTestGroup: varchar("ab_test_group"), // 'baseline' | 'personalized'
  eventData: jsonb("event_data"), // Additional event context
  createdAt: timestamp("created_at").defaultNow(),
});

// User personalization settings
export const userPersonalization = pgTable("user_personalization", {
  userId: varchar("user_id").primaryKey(),
  isPaused: boolean("is_paused").default(false), // User can pause personalization
  resetAt: timestamp("reset_at"), // When user last reset recommendations
  abTestGroup: varchar("ab_test_group").default('personalized'), // 'baseline' | 'personalized'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  organizedTrips: many(trips),
  comments: many(comments),
  givenRatings: many(ratings, { relationName: "raterRatings" }),
  receivedRatings: many(ratings, { relationName: "ratedRatings" }),
  reports: many(reports),
  authSessions: many(authSessions),
}));

export const authSessionsRelations = relations(authSessions, ({ one }) => ({
  user: one(users, {
    fields: [authSessions.userId],
    references: [users.id],
  }),
}));

export const tripsRelations = relations(trips, ({ one, many }) => ({
  organizer: one(users, {
    fields: [trips.organizerId],
    references: [users.id],
  }),
  comments: many(comments),
  ratings: many(ratings),
  reports: many(reports),
}));


export const commentsRelations = relations(comments, ({ one }) => ({
  trip: one(trips, {
    fields: [comments.tripId],
    references: [trips.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

export const ratingsRelations = relations(ratings, ({ one }) => ({
  trip: one(trips, {
    fields: [ratings.tripId],
    references: [trips.id],
  }),
  rater: one(users, {
    fields: [ratings.raterId],
    references: [users.id],
    relationName: "raterRatings",
  }),
  rated: one(users, {
    fields: [ratings.ratedId],
    references: [users.id],
    relationName: "ratedRatings",
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  trip: one(trips, {
    fields: [reports.tripId],
    references: [trips.id],
  }),
  user: one(users, {
    fields: [reports.userId],
    references: [users.id],
  }),
  reporter: one(users, {
    fields: [reports.reporterId],
    references: [users.id],
  }),
}));

// Community Q&A Relations
export const topicsRelations = relations(topics, ({ many }) => ({
  questions: many(questions),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  user: one(users, {
    fields: [questions.userId],
    references: [users.id],
  }),
  topic: one(topics, {
    fields: [questions.topicId],
    references: [topics.id],
  }),
  answers: many(answers),
  votes: many(votes),
  acceptedAnswer: one(answers, {
    fields: [questions.acceptedAnswerId],
    references: [answers.id],
  }),
}));

export const answersRelations = relations(answers, ({ one, many }) => ({
  question: one(questions, {
    fields: [answers.questionId],
    references: [questions.id],
  }),
  user: one(users, {
    fields: [answers.userId],
    references: [users.id],
  }),
  votes: many(votes),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  user: one(users, {
    fields: [votes.userId],
    references: [users.id],
  }),
  question: one(questions, {
    fields: [votes.questionId],
    references: [questions.id],
  }),
  answer: one(answers, {
    fields: [votes.answerId],
    references: [answers.id],
  }),
}));

// ML recommendation relations
export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));

export const userInteractionsRelations = relations(userInteractions, ({ one }) => ({
  user: one(users, {
    fields: [userInteractions.userId],
    references: [users.id],
  }),
  trip: one(trips, {
    fields: [userInteractions.tripId],
    references: [trips.id],
  }),
}));

export const tripFeaturesRelations = relations(tripFeatures, ({ one }) => ({
  trip: one(trips, {
    fields: [tripFeatures.tripId],
    references: [trips.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Auth schemas
export const insertAuthSessionSchema = createInsertSchema(authSessions).omit({
  id: true,
  createdAt: true,
});

export const insertEmailTokenSchema = createInsertSchema(emailTokens).omit({
  id: true,
  createdAt: true,
  used: true,
});

export const insertPhoneOtpSchema = createInsertSchema(phoneOtps).omit({
  id: true,
  createdAt: true,
  attempts: true,
});

// Email magic link schema
export const emailAuthSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

// Phone OTP schemas - relaxed validation, normalization happens server-side
export const phoneStartSchema = z.object({
  phone: z.string().min(8, "Phone number must be at least 8 digits").max(15, "Phone number too long"),
});

export const phoneVerifySchema = z.object({
  phone: z.string().min(8, "Phone number must be at least 8 digits").max(15, "Phone number too long"),
  code: z.string().length(6, "Please enter a 6-digit code"),
});

// Custom schema for trip posting that handles string inputs
export const insertTripSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  fromLocation: z.string().min(1, "From location is required"),
  toLocation: z.string().min(1, "To location is required"),
  date: z.union([z.string(), z.date()]).transform(val => typeof val === 'string' ? new Date(val) : val),
  time: z.string().min(1, "Time is required"),
  seatsAvailable: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseInt(val) : val),
  price: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseFloat(val) : val),
  region: z.string().min(1, "Region is required"),
  contactInfo: z.string().min(1, "Contact information is required"),
  notes: z.string().optional(),
  organizerId: z.string(),
  status: z.string().optional(),
});


export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const notificationTypeSchema = z.enum([
  // My Posted Trips
  "trip_viewed",              // Someone viewed your trip (threshold-based)
  "trip_commented",           // Someone commented on your trip
  "trip_edited",              // Trip details were updated (co-hosts)
  
  // System & Safety Alerts
  "trip_reported",            // Your trip was reported
  "trip_flagged",             // Trip temporarily flagged by admin
  "weather_alert",            // Weather warning for your trip area
  "region_alert",             // Region-specific alerts (closures, strikes)
  
  // Social Interactions
  "new_follower",             // Someone followed you
  "trip_liked",               // Someone liked/saved your trip
  "direct_message",           // Direct message received
  
  // Booking & Payment (future)
  "booking_confirmed",        // Booking confirmed
  "booking_failed",           // Booking failed/canceled
  "payment_received",         // Payment received for your trip
  
  // Admin & Platform
  "feature_update",           // New feature announcement
  "policy_change",            // Important policy change
  "account_alert",            // Account verification/security issues
  
  // Legacy types (keeping for compatibility)
  "trip_completed",           // Trip marked as complete
  "trip_cancelled",           // Trip was cancelled
  "new_trip_in_region",       // New trip in preferred region
  "system_update",            // System announcements
  
  // Chat features
  "comment_on_trip",          // New comment on your trip
  "chat_message"              // New chat message received
]);

export const notificationCategorySchema = z.enum([
  "trips",    // Trip-related notifications
  "social",   // Social interactions and follows
  "safety",   // Weather alerts, reports, flagged content
  "system"    // Platform updates, account alerts
]);

export const notificationPrioritySchema = z.enum([
  "critical", // Red - safety alerts, rejections, reports
  "normal",   // Blue/green - joins, comments, likes
  "info"      // Grey - views, tips, updates
]);

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

export const insertTripViewSchema = createInsertSchema(tripViews).omit({
  id: true,
  createdAt: true,
});

export const insertRatingSchema = createInsertSchema(ratings).omit({
  id: true,
  createdAt: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
});

// Community Q&A insert schemas
export const insertTopicSchema = createInsertSchema(topics).omit({
  id: true,
  createdAt: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  votesCount: true,
  answersCount: true,
});

export const insertAnswerSchema = createInsertSchema(answers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  votesCount: true,
  isAccepted: true,
});

export const insertVoteSchema = createInsertSchema(votes).omit({
  id: true,
  createdAt: true,
});

// ML recommendation schemas
export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserInteractionSchema = createInsertSchema(userInteractions).omit({
  id: true,
  createdAt: true,
});

export const insertTripFeaturesSchema = createInsertSchema(tripFeatures).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertKpiEventSchema = createInsertSchema(kpiEvents).omit({
  id: true,
  createdAt: true,
});

export const insertUserPersonalizationSchema = createInsertSchema(userPersonalization).omit({
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertAuthSession = z.infer<typeof insertAuthSessionSchema>;
export type AuthSession = typeof authSessions.$inferSelect;
export type InsertEmailToken = z.infer<typeof insertEmailTokenSchema>;
export type EmailToken = typeof emailTokens.$inferSelect;
export type InsertPhoneOtp = z.infer<typeof insertPhoneOtpSchema>;
export type PhoneOtp = typeof phoneOtps.$inferSelect;
export type EmailAuth = z.infer<typeof emailAuthSchema>;
export type PhoneStart = z.infer<typeof phoneStartSchema>;
export type PhoneVerify = z.infer<typeof phoneVerifySchema>;

export type InsertJoinRequest = z.infer<typeof insertJoinRequestSchema>;
export type JoinRequest = typeof joinRequests.$inferSelect;

export const insertChatThreadSchema = createInsertSchema(chatThreads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertChatThread = z.infer<typeof insertChatThreadSchema>;
export type ChatThread = typeof chatThreads.$inferSelect;

export const insertThreadUserSchema = createInsertSchema(threadUsers).omit({
  id: true,
  joinedAt: true,
});
export type InsertThreadUser = z.infer<typeof insertThreadUserSchema>;
export type ThreadUser = typeof threadUsers.$inferSelect;

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Trip = typeof trips.$inferSelect;
export type TripWithOrganizer = Trip & { organizer: User };
export type InsertTripParticipant = z.infer<typeof insertTripParticipantSchema>;
export type TripParticipant = typeof tripParticipants.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type NotificationType = z.infer<typeof notificationTypeSchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;
export type CommentWithUser = Comment & { user: User };
export type InsertTripView = z.infer<typeof insertTripViewSchema>;
export type TripView = typeof tripViews.$inferSelect;
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type Rating = typeof ratings.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;

// Community Q&A Types
export type InsertTopic = z.infer<typeof insertTopicSchema>;
export type Topic = typeof topics.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;
export type QuestionWithDetails = Question & {
  user: User;
  topic?: Topic;
  answers?: AnswerWithUser[];
  votesCount: number;
  answersCount: number;
};
export type InsertAnswer = z.infer<typeof insertAnswerSchema>;
export type Answer = typeof answers.$inferSelect;
export type AnswerWithUser = Answer & { user: User };
export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Vote = typeof votes.$inferSelect;

// ML recommendation types
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserInteraction = z.infer<typeof insertUserInteractionSchema>;
export type UserInteraction = typeof userInteractions.$inferSelect;
export type InsertTripFeatures = z.infer<typeof insertTripFeaturesSchema>;
export type TripFeatures = typeof tripFeatures.$inferSelect;
export type InsertKpiEvent = z.infer<typeof insertKpiEventSchema>;
export type KpiEvent = typeof kpiEvents.$inferSelect;
export type InsertUserPersonalization = z.infer<typeof insertUserPersonalizationSchema>;
export type UserPersonalization = typeof userPersonalization.$inferSelect;
