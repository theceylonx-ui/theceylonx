import { randomUUID } from 'node:crypto';
import { DataType, newDb } from 'pg-mem';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../../shared/schema';

const TEST_SCHEMA_SQL = `
  CREATE TYPE trip_category AS ENUM (
    'roadtrip', 'hiking', 'beach', 'culture', 'wellness', 'festival',
    'workshop', 'wildlife', 'food', 'adventure_sport', 'unknown'
  );

  CREATE TABLE roles (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    name varchar NOT NULL UNIQUE, display_name varchar NOT NULL, description text,
    permissions jsonb DEFAULT '[]'::jsonb NOT NULL, is_system boolean DEFAULT false,
    is_active boolean DEFAULT true, hierarchy integer DEFAULT 0 NOT NULL,
    created_at timestamp DEFAULT now(), updated_at timestamp DEFAULT now(),
    created_by varchar
  );

  CREATE TABLE users (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    email varchar(255), phone varchar(20), name varchar(100), image varchar(500),
    provider varchar(50) DEFAULT 'email' NOT NULL, first_name varchar(50),
    last_name varchar(50), username varchar(50), profile_image_url varchar(500),
    phone_number varchar(20), bio text, google_id varchar(100),
    facebook_id varchar(100), microsoft_id varchar(100), apple_id varchar(100),
    role_id varchar, email_verified boolean DEFAULT false NOT NULL,
    auth_provider varchar(50) DEFAULT 'email' NOT NULL, password varchar(255),
    provider_id varchar(100), display_name text, location text, languages text[],
    links_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    profile_complete_pct integer DEFAULT 0 NOT NULL,
    vibe text[] DEFAULT '{}'::text[] NOT NULL,
    companions text[] DEFAULT '{}'::text[] NOT NULL,
    interests text[] DEFAULT '{}'::text[] NOT NULL,
    months text[] DEFAULT '{}'::text[] NOT NULL,
    regions text[] DEFAULT '{}'::text[] NOT NULL,
    budget_min integer, budget_max integer, is_paused boolean DEFAULT false NOT NULL,
    reset_at timestamp, ab_test_group varchar(50) DEFAULT 'personalized' NOT NULL,
    profile_visibility varchar(20) DEFAULT 'public' NOT NULL,
    show_email boolean DEFAULT false NOT NULL, show_phone boolean DEFAULT false NOT NULL,
    show_real_name boolean DEFAULT true NOT NULL, show_bio boolean DEFAULT true NOT NULL,
    show_location boolean DEFAULT true NOT NULL, show_interests boolean DEFAULT true NOT NULL,
    show_travel_history boolean DEFAULT true NOT NULL,
    is_verified_user boolean DEFAULT false NOT NULL,
    verification_badges text[] DEFAULT '{}'::text[] NOT NULL,
    verification_level integer DEFAULT 0 NOT NULL, verification_date timestamp,
    created_at timestamp DEFAULT now() NOT NULL, updated_at timestamp DEFAULT now() NOT NULL
  );

  CREATE TABLE trips (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    title varchar(200) NOT NULL, from_location varchar(100) NOT NULL,
    to_location varchar(100) NOT NULL, date timestamp NOT NULL, time varchar(10) NOT NULL,
    seats_available integer NOT NULL, price numeric(10, 2), region varchar(50) NOT NULL,
    category trip_category DEFAULT 'unknown' NOT NULL, contact_info varchar(500),
    organizer_phone varchar(20), organizer_email varchar(255),
    organizer_country_code varchar(10) DEFAULT '+94' NOT NULL,
    organizer_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status varchar(20) DEFAULT 'active' NOT NULL, price_min numeric(10, 2),
    price_max numeric(10, 2), duration varchar, difficulty varchar,
    buddy_friendly boolean DEFAULT false, safety_flags text[] DEFAULT '{}'::text[],
    seasonality varchar, tags text[] DEFAULT '{}'::text[], interests text[] DEFAULT '{}'::text[],
    group_size_min integer, group_size_max integer, image_url varchar,
    media_urls text[] DEFAULT '{}'::text[], cover_image_index integer DEFAULT 0,
    created_at timestamp DEFAULT now() NOT NULL, updated_at timestamp DEFAULT now() NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL, deleted_at timestamp, archived_at timestamp
  );

  CREATE TABLE quick_trips (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    organizer_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title varchar(200) NOT NULL, description text NOT NULL,
    category trip_category DEFAULT 'adventure_sport' NOT NULL,
    from_location varchar(100) NOT NULL, to_location varchar(100) NOT NULL,
    region varchar(50) NOT NULL, date timestamp NOT NULL, time varchar(10) NOT NULL,
    seats_available integer NOT NULL, is_free boolean DEFAULT true NOT NULL,
    seat_price real, status varchar(20) DEFAULT 'active' NOT NULL, image_url varchar,
    created_at timestamp DEFAULT now() NOT NULL, expires_at timestamp NOT NULL
  );

  CREATE TABLE trip_metadata (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    trip_id varchar NOT NULL UNIQUE REFERENCES trips(id) ON DELETE CASCADE,
    tags text[] DEFAULT '{}'::text[], duration varchar, difficulty varchar,
    buddy_friendly boolean DEFAULT false, seasonality text[] DEFAULT '{}'::text[],
    safety_flags text[] DEFAULT '{}'::text[], category varchar, notes text,
    created_at timestamp DEFAULT now(), updated_at timestamp DEFAULT now()
  );
`;

export async function createTestDatabase() {
  const memory = newDb({ autoCreateForeignKeyIndices: true });
  memory.public.registerFunction({
    name: 'gen_random_uuid',
    returns: DataType.uuid,
    implementation: randomUUID,
    impure: true,
  });
  memory.public.none(TEST_SCHEMA_SQL);

  const adapter = memory.adapters.createPg();
  const pool = new adapter.Pool();
  const query = pool.query.bind(pool);
  pool.query = (async (config: any, values?: any[]) => {
    if (typeof config !== 'object') {
      return query(config, values);
    }

    const { rowMode: _rowMode, types: _types, ...supportedConfig } = config;
    const result = await query(supportedConfig, values);
    if (config.rowMode !== 'array') {
      return result;
    }

    return {
      ...result,
      rows: result.rows.map((row: Record<string, unknown>) => Object.values(row)),
    };
  }) as typeof pool.query;
  const db = drizzle(pool, { schema });

  return { db, pool };
}