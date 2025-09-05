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
export const tripStatusEnum = pgEnum('trip_status', ['active', 'full', 'completed', 'cancelled', 'inactive', 'deleted']);
export const saveTypeEnum = pgEnum('save_type', ['pinned', 'interested']);
export const notificationTypeEnum = pgEnum('notification_type', ['trip_updated', 'trip_removed', 'save_removed']);
export const difficultyEnum = pgEnum('difficulty', ['easy', 'moderate', 'challenging']);
export const userRoleEnum = pgEnum('user_role', ['user', 'moderator', 'admin', 'superadmin']);
export const reportStatusEnum = pgEnum('report_status', ['open', 'investigating', 'resolved', 'dismissed']);
export const notificationPriorityEnum = pgEnum('notification_priority', ['critical', 'high', 'normal', 'low']);
export const messageTypeEnum = pgEnum('message_type', ['text', 'contact_card']);
export const tripCategoryEnum = pgEnum('trip_category', [
  'roadtrip', 'hiking', 'beach', 'culture', 'wellness', 'festival', 
  'workshop', 'wildlife', 'food', 'adventure_sport', 'unknown'
]);

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
  status: tripStatusEnum("status").default("active"),
  
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
  unreadCount: integer("unread_count").default(0),
  lastReadAt: timestamp("last_read_at"),
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
  type: messageTypeEnum("type").default("text"),
  payload: jsonb("payload"), // For structured contact data
  createdAt: timestamp("created_at").defaultNow(),
  isDeleted: boolean("is_deleted").default(false),
}, (table) => ({
  threadIdCreatedAtIdx: index("messages_thread_id_created_at_idx").on(table.threadId, table.createdAt),
}));

// Contact shares audit table
export const contactShares = pgTable("contact_shares", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  threadId: varchar("thread_id").notNull(),
  organizerId: varchar("organizer_id").notNull(),
  payload: jsonb("payload").notNull(),
  sharedAt: timestamp("shared_at").defaultNow(),
}, (table) => ({
  threadIdIdx: index("contact_shares_thread_id_idx").on(table.threadId),
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
  votesCount: integer("votes_count").default(0),
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
  voteType: varchar("vote_type").notNull(), // 'up' | 'down'
  createdAt: timestamp("created_at").defaultNow(),
});

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

// User preferences table for Travel Style Settings and ML recommendations
export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  
  // New Travel Style Settings format
  vibe: text("vibe").array(), // max 3: ["Beach", "Hills", "Wildlife"]
  when: text("when").array(), // max 2: ["Weekends", "Festivals"]  
  companions: text("companions").array(), // max 2: ["Solo", "Friends"]
  interests: text("interests").array(), // unlimited: ["Surfing", "Tea estates"]
  
  // Legacy preferences (keep for backward compatibility)
  preferredRegions: jsonb("preferred_regions").$type<string[]>().default([]),
  budgetRange: jsonb("budget_range").$type<{min: number, max: number}>(),
  preferredDays: jsonb("preferred_days").$type<string[]>().default([]), // ['weekday', 'weekend']
  preferredTimes: jsonb("preferred_times").$type<string[]>().default([]), // ['morning', 'afternoon', 'evening']
  tripTypes: jsonb("trip_types").$type<string[]>().default([]), // ['adventure', 'cultural', 'beach', 'nature']
  groupSize: varchar("group_size"), // 'solo', 'couple', 'small_group', 'large_group'
  
  // Legacy single fields (keep for backward compatibility)
  whenTravel: varchar("when_travel"), // old format
  travelStyle: varchar("travel_style"), // old format
  
  // Engagement tracking for "For You" tab unlock
  actionCount: integer("action_count").default(0), // Count of pins, interests, joins
  
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

// Roles table for admin system
export const roles = pgTable("roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(), // 'superadmin', 'admin', 'moderator', 'user'
  permissions: jsonb("permissions").notNull().default('{}'), // Permissions JSONB
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Audit logs table for tracking admin actions
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  actorUserId: varchar("actor_user_id").notNull(), // Who performed the action
  action: varchar("action").notNull(), // 'role_change', 'upload', 'slide_edit', 'role_create'
  targetType: varchar("target_type").notNull(), // 'user', 'media', 'role', 'slide'
  targetId: varchar("target_id"), // ID of the affected entity
  meta: jsonb("meta").default('{}'), // Additional context data
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("audit_logs_actor_idx").on(table.actorUserId),
  index("audit_logs_action_idx").on(table.action),
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
  status: reportStatusEnum("status").default("open"),
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
  // Note: Can't directly relate to question/answer since votableType and votableId are dynamic
  // These relationships will be handled in queries
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
  updatedAt: true,
});

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

// Vote request schema for API
export const voteRequestSchema = z.object({
  votableType: z.enum(['question', 'answer']),
  votableId: z.string(),
  value: z.number().min(-1).max(1), // -1, 0, or 1
});

// ML recommendation schemas
export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

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
export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Vote = typeof votes.$inferSelect;
export type VoteRequest = z.infer<typeof voteRequestSchema>;

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
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;

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

// Admin permissions interface
export interface AdminPermissions {
  canManageUsers: boolean;
  canManageContent: boolean;
  canViewLogs: boolean;
  canManageRoles: boolean;
}

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

// Contact sharing types
export type ContactShare = typeof contactShares.$inferSelect;
export type InsertContactShare = typeof contactShares.$inferInsert;

// Enhanced message types with contact card support
export type MessageWithContactCard = Message & {
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
