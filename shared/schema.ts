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
export const saveTypeEnum = pgEnum('save_type', ['pinned', 'request_sent']);
export const notificationTypeEnum = pgEnum('notification_type', [
  // Trip participation
  'trip_interest_request', 'trip_join_request', 'interest_accepted', 'interest_declined',
  // Trip updates
  'trip_updated', 'trip_removed', 'trip_commented', 'trip_viewed', 'trip_completed',
  // Legacy saved trip notifications  
  'save_removed',
  // Social
  'new_follower', 'new_trip_from_following', 'trip_liked',
  // System
  'weather_alert', 'system_update',
  // Q&A Community
  'question_answered', 'answer_accepted', 'question_voted', 'answer_voted',
  // Chat & Communication
  'chat_message', 'contact_shared', 'chat_opened', 'chat_closed'
]);
// Difficulty enum removed - using varchar instead
// userRoleEnum removed - using varchar instead
// reportStatusEnum removed - using varchar instead
export const reportContextEnum = pgEnum('report_context', ['trip', 'user', 'chat_message', 'user_profile']);
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

// Site settings table for dynamic content like background images
export const siteSettings = pgTable("site_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key").notNull().unique(),
  value: text("value"),
  description: text("description"),
  category: varchar("category").default('general'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Site settings types
export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = typeof siteSettings.$inferInsert;

// Insert schema for site settings
export const insertSiteSettingSchema = createInsertSchema(siteSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Join status enum (exists in database)
export const joinStatusEnum = pgEnum('join_status', ['pending', 'accepted', 'declined', 'cancelled']);

// Thread users table with enhanced constraints
export const threadUsers = pgTable("thread_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  threadId: varchar("thread_id").notNull().references(() => chatThreads.id, { onDelete: 'cascade' }), // FK to chatThreads.id
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  unreadCount: integer("unread_count").default(0).notNull(),
  lastReadAt: timestamp("last_read_at"),
}, (table) => [
  // Unique constraint - one record per user per thread
  unique("unique_user_thread").on(table.userId, table.threadId),
  // CHECK constraints
  sql`CONSTRAINT check_unread_count_positive CHECK (unread_count >= 0)`,
  // Indexes for performance
  index("thread_users_thread_idx").on(table.threadId),
  index("thread_users_user_idx").on(table.userId),
]);

// NOTE: messages table removed - unified with chatMessages table for consistency

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
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  name: varchar("name", { length: 100 }),
  image: varchar("image", { length: 500 }),
  provider: varchar("provider", { length: 50 }).notNull().default("email"), // 'google' | 'facebook' | 'microsoft' | 'apple' | 'email' | 'phone'
  firstName: varchar("first_name", { length: 50 }),
  lastName: varchar("last_name", { length: 50 }),
  username: varchar("username", { length: 50 }),
  profileImageUrl: varchar("profile_image_url", { length: 500 }),
  phoneNumber: varchar("phone_number", { length: 20 }),
  bio: text("bio"),
  googleId: varchar("google_id", { length: 100 }),
  facebookId: varchar("facebook_id", { length: 100 }),
  microsoftId: varchar("microsoft_id", { length: 100 }),
  appleId: varchar("apple_id", { length: 100 }),
  roleId: varchar("role_id").references(() => roles.id, { onDelete: 'set null' }), // FK to roles.id
  emailVerified: boolean("email_verified").default(false).notNull(),
  // Additional auth fields that exist in database
  authProvider: varchar("auth_provider", { length: 50 }).default("email").notNull(),
  password: varchar("password", { length: 255 }),
  providerId: varchar("provider_id", { length: 100 }),
  // New profile fields for redesigned system
  displayName: text("display_name"),
  location: text("location"),
  languages: text("languages").array(),
  linksJson: jsonb("links_json").default(sql`'{}'::jsonb`).notNull(),
  profileCompletePct: integer("profile_complete_pct").default(0).notNull(),
  
  // Travel preferences (consolidated from user_preferences table)
  vibe: text("vibe").array().default(sql`'{}'::text[]`).notNull(), 
  companions: text("companions").array().default(sql`'{}'::text[]`).notNull(),
  interests: text("interests").array().default(sql`'{}'::text[]`).notNull(),
  months: text("months").array().default(sql`'{}'::text[]`).notNull(),
  regions: text("regions").array().default(sql`'{}'::text[]`).notNull(),
  budgetMin: integer("budget_min"),
  budgetMax: integer("budget_max"),
  
  // Personalization settings (consolidated from user_personalization table)
  isPaused: boolean("is_paused").default(false).notNull(),
  resetAt: timestamp("reset_at"),
  abTestGroup: varchar("ab_test_group", { length: 50 }).default('personalized').notNull(),
  
  // Privacy settings
  profileVisibility: varchar("profile_visibility", { length: 20 }).default("public").notNull(), // 'public', 'friends', 'private'
  showEmail: boolean("show_email").default(false).notNull(),
  showPhone: boolean("show_phone").default(false).notNull(),
  showRealName: boolean("show_real_name").default(true).notNull(),
  showBio: boolean("show_bio").default(true).notNull(),
  showLocation: boolean("show_location").default(true).notNull(),
  showInterests: boolean("show_interests").default(true).notNull(),
  showTravelHistory: boolean("show_travel_history").default(true).notNull(),
  
  // Verification and badges
  isVerifiedUser: boolean("is_verified_user").default(false).notNull(),
  verificationBadges: text("verification_badges").array().default(sql`'{}'::text[]`).notNull(), // ['email', 'phone', 'id', 'host', 'plus']
  verificationLevel: integer("verification_level").default(0).notNull(), // 0-5 scale
  verificationDate: timestamp("verification_date"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  // Unique constraints
  unique("unique_email_not_null").on(table.email).nullsNotDistinct(),
  unique("unique_phone_not_null").on(table.phone).nullsNotDistinct(),
  unique("unique_username_not_null").on(table.username).nullsNotDistinct(),
  unique("unique_phone_number_not_null").on(table.phoneNumber).nullsNotDistinct(),
  unique("unique_google_id_not_null").on(table.googleId).nullsNotDistinct(),
  unique("unique_facebook_id_not_null").on(table.facebookId).nullsNotDistinct(),
  // CHECK constraints for data validation
  sql`CONSTRAINT check_email_format CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')`,
  sql`CONSTRAINT check_phone_format CHECK (phone IS NULL OR phone ~* '^[+]?[0-9\s\-()]{8,20}$')`,
  sql`CONSTRAINT check_profile_visibility CHECK (profile_visibility IN ('public', 'friends', 'private'))`,
  sql`CONSTRAINT check_verification_level CHECK (verification_level >= 0 AND verification_level <= 5)`,
  sql`CONSTRAINT check_profile_complete_pct CHECK (profile_complete_pct >= 0 AND profile_complete_pct <= 100)`,
  sql`CONSTRAINT check_budget_range CHECK (budget_min IS NULL OR budget_max IS NULL OR budget_min <= budget_max)`,
  sql`CONSTRAINT check_auth_provider_valid CHECK (auth_provider IN ('email', 'google', 'facebook', 'microsoft', 'apple', 'phone'))`,
  // 🚀 PERFORMANCE: Critical user lookup indexes
  index("idx_users_email").on(table.email),
  index("idx_users_username").on(table.username),
  index("idx_users_provider").on(table.provider),
  index("idx_users_created_at").on(table.createdAt),
  // 🚀 PERFORMANCE: GIN indexes for array-based preference search
  index("idx_users_interests_gin").using("gin", table.interests),
  index("idx_users_regions_gin").using("gin", table.regions),
  index("idx_users_vibe_gin").using("gin", table.vibe),
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

// Optimized trips table (core data only) with enhanced constraints
export const trips = pgTable("trips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 200 }).notNull(),
  fromLocation: varchar("from_location", { length: 100 }).notNull(),
  toLocation: varchar("to_location", { length: 100 }).notNull(),
  date: timestamp("date").notNull(),
  time: varchar("time", { length: 10 }).notNull(),
  seatsAvailable: integer("seats_available").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }),
  region: varchar("region", { length: 50 }).notNull(),
  category: tripCategoryEnum("category").default("unknown").notNull(),
  contactInfo: varchar("contact_info", { length: 500 }), // Legacy field - kept for backward compatibility
  organizerPhone: varchar("organizer_phone", { length: 20 }),
  organizerEmail: varchar("organizer_email", { length: 255 }), 
  organizerCountryCode: varchar("organizer_country_code", { length: 10 }).default("+94").notNull(), // Default to Sri Lanka
  organizerId: varchar("organizer_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  
  // Pricing variants
  priceMin: decimal("price_min", { precision: 10, scale: 2 }),
  priceMax: decimal("price_max", { precision: 10, scale: 2 }),
  
  // Additional trip details for "Show More" section
  duration: varchar("duration"), // e.g., "3 days 2 nights", "Full day (8 hours)"
  difficulty: varchar("difficulty"), // "easy", "moderate", "challenging"
  buddyFriendly: boolean("buddy_friendly").default(false), // Solo traveler friendly
  safetyFlags: text("safety_flags").array().default(sql`'{}'::text[]`), // Safety requirements/warnings
  seasonality: varchar("seasonality"), // Best season for this trip
  tags: text("tags").array().default(sql`'{}'::text[]`), // Hashtag-style tags
  interests: text("interests").array().default(sql`'{}'::text[]`), // Trip interests/activities for filtering
  groupSizeMin: integer("group_size_min"), // Minimum preferred group size
  groupSizeMax: integer("group_size_max"), // Maximum preferred group size
  
  // Image fields for trip photos
  imageUrl: varchar("image_url"), // Single fallback image URL
  mediaUrls: text("media_urls").array().default(sql`'{}'::text[]`), // Array of uploaded images
  coverImageIndex: integer("cover_image_index").default(0), // Which image to use as cover
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isDeleted: boolean("is_deleted").default(false).notNull(),
  deletedAt: timestamp("deleted_at"),
  archivedAt: timestamp("archived_at"), // When trip was auto-archived (past date)
}, (table) => [
  // CHECK constraints for data validation
  sql`CONSTRAINT check_seats_positive CHECK (seats_available > 0 AND seats_available <= 100)`,
  sql`CONSTRAINT check_price_positive CHECK (price IS NULL OR price >= 0)`,
  sql`CONSTRAINT check_price_range CHECK (price_min IS NULL OR price_max IS NULL OR price_min <= price_max)`,
  sql`CONSTRAINT check_trip_date_future CHECK (date > NOW() - INTERVAL '1 day')`, // Allow trips starting today
  sql`CONSTRAINT check_time_format CHECK (time ~* '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')`,
  sql`CONSTRAINT check_organizer_email_format CHECK (organizer_email IS NULL OR organizer_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')`,
  sql`CONSTRAINT check_organizer_phone_format CHECK (organizer_phone IS NULL OR organizer_phone ~* '^[0-9]{9}$')`,
  sql`CONSTRAINT check_status_valid CHECK (status IN ('active', 'inactive', 'cancelled', 'completed', 'archived'))`,
  sql`CONSTRAINT check_country_code_format CHECK (organizer_country_code ~* '^[+][0-9]{1,4}$')`,
  sql`CONSTRAINT check_contact_required CHECK (organizer_phone IS NOT NULL OR organizer_email IS NOT NULL OR contact_info IS NOT NULL)`,
  // Performance indexes for core fields only
  index("trips_region_date_idx").on(table.region, table.date),
  index("trips_status_idx").on(table.status),
  index("trips_organizer_idx").on(table.organizerId),
  index("trips_date_idx").on(table.date),
  index("trips_seats_idx").on(table.seatsAvailable),
  index("trips_status_seats_idx").on(table.status, table.seatsAvailable),
  // 🚀 PHASE 3 PERFORMANCE: Critical search optimization indexes
  index("trips_search_core_idx").on(table.status, table.isDeleted, table.date), // Core search filter
  index("trips_location_search_idx").on(table.fromLocation, table.toLocation), // Location search
  index("trips_category_idx").on(table.category), // Category filtering
  index("trips_price_range_idx").on(table.price), // Price filtering
  index("trips_active_listing_idx").on(table.status, table.isDeleted, table.region, table.date), // Full active listing optimization
  // 🚀 PHASE 6 PERFORMANCE: Advanced filtering indexes
  index("trips_interests_gin").using("gin", table.interests), // Array-based interest filtering
  index("trips_group_size_idx").on(table.groupSizeMin, table.groupSizeMax), // Group size filtering
  index("trips_difficulty_idx").on(table.difficulty), // Difficulty filtering
  index("trips_duration_idx").on(table.duration), // Duration filtering
]);

// Trip metadata table (moved from trips for better performance)
export const tripMetadata = pgTable("trip_metadata", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id").notNull().unique().references(() => trips.id, { onDelete: 'cascade' }),
  tags: text("tags").array().default(sql`'{}'::text[]`),
  duration: varchar("duration"),
  difficulty: varchar("difficulty"),
  buddyFriendly: boolean("buddy_friendly").default(false),
  seasonality: text("seasonality").array().default(sql`'{}'::text[]`),
  safetyFlags: text("safety_flags").array().default(sql`'{}'::text[]`),
  category: varchar("category"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Trip statistics table (moved from trips for better performance)
export const tripStats = pgTable("trip_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id").notNull().unique().references(() => trips.id, { onDelete: 'cascade' }),
  viewCount: integer("view_count").default(0),
  bookingCount: integer("booking_count").default(0),
  freshBoost: decimal("fresh_boost", { precision: 3, scale: 2 }).default('1.0'),
  imageUrl: varchar("image_url"),
  imageProvider: text("image_provider").default("curated"),
  imageAttribution: jsonb("image_attribution").default(sql`'{}'::jsonb`),
  imageFetchedAt: timestamp("image_fetched_at"),
  // User uploaded images from trip creation form
  mediaUrls: text("media_urls").array().default(sql`'{}'::text[]`),
  coverImageIndex: integer("cover_image_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// tripDrafts table removed - feature not implemented yet

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
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }), // who receives the notification
  tripId: varchar("trip_id").references(() => trips.id, { onDelete: 'cascade' }), // related trip for save notifications
  type: notificationTypeEnum("type").notNull(), // trip_updated, trip_removed, save_removed
  category: varchar("category", { length: 50 }).notNull(), // "trips", "social", "safety", "system"
  priority: varchar("priority", { length: 20 }).notNull(), // "critical", "normal", "info"
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  payload: jsonb("payload").default(sql`'{}'::jsonb`).notNull(), // store changed fields for trip_updated
  isRead: boolean("is_read").default(false).notNull(),
  relatedTripId: varchar("related_trip_id").references(() => trips.id, { onDelete: 'set null' }), // optional: related trip
  relatedUserId: varchar("related_user_id").references(() => users.id, { onDelete: 'set null' }), // optional: who triggered the notification
  actionUrl: varchar("action_url", { length: 500 }), // optional: where to navigate when clicked
  primaryActionLabel: varchar("primary_action_label", { length: 100 }), // e.g., "View Trip"
  primaryActionUrl: varchar("primary_action_url", { length: 500 }), // primary action link
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

// Comments table with enhanced constraints
export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id").notNull().references(() => trips.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isDeleted: boolean("is_deleted").default(false).notNull(),
  deletedAt: timestamp("deleted_at"),
}, (table) => [
  // CHECK constraints
  sql`CONSTRAINT check_content_not_empty CHECK (LENGTH(TRIM(content)) > 0 AND LENGTH(content) <= 2000)`,
  // Indexes for performance
  index("comments_trip_idx").on(table.tripId),
  index("comments_user_idx").on(table.userId),
  index("comments_created_at_idx").on(table.createdAt),
]);

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
  // 🚀 PHASE 3 PERFORMANCE: Chat optimization indexes
  threadIdKindIdx: index("chat_messages_thread_kind_idx").on(table.threadId, table.kind), // Message type filtering
  createdAtIdx: index("chat_messages_created_at_idx").on(table.createdAt), // Chronological ordering
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

// Ratings table with enhanced constraints
export const ratings = pgTable("ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id").notNull().references(() => trips.id, { onDelete: 'cascade' }),
  raterId: varchar("rater_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  ratedId: varchar("rated_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  rating: integer("rating").notNull(), // 1-5
  review: text("review"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  // CHECK constraints
  sql`CONSTRAINT check_rating_range CHECK (rating >= 1 AND rating <= 5)`,
  sql`CONSTRAINT check_no_self_rating CHECK (rater_id != rated_id)`,
  // Unique constraint to prevent duplicate ratings
  unique("unique_rating_per_trip").on(table.tripId, table.raterId, table.ratedId),
  // Indexes for performance
  index("ratings_trip_idx").on(table.tripId),
  index("ratings_rater_idx").on(table.raterId),
  index("ratings_rated_idx").on(table.ratedId),
]);

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
  adminId: varchar("admin_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  organizerId: varchar("organizer_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  isBlocked: boolean("is_blocked").default(false).notNull(),
  blockedAt: timestamp("blocked_at"),
  blockedBy: varchar("blocked_by").references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  // Unique constraint - one thread per report
  unique("unique_report_thread").on(table.reportId),
  // Indexes for performance
  index("admin_chat_threads_report_idx").on(table.reportId),
  index("admin_chat_threads_admin_idx").on(table.adminId),
  index("admin_chat_threads_organizer_idx").on(table.organizerId),
]);

// Admin chat messages
export const adminChatMessages = pgTable("admin_chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  threadId: varchar("thread_id").notNull().references(() => adminChatThreads.id, { onDelete: 'cascade' }),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: 'cascade' }), // admin or organizer ID
  senderType: varchar("sender_type", { length: 20 }).notNull(), // 'admin' | 'organizer'
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  // CHECK constraints
  sql`CONSTRAINT check_sender_type CHECK (sender_type IN ('admin', 'organizer'))`,
  sql`CONSTRAINT check_content_not_empty CHECK (LENGTH(TRIM(content)) > 0 AND LENGTH(content) <= 5000)`,
  // Indexes for performance
  index("admin_chat_messages_thread_idx").on(table.threadId),
  index("admin_chat_messages_sender_idx").on(table.senderId),
]);

// Community Q&A Tables

// Categories table removed - using topics table instead

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

// questionTags table removed - questions use tags array field instead

// Follows table removed - feature not implemented yet

// User preferences consolidated into users table

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
}, (table) => [
  // 🚀 PERFORMANCE: Critical indexes for user interaction analytics
  index("idx_user_interactions_user_id").on(table.userId),
  index("idx_user_interactions_trip_id").on(table.tripId),
  index("idx_user_interactions_type").on(table.interactionType),
  index("idx_user_interactions_created_at").on(table.createdAt),
  // Composite indexes for common query patterns
  index("idx_user_interactions_user_type").on(table.userId, table.interactionType),
  index("idx_user_interactions_user_created").on(table.userId, table.createdAt),
]);

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

// User personalization settings consolidated into users table

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

// regions table removed - feature not implemented yet

// Note: mediaAssets and auditLogs tables are defined in the admin section above

// User follows table removed - not needed for travel buddy platform

// moderationFlags table removed - feature not implemented yet

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
// User preferences relations removed - data consolidated into users table

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
  
  // Pricing variants
  priceMin: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional().transform(val => {
    if (val === null || val === undefined || val === '') return null;
    if (typeof val === 'string') {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? null : parsed;
    }
    return val;
  }),
  priceMax: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional().transform(val => {
    if (val === null || val === undefined || val === '') return null;
    if (typeof val === 'string') {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? null : parsed;
    }
    return val;
  }),
  
  // Additional trip details
  duration: z.string().optional(),
  difficulty: z.enum(['easy', 'moderate', 'challenging']).optional(),
  buddyFriendly: z.boolean().default(false).optional(),
  safetyFlags: z.array(z.string()).optional(),
  seasonality: z.string().optional(),
  tags: z.array(z.string()).optional(),
  
  // Category field
  category: z.enum(['roadtrip', 'hiking', 'beach', 'culture', 'wellness', 'festival', 'workshop', 'wildlife', 'food', 'adventure_sport', 'unknown']).optional(),
  
  // Legacy contact field - kept for backward compatibility, now optional
  contactInfo: z.string().optional(),
  // New separate contact fields
  organizerPhone: z.string().min(9, "Phone number must be 9 digits").max(9, "Phone number must be 9 digits").optional(),
  organizerEmail: z.string().email("Valid email required").optional(), 
  organizerCountryCode: z.string().default("+94").optional(),
  notes: z.string().optional(),
  organizerId: z.string(),
  status: z.string().optional(),
  imageUrl: z.string().optional(),
  
  // User uploaded images from trip creation form
  mediaUrls: z.array(z.string().refine((url) => {
    // Allow data URLs (base64) and regular URLs
    return url.startsWith('data:') || z.string().url().safeParse(url).success;
  }, "Invalid image URL or data format")).max(12, "Maximum 12 images allowed").optional(),
  coverImageIndex: z.number().min(0).default(0).optional(),
  mediaMetadata: z.array(z.object({
    url: z.string().url(),
    alt: z.string().optional(),
    caption: z.string().optional(),
  })).optional(),
  
  // Form-specific field (not stored in database)
  termsAccepted: z.boolean().optional(),
}).refine((data) => {
  // Custom validation: require at least phone OR email contact information
  const hasPhone = data.organizerPhone && data.organizerPhone.length >= 9;
  const hasEmail = data.organizerEmail && data.organizerEmail.length > 0;
  const hasLegacyContact = data.contactInfo && data.contactInfo.length > 0;
  
  return hasPhone || hasEmail || hasLegacyContact;
}, {
  message: "Please provide either a phone number or email address for contact",
  path: ["organizerPhone"]
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
  "new_trip_from_following",  // Someone you follow posted a new trip
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

// Preferences schemas (consolidated into users table)

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
// insertCategorySchema removed - using topics instead

// insertQuestionTagSchema removed - using array tags instead

// insertFollowSchema removed - follows feature not implemented

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

// User personalization schema (consolidated into users table)

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

// User follows table - for following other users to get notifications about new trips
export const userFollows = pgTable("user_follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  followerId: varchar("follower_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  followingId: varchar("following_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Ensure unique follower-following pairs
  unique("unique_user_follow").on(table.followerId, table.followingId),
  // Indexes for performance
  index("user_follows_follower_idx").on(table.followerId),
  index("user_follows_following_idx").on(table.followingId),
]);

export type UserFollow = typeof userFollows.$inferSelect;
export type InsertUserFollow = typeof userFollows.$inferInsert;

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
// Category types removed - using Topic types instead
// QuestionTag types removed - using array tags instead
// Follow types removed - feature not implemented

// Enhanced Q&A types
export type QuestionWithDetailsEnhanced = Question & {
  user: User;
  topic?: Topic;
  answers?: AnswerWithUserEnhanced[];
  myVote?: number; // -1, 0, or 1
  // isFollowed removed - follows feature not implemented
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
// UserPreferences type removed - data consolidated into users table
export type InsertUserInteraction = z.infer<typeof insertUserInteractionSchema>;
export type UserInteraction = typeof userInteractions.$inferSelect;
export type InsertTripFeatures = z.infer<typeof insertTripFeaturesSchema>;
export type TripFeatures = typeof tripFeatures.$inferSelect;
export type InsertKpiEvent = z.infer<typeof insertKpiEventSchema>;
export type KpiEvent = typeof kpiEvents.$inferSelect;
// UserPersonalization types removed - data consolidated into users table

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

// Preferences types - user preferences are now consolidated into the users table
export type InsertPreferenceEvent = z.infer<typeof insertPreferenceEventSchema>;
export type PreferenceEvent = typeof preferenceEvents.$inferSelect;

// Trip draft types (removed - feature not implemented)

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
  category: z.enum(['roadtrip', 'hiking', 'beach', 'culture', 'wellness', 'festival', 'workshop', 'wildlife', 'food', 'adventure_sport', 'unknown']).refine(val => val !== 'unknown', "Please select a trip category"),
  
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
  mediaUrls: z.array(z.string().refine((url) => {
    // Allow data URLs (base64) and regular URLs
    return url.startsWith('data:') || z.string().url().safeParse(url).success;
  }, "Invalid image URL or data format")).max(12, "Maximum 12 images allowed").optional(),
  coverImageIndex: z.number().min(0).default(0),
  mediaMetadata: z.array(TripMediaSchema).optional(),
  
  // Step 6: Safety & Terms
  safetyFlags: z.array(z.string()).optional(),
  termsAccepted: z.boolean().refine((val) => val === true, "You must accept the terms and conditions"),
  // Legacy contact field - kept for backward compatibility
  contactInfo: z.string().optional(),
  // New separate contact fields with validation requiring at least phone OR email
  organizerPhone: z.string().min(9, "Phone number must be 9 digits").max(9, "Phone number must be 9 digits").optional(),
  organizerEmail: z.string().email("Valid email required").optional(),
  organizerCountryCode: z.string().default("+94"),
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
}).refine((data) => {
  // Custom validation: require at least phone OR email contact information
  const hasPhone = data.organizerPhone && data.organizerPhone.length >= 9;
  const hasEmail = data.organizerEmail && data.organizerEmail.length > 0;
  const hasLegacyContact = data.contactInfo && data.contactInfo.length > 0;
  
  return hasPhone || hasEmail || hasLegacyContact;
}, {
  message: "Please provide either a phone number or email address for contact",
  path: ["organizerPhone"]
});

// Step-by-step validation schemas (base schemas without refinements)
const BaseTripSchema = z.object({
  // Step 1: Basics
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000, "Description must be less than 1000 characters"),
  category: z.enum(['roadtrip', 'hiking', 'beach', 'culture', 'wellness', 'festival', 'workshop', 'wildlife', 'food', 'adventure_sport', 'unknown']).refine(val => val !== 'unknown', "Please select a trip category"),
  
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
  mediaUrls: z.array(z.string().refine((url) => {
    // Allow data URLs (base64) and regular URLs
    return url.startsWith('data:') || z.string().url().safeParse(url).success;
  }, "Invalid image URL or data format")).max(12, "Maximum 12 images allowed").optional(),
  coverImageIndex: z.number().min(0).default(0),
  mediaMetadata: z.array(TripMediaSchema).optional(),
  
  // Step 6: Safety & Terms
  safetyFlags: z.array(z.string()).optional(),
  termsAccepted: z.boolean().refine((val) => val === true, "You must accept the terms and conditions"),
  // Legacy contact field - kept for backward compatibility
  contactInfo: z.string().optional(),
  // New separate contact fields with validation requiring at least phone OR email
  organizerPhone: z.string().min(9, "Phone number must be 9 digits").max(9, "Phone number must be 9 digits").optional(),
  organizerEmail: z.string().email("Valid email required").optional(),
  organizerCountryCode: z.string().default("+94"),
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
export const Step6Schema = BaseTripSchema.pick({ safetyFlags: true, termsAccepted: true, contactInfo: true, organizerPhone: true, organizerEmail: true, organizerCountryCode: true, notes: true });

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

// ==========================================
// Quick Trips - Simplified 3-step trip posting
// ==========================================

export const quickTrips = pgTable("quick_trips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizerId: varchar("organizer_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  category: tripCategoryEnum("category").default("adventure_sport").notNull(),
  fromLocation: varchar("from_location", { length: 100 }).notNull(),
  toLocation: varchar("to_location", { length: 100 }).notNull(),
  region: varchar("region", { length: 50 }).notNull(),
  date: timestamp("date").notNull(),
  time: varchar("time", { length: 10 }).notNull(),
  seatsAvailable: integer("seats_available").notNull(),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  imageUrl: varchar("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
}, (table) => [
  sql`CONSTRAINT check_quick_seats_positive CHECK (seats_available > 0 AND seats_available <= 50)`,
  sql`CONSTRAINT check_quick_status_valid CHECK (status IN ('active', 'expired'))`,
  index("quick_trips_organizer_idx").on(table.organizerId),
  index("quick_trips_status_expires_idx").on(table.status, table.expiresAt),
  index("quick_trips_region_date_idx").on(table.region, table.date),
  index("quick_trips_date_idx").on(table.date),
]);

export const quickTripsRelations = relations(quickTrips, ({ one }) => ({
  organizer: one(users, {
    fields: [quickTrips.organizerId],
    references: [users.id],
  }),
}));

export const insertQuickTripSchema = createInsertSchema(quickTrips).omit({
  id: true,
  createdAt: true,
  expiresAt: true,
  status: true,
});

export type QuickTrip = typeof quickTrips.$inferSelect;
export type InsertQuickTrip = z.infer<typeof insertQuickTripSchema>;
export type QuickTripWithOrganizer = QuickTrip & {
  organizer: {
    id: string;
    displayName: string | null;
    username: string | null;
    profileImageUrl: string | null;
  };
};

export const QuickTripFormSchema = z.object({
  fromLocation: z.string().min(1, "Departure location is required"),
  toLocation: z.string().min(1, "Destination is required"),
  region: z.string().min(1, "Region is required"),
  date: z.string().or(z.date()).refine((val) => {
    const date = typeof val === 'string' ? new Date(val) : val;
    return date > new Date();
  }, "Date must be in the future"),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(500, "Description must be less than 500 characters"),
  category: z.enum(['roadtrip', 'hiking', 'beach', 'culture', 'wellness', 'festival', 'workshop', 'wildlife', 'food', 'adventure_sport', 'unknown']).refine(val => val !== 'unknown', "Please select a trip category"),
  seatsAvailable: z.number().min(1, "At least 1 seat required").max(50, "Maximum 50 seats"),
});

export const QuickTripStep1Schema = QuickTripFormSchema.pick({
  fromLocation: true,
  toLocation: true,
  region: true,
  date: true,
  time: true,
});

export const QuickTripStep2Schema = QuickTripFormSchema.pick({
  title: true,
  description: true,
  category: true,
  seatsAvailable: true,
});

export type QuickTripFormData = z.infer<typeof QuickTripFormSchema>;
