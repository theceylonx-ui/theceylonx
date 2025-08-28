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

// Users table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  username: varchar("username").unique(),
  profileImageUrl: varchar("profile_image_url"),
  phoneNumber: varchar("phone_number").unique(),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Trip participants table
export const tripParticipants = pgTable("trip_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id").notNull(),
  userId: varchar("user_id").notNull(),
  status: varchar("status").default("pending"), // pending, approved, declined
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  organizedTrips: many(trips),
  participations: many(tripParticipants),
  comments: many(comments),
  givenRatings: many(ratings, { relationName: "raterRatings" }),
  receivedRatings: many(ratings, { relationName: "ratedRatings" }),
  reports: many(reports),
}));

export const tripsRelations = relations(trips, ({ one, many }) => ({
  organizer: one(users, {
    fields: [trips.organizerId],
    references: [users.id],
  }),
  participants: many(tripParticipants),
  comments: many(comments),
  ratings: many(ratings),
  reports: many(reports),
}));

export const tripParticipantsRelations = relations(tripParticipants, ({ one }) => ({
  trip: one(trips, {
    fields: [tripParticipants.tripId],
    references: [trips.id],
  }),
  user: one(users, {
    fields: [tripParticipants.userId],
    references: [users.id],
  }),
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

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTripSchema = createInsertSchema(trips).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTripParticipantSchema = createInsertSchema(tripParticipants).omit({
  id: true,
  createdAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
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

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Trip = typeof trips.$inferSelect;
export type TripWithOrganizer = Trip & { organizer: User };
export type InsertTripParticipant = z.infer<typeof insertTripParticipantSchema>;
export type TripParticipant = typeof tripParticipants.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;
export type CommentWithUser = Comment & { user: User };
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
