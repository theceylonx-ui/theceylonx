import { db } from '../server/db';
import { users } from '../shared/schema';
import { eq, isNull, or, sql } from 'drizzle-orm';

/**
 * One-time backfill script to populate missing display names from email prefixes
 * This script identifies users with missing names and safely fills them where appropriate
 */
async function backfillDisplayNames() {
  console.log('🔄 Starting display name backfill process...');

  try {
    // Find users who have missing name data but have emails
    const usersWithoutNames = await db
      .select()
      .from(users)
      .where(
        or(
          isNull(users.name),
          eq(users.name, ''),
          sql`TRIM(${users.name}) = ''`
        )
      );

    console.log(`Found ${usersWithoutNames.length} users with missing names`);

    let backfilledCount = 0;
    let skippedCount = 0;
    let emailFallbackCount = 0;

    for (const user of usersWithoutNames) {
      let newName: string | null = null;
      let fallbackUsed = false;

      // Strategy 1: Use firstName + lastName if available
      if (user.firstName?.trim() || user.lastName?.trim()) {
        const parts = [user.firstName?.trim(), user.lastName?.trim()].filter(Boolean);
        if (parts.length > 0) {
          newName = parts.join(' ');
        }
      }

      // Strategy 2: Use email prefix if email exists and is valid
      if (!newName && user.email?.includes('@')) {
        const emailPrefix = user.email.split('@')[0];
        // Only use email prefix if it looks reasonable (not too short, not all numbers)
        if (emailPrefix.length >= 3 && !/^\d+$/.test(emailPrefix)) {
          newName = emailPrefix.replace(/[._-]/g, ' ').trim();
          fallbackUsed = true;
          emailFallbackCount++;
        }
      }

      if (newName) {
        // Update the user's name
        await db
          .update(users)
          .set({ 
            name: newName,
            updatedAt: new Date()
          })
          .where(eq(users.id, user.id));

        console.log(`✅ Updated user ${user.id}: "${newName}" ${fallbackUsed ? '(from email)' : '(from first/last name)'}`);
        backfilledCount++;
      } else {
        console.log(`⚠️  Skipped user ${user.id}: No suitable name source found`);
        skippedCount++;
      }
    }

    console.log('\n📊 Backfill Summary:');
    console.log(`- Total users processed: ${usersWithoutNames.length}`);
    console.log(`- Successfully backfilled: ${backfilledCount}`);
    console.log(`- Names from email prefix: ${emailFallbackCount}`);
    console.log(`- Skipped (no source): ${skippedCount}`);

    // Verify the results
    const remainingUsersWithoutNames = await db
      .select()
      .from(users)
      .where(
        or(
          isNull(users.name),
          eq(users.name, ''),
          sql`TRIM(${users.name}) = ''`
        )
      );

    console.log(`\n🔍 Verification: ${remainingUsersWithoutNames.length} users still without names`);

    if (remainingUsersWithoutNames.length > 0) {
      console.log('Remaining users without names:');
      remainingUsersWithoutNames.forEach(user => {
        console.log(`  - ${user.id}: email=${user.email}, provider=${user.provider}`);
      });
    }

    console.log('✅ Display name backfill completed!');

  } catch (error) {
    console.error('❌ Error during display name backfill:', error);
    throw error;
  }
}

// Analytics function to check current state of user names
async function analyzeUserNameData() {
  console.log('📈 Analyzing user name data...');

  const totalUsers = await db.select({ count: sql<number>`count(*)` }).from(users);
  const usersWithNames = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(sql`${users.name} IS NOT NULL AND TRIM(${users.name}) != ''`);

  const usersWithFirstLastName = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(sql`${users.firstName} IS NOT NULL OR ${users.lastName} IS NOT NULL`);

  const usersWithEmails = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(sql`${users.email} IS NOT NULL AND ${users.email} LIKE '%@%'`);

  console.log('Current state:');
  console.log(`- Total users: ${totalUsers[0].count}`);
  console.log(`- Users with name field: ${usersWithNames[0].count}`);
  console.log(`- Users with first/last name: ${usersWithFirstLastName[0].count}`);
  console.log(`- Users with valid emails: ${usersWithEmails[0].count}`);
  console.log(`- Coverage: ${((usersWithNames[0].count / totalUsers[0].count) * 100).toFixed(1)}%`);
}

// Run based on command line arguments
async function main() {
  const command = process.argv[2];

  if (command === 'analyze') {
    await analyzeUserNameData();
  } else if (command === 'backfill') {
    await backfillDisplayNames();
  } else {
    console.log('Usage:');
    console.log('  npm run backfill-names analyze  - Analyze current state');
    console.log('  npm run backfill-names backfill - Run the backfill process');
  }
}

// Run the script if this file is executed directly
if (require.main === module) {
  main()
    .then(() => {
      console.log('🎉 Script completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

export { backfillDisplayNames, analyzeUserNameData };