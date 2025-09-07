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
  foreignKey,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// PostgreSQL Enums for data integrity
// tripStatusEnum removed - using varchar instead
export const saveTypeEnum = pgEnum('save_type', ['pinned', 'interested']);
export const notificationTypeEnum = pgEnum('notification_type', ['trip_updated', 'trip_removed', 'save_removed']);
// Difficulty enum removed - using varchar instead
// userRoleEnum removed - using varchar instead
// reportStatusEnum removed - using varchar instead
export const reportContextEnum = pgEnum('report_context', ['trip', 'user', 'chat_message']);
// notificationPriorityEnum removed - using varchar instead
// messageTypeEnum removed - using varchar instead
export const chatThreadStatusEnum = pgEnum('chat_thread_status', ['open', 'locked', 'closed']);
export const chatMessageKindEnum = pgEnum('chat_message_kind', ['text', 'media', 'system', 'contact_share']);
export const tripCategoryEnum = pgEnum('trip_category', [
  'roadtrip', 'hiking', 'beach', 'culture', 'wellness', 'festival', 
  'workshop', 'wildlife', 'food', 'adventure_sport', 'unknown'
]);
// draftStatusEnum removed - using varchar instead
export const questionVisibilityEnum = pgEnum('question_visibility', ['public', 'hidden']);

// Preferences enums
export const preferenceEventEnum = pgEnum('preference_event', ['created', 'updated', 'reset']);

// Join status enum (exists in database)
export const joinStatusEnum = pgEnum('join_status', ['pending', 'accepted', 'declined', 'cancelled']);

// Thread users table (exists in database)
export const threadUsers = pgTable("thread_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  threadId: varchar("thread_id").notNull(),
  userId: varchar("user_id").notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
  unreadCount: integer("unread_count").default(0),
  lastReadAt: timestamp("last_read_at"),
});

// Messages table (exists in database) 
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  threadId: varchar("thread_id").notNull(),
  authorId: varchar("author_id").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

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

// Users table for multi-provider auth with hardened constraints
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email"),
  phone: varchar("phone"),
  name: varchar("name"),
  image: varchar("image"),
  provider: varchar("provider"), // 'google' | 'facebook' | 'microsoft' | 'apple' | 'email' | 'phone'
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  username: varchar("username"),
  profileImageUrl: varchar("profile_image_url"),
  phoneNumber: varchar("phone_number"),
  bio: text("bio"),
  googleId: varchar("google_id"),
  facebookId: varchar("facebook_id"),
  microsoftId: varchar("microsoft_id"),
  appleId: varchar("apple_id"),
  roleId: varchar("role_id"), // References roles table
  emailVerified: boolean("email_verified").default(false),
  // Additional auth fields that exist in database
  authProvider: varchar("auth_provider").default("email"),
  password: varchar("password"),
  providerId: varchar("provider_id"),
  // New profile fields for redesigned system
  displayName: text("display_name"),
  location: text("location"),
  languages: text("languages").array(),
  linksJson: jsonb("links_json").default(sql`'{}'::jsonb`),
  profileCompletePct: integer("profile_complete_pct").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Unique constraints
  unique("unique_email_not_null").on(table.email).nullsNotDistinct(),
  unique("unique_phone_not_null").on(table.phone).nullsNotDistinct(),
  unique("unique_username_not_null").on(table.username).nullsNotDistinct(),
  unique("unique_phone_number_not_null").on(table.phoneNumber).nullsNotDistinct(),
  unique("unique_google_id_not_null").on(table.googleId).nullsNotDistinct(),
  unique("unique_facebook_id_not_null").on(table.facebookId).nullsNotDistinct(),
]);

// JWT refresh token sessions
export const authSessions = pgTable("auth_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
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
  price: decimal("price", { precision: 10, scale: 2 }),
  region: varchar("region").notNull(),
  contactInfo: varchar("contact_info").notNull(),
  notes: text("notes"),
  organizerId: varchar("organizer_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: varchar("status").default("active"),
  
  // Optional enhanced fields for better recommendations
  tags: jsonb("tags"), // JSONB for GIN index support
  priceMin: decimal("price_min", { precision: 10, scale: 2 }), // Optional: minimum price range
  priceMax: decimal("price_max", { precision: 10, scale: 2 }), // Optional: maximum price range
  duration: varchar("duration"), // Optional: duration like '1 day', '2-3 days', '1 week'
  difficulty: varchar("difficulty"),
  buddyFriendly: boolean("buddy_friendly").default(false), // Optional: suitable for solo travelers
  
  // Seasonality and safety
  seasonality: text("seasonality").array(), // Optional: ['dry_season', 'wet_season', 'year_round']
  safetyFlags: text("safety_flags").array(), // Optional: ['weather_dependent', 'road_conditions', 'equipment_required']
  
  // Exposure and ranking metrics
  viewCount: integer("view_count").default(0),
  bookingCount: integer("booking_count").default(0),
  freshBoost: decimal("fresh_boost", { precision: 3, scale: 2 }).default('1.0'), // New listing boost that decays
  
  // Category-based image system
  category: tripCategoryEnum("category").default("unknown"),
  imageUrl: text("image_url"),
  imageProvider: text("image_provider").default("curated"),
  imageAttribution: jsonb("image_attribution"),
  imageFetchedAt: timestamp("image_fetched_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isDeleted: boolean("is_deleted").default(false),
  deletedAt: timestamp("deleted_at"),
}, (table) => [
  // Performance indexes for hot paths
  index("trips_region_date_idx").on(table.region, table.date),
  index("trips_status_idx").on(table.status),
  index("trips_tags_gin_idx").using("gin", table.tags),
  index("trips_organizer_idx").on(table.organizerId),
  // Calendar-specific indexes for efficient date range queries
  index("trips_date_idx").on(table.date),
  index("trips_seats_idx").on(table.seatsAvailable),
  index("trips_status_seats_idx").on(table.status, table.seatsAvailable),
  // Category-based image system indexes
  index("trips_category_idx").on(table.category),
]);

// Trip drafts table for Post Trip V3 flow
export const tripDrafts = pgTable("trip_drafts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Step 1: Basics
  title: varchar("title"),
  description: text("description"),
  category: tripCategoryEnum("category"),
  
  // Step 2: Schedule
  fromLocation: varchar("from_location"),
  toLocation: varchar("to_location"),
  region: varchar("region"),
  date: timestamp("date"),
  time: varchar("time"),
  duration: varchar("duration"),
  
  // Step 3: Pricing
  price: decimal("price", { precision: 10, scale: 2 }),
  priceMin: decimal("price_min", { precision: 10, scale: 2 }),
  priceMax: decimal("price_max", { precision: 10, scale: 2 }),
  
  // Step 4: Capacity
  seatsAvailable: integer("seats_available"),
  buddyFriendly: boolean("buddy_friendly").default(false),
  
  // Step 5: Media
  mediaUrls: text("media_urls").array(),
  coverImageIndex: integer("cover_image_index").default(0),
  mediaMetadata: jsonb("media_metadata"), // Alt text, captions
  
  // Step 6: Safety & Terms
  safetyFlags: text("safety_flags").array(),
  termsAccepted: boolean("terms_accepted").default(false),
  contactInfo: varchar("contact_info"),
  notes: text("notes"),
  
  // Additional fields
  tags: jsonb("tags"),
  difficulty: varchar("difficulty"),
  seasonality: text("seasonality").array(),
  
  // Draft metadata
  status: varchar("status").default("draft"),
  currentStep: integer("current_step").default(1),
  completedSteps: text("completed_steps").array().default(sql`'{}'::text[]`),
  lastSavedAt: timestamp("last_saved_at").defaultNow(),
  publishedTripId: varchar("published_trip_id"), // Links to published trip
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("trip_drafts_user_idx").on(table.userId),
  index("trip_drafts_status_idx").on(table.status),
  index("trip_drafts_updated_idx").on(table.updatedAt),
]);

// Saved trips table for Pin and Interest functionality
export const savedTrips = pgTable("saved_trips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  tripId: varchar("trip_id").notNull().references(() => trips.id, { onDelete: 'cascade' }),
  saveType: saveTypeEnum("save_type").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Unique constraint to enforce one state per user/trip
  unique("unique_user_trip_save").on(table.userId, table.tripId),
  // Performance indexes
  index("idx_saved_trips_user").on(table.userId),
  index("idx_saved_trips_trip").on(table.tripId),
  index("idx_saved_trips_type").on(table.saveType),
]);

// Calendar events for aggregated view
export const calendarEvents = pgTable("calendar_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // owner of the event
  title: varchar("title").notNull(),
  description: text("description"),
  eventDate: timestamp("event_date").notNull(),
  eventType: varchar("event_type").notNull(), // 'trip', 'community_event', 'personal_plan', 'reminder'
  entityId: varchar("entity_id"), // reference to trips.id, questions.id, etc.
  entityType: varchar("entity_type"), // 'trip', 'question', 'custom'
  status: varchar("status").default("active"), // active, completed, cancelled
  isAllDay: boolean("is_all_day").default(false),
  startTime: varchar("start_time"), // e.g., "09:00"
  endTime: varchar("end_time"), // e.g., "17:00"
  location: varchar("location"),
  metadata: jsonb("metadata"), // flexible data for different event types
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});


// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // who receives the notification
  tripId: varchar("trip_id").references(() => trips.id, { onDelete: 'cascade' }), // related trip for save notifications
  type: notificationTypeEnum("type"), // trip_updated, trip_removed, save_removed
  category: varchar("category").notNull(), // "trips", "social", "safety", "system"
  priority: varchar("priority").notNull(), // "critical", "normal", "info"
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  payload: jsonb("payload").default(sql`'{}'::jsonb`), // store changed fields for trip_updated
  isRead: boolean("is_read").default(false),
  relatedTripId: varchar("related_trip_id"), // optional: related trip
  relatedUserId: varchar("related_user_id"), // optional: who triggered the notification
  actionUrl: varchar("action_url"), // optional: where to navigate when clicked
  primaryActionLabel: varchar("primary_action_label"), // e.g., "View Trip"
  primaryActionUrl: varchar("primary_action_url"), // primary action link
  secondaryActionLabel: varchar("secondary_action_label"), // e.g., "Ask Question"
  secondaryActionUrl: varchar("secondary_action_url"), // secondary action link
  metadata: jsonb("metadata").default({}), // additional data for weather alerts, view counts, etc.
  // Deep-link context for notifications
  commentId: varchar("comment_id"), // For comment-related notifications
  threadId: varchar("thread_id"), // For chat message notifications
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Performance index for unread notifications
  index("idx_notifications_user_unread").on(table.userId, table.isRead),
  index("idx_notifications_trip").on(table.tripId),
]);

// Comments table with foreign key constraints
export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id").notNull().references(() => trips.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isDeleted: boolean("is_deleted").default(false),
  deletedAt: timestamp("deleted_at"),
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


// Enhanced Chat System - Extended from existing schema

// Chat Threads table - enhanced for organizer-gated access
export const chatThreads = pgTable("chat_threads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id").references(() => trips.id, { onDelete: 'cascade' }),
  organizerId: varchar("organizer_id").references(() => users.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }),
  status: chatThreadStatusEnum("status").default("open"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Unique constraint: one thread per trip-organizer-user combination
  uniqueTripOrganizerUser: unique().on(table.tripId, table.organizerId, table.userId),
  tripIdIdx: index("chat_threads_trip_id_idx").on(table.tripId),
  organizerIdIdx: index("chat_threads_organizer_id_idx").on(table.organizerId),
  userIdIdx: index("chat_threads_user_id_idx").on(table.userId),
  statusIdx: index("chat_threads_status_idx").on(table.status),
}));

// Chat Messages table - supports text, media, system messages, and contact sharing
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  threadId: varchar("thread_id").notNull().references(() => chatThreads.id, { onDelete: 'cascade' }),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  kind: chatMessageKindEnum("kind").default("text"),
  text: text("text"), // Nullable for non-text messages
  meta: jsonb("meta"), // System payload, contact data, media info
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  threadIdCreatedAtIdx: index("chat_messages_thread_id_created_at_idx").on(table.threadId, table.createdAt),
  senderIdIdx: index("chat_messages_sender_id_idx").on(table.senderId),
}));

// Chat Attachments table - supports ephemeral media with one-time viewing
export const chatAttachments = pgTable("chat_attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").notNull().references(() => chatMessages.id, { onDelete: 'cascade' }),
  threadId: varchar("thread_id").notNull().references(() => chatThreads.id, { onDelete: 'cascade' }),
  storageKey: varchar("storage_key").notNull(),
  mimeType: varchar("mime_type").notNull(), // image/* only
  sizeBytes: integer("size_bytes").notNull(),
  isEphemeral: boolean("is_ephemeral").default(false),
  maxViews: integer("max_views").default(1),
  viewCount: integer("view_count").default(0),
  expiresAt: timestamp("expires_at"),
  consumedAt: timestamp("consumed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  threadIdEphemeralIdx: index("chat_attachments_thread_id_ephemeral_idx").on(table.threadId, table.isEphemeral),
  messageIdIdx: index("chat_attachments_message_id_idx").on(table.messageId),
}));

// Chat Participant State table - tracks unread counts and read status per user
export const chatParticipantState = pgTable("chat_participant_state", {
  threadId: varchar("thread_id").notNull().references(() => chatThreads.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  unreadCount: integer("unread_count").default(0),
  lastReadAt: timestamp("last_read_at"),
  muted: boolean("muted").default(false),
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => ({
  primaryKey: [table.threadId, table.userId],
  threadIdIdx: index("chat_participant_state_thread_id_idx").on(table.threadId),
  userIdIdx: index("chat_participant_state_user_id_idx").on(table.userId),
}));

// Trip Interest Requests table for "I'm Interested" functionality
export const tripInterestRequests = pgTable("trip_interest_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id").notNull().references(() => trips.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: varchar("status").notNull().default("pending"), // pending, accepted, declined, withdrawn
  message: text("message"), // Optional message from interested user
  chatThreadId: varchar("chat_thread_id"), // Created when accepted
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Prevent duplicate interest requests for same user+trip
  uniqueUserTrip: unique().on(table.tripId, table.userId),
}));

// Pinned trips table for user bookmarks
export const pinnedTrips = pgTable("pinned_trips", {
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  tripId: varchar("trip_id").notNull().references(() => trips.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Primary key constraint on userId, tripId
  primaryKey: [table.userId, table.tripId],
  // Index for efficient queries
  userIdIdx: index("pinned_trips_user_id_idx").on(table.userId),
}));

// User action history table for audit trail
export const userHistory = pgTable("user_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  action: varchar("action").notNull(), // PIN, UNPIN, INTEREST, WITHDRAW, INTEREST_ACCEPTED, INTEREST_DECLINED
  tripId: varchar("trip_id").notNull().references(() => trips.id, { onDelete: 'cascade' }),
  meta: jsonb("meta"), // {source:'ui', note:'...'}
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Index for user history queries
  userIdCreatedAtIdx: index("user_history_user_id_created_at_idx").on(table.userId, table.createdAt),
}));

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

// Reports table - enhanced to support chat message reporting
// Enhanced Reports table for comprehensive moderation workflow
export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  context: reportContextEnum("context").default("trip"),
  tripId: varchar("trip_id"),
  userId: varchar("user_id"),
  threadId: varchar("thread_id"), // For chat message reports
  messageId: varchar("message_id"), // For chat message reports
  reporterId: varchar("reporter_id").notNull(),
  reason: varchar("reason").notNull(),
  description: text("description"),
  status: varchar("status").default("open"),
  // Enhanced moderation fields (added via ALTER TABLE)
  priority: varchar("priority", { enum: ['low', 'medium', 'high', 'critical'] }).default('medium'),
  severity: varchar("severity", { enum: ['low', 'medium', 'high', 'critical'] }).default('low'),
  assignedTo: varchar("assigned_to").references(() => users.id), // Assigned moderator
  escalatedAt: timestamp("escalated_at"),
  escalatedBy: varchar("escalated_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  resolutionNotes: text("resolution_notes"),
  autoFlagged: boolean("auto_flagged").default(false), // Auto-detected content
  flagScore: integer("flag_score").default(0), // Automated scoring
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  contextIdx: index("reports_context_idx").on(table.context),
  reporterIdIdx: index("reports_reporter_id_idx").on(table.reporterId),
  statusIdx: index("reports_status_idx").on(table.status),
  threadIdIdx: index("reports_thread_id_idx").on(table.threadId),
  priorityIdx: index("reports_priority_idx").on(table.priority),
  severityIdx: index("reports_severity_idx").on(table.severity),
  assignedToIdx: index("reports_assigned_to_idx").on(table.assignedTo),
}));

// Moderation actions tracking table
export const moderationActions = pgTable("moderation_actions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportId: varchar("report_id").references(() => reports.id, { onDelete: 'cascade' }),
  moderatorId: varchar("moderator_id").notNull().references(() => users.id),
  actionType: varchar("action_type").notNull(), // 'warn', 'suspend', 'ban', 'delete_content', 'edit_content', 'dismiss'
  targetType: varchar("target_type").notNull(), // 'user', 'trip', 'message', 'comment'
  targetId: varchar("target_id").notNull(),
  reason: text("reason"),
  durationHours: integer("duration_hours"), // For temporary actions like suspensions
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  moderatorIdx: index("moderation_actions_moderator_idx").on(table.moderatorId),
  actionTypeIdx: index("moderation_actions_action_type_idx").on(table.actionType),
  targetIdx: index("moderation_actions_target_idx").on(table.targetType, table.targetId),
}));

// Content flags for automatic and manual content flagging
export const contentFlags = pgTable("content_flags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentType: varchar("content_type").notNull(), // 'trip', 'comment', 'message', 'user_bio'
  contentId: varchar("content_id").notNull(),
  flagType: varchar("flag_type").notNull(), // 'spam', 'inappropriate', 'fake', 'scam', 'violence', 'harassment'
  severity: integer("severity").default(1), // 1-5 severity scale
  autoDetected: boolean("auto_detected").default(false),
  detectionMethod: varchar("detection_method"), // 'keyword', 'ml_model', 'user_pattern', 'manual'
  confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }), // 0.00-1.00
  flaggedBy: varchar("flagged_by").references(() => users.id),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  status: varchar("status", { enum: ['pending', 'confirmed', 'false_positive', 'resolved'] }).default('pending'),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
}, (table) => ({
  contentIdx: index("content_flags_content_idx").on(table.contentType, table.contentId),
  flagTypeIdx: index("content_flags_flag_type_idx").on(table.flagType),
  statusIdx: index("content_flags_status_idx").on(table.status),
  severityIdx: index("content_flags_severity_idx").on(table.severity),
}));

// Admin chat threads for report investigations
export const adminChatThreads = pgTable("admin_chat_threads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportId: varchar("report_id").notNull().references(() => reports.id, { onDelete: 'cascade' }),
  adminId: varchar("admin_id").notNull(),
  organizerId: varchar("organizer_id").notNull(),
  isBlocked: boolean("is_blocked").default(false),
  blockedAt: timestamp("blocked_at"),
  blockedBy: varchar("blocked_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin chat messages
export const adminChatMessages = pgTable("admin_chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  threadId: varchar("thread_id").notNull().references(() => adminChatThreads.id, { onDelete: 'cascade' }),
  senderId: varchar("sender_id").notNull(), // admin or organizer ID
  senderType: varchar("sender_type").notNull(), // 'admin' | 'organizer'
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Community Q&A Tables

// Categories table for categorizing questions (renamed from topics for clarity)
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  slug: varchar("slug").notNull().unique(),
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Topics table (keep for backward compatibility, but use categories for new features)
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
  isAnonymous: boolean("is_anonymous").default(false),
  visibility: questionVisibilityEnum("visibility").default("public"),
  votesCount: integer("votes_count").default(0),
  score: integer("score").notNull().default(0), // Cached upvote count
  answersCount: integer("answers_count").default(0),
  acceptedAnswerId: varchar("accepted_answer_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isDeleted: boolean("is_deleted").default(false),
  deletedAt: timestamp("deleted_at"),
});

// Answers table
export const answers = pgTable("answers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  body: text("body").notNull(),
  questionId: varchar("question_id").notNull(),
  userId: varchar("user_id").notNull(),
  votesCount: integer("votes_count").default(0),
  score: integer("score").notNull().default(0), // Cached upvote count
  isAccepted: boolean("is_accepted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// New upvote-only tables (replacing old votes table)
export const questionUpvotes = pgTable("question_upvotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questionId: varchar("question_id").notNull(),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  // Unique constraint: one upvote per user per question
  uniqueUserQuestion: unique().on(table.questionId, table.userId),
  // Performance indexes
  questionIdIdx: index("idx_question_upvotes_q").on(table.questionId),
  userIdIdx: index("idx_question_upvotes_u").on(table.userId),
}));

export const answerUpvotes = pgTable("answer_upvotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  answerId: varchar("answer_id").notNull(),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  // Unique constraint: one upvote per user per answer
  uniqueUserAnswer: unique().on(table.answerId, table.userId),
  // Performance indexes
  answerIdIdx: index("idx_answer_upvotes_a").on(table.answerId),
  userIdIdx: index("idx_answer_upvotes_u").on(table.userId),
}));

// Question tags pivot table (optional if not using array)
export const questionTags = pgTable("question_tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questionId: varchar("question_id").notNull(),
  tag: varchar("tag").notNull(),
}, (table) => ({
  uniqueQuestionTag: unique().on(table.questionId, table.tag),
}));

// Follows table for watching questions/categories/tags
export const follows = pgTable("follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  followType: varchar("follow_type").notNull(), // 'question' | 'category' | 'tag'
  followIdOrValue: varchar("follow_id_or_value").notNull(), // ID for question/category, value for tag
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueUserFollow: unique().on(table.userId, table.followType, table.followIdOrValue),
}));

// User preferences table - single source of truth for travel preferences
export const userPreferences = pgTable("user_preferences", {
  userId: varchar("user_id").primaryKey(), // Exactly one row per user
  
  // Taxonomy-validated arrays (deduped, sorted, controlled values)
  vibe: text("vibe").array().default(sql`'{}'::text[]`), 
  companions: text("companions").array().default(sql`'{}'::text[]`),
  interests: text("interests").array().default(sql`'{}'::text[]`),
  months: text("months").array().default(sql`'{}'::text[]`), // ['jan', 'feb', etc.]
  regions: text("regions").array().default(sql`'{}'::text[]`), // Optional Sri Lankan regions
  
  // Budget constraints
  budgetMin: integer("budget_min"),
  budgetMax: integer("budget_max"),
  
  // Optimistic concurrency control
  version: integer("version").default(1).notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Ensure budget constraints are logical
  budgetCheck: sql`CHECK (budget_min IS NULL OR budget_max IS NULL OR budget_min <= budget_max)`,
}));

// Preference events audit table for tracking changes and ML signals
export const preferenceEvents = pgTable("preference_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  event: preferenceEventEnum("event").notNull(), // 'created' | 'updated' | 'reset'
  diff: jsonb("diff").$type<{old?: any, new?: any}>(), // Changes made
  createdAt: timestamp("created_at").defaultNow().notNull(),
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

// User notifications settings for redesigned profile system
export const userNotifications = pgTable("user_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  emailOn: boolean("email_on").default(true),
  pushOn: boolean("push_on").default(true),
  categoriesJson: jsonb("categories_json").default(sql`'{"trip":"instant","answers":"instant","votes":"digest","reports":"instant","dm":"instant","interest":"instant"}'::jsonb`),
  digest: varchar("digest", { enum: ['instant', 'daily', 'weekly'] }).default('instant'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User privacy settings for redesigned profile system
export const userPrivacy = pgTable("user_privacy", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  visibility: varchar("visibility", { enum: ['public', 'friends', 'private'] }).default('public'),
  dmPolicy: varchar("dm_policy", { enum: ['everyone', 'followers', 'nobody'] }).default('everyone'),
  showOnline: boolean("show_online").default(true),
  showJoinedTrips: boolean("show_joined_trips").default(true),
  cityVisibility: varchar("city_visibility", { enum: ['show', 'hide'] }).default('show'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin system tables for role-based access control

// Enhanced Roles table for granular permission management
export const roles = pgTable("roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(), // 'superadmin', 'admin', 'moderator', 'user'
  displayName: varchar("display_name").notNull(), // Human-readable role name
  description: text("description"), // Role description
  permissions: jsonb("permissions").notNull().default('[]'), // Array of permission strings
  isSystem: boolean("is_system").default(false), // System roles can't be deleted
  isActive: boolean("is_active").default(true), // Enable/disable roles
  hierarchy: integer("hierarchy").notNull().default(0), // Role hierarchy level (higher = more power)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by").references(() => users.id), // Who created this role
}, (table) => [
  index("IDX_roles_hierarchy").on(table.hierarchy),
  index("IDX_roles_active").on(table.isActive),
]);

// Role assignments table for tracking role changes
export const roleAssignments = pgTable("role_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: varchar("role_id").notNull().references(() => roles.id, { onDelete: 'cascade' }),
  assignedBy: varchar("assigned_by").notNull().references(() => users.id), // Who assigned this role
  assignedAt: timestamp("assigned_at").defaultNow(),
  reason: text("reason"), // Reason for role assignment
  isActive: boolean("is_active").default(true),
  revokedAt: timestamp("revoked_at"),
  revokedBy: varchar("revoked_by").references(() => users.id),
  revokeReason: text("revoke_reason"),
}, (table) => [
  index("IDX_role_assignments_user").on(table.userId),
  index("IDX_role_assignments_role").on(table.roleId),
  index("IDX_role_assignments_active").on(table.isActive),
  unique("unique_active_user_role").on(table.userId, table.roleId, table.isActive),
]);

// Enhanced audit logs table for tracking admin actions
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  actorUserId: varchar("actor_user_id").notNull(), // Who performed the action
  action: varchar("action").notNull(), // 'role_change', 'upload', 'slide_edit', 'role_create'
  targetType: varchar("target_type").notNull(), // 'user', 'media', 'role', 'slide'
  targetId: varchar("target_id"), // ID of the affected entity
  targetUserId: varchar("target_user_id"), // User affected by the action
  ipAddress: varchar("ip_address"), // IP address of the actor
  userAgent: text("user_agent"), // User agent of the actor
  meta: jsonb("meta").default('{}'), // Additional context data
  severity: varchar("severity", { enum: ['low', 'medium', 'high', 'critical'] }).default('medium'),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("audit_logs_actor_idx").on(table.actorUserId),
  index("audit_logs_action_idx").on(table.action),
  index("audit_logs_target_user_idx").on(table.targetUserId),
  index("audit_logs_severity_idx").on(table.severity),
  index("audit_logs_created_at_idx").on(table.createdAt),
]);

// Media assets table for admin uploads
export const mediaAssets = pgTable("media_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: varchar("filename").notNull(), // Sanitized UUID filename
  originalName: varchar("original_name").notNull(), // Original upload name
  fileUrl: varchar("file_url").notNull(), // /uploads/admin/filename
  mimeType: varchar("mime_type").notNull(),
  fileSize: integer("file_size").notNull(), // Size in bytes
  ownerId: varchar("owner_id").notNull(), // Admin who uploaded
  type: varchar("type").notNull().default("image"), // 'image', 'slide'
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("media_assets_type_idx").on(table.type),
  index("media_assets_owner_idx").on(table.ownerId),
]);

// User trip flags table for unified pinning and interest management
export const userTripFlags = pgTable("user_trip_flags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  tripId: varchar("trip_id").notNull().references(() => trips.id, { onDelete: 'cascade' }),
  pinned: boolean("pinned").default(false),
  interested: boolean("interested").default(false),
  hidden: boolean("hidden").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Unique constraint to prevent duplicate entries for same user+trip
  uniqueUserTrip: unique().on(table.userId, table.tripId),
  // Performance indexes for calendar filtering
  userIdIndex: index("utf_user_id_idx").on(table.userId),
  pinnedUserIndex: index("utf_pinned_user_idx").on(table.userId, table.pinned),
  interestedUserIndex: index("utf_interested_user_idx").on(table.userId, table.interested),
}));


// Missing Infrastructure Tables

// Regions table for preventing typos in trip regions
export const regions = pgTable("regions", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  province: varchar("province").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Note: mediaAssets and auditLogs tables are defined in the admin section above

// User follows table removed - not needed for travel buddy platform

// Enhanced moderation flags
export const moderationFlags = pgTable("moderation_flags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reporterId: varchar("reporter_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  targetType: varchar("target_type").notNull(),
  targetId: varchar("target_id").notNull(),
  reason: varchar("reason").notNull(),
  description: text("description"),
  status: varchar("status").default("open"),
  severity: varchar("severity").default("medium"), // 'low', 'medium', 'high', 'critical'
  resolvedBy: varchar("resolved_by").references(() => users.id, { onDelete: 'set null' }),
  resolutionNote: text("resolution_note"),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
}, (table) => [
  index("moderation_flags_status_idx").on(table.status),
  index("moderation_flags_target_idx").on(table.targetType, table.targetId),
  index("moderation_flags_reporter_idx").on(table.reporterId),
]);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  organizedTrips: many(trips),
  comments: many(comments),
  givenRatings: many(ratings, { relationName: "raterRatings" }),
  receivedRatings: many(ratings, { relationName: "ratedRatings" }),
  reports: many(reports),
  authSessions: many(authSessions),
  interestRequests: many(tripInterestRequests),
  tripFlags: many(userTripFlags),
  pinnedTrips: many(pinnedTrips),
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
  interestRequests: many(tripInterestRequests),
  userFlags: many(userTripFlags),
  pinnedByUsers: many(pinnedTrips),
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

export const tripInterestRequestsRelations = relations(tripInterestRequests, ({ one }) => ({
  trip: one(trips, {
    fields: [tripInterestRequests.tripId],
    references: [trips.id],
  }),
  user: one(users, {
    fields: [tripInterestRequests.userId],
    references: [users.id],
  }),
  chatThread: one(chatThreads, {
    fields: [tripInterestRequests.chatThreadId],
    references: [chatThreads.id],
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
  questionUpvotes: many(questionUpvotes),
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
  answerUpvotes: many(answerUpvotes),
}));

// New upvote relations
export const questionUpvotesRelations = relations(questionUpvotes, ({ one }) => ({
  user: one(users, { fields: [questionUpvotes.userId], references: [users.id] }),
  question: one(questions, { fields: [questionUpvotes.questionId], references: [questions.id] }),
}));

export const answerUpvotesRelations = relations(answerUpvotes, ({ one }) => ({
  user: one(users, { fields: [answerUpvotes.userId], references: [users.id] }),
  answer: one(answers, { fields: [answerUpvotes.answerId], references: [answers.id] }),
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

export const userTripFlagsRelations = relations(userTripFlags, ({ one }) => ({
  user: one(users, {
    fields: [userTripFlags.userId],
    references: [users.id],
  }),
  trip: one(trips, {
    fields: [userTripFlags.tripId],
    references: [trips.id],
  }),
}));

export const pinnedTripsRelations = relations(pinnedTrips, ({ one }) => ({
  user: one(users, {
    fields: [pinnedTrips.userId],
    references: [users.id],
  }),
  trip: one(trips, {
    fields: [pinnedTrips.tripId],
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
  price: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional().transform(val => {
    if (val === null || val === undefined || val === '') return null;
    if (typeof val === 'string') {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? null : parsed;
    }
    return val;
  }),
  region: z.string().min(1, "Region is required"),
  contactInfo: z.string().min(1, "Contact information is required"),
  notes: z.string().optional(),
  organizerId: z.string(),
  status: z.string().optional(),
  imageUrl: z.string().optional(),
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

// Admin chat insert schemas
export const insertAdminChatThreadSchema = createInsertSchema(adminChatThreads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdminChatMessageSchema = createInsertSchema(adminChatMessages).omit({
  id: true,
  createdAt: true,
});

// Preferences schemas
export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  version: true, // Server manages version
  updatedAt: true, // Server manages timestamp
});

export const insertPreferenceEventSchema = createInsertSchema(preferenceEvents).omit({
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

// Old vote schema removed - replaced with new upvote schemas above

// New schemas for enhanced Q&A system
export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertQuestionTagSchema = createInsertSchema(questionTags).omit({
  id: true,
});

export const insertFollowSchema = createInsertSchema(follows).omit({
  id: true,
  createdAt: true,
});

// Old vote request schema removed - replaced with new upvote toggle schema above

// ML recommendation schemas (userPreferences schema moved above)

// Travel Style Settings Zod schemas with validation rules
export const travelStyleSettingsSchema = z.object({
  vibe: z.array(z.string()).max(3, "Choose up to 3 vibes").default([]),
  when: z.array(z.string()).max(2, "Choose up to 2 travel times").default([]),
  companions: z.array(z.string()).max(2, "Choose up to 2 companion types").default([]),
  interests: z.array(z.string()).default([]),
}).refine(
  (data) => data.vibe.length > 0 || data.interests.length > 0,
  "Please select at least one vibe or interest"
);

export type TravelStyleSettings = z.infer<typeof travelStyleSettingsSchema>;

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

export const insertUserTripFlagsSchema = createInsertSchema(userTripFlags).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Calendar Event Types
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = typeof calendarEvents.$inferInsert;
export const insertCalendarEventSchema = createInsertSchema(calendarEvents);
export type InsertCalendarEventType = z.infer<typeof insertCalendarEventSchema>;
export type InsertAuthSession = z.infer<typeof insertAuthSessionSchema>;
export type AuthSession = typeof authSessions.$inferSelect;
export type InsertEmailToken = z.infer<typeof insertEmailTokenSchema>;
export type EmailToken = typeof emailTokens.$inferSelect;
export type InsertPhoneOtp = z.infer<typeof insertPhoneOtpSchema>;
export type PhoneOtp = typeof phoneOtps.$inferSelect;
export type EmailAuth = z.infer<typeof emailAuthSchema>;
export type PhoneStart = z.infer<typeof phoneStartSchema>;
export type PhoneVerify = z.infer<typeof phoneVerifySchema>;


// Enhanced Chat System Types
export const insertChatThreadSchema = createInsertSchema(chatThreads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertChatThread = z.infer<typeof insertChatThreadSchema>;
export type ChatThread = typeof chatThreads.$inferSelect;

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

export const insertChatAttachmentSchema = createInsertSchema(chatAttachments).omit({
  id: true,
  createdAt: true,
  consumedAt: true,
});
export type InsertChatAttachment = z.infer<typeof insertChatAttachmentSchema>;
export type ChatAttachment = typeof chatAttachments.$inferSelect;

export const insertChatParticipantStateSchema = createInsertSchema(chatParticipantState).omit({
  joinedAt: true,
});
export type InsertChatParticipantState = z.infer<typeof insertChatParticipantStateSchema>;
export type ChatParticipantState = typeof chatParticipantState.$inferSelect;

export const insertTripInterestRequestSchema = createInsertSchema(tripInterestRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTripInterestRequest = z.infer<typeof insertTripInterestRequestSchema>;
export type TripInterestRequest = typeof tripInterestRequests.$inferSelect;
export type TripInterestRequestWithDetails = TripInterestRequest & { 
  user: User;
  trip: TripWithOrganizer;
};

export type InsertUserTripFlags = z.infer<typeof insertUserTripFlagsSchema>;
export type UserTripFlags = typeof userTripFlags.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Trip = typeof trips.$inferSelect;
export type TripWithOrganizer = Trip & { organizer: User };

// Saved trips schemas and types
export const insertSavedTripSchema = createInsertSchema(savedTrips).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const upsertSavedTripSchema = z.object({
  tripId: z.string().min(1, "Trip ID is required"),
  saveType: z.enum(['pinned', 'interested'], {
    required_error: "Save type must be either 'pinned' or 'interested'"
  }),
});

export type InsertSavedTrip = z.infer<typeof insertSavedTripSchema>;
export type UpsertSavedTrip = z.infer<typeof upsertSavedTripSchema>;
export type SavedTrip = typeof savedTrips.$inferSelect;
export type SavedTripWithTrip = SavedTrip & { trip: Trip };

// Notification types for the new save system
export type SaveNotification = {
  id: string;
  userId: string;
  tripId: string | null;
  type: 'trip_updated' | 'trip_removed' | 'save_removed';
  payload: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
};

// Normalized version for UI with properly handled user data
export type TripWithNormalizedOrganizer = Omit<TripWithOrganizer, 'organizer'> & {
  organizer: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    initials: string;
  } | null;
};

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

// Admin Chat Types
export type InsertAdminChatThread = z.infer<typeof insertAdminChatThreadSchema>;
export type AdminChatThread = typeof adminChatThreads.$inferSelect;
export type InsertAdminChatMessage = z.infer<typeof insertAdminChatMessageSchema>;
export type AdminChatMessage = typeof adminChatMessages.$inferSelect;

// Admin chat with enhanced details
export type AdminChatThreadWithDetails = AdminChatThread & {
  admin: User;
  organizer: User;
  report: Report;
  messageCount: number;
  lastMessage?: AdminChatMessage;
};

export type AdminChatMessageWithSender = AdminChatMessage & {
  sender: User;
};

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
// Old Vote types removed - replaced with new upvote types above

// New Q&A types
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;
export type InsertQuestionTag = z.infer<typeof insertQuestionTagSchema>;
export type QuestionTag = typeof questionTags.$inferSelect;
export type InsertFollow = z.infer<typeof insertFollowSchema>;
export type Follow = typeof follows.$inferSelect;

// Enhanced Q&A types
export type QuestionWithDetailsEnhanced = Question & {
  user: User;
  category?: Category;
  answers?: AnswerWithUserEnhanced[];
  myVote?: number; // -1, 0, or 1
  isFollowed?: boolean;
};

export type AnswerWithUserEnhanced = Answer & { 
  user: User;
  myVote?: number; // -1, 0, or 1
};

// ML recommendation types

// Admin system schemas and types
export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export const insertMediaAssetSchema = createInsertSchema(mediaAssets).omit({
  id: true,
  createdAt: true,
});

// Admin types
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type Role = typeof roles.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertMediaAsset = z.infer<typeof insertMediaAssetSchema>;
export type MediaAsset = typeof mediaAssets.$inferSelect;

// Admin permissions interface (legacy format for backward compatibility)
export interface AdminPermissions {
  canManageUsers: boolean;
  canManageContent: boolean;
  canViewLogs: boolean;
  canManageRoles: boolean;
}

// New permission types (imported from admin module)
export type PermKey = import('../server/admin/permissions').PermKey;
export type AdminPermissionsList = PermKey[];

// User with role details
export type UserWithRole = User & {
  role?: Role;
};
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserInteraction = z.infer<typeof insertUserInteractionSchema>;
export type UserInteraction = typeof userInteractions.$inferSelect;
export type InsertTripFeatures = z.infer<typeof insertTripFeaturesSchema>;
export type TripFeatures = typeof tripFeatures.$inferSelect;
export type InsertKpiEvent = z.infer<typeof insertKpiEventSchema>;
export type KpiEvent = typeof kpiEvents.$inferSelect;
export type InsertUserPersonalization = z.infer<typeof insertUserPersonalizationSchema>;
export type UserPersonalization = typeof userPersonalization.$inferSelect;

// Pinned trips types
export type PinnedTrip = typeof pinnedTrips.$inferSelect;
export type InsertPinnedTrip = typeof pinnedTrips.$inferInsert;

// Contact sharing types (deprecated - table removed)

// Enhanced message types with contact card support
export type MessageWithContactCard = ChatMessage & {
  author?: User;
  canViewContactDetails?: boolean;
};

// User history types
export type UserHistoryEntry = typeof userHistory.$inferSelect;
export type InsertUserHistoryEntry = typeof userHistory.$inferInsert;

// New profile system types
export type UserNotifications = typeof userNotifications.$inferSelect;
export type InsertUserNotifications = typeof userNotifications.$inferInsert;
export type UserPrivacy = typeof userPrivacy.$inferSelect;
export type InsertUserPrivacy = typeof userPrivacy.$inferInsert;

// Preferences types
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type InsertPreferenceEvent = z.infer<typeof insertPreferenceEventSchema>;
export type PreferenceEvent = typeof preferenceEvents.$inferSelect;

// Trip draft types
export type TripDraft = typeof tripDrafts.$inferSelect;
export type InsertTripDraft = typeof tripDrafts.$inferInsert;

// Post Trip V3 schema for form validation
const TripMediaSchema = z.object({
  url: z.string().url(),
  alt: z.string().optional(),
  caption: z.string().optional(),
});

export const TripSchema = z.object({
  // Step 1: Basics
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000, "Description must be less than 1000 characters"),
  category: z.enum(['roadtrip', 'hiking', 'beach', 'culture', 'wellness', 'festival', 'workshop', 'wildlife', 'food', 'adventure_sport', 'unknown']),
  
  // Step 2: Schedule
  fromLocation: z.string().min(1, "Departure location is required"),
  toLocation: z.string().min(1, "Destination is required"),
  region: z.string().min(1, "Region is required"),
  date: z.string().or(z.date()).refine((val) => {
    const date = typeof val === 'string' ? new Date(val) : val;
    return date > new Date();
  }, "Date must be in the future"),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  duration: z.string().min(1, "Duration is required"),
  
  // Step 3: Pricing
  price: z.number().min(0, "Price must be positive").optional(),
  priceMin: z.number().min(0, "Minimum price must be positive").optional(),
  priceMax: z.number().min(0, "Maximum price must be positive").optional(),
  
  // Step 4: Capacity
  seatsAvailable: z.number().min(1, "At least 1 seat must be available").max(50, "Maximum 50 seats allowed"),
  buddyFriendly: z.boolean().default(false),
  
  // Step 5: Media
  mediaUrls: z.array(z.string().url()).max(12, "Maximum 12 images allowed").optional(),
  coverImageIndex: z.number().min(0).default(0),
  mediaMetadata: z.array(TripMediaSchema).optional(),
  
  // Step 6: Safety & Terms
  safetyFlags: z.array(z.string()).optional(),
  termsAccepted: z.boolean().refine((val) => val === true, "You must accept the terms and conditions"),
  contactInfo: z.string().min(1, "Contact information is required"),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
  
  // Additional fields
  tags: z.array(z.string()).optional(),
  difficulty: z.enum(['easy', 'moderate', 'challenging']).optional(),
  seasonality: z.array(z.string()).optional(),
}).refine((data) => {
  // Custom validation: if price range is provided, min should be less than max
  if (data.priceMin !== undefined && data.priceMax !== undefined) {
    return data.priceMin <= data.priceMax;
  }
  return true;
}, {
  message: "Minimum price must be less than or equal to maximum price",
  path: ["priceMax"]
});

// Step-by-step validation schemas (base schemas without refinements)
const BaseTripSchema = z.object({
  // Step 1: Basics
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000, "Description must be less than 1000 characters"),
  category: z.enum(['roadtrip', 'hiking', 'beach', 'culture', 'wellness', 'festival', 'workshop', 'wildlife', 'food', 'adventure_sport', 'unknown']),
  
  // Step 2: Schedule
  fromLocation: z.string().min(1, "Departure location is required"),
  toLocation: z.string().min(1, "Destination is required"),
  region: z.string().min(1, "Region is required"),
  date: z.string().or(z.date()).refine((val) => {
    const date = typeof val === 'string' ? new Date(val) : val;
    return date > new Date();
  }, "Date must be in the future"),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  duration: z.string().min(1, "Duration is required"),
  
  // Step 3: Pricing
  price: z.number().min(0, "Price must be positive").optional(),
  priceMin: z.number().min(0, "Minimum price must be positive").optional(),
  priceMax: z.number().min(0, "Maximum price must be positive").optional(),
  
  // Step 4: Capacity
  seatsAvailable: z.number().min(1, "At least 1 seat must be available").max(50, "Maximum 50 seats allowed"),
  buddyFriendly: z.boolean().default(false),
  
  // Step 5: Media
  mediaUrls: z.array(z.string().url()).max(12, "Maximum 12 images allowed").optional(),
  coverImageIndex: z.number().min(0).default(0),
  mediaMetadata: z.array(TripMediaSchema).optional(),
  
  // Step 6: Safety & Terms
  safetyFlags: z.array(z.string()).optional(),
  termsAccepted: z.boolean().refine((val) => val === true, "You must accept the terms and conditions"),
  contactInfo: z.string().min(1, "Contact information is required"),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
  
  // Additional fields
  tags: z.array(z.string()).optional(),
  difficulty: z.enum(['easy', 'moderate', 'challenging']).optional(),
  seasonality: z.array(z.string()).optional(),
});

export const Step1Schema = BaseTripSchema.pick({ title: true, description: true, category: true });
export const Step2Schema = BaseTripSchema.pick({ fromLocation: true, toLocation: true, region: true, date: true, time: true, duration: true });
export const Step3Schema = BaseTripSchema.pick({ price: true, priceMin: true, priceMax: true });
export const Step4Schema = BaseTripSchema.pick({ seatsAvailable: true, buddyFriendly: true });
export const Step5Schema = BaseTripSchema.pick({ mediaUrls: true, coverImageIndex: true, mediaMetadata: true });
export const Step6Schema = BaseTripSchema.pick({ safetyFlags: true, termsAccepted: true, contactInfo: true, notes: true });

export type TripFormData = z.infer<typeof TripSchema>;
export type Step1Data = z.infer<typeof Step1Schema>;
export type Step2Data = z.infer<typeof Step2Schema>;
export type Step3Data = z.infer<typeof Step3Schema>;
export type Step4Data = z.infer<typeof Step4Schema>;
export type Step5Data = z.infer<typeof Step5Schema>;
export type Step6Data = z.infer<typeof Step6Schema>;

// New upvote types
export type QuestionUpvote = typeof questionUpvotes.$inferSelect;
export type InsertQuestionUpvote = typeof questionUpvotes.$inferInsert;
export type AnswerUpvote = typeof answerUpvotes.$inferSelect;
export type InsertAnswerUpvote = typeof answerUpvotes.$inferInsert;

// New upvote schemas for validation
export const insertQuestionUpvoteSchema = createInsertSchema(questionUpvotes).omit({
  id: true,
  createdAt: true,
});

export const insertAnswerUpvoteSchema = createInsertSchema(answerUpvotes).omit({
  id: true,
  createdAt: true,
});

// Toggle upvote request schema for API
export const upvoteToggleRequestSchema = z.object({
  itemType: z.enum(['question', 'answer']),
  itemId: z.string(),
});
