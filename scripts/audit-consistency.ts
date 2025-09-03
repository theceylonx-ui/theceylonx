import { db } from '../server/db';
import { users, trips, comments, questions, answers } from '../shared/schema';
import { sql, eq, isNull, or } from 'drizzle-orm';
import { normalizeUserForUI } from '../server/utils/userNormalization';
import chalk from 'chalk';

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
  details?: any;
}

interface TelemetryData {
  totalUsers: number;
  usersWithoutNames: number;
  usersWithoutAvatars: number;
  fallbackDisplayNamesUsed: number;
  fallbackAvatarsUsed: number;
  dataCompleteness: number;
}

class ConsistencyAuditor {
  private issues: AuditIssue[] = [];
  private telemetry: TelemetryData = {
    totalUsers: 0,
    usersWithoutNames: 0,
    usersWithoutAvatars: 0,
    fallbackDisplayNamesUsed: 0,
    fallbackAvatarsUsed: 0,
    dataCompleteness: 0,
  };

  async runFullAudit(): Promise<AuditResults> {
    console.log(chalk.blue('🔍 Starting Ceylon Expand Consistency Audit...'));
    
    await this.auditUserIdentity();
    await this.auditRelationshipIntegrity();
    await this.auditApiContractCompliance();
    await this.auditRenderingSafety();
    await this.calculateTelemetry();

    const score = this.calculateOverallScore();
    
    return {
      score,
      maxScore: 100,
      issues: this.issues,
      telemetry: this.telemetry,
    };
  }

  private async auditUserIdentity() {
    console.log(chalk.yellow('📋 Auditing user identity normalization...'));

    // Check for users without any name data
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

    if (usersWithoutNames.length > 0) {
      this.issues.push({
        severity: 'warning',
        category: 'User Identity',
        description: 'Users found with missing display names',
        count: usersWithoutNames.length,
        details: usersWithoutNames.slice(0, 5).map(u => ({ id: u.id, email: u.email })),
      });
    }

    // Check for users without avatar URLs
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

    this.telemetry.usersWithoutNames = usersWithoutNames.length;
    this.telemetry.usersWithoutAvatars = usersWithoutAvatars.length;

    // Test user normalization for a sample of users
    const sampleUsers = await db.select().from(users).limit(10);
    let fallbackCount = 0;

    for (const user of sampleUsers) {
      const normalized = normalizeUserForUI(user);
      if (normalized) {
        // Check if fallback was used for display name
        if (normalized.displayName.startsWith('Traveler') || 
            (user.email && normalized.displayName === user.email.split('@')[0])) {
          fallbackCount++;
        }
      }
    }

    this.telemetry.fallbackDisplayNamesUsed = fallbackCount;

    if (fallbackCount > 0) {
      this.issues.push({
        severity: 'info',
        category: 'User Identity',
        description: 'Fallback display names being used',
        count: fallbackCount,
      });
    }
  }

  private async auditRelationshipIntegrity() {
    console.log(chalk.yellow('🔗 Auditing relationship integrity...'));

    // Check for orphaned trips (organizer doesn't exist)
    const orphanedTrips = await db
      .select({ tripId: trips.id, organizerId: trips.organizerId })
      .from(trips)
      .leftJoin(users, eq(trips.organizerId, users.id))
      .where(isNull(users.id));

    if (orphanedTrips.length > 0) {
      this.issues.push({
        severity: 'critical',
        category: 'Data Integrity',
        description: 'Trips found with non-existent organizers',
        count: orphanedTrips.length,
        details: orphanedTrips.slice(0, 5),
      });
    }

    // Check for orphaned comments
    const orphanedComments = await db
      .select({ commentId: comments.id, userId: comments.userId })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(isNull(users.id));

    if (orphanedComments.length > 0) {
      this.issues.push({
        severity: 'critical',
        category: 'Data Integrity',
        description: 'Comments found with non-existent users',
        count: orphanedComments.length,
        details: orphanedComments.slice(0, 5),
      });
    }

    // Check for orphaned questions
    const orphanedQuestions = await db
      .select({ questionId: questions.id, userId: questions.userId })
      .from(questions)
      .leftJoin(users, eq(questions.userId, users.id))
      .where(isNull(users.id));

    if (orphanedQuestions.length > 0) {
      this.issues.push({
        severity: 'critical',
        category: 'Data Integrity',
        description: 'Questions found with non-existent users',
        count: orphanedQuestions.length,
        details: orphanedQuestions.slice(0, 5),
      });
    }
  }

  private async auditApiContractCompliance() {
    console.log(chalk.yellow('📝 Auditing API contract compliance...'));

    // Simulate API response validation by checking if all trip organizers can be normalized
    const tripsWithOrganizers = await db
      .select()
      .from(trips)
      .innerJoin(users, eq(trips.organizerId, users.id))
      .limit(20);

    let normalizationFailures = 0;

    for (const { trips: trip, users: organizer } of tripsWithOrganizers) {
      const normalized = normalizeUserForUI(organizer);
      if (!normalized) {
        normalizationFailures++;
      }
    }

    if (normalizationFailures > 0) {
      this.issues.push({
        severity: 'critical',
        category: 'API Contract',
        description: 'Trip organizers that fail normalization',
        count: normalizationFailures,
      });
    }

    // Check for potential null/undefined exposure in critical fields
    const tripsWithNullFields = await db
      .select({
        id: trips.id,
        title: trips.title,
        seatsAvailable: trips.seatsAvailable,
      })
      .from(trips)
      .where(
        or(
          isNull(trips.title),
          isNull(trips.seatsAvailable),
          eq(trips.title, '')
        )
      );

    if (tripsWithNullFields.length > 0) {
      this.issues.push({
        severity: 'warning',
        category: 'API Contract',
        description: 'Trips with null/empty critical fields',
        count: tripsWithNullFields.length,
      });
    }
  }

  private async auditRenderingSafety() {
    console.log(chalk.yellow('🎨 Auditing rendering safety...'));

    // Check for users that would cause rendering issues
    const problematicUsers = await db
      .select()
      .from(users)
      .where(
        or(
          sql`${users.name} ~ '[<>\"''&]'`, // Contains HTML/XML characters
          sql`LENGTH(${users.name}) > 100`, // Excessively long names
          sql`${users.email} ~ '[<>\"''&]'` // Contains dangerous characters in email
        )
      );

    if (problematicUsers.length > 0) {
      this.issues.push({
        severity: 'warning',
        category: 'Rendering Safety',
        description: 'Users with potentially unsafe display data',
        count: problematicUsers.length,
        details: problematicUsers.slice(0, 3).map(u => ({ 
          id: u.id, 
          name: u.name?.substring(0, 50),
          email: u.email?.substring(0, 50) 
        })),
      });
    }

    // Check for trips with unsafe content
    const problematicTrips = await db
      .select()
      .from(trips)
      .where(
        or(
          sql`${trips.title} ~ '[<>\"''&]'`,
          sql`LENGTH(${trips.title}) > 200`
        )
      );

    if (problematicTrips.length > 0) {
      this.issues.push({
        severity: 'warning',
        category: 'Rendering Safety',
        description: 'Trips with potentially unsafe display data',
        count: problematicTrips.length,
      });
    }
  }

  private async calculateTelemetry() {
    console.log(chalk.yellow('📊 Calculating telemetry data...'));

    const [totalUsersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    this.telemetry.totalUsers = totalUsersResult.count;

    // Calculate data completeness score
    const usersWithCompleteData = this.telemetry.totalUsers - this.telemetry.usersWithoutNames;
    this.telemetry.dataCompleteness = this.telemetry.totalUsers > 0 
      ? (usersWithCompleteData / this.telemetry.totalUsers) * 100 
      : 100;
  }

  private calculateOverallScore(): number {
    let score = 100;

    // Deduct points for each issue based on severity
    for (const issue of this.issues) {
      switch (issue.severity) {
        case 'critical':
          score -= 20;
          break;
        case 'warning':
          score -= 10;
          break;
        case 'info':
          score -= 2;
          break;
      }
    }

    // Bonus points for high data completeness
    if (this.telemetry.dataCompleteness > 95) {
      score += 5;
    }

    return Math.max(0, Math.min(100, score));
  }
}

function printAuditReport(results: AuditResults) {
  console.log('\n' + '='.repeat(60));
  console.log(chalk.bold.blue('🎯 Ceylon Expand Consistency Audit Report'));
  console.log('='.repeat(60));

  // Overall score
  const scoreColor = results.score >= 80 ? chalk.green : results.score >= 60 ? chalk.yellow : chalk.red;
  console.log(`\n${chalk.bold('Overall Score:')} ${scoreColor(results.score)}/${results.maxScore}`);

  // Telemetry summary
  console.log(`\n${chalk.bold.cyan('📊 Telemetry Summary:')}`);
  console.log(`  Total Users: ${results.telemetry.totalUsers}`);
  console.log(`  Users without names: ${results.telemetry.usersWithoutNames}`);
  console.log(`  Users without avatars: ${results.telemetry.usersWithoutAvatars}`);
  console.log(`  Fallback display names used: ${results.telemetry.fallbackDisplayNamesUsed}`);
  console.log(`  Data completeness: ${results.telemetry.dataCompleteness.toFixed(1)}%`);

  // Issues breakdown
  if (results.issues.length === 0) {
    console.log(`\n${chalk.green('✅ No issues found! System is consistent.')}`);
  } else {
    console.log(`\n${chalk.bold.yellow('⚠️  Issues Found:')}`);
    
    const criticalIssues = results.issues.filter(i => i.severity === 'critical');
    const warningIssues = results.issues.filter(i => i.severity === 'warning');
    const infoIssues = results.issues.filter(i => i.severity === 'info');

    if (criticalIssues.length > 0) {
      console.log(`\n${chalk.red.bold('🚨 Critical Issues:')}`);
      criticalIssues.forEach(issue => {
        console.log(`  ${chalk.red('●')} ${issue.description} (${issue.count || 'N/A'})`);
        if (issue.details) {
          console.log(`    ${chalk.gray(JSON.stringify(issue.details, null, 2).substring(0, 200))}...`);
        }
      });
    }

    if (warningIssues.length > 0) {
      console.log(`\n${chalk.yellow.bold('⚠️  Warnings:')}`);
      warningIssues.forEach(issue => {
        console.log(`  ${chalk.yellow('●')} ${issue.description} (${issue.count || 'N/A'})`);
      });
    }

    if (infoIssues.length > 0) {
      console.log(`\n${chalk.blue.bold('ℹ️  Information:')}`);
      infoIssues.forEach(issue => {
        console.log(`  ${chalk.blue('●')} ${issue.description} (${issue.count || 'N/A'})`);
      });
    }
  }

  // Recommendations
  console.log(`\n${chalk.bold.green('💡 Recommendations:')}`);
  
  if (results.telemetry.usersWithoutNames > 0) {
    console.log(`  • Run: npm run backfill-names backfill`);
  }
  
  if (criticalIssues.length > 0) {
    console.log(`  • Address critical data integrity issues immediately`);
  }
  
  if (results.score < 80) {
    console.log(`  • Review and fix reported issues to improve consistency`);
  } else {
    console.log(`  • System is in good health! Continue monitoring.`);
  }

  console.log('\n' + '='.repeat(60));
}

// Main execution
async function runConsistencyAudit() {
  try {
    const auditor = new ConsistencyAuditor();
    const results = await auditor.runFullAudit();
    
    printAuditReport(results);
    
    // Exit with appropriate code
    process.exit(results.score >= 60 ? 0 : 1);
    
  } catch (error) {
    console.error(chalk.red('❌ Audit failed:'), error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runConsistencyAudit();
}

export { ConsistencyAuditor, runConsistencyAudit, type AuditResults };