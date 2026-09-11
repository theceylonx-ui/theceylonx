import { db } from '../db';
import { users, trips, quickTrips } from '@shared/schema';
import { and, gte, notInArray, sql } from 'drizzle-orm';
import { getExcludedUserIds } from '../utils/testDataFilter';

export interface DigestSignup {
  name: string;
  email: string;
}

export interface DigestTrip {
  title: string;
  fromLocation: string;
  toLocation: string;
  type: 'Quick Trip' | 'Detailed Trip';
}

export interface DigestStats {
  newSignups: DigestSignup[];
  newTrips: DigestTrip[];
  totalUsers: number;
  totalTrips: number;
  tripsThisWeek: number;
}

/**
 * excludedUserIds can be empty on a fresh DB with no seeded/test accounts
 * yet, in which case notInArray with an empty array would match nothing —
 * Drizzle needs an explicit true-clause instead.
 */
function excludeIds(column: any, excludedUserIds: string[]) {
  return excludedUserIds.length > 0 ? notInArray(column, excludedUserIds) : sql`true`;
}

export async function getDigestStats(sinceHours = 24): Promise<DigestStats> {
  const excludedUserIds = await getExcludedUserIds();
  const since = new Date(Date.now() - sinceHours * 60 * 60 * 1000);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const newSignupRows = await db
    .select({ name: users.displayName, username: users.username, email: users.email, id: users.id })
    .from(users)
    .where(and(gte(users.createdAt, since), excludeIds(users.id, excludedUserIds)));

  const newTripRows = await db
    .select({
      title: trips.title,
      fromLocation: trips.fromLocation,
      toLocation: trips.toLocation,
    })
    .from(trips)
    .where(and(gte(trips.createdAt, since), excludeIds(trips.organizerId, excludedUserIds)));

  const newQuickTripRows = await db
    .select({
      title: quickTrips.title,
      fromLocation: quickTrips.fromLocation,
      toLocation: quickTrips.toLocation,
    })
    .from(quickTrips)
    .where(and(gte(quickTrips.createdAt, since), excludeIds(quickTrips.organizerId, excludedUserIds)));

  const [{ count: totalUsers }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(excludeIds(users.id, excludedUserIds));

  const [{ count: totalTripsCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(trips)
    .where(excludeIds(trips.organizerId, excludedUserIds));

  const [{ count: totalQuickTripsCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(quickTrips)
    .where(excludeIds(quickTrips.organizerId, excludedUserIds));

  const [{ count: tripsThisWeekCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(trips)
    .where(and(gte(trips.createdAt, weekAgo), excludeIds(trips.organizerId, excludedUserIds)));

  const [{ count: quickTripsThisWeekCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(quickTrips)
    .where(and(gte(quickTrips.createdAt, weekAgo), excludeIds(quickTrips.organizerId, excludedUserIds)));

  return {
    newSignups: newSignupRows.map((u) => ({
      name: u.name?.trim() || u.username?.trim() || 'Unnamed',
      email: u.email || '(no email)',
    })),
    newTrips: [
      ...newTripRows.map((t) => ({ ...t, type: 'Detailed Trip' as const })),
      ...newQuickTripRows.map((t) => ({ ...t, type: 'Quick Trip' as const })),
    ],
    totalUsers,
    totalTrips: totalTripsCount + totalQuickTripsCount,
    tripsThisWeek: tripsThisWeekCount + quickTripsThisWeekCount,
  };
}
