import { db } from '../db';
import { users } from '@shared/schema';
import { eq, inArray, or } from 'drizzle-orm';

/**
 * Admin's own manual test accounts (personal Google/Facebook logins used
 * while building/testing), as a comma-separated list of emails in
 * TEST_ACCOUNT_EMAILS. Seeded content is excluded separately via
 * users.isTestData, set automatically by scripts/seed-trips.ts.
 *
 * Both are "not real product usage" for the same reason: admin dashboard
 * and digest counts must only reflect genuine signups/trips.
 */
function getTestAccountEmails(): string[] {
  return (process.env.TEST_ACCOUNT_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * User ids to exclude from any "real users/trips" count: seeded users
 * (users.isTestData) plus the admin's manual test accounts
 * (TEST_ACCOUNT_EMAILS). Trips and quick trips are excluded by checking
 * their organizerId against this same set, since every trip has a
 * required organizer — no separate isTestData column needed on trips.
 */
export async function getExcludedUserIds(): Promise<string[]> {
  const testEmails = getTestAccountEmails();

  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(
      testEmails.length > 0
        ? or(eq(users.isTestData, true), inArray(users.email, testEmails))
        : eq(users.isTestData, true)
    );

  return rows.map((r) => r.id);
}
