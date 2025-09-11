-- 🚀 PERFORMANCE: Database indexes for optimal query performance
-- These indexes target the most commonly queried columns based on API route analysis

-- ==== TRIPS TABLE INDEXES ====
-- Most important - trip search and filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_status_active ON trips(status) WHERE status = 'active';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_category ON trips(category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_departure_date ON trips(departure_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_created_at ON trips(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_price ON trips(price);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_available_spots ON trips(available_spots);

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_status_category ON trips(status, category) WHERE status = 'active';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_status_departure ON trips(status, departure_date) WHERE status = 'active';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_price_range ON trips(price, departure_date) WHERE status = 'active';

-- Text search optimization for trips
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_from_location ON trips USING gin(to_tsvector('english', from_location));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_to_location ON trips USING gin(to_tsvector('english', to_location));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_title_search ON trips USING gin(to_tsvector('english', title));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_description_search ON trips USING gin(to_tsvector('english', description));

-- Full text search index for combined content
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_full_text_search ON trips 
  USING gin(to_tsvector('english', title || ' ' || description || ' ' || from_location || ' ' || to_location));

-- ==== USERS TABLE INDEXES ====
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_provider ON users(provider);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- User preferences for recommendations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_interests ON users USING gin(interests);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_regions ON users USING gin(regions);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_vibe ON users USING gin(vibe);

-- ==== USER INTERACTIONS TABLE INDEXES ====
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_interactions_trip_id ON user_interactions(trip_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_interactions_type ON user_interactions(type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_interactions_created_at ON user_interactions(created_at DESC);

-- Composite index for user interaction queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_interactions_user_type ON user_interactions(user_id, type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_interactions_user_created ON user_interactions(user_id, created_at DESC);

-- ==== CHAT SYSTEM INDEXES ====
-- Chat threads
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_threads_trip_id ON chat_threads(trip_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_threads_organizer_id ON chat_threads(organizer_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_threads_user_id ON chat_threads(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_threads_status ON chat_threads(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_threads_created_at ON chat_threads(created_at DESC);

-- Chat messages
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_thread_id ON chat_messages(thread_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_kind ON chat_messages(kind);

-- Composite index for message queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_thread_created ON chat_messages(thread_id, created_at DESC);

-- Thread users
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_thread_users_thread_id ON thread_users(thread_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_thread_users_user_id ON thread_users(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_thread_users_composite ON thread_users(thread_id, user_id);

-- ==== COMMENTS TABLE INDEXES ====
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_trip_id ON comments(trip_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_trip_created ON comments(trip_id, created_at DESC);

-- ==== QUESTIONS AND ANSWERS INDEXES ====
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_user_id ON questions(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_topic_id ON questions(topic_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_score ON questions(score DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_answers_count ON questions(answers_count DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_created_at ON questions(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_visibility ON questions(visibility);

-- Full text search for questions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_title_search ON questions USING gin(to_tsvector('english', title));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_body_search ON questions USING gin(to_tsvector('english', body));

-- Answers
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_answers_question_id ON answers(question_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_answers_user_id ON answers(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_answers_score ON answers(score DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_answers_created_at ON answers(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_answers_question_created ON answers(question_id, created_at DESC);

-- ==== NOTIFICATIONS TABLE INDEXES ====
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- ==== REPORTS TABLE INDEXES ====
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reports_context_id ON reports(context_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reports_reported_by ON reports(reported_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reports_priority ON reports(priority);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reports_assigned_to ON reports(assigned_to);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

-- ==== TRIP INTEREST REQUESTS INDEXES ====
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trip_interest_requests_trip_id ON trip_interest_requests(trip_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trip_interest_requests_user_id ON trip_interest_requests(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trip_interest_requests_status ON trip_interest_requests(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trip_interest_requests_created_at ON trip_interest_requests(created_at DESC);

-- ==== USER TRIP FLAGS INDEXES ====
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_trip_flags_user_id ON user_trip_flags(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_trip_flags_trip_id ON user_trip_flags(trip_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_trip_flags_interested ON user_trip_flags(interested) WHERE interested = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_trip_flags_pinned ON user_trip_flags(pinned) WHERE pinned = true;

-- ==== AUDIT LOGS INDEXES ====
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_actor_user_id ON audit_logs(actor_user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_target_user_id ON audit_logs(target_user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ==== KPI EVENTS INDEXES ====
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kpi_events_event_type ON kpi_events(event_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kpi_events_ab_test_group ON kpi_events(ab_test_group);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kpi_events_user_id ON kpi_events(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kpi_events_created_at ON kpi_events(created_at DESC);

-- Composite index for analytics queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kpi_events_type_date ON kpi_events(event_type, created_at DESC);

-- ==== AUTH SESSIONS INDEXES ====
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_sessions_active ON auth_sessions(expires_at) WHERE expires_at > NOW();

-- ==== SITE SETTINGS INDEXES ====
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_site_settings_key ON site_settings(key);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_site_settings_category ON site_settings(category);

-- ==== OPTIMIZATION NOTES ====
-- CONCURRENTLY allows indexes to be built without blocking operations
-- Partial indexes (WHERE clauses) reduce index size for common filters
-- GIN indexes for full-text search and array columns
-- Composite indexes follow the principle of most selective columns first
-- DESC ordering for created_at fields to optimize recent-first queries

-- ==== PERFORMANCE MONITORING ====
-- Add query to monitor index usage
-- SELECT 
--   schemaname,
--   tablename,
--   indexname,
--   idx_scan,
--   idx_tup_read,
--   idx_tup_fetch
-- FROM pg_stat_user_indexes 
-- ORDER BY idx_scan DESC;

-- Monitor table scan ratios
-- SELECT 
--   schemaname,
--   tablename,
--   seq_scan,
--   seq_tup_read,
--   idx_scan,
--   idx_tup_fetch,
--   CASE 
--     WHEN seq_scan + idx_scan = 0 THEN 0
--     ELSE seq_scan::float / (seq_scan + idx_scan)
--   END as seq_scan_ratio
-- FROM pg_stat_user_tables
-- WHERE seq_scan + idx_scan > 0
-- ORDER BY seq_scan_ratio DESC;