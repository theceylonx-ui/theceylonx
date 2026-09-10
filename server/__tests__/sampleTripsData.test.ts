/**
 * Regression test for scripts/sampleTripsData.ts — the data seeded by
 * scripts/seed-trips.ts and shown to new users as "Sample Trip" cards.
 *
 * Pure data checks only, no database access: this module intentionally
 * avoids importing server/db so it can run without a DATABASE_URL.
 */

import { describe, it, expect } from 'vitest';
import { SEED_USERS, SAMPLE_TRIPS } from '../../scripts/sampleTripsData';
import { tripCategoryEnum } from '../../shared/schema';

// trip-card.tsx's getRegionColor() only has styling for these keys; any
// other region silently falls back to a plain gray badge. Keep in sync
// with client/src/components/trip-card.tsx.
const KNOWN_REGIONS = new Set([
  'western',
  'southern',
  'central',
  'northern',
  'eastern',
  'north_western',
  'north_central',
  'sabaragamuwa',
  'uva',
]);

// Mirrors the DB CHECK constraints on the trips table in shared/schema.ts.
const TIME_FORMAT = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
const PHONE_FORMAT = /^[0-9]{9}$/;
const EMAIL_FORMAT = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

const VALID_CATEGORIES = new Set<string>(tripCategoryEnum.enumValues);
const SEED_USER_EMAILS = new Set(SEED_USERS.map((u) => u.email));

describe('sample trip seed data', () => {
  it('has exactly 10 sample trips', () => {
    expect(SAMPLE_TRIPS).toHaveLength(10);
  });

  it('gives every trip a unique id', () => {
    const ids = SAMPLE_TRIPS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('prefixes every id with "sample-", the prefix trip-card.tsx checks for the Sample Trip badge', () => {
    for (const trip of SAMPLE_TRIPS) {
      expect(trip.id.startsWith('sample-')).toBe(true);
    }
  });

  it('dates every trip in the future', () => {
    const now = Date.now();
    for (const trip of SAMPLE_TRIPS) {
      expect(trip.date.getTime()).toBeGreaterThan(now);
    }
  });

  it('formats every trip time as 24-hour HH:MM', () => {
    for (const trip of SAMPLE_TRIPS) {
      expect(trip.time).toMatch(TIME_FORMAT);
    }
  });

  it('uses only lowercase regions that trip-card.tsx knows how to color', () => {
    for (const trip of SAMPLE_TRIPS) {
      expect(trip.region).toBe(trip.region.toLowerCase());
      expect(KNOWN_REGIONS.has(trip.region)).toBe(true);
    }
  });

  it('uses only categories defined in the trip_category enum', () => {
    for (const trip of SAMPLE_TRIPS) {
      expect(VALID_CATEGORIES.has(trip.category)).toBe(true);
    }
  });

  it('gives every trip a contact field, satisfying the check_contact_required constraint', () => {
    for (const trip of SAMPLE_TRIPS) {
      expect(Boolean(trip.organizerPhone || trip.organizerEmail || trip.contactInfo)).toBe(true);
    }
  });

  it('formats every organizerPhone as 9 digits', () => {
    for (const trip of SAMPLE_TRIPS) {
      expect(trip.organizerPhone).toMatch(PHONE_FORMAT);
    }
  });

  it('formats every organizerEmail as a valid email', () => {
    for (const trip of SAMPLE_TRIPS) {
      expect(trip.organizerEmail).toMatch(EMAIL_FORMAT);
    }
  });

  it('points every organizerEmail at a user in SEED_USERS, so seed-trips.ts can resolve an organizerId', () => {
    for (const trip of SAMPLE_TRIPS) {
      expect(SEED_USER_EMAILS.has(trip.organizerEmail)).toBe(true);
    }
  });

  it('keeps every price non-negative', () => {
    for (const trip of SAMPLE_TRIPS) {
      expect(Number(trip.price)).toBeGreaterThanOrEqual(0);
    }
  });

  it('keeps seatsAvailable within the 1-100 range required by check_seats_positive', () => {
    for (const trip of SAMPLE_TRIPS) {
      expect(trip.seatsAvailable).toBeGreaterThan(0);
      expect(trip.seatsAvailable).toBeLessThanOrEqual(100);
    }
  });

  it('keeps SEED_USERS emails unique', () => {
    expect(SEED_USER_EMAILS.size).toBe(SEED_USERS.length);
  });
});
