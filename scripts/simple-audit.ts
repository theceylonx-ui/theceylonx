import { db } from '../server/db';
import { users, trips, comments, questions, answers } from '../shared/schema';
import { sql, eq, isNull, or } from 'drizzle-orm';
import { normalizeUserForUI } from '../server/utils/userNormalization';

interface AuditResults {
  score: number;
  maxScore: number;
  issues: AuditIssue[];
  telemetry: TelemetryData;
}

interface AuditIssue {
  severity: 'critical' | 'warning' | 'info';
  category: string;
  description: string;
  count?: number;
}

interface TelemetryData {
  totalUsers: number;
  usersWithoutNames: number;
  usersWithoutAvatars: number;
  fallbackDisplayNamesUsed: number;
  dataCompleteness: number;
}

async function runAudit(): Promise<AuditResults> {
  console.log('🔍 Starting Ceylon Expand Consistency Audit...');
  
  const issues: AuditIssue[] = [];
  const telemetry: TelemetryData = {
    totalUsers: 0,
    usersWithoutNames: 0,
    usersWithoutAvatars: 0,
    fallbackDisplayNamesUsed: 0,
    dataCompleteness: 0,
  };

  // Get total user count
  const [totalUsersResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users);
  telemetry.totalUsers = totalUsersResult.count;

  // Check for users without names
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

  telemetry.usersWithoutNames = usersWithoutNames.length;

  if (usersWithoutNames.length > 0) {
    issues.push({
      severity: 'warning',
      category: 'User Identity',
      description: 'Users found with missing display names',
      count: usersWithoutNames.length,
    });
  }

  // Check for users without avatars
  const usersWithoutAvatars = await db
    .select()
    .from(users)
    .where(
      or(
        isNull(users.profileImageUrl),
        eq(users.profileImageUrl, ''),
        isNull(users.image),
        eq(users.image, '')
      )
    );

  telemetry.usersWithoutAvatars = usersWithoutAvatars.length;

  // Test normalization for sample users
  const sampleUsers = await db.select().from(users).limit(10);
  let fallbackCount = 0;

  for (const user of sampleUsers) {
    const normalized = normalizeUserForUI(user);
    if (normalized) {
      if (normalized.displayName.startsWith('Traveler') || 
          (user.email && normalized.displayName === user.email.split('@')[0])) {
        fallbackCount++;
      }
    }
  }

  telemetry.fallbackDisplayNamesUsed = fallbackCount;

  // Check for orphaned trips
  const orphanedTrips = await db
    .select({ tripId: trips.id, organizerId: trips.organizerId })
    .from(trips)
    .leftJoin(users, eq(trips.organizerId, users.id))
    .where(isNull(users.id));

  if (orphanedTrips.length > 0) {
    issues.push({
      severity: 'critical',
      category: 'Data Integrity',
      description: 'Trips found with non-existent organizers',
      count: orphanedTrips.length,
    });
  }

  // Check for orphaned comments
  const orphanedComments = await db
    .select({ commentId: comments.id, userId: comments.userId })
    .from(comments)
    .leftJoin(users, eq(comments.userId, users.id))
    .where(isNull(users.id));

  if (orphanedComments.length > 0) {
    issues.push({
      severity: 'critical',
      category: 'Data Integrity',
      description: 'Comments found with non-existent users',
      count: orphanedComments.length,
    });
  }

  // Calculate data completeness
  const usersWithCompleteData = telemetry.totalUsers - telemetry.usersWithoutNames;
  telemetry.dataCompleteness = telemetry.totalUsers > 0 
    ? (usersWithCompleteData / telemetry.totalUsers) * 100 
    : 100;

  // Calculate score
  let score = 100;
  for (const issue of issues) {
    switch (issue.severity) {
      case 'critical': score -= 20; break;
      case 'warning': score -= 10; break;
      case 'info': score -= 2; break;
    }
  }

  if (telemetry.dataCompleteness > 95) {
    score += 5;
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    maxScore: 100,
    issues,
    telemetry,
  };
}

function printReport(results: AuditResults) {
  console.log('\n============================================================');
  console.log('🎯 Ceylon Expand Consistency Audit Report');
  console.log('============================================================');

  console.log(`\nOverall Score: ${results.score}/${results.maxScore}`);

  console.log(`\n📊 Telemetry Summary:`);
  console.log(`  Total Users: ${results.telemetry.totalUsers}`);
  console.log(`  Users without names: ${results.telemetry.usersWithoutNames}`);
  console.log(`  Users without avatars: ${results.telemetry.usersWithoutAvatars}`);
  console.log(`  Fallback display names used: ${results.telemetry.fallbackDisplayNamesUsed}`);
  console.log(`  Data completeness: ${results.telemetry.dataCompleteness.toFixed(1)}%`);

  if (results.issues.length === 0) {
    console.log(`\n✅ No issues found! System is consistent.`);
  } else {
    console.log(`\n⚠️  Issues Found:`);
    
    const criticalIssues = results.issues.filter(i => i.severity === 'critical');
    const warningIssues = results.issues.filter(i => i.severity === 'warning');
    const infoIssues = results.issues.filter(i => i.severity === 'info');

    if (criticalIssues.length > 0) {
      console.log(`\n🚨 Critical Issues:`);
      criticalIssues.forEach(issue => {
        console.log(`  • ${issue.description} (${issue.count || 'N/A'})`);
      });
    }

    if (warningIssues.length > 0) {
      console.log(`\n⚠️  Warnings:`);
      warningIssues.forEach(issue => {
        console.log(`  • ${issue.description} (${issue.count || 'N/A'})`);
      });
    }

    if (infoIssues.length > 0) {
      console.log(`\nℹ️  Information:`);
      infoIssues.forEach(issue => {
        console.log(`  • ${issue.description} (${issue.count || 'N/A'})`);
      });
    }
  }

  console.log(`\n💡 Recommendations:`);
  
  if (results.telemetry.usersWithoutNames > 0) {
    console.log(`  • Run backfill script for missing user names`);
  }
  
  const criticalIssues = results.issues.filter(i => i.severity === 'critical');
  if (criticalIssues.length > 0) {
    console.log(`  • Address critical data integrity issues immediately`);
  }
  
  if (results.score < 80) {
    console.log(`  • Review and fix reported issues to improve consistency`);
  } else {
    console.log(`  • System is in good health! Continue monitoring.`);
  }

  console.log('\n============================================================\n');
}

// Main execution
async function main() {
  try {
    const results = await runAudit();
    printReport(results);
    process.exit(results.score >= 60 ? 0 : 1);
  } catch (error) {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}