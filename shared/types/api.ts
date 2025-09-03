import { z } from 'zod';
import type { User, Trip, Question, Comment, Answer } from '@shared/schema';

// Normalized user type for UI consumption
export const normalizedUserSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  initials: z.string(),
  email: z.string().optional(),
  provider: z.string().optional(),
});

export type NormalizedUser = z.infer<typeof normalizedUserSchema>;

// Trip with normalized organizer
export const tripWithOrganizerSchema = z.object({
  id: z.string(),
  title: z.string(),
  fromLocation: z.string(),
  toLocation: z.string(),
  date: z.date(),
  time: z.string(),
  seatsAvailable: z.number(),
  price: z.number().nullable(),
  region: z.string(),
  notes: z.string().nullable(),
  status: z.string(),
  category: z.string(),
  imageUrl: z.string().nullable(),
  organizer: normalizedUserSchema,
  viewCount: z.number().default(0),
  bookingCount: z.number().default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type TripWithOrganizer = z.infer<typeof tripWithOrganizerSchema>;

// Comment with normalized user
export const commentWithUserSchema = z.object({
  id: z.string(),
  content: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  user: normalizedUserSchema,
  isDeleted: z.boolean().default(false),
});

export type CommentWithUser = z.infer<typeof commentWithUserSchema>;

// Question with normalized user
export const questionWithUserSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  tags: z.array(z.string()).default([]),
  votesCount: z.number().default(0),
  answersCount: z.number().default(0),
  isAnonymous: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
  user: normalizedUserSchema,
  topicId: z.string().nullable(),
});

export type QuestionWithUser = z.infer<typeof questionWithUserSchema>;

// Answer with normalized user
export const answerWithUserSchema = z.object({
  id: z.string(),
  body: z.string(),
  votesCount: z.number().default(0),
  isAccepted: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
  user: normalizedUserSchema,
});

export type AnswerWithUser = z.infer<typeof answerWithUserSchema>;

// API Response schemas for validation
export const tripsListResponseSchema = z.object({
  trips: z.array(tripWithOrganizerSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export const tripDetailResponseSchema = z.object({
  trip: tripWithOrganizerSchema,
  comments: z.array(commentWithUserSchema),
  ratingsCount: z.number().default(0),
  averageRating: z.number().default(0),
  userInterestStatus: z.enum(['none', 'pending', 'approved', 'rejected']).default('none'),
});

export const questionsListResponseSchema = z.object({
  questions: z.array(questionWithUserSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export const questionDetailResponseSchema = z.object({
  question: questionWithUserSchema,
  answers: z.array(answerWithUserSchema),
});

// Error response schema
export const errorResponseSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
  details: z.record(z.any()).optional(),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;