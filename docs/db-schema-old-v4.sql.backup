-- Ceylon Expand v5.0 - Database Schema
-- PostgreSQL 16+ with pgvector extension
-- Designed for scalability, performance, and data integrity

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ===== ENUMS =====

CREATE TYPE locale_enum AS ENUM ('EN', 'SI', 'TA');
CREATE TYPE region_enum AS ENUM (
  'WESTERN', 'CENTRAL', 'SOUTHERN', 'NORTHERN', 'EASTERN',
  'NORTH_WESTERN', 'NORTH_CENTRAL', 'UVA', 'SABARAGAMUWA'
);
CREATE TYPE trip_status_enum AS ENUM ('DRAFT', 'PUBLISHED', 'FULL', 'COMPLETED', 'CANCELLED');
CREATE TYPE participant_status_enum AS ENUM ('PENDING', 'CONFIRMED', 'DECLINED', 'REMOVED');
CREATE TYPE save_type_enum AS ENUM ('INTERESTED', 'WISHLIST', 'BOOKMARK');
CREATE TYPE interest_request_status_enum AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');
CREATE TYPE question_status_enum AS ENUM ('PUBLISHED', 'HIDDEN', 'DELETED', 'UNDER_REVIEW');
CREATE TYPE notification_kind_enum AS ENUM (
  'TRIP_JOIN_REQUEST', 'TRIP_REQUEST_ACCEPTED', 'TRIP_REQUEST_DECLINED',
  'TRIP_COMMENT', 'QUESTION_UPVOTE', 'ANSWER_UPVOTE', 'ANSWER_ACCEPTED',
  'SYSTEM_ANNOUNCEMENT', 'MODERATION_ACTION'
);
CREATE TYPE interaction_type_enum AS ENUM (
  'VIEW', 'CLICK', 'SAVE', 'SHARE', 'SEARCH', 'FILTER',
  'COMMENT', 'UPVOTE', 'JOIN_REQUEST'
);
CREATE TYPE entity_type_enum AS ENUM ('TRIP', 'QUESTION', 'ANSWER', 'USER', 'SEARCH_RESULT');
CREATE TYPE moderation_action_enum AS ENUM ('APPROVE', 'REJECT', 'FLAG', 'HIDE', 'DELETE');

-- ===== CORE TABLES =====

-- Session storage (required for authentication)
CREATE TABLE sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  username VARCHAR(50) UNIQUE,
  image_url TEXT,
  locale locale_enum DEFAULT 'EN',
  email_verified BOOLEAN DEFAULT FALSE,
  phone VARCHAR(20),
  bio TEXT,
  
  -- Security fields
  password_hash VARCHAR(255),
  salt VARCHAR(255),
  email_verification_token VARCHAR(255),
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP,
  
  -- Moderation fields
  is_banned BOOLEAN DEFAULT FALSE,
  ban_reason TEXT,
  banned_until TIMESTAMP,
  
  -- Privacy settings
  profile_visibility VARCHAR(20) DEFAULT 'public',
  show_email BOOLEAN DEFAULT FALSE,
  show_phone BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  last_active TIMESTAMP
);

-- User preferences
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Travel preferences
  preferred_regions region_enum[],
  budget_range_min INTEGER,
  budget_range_max INTEGER,
  travel_style VARCHAR(50), -- 'adventure', 'leisure', 'cultural', 'nature'
  group_size_preference VARCHAR(20), -- 'solo', 'small', 'large', 'any'
  
  -- Communication preferences
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  push_notifications BOOLEAN DEFAULT TRUE,
  
  -- Content preferences
  language_preference locale_enum DEFAULT 'EN',
  content_filter_level VARCHAR(20) DEFAULT 'moderate', -- 'strict', 'moderate', 'minimal'
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Trips table
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Basic info
  title VARCHAR(300) NOT NULL,
  description TEXT,
  from_location VARCHAR(255) NOT NULL,
  to_location VARCHAR(255) NOT NULL,
  region region_enum NOT NULL,
  
  -- Dates and timing
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  timezone VARCHAR(50) DEFAULT 'Asia/Colombo',
  
  -- Capacity and pricing
  max_participants INTEGER DEFAULT 1,
  current_participants INTEGER DEFAULT 0,
  price_lkr INTEGER,
  price_per_person BOOLEAN DEFAULT TRUE,
  
  -- Status and visibility
  active BOOLEAN DEFAULT TRUE,
  status trip_status_enum DEFAULT 'DRAFT',
  featured BOOLEAN DEFAULT FALSE,
  
  -- Engagement metrics
  score INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  
  -- Search and discovery
  search_vector TSVECTOR,
  location_vector VECTOR(384), -- For semantic location search
  
  -- Moderation
  moderation_status VARCHAR(20) DEFAULT 'approved',
  moderation_notes TEXT,
  flagged_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Trip participants
CREATE TABLE trip_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status participant_status_enum DEFAULT 'PENDING',
  joined_at TIMESTAMP DEFAULT NOW(),
  
  -- Contact info (copied for privacy)
  contact_info JSONB,
  
  UNIQUE(trip_id, user_id)
);

-- Trip interest requests
CREATE TABLE trip_interest_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT,
  status interest_request_status_enum DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(trip_id, user_id)
);

-- Trip comments
CREATE TABLE trip_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  
  -- Moderation
  flagged BOOLEAN DEFAULT FALSE,
  flagged_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Saved trips
CREATE TABLE saved_trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  save_type save_type_enum DEFAULT 'INTERESTED',
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, trip_id)
);

-- ===== COMMUNITY Q&A TABLES =====

-- Topics for categorizing questions
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  color VARCHAR(7), -- Hex color code
  icon VARCHAR(50),
  question_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Questions
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Content
  title VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  
  -- Privacy and moderation
  is_anonymous BOOLEAN DEFAULT FALSE,
  status question_status_enum DEFAULT 'PUBLISHED',
  moderation_notes TEXT,
  
  -- Engagement metrics
  score INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  answer_count INTEGER DEFAULT 0,
  
  -- Search
  search_vector TSVECTOR,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Question-topic associations
CREATE TABLE question_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(question_id, topic_id)
);

-- Answers to questions
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Content
  body TEXT NOT NULL,
  
  -- Status
  is_accepted BOOLEAN DEFAULT FALSE,
  score INTEGER DEFAULT 0,
  
  -- Moderation
  flagged BOOLEAN DEFAULT FALSE,
  moderation_status VARCHAR(20) DEFAULT 'approved',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Question upvotes
CREATE TABLE question_upvotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(question_id, user_id)
);

-- Answer upvotes
CREATE TABLE answer_upvotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  answer_id UUID NOT NULL REFERENCES answers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(answer_id, user_id)
);

-- ===== NOTIFICATION SYSTEM =====

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Notification content
  kind notification_kind_enum NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  payload JSONB,
  action_url TEXT,
  
  -- Status
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  
  -- Metadata
  priority INTEGER DEFAULT 0, -- 0=normal, 1=high, 2=urgent
  expires_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- ===== ANALYTICS TABLES =====

-- User interactions for analytics
CREATE TABLE user_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR(255),
  
  -- Action details
  action_type interaction_type_enum NOT NULL,
  entity_type entity_type_enum NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  
  -- Context
  metadata JSONB,
  user_agent TEXT,
  ip_address INET,
  referrer TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Search queries for analytics
CREATE TABLE search_queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR(255),
  
  -- Search details
  query TEXT NOT NULL,
  entity_type entity_type_enum NOT NULL,
  filters JSONB,
  result_count INTEGER,
  
  -- Engagement
  clicked_result_id VARCHAR(255),
  click_position INTEGER,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- ===== MODERATION TABLES =====

-- Content reports
CREATE TABLE content_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Reported content
  entity_type entity_type_enum NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  
  -- Report details
  reason VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, reviewed, resolved, dismissed
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  action_taken moderation_action_enum,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Moderation logs
CREATE TABLE moderation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  moderator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Target
  entity_type entity_type_enum NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  
  -- Action
  action moderation_action_enum NOT NULL,
  reason TEXT,
  notes TEXT,
  
  -- Auto vs manual
  is_automated BOOLEAN DEFAULT FALSE,
  confidence_score FLOAT, -- For AI moderation
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- ===== PERFORMANCE OPTIMIZATION INDEXES =====

-- Session indexes
CREATE INDEX idx_sessions_expire ON sessions(expire);

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_locale ON users(locale);

-- Trip indexes for performance
CREATE INDEX idx_trips_owner_id ON trips(owner_id);
CREATE INDEX idx_trips_region ON trips(region);
CREATE INDEX idx_trips_start_date ON trips(start_date);
CREATE INDEX idx_trips_end_date ON trips(end_date);
CREATE INDEX idx_trips_active_status ON trips(active, status);
CREATE INDEX idx_trips_score ON trips(score DESC);
CREATE INDEX idx_trips_created_at ON trips(created_at DESC);
CREATE INDEX idx_trips_search_vector ON trips USING gin(search_vector);
CREATE INDEX idx_trips_location_vector ON trips USING ivfflat(location_vector vector_cosine_ops);

-- Composite indexes for common queries
CREATE INDEX idx_trips_active_region_dates ON trips(active, region, start_date, end_date)
  WHERE active = true AND status = 'PUBLISHED';
CREATE INDEX idx_trips_search_active ON trips(search_vector, active, status)
  WHERE active = true AND status = 'PUBLISHED';

-- Trip participant indexes
CREATE INDEX idx_trip_participants_trip_id ON trip_participants(trip_id);
CREATE INDEX idx_trip_participants_user_id ON trip_participants(user_id);
CREATE INDEX idx_trip_participants_status ON trip_participants(status);

-- Saved trips indexes
CREATE INDEX idx_saved_trips_user_id ON saved_trips(user_id);
CREATE INDEX idx_saved_trips_trip_id ON saved_trips(trip_id);
CREATE INDEX idx_saved_trips_created_at ON saved_trips(created_at DESC);

-- Question indexes
CREATE INDEX idx_questions_owner_id ON questions(owner_id);
CREATE INDEX idx_questions_status ON questions(status);
CREATE INDEX idx_questions_score ON questions(score DESC);
CREATE INDEX idx_questions_created_at ON questions(created_at DESC);
CREATE INDEX idx_questions_search_vector ON questions USING gin(search_vector);

-- Answer indexes
CREATE INDEX idx_answers_question_id ON answers(question_id);
CREATE INDEX idx_answers_owner_id ON answers(owner_id);
CREATE INDEX idx_answers_score ON answers(score DESC);
CREATE INDEX idx_answers_accepted ON answers(is_accepted) WHERE is_accepted = true;

-- Upvote indexes
CREATE INDEX idx_question_upvotes_question_id ON question_upvotes(question_id);
CREATE INDEX idx_question_upvotes_user_id ON question_upvotes(user_id);
CREATE INDEX idx_answer_upvotes_answer_id ON answer_upvotes(answer_id);
CREATE INDEX idx_answer_upvotes_user_id ON answer_upvotes(user_id);

-- Notification indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_unread_user ON notifications(user_id, read, created_at)
  WHERE read = false;

-- Analytics indexes
CREATE INDEX idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX idx_user_interactions_entity ON user_interactions(entity_type, entity_id);
CREATE INDEX idx_user_interactions_created_at ON user_interactions(created_at DESC);
CREATE INDEX idx_search_queries_user_id ON search_queries(user_id);
CREATE INDEX idx_search_queries_created_at ON search_queries(created_at DESC);

-- ===== SEARCH CONFIGURATION =====

-- Create custom text search configuration for Sri Lankan content
CREATE TEXT SEARCH CONFIGURATION ceylon_config (COPY = pg_catalog.english);
CREATE TEXT SEARCH DICTIONARY ceylon_dict (
  TEMPLATE = pg_catalog.simple,
  STOPWORDS = 'english'
);
ALTER TEXT SEARCH CONFIGURATION ceylon_config
  ALTER MAPPING FOR asciiword, asciihword, hword_asciipart, word, hword, hword_part
  WITH ceylon_dict, pg_catalog.english_stem;

-- ===== TRIGGERS FOR SEARCH VECTORS =====

-- Function to update trip search vector
CREATE OR REPLACE FUNCTION update_trip_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := setweight(to_tsvector('ceylon_config', COALESCE(NEW.title, '')), 'A') ||
                      setweight(to_tsvector('ceylon_config', COALESCE(NEW.description, '')), 'B') ||
                      setweight(to_tsvector('ceylon_config', COALESCE(NEW.from_location, '')), 'A') ||
                      setweight(to_tsvector('ceylon_config', COALESCE(NEW.to_location, '')), 'A') ||
                      setweight(to_tsvector('ceylon_config', COALESCE(NEW.region::text, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update question search vector
CREATE OR REPLACE FUNCTION update_question_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := setweight(to_tsvector('ceylon_config', COALESCE(NEW.title, '')), 'A') ||
                      setweight(to_tsvector('ceylon_config', COALESCE(NEW.body, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER trip_search_vector_update
  BEFORE INSERT OR UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_trip_search_vector();

CREATE TRIGGER question_search_vector_update
  BEFORE INSERT OR UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_question_search_vector();

-- ===== TRIGGERS FOR COUNTERS =====

-- Function to update trip participant count
CREATE OR REPLACE FUNCTION update_trip_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'CONFIRMED' THEN
    UPDATE trips SET current_participants = current_participants + 1 WHERE id = NEW.trip_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'CONFIRMED' AND NEW.status = 'CONFIRMED' THEN
      UPDATE trips SET current_participants = current_participants + 1 WHERE id = NEW.trip_id;
    ELSIF OLD.status = 'CONFIRMED' AND NEW.status != 'CONFIRMED' THEN
      UPDATE trips SET current_participants = current_participants - 1 WHERE id = NEW.trip_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'CONFIRMED' THEN
    UPDATE trips SET current_participants = current_participants - 1 WHERE id = OLD.trip_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to update question/answer scores and counts
CREATE OR REPLACE FUNCTION update_question_score()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE questions SET score = score + 1 WHERE id = NEW.question_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE questions SET score = score - 1 WHERE id = OLD.question_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_answer_score()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE answers SET score = score + 1 WHERE id = NEW.answer_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE answers SET score = score - 1 WHERE id = OLD.answer_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_answer_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE questions SET answer_count = answer_count + 1 WHERE id = NEW.question_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE questions SET answer_count = answer_count - 1 WHERE id = OLD.question_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply counter triggers
CREATE TRIGGER trip_participant_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON trip_participants
  FOR EACH ROW EXECUTE FUNCTION update_trip_participant_count();

CREATE TRIGGER question_score_trigger
  AFTER INSERT OR DELETE ON question_upvotes
  FOR EACH ROW EXECUTE FUNCTION update_question_score();

CREATE TRIGGER answer_score_trigger
  AFTER INSERT OR DELETE ON answer_upvotes
  FOR EACH ROW EXECUTE FUNCTION update_answer_score();

CREATE TRIGGER answer_count_trigger
  AFTER INSERT OR DELETE ON answers
  FOR EACH ROW EXECUTE FUNCTION update_answer_count();

-- ===== DEFAULT DATA =====

-- Insert default topics
INSERT INTO topics (id, name, description, color, icon) VALUES
  ('accommodation', 'Accommodation', 'Hotels, guesthouses, and places to stay', '#3B82F6', 'bed'),
  ('transportation', 'Transportation', 'Buses, trains, taxis, and getting around', '#10B981', 'car'),
  ('food', 'Food & Dining', 'Restaurants, street food, and local cuisine', '#F59E0B', 'utensils'),
  ('activities', 'Activities', 'Things to do, attractions, and experiences', '#EF4444', 'activity'),
  ('culture', 'Culture & History', 'Cultural sites, traditions, and history', '#8B5CF6', 'landmark'),
  ('nature', 'Nature & Wildlife', 'National parks, beaches, and nature spots', '#10B981', 'tree'),
  ('safety', 'Safety & Health', 'Safety tips, health advice, and emergency info', '#EF4444', 'shield'),
  ('budget', 'Budget & Money', 'Costs, budgeting, and money matters', '#F59E0B', 'dollar-sign'),
  ('solo-travel', 'Solo Travel', 'Tips and advice for solo travelers', '#6366F1', 'user'),
  ('group-travel', 'Group Travel', 'Planning trips with friends or family', '#EC4899', 'users');

-- ===== VIEWS FOR COMMON QUERIES =====

-- Active trips view
CREATE VIEW active_trips AS
SELECT t.*, u.name as owner_name, u.image_url as owner_image
FROM trips t
JOIN users u ON t.owner_id = u.id
WHERE t.active = true AND t.status = 'PUBLISHED' AND t.start_date > NOW();

-- Popular questions view
CREATE VIEW popular_questions AS
SELECT q.*, u.name as owner_name, u.image_url as owner_image
FROM questions q
LEFT JOIN users u ON q.owner_id = u.id
WHERE q.status = 'PUBLISHED'
ORDER BY q.score DESC, q.created_at DESC;

-- ===== SECURITY POLICIES (RLS) =====

-- Enable row level security on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_trips ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY user_own_data ON users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY user_preferences_policy ON user_preferences
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY notifications_policy ON notifications
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY saved_trips_policy ON saved_trips
  FOR ALL USING (auth.uid() = user_id);

-- ===== PERFORMANCE MONITORING =====

-- Create function to analyze slow queries
CREATE OR REPLACE FUNCTION analyze_query_performance()
RETURNS TABLE(
  query TEXT,
  calls BIGINT,
  total_time DOUBLE PRECISION,
  mean_time DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pg_stat_statements.query,
    pg_stat_statements.calls,
    pg_stat_statements.total_exec_time,
    pg_stat_statements.mean_exec_time
  FROM pg_stat_statements
  WHERE pg_stat_statements.mean_exec_time > 100 -- queries slower than 100ms
  ORDER BY pg_stat_statements.mean_exec_time DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Create materialized view for dashboard stats (refreshed hourly)
CREATE MATERIALIZED VIEW dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '24 hours') as new_users_24h,
  (SELECT COUNT(*) FROM trips WHERE created_at > NOW() - INTERVAL '24 hours') as new_trips_24h,
  (SELECT COUNT(*) FROM questions WHERE created_at > NOW() - INTERVAL '24 hours') as new_questions_24h,
  (SELECT COUNT(*) FROM trips WHERE active = true AND status = 'PUBLISHED') as active_trips,
  (SELECT COUNT(*) FROM users WHERE last_active > NOW() - INTERVAL '30 days') as monthly_active_users,
  NOW() as last_updated;

-- Refresh schedule (to be set up in cron)
-- 0 * * * * psql -d ceylon_expand -c "REFRESH MATERIALIZED VIEW dashboard_stats;"

-- ===== CLEANUP FUNCTIONS =====

-- Function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
  -- Delete old sessions (older than 30 days)
  DELETE FROM sessions WHERE expire < NOW() - INTERVAL '30 days';
  
  -- Delete old notifications (older than 90 days and read)
  DELETE FROM notifications WHERE read = true AND created_at < NOW() - INTERVAL '90 days';
  
  -- Delete old user interactions (older than 1 year)
  DELETE FROM user_interactions WHERE created_at < NOW() - INTERVAL '1 year';
  
  -- Delete old search queries (older than 6 months)
  DELETE FROM search_queries WHERE created_at < NOW() - INTERVAL '6 months';
  
  -- Archive completed trips (older than 1 year)
  UPDATE trips SET active = false 
  WHERE status = 'COMPLETED' AND completed_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

-- ===== BACKUP RECOMMENDATIONS =====

/*
Backup Strategy:
1. Full backup daily at 2 AM UTC
2. WAL archiving for point-in-time recovery
3. Weekly backup validation
4. Cross-region backup replication for disaster recovery

Performance Monitoring:
1. Monitor pg_stat_statements for slow queries
2. Track index usage with pg_stat_user_indexes
3. Monitor connection count and database size
4. Set up alerts for replication lag (if using replicas)

Maintenance Schedule:
1. VACUUM ANALYZE daily during low traffic hours
2. REINDEX monthly for heavily updated indexes
3. Update table statistics weekly
4. Clean up old data monthly using cleanup_old_data()
*/