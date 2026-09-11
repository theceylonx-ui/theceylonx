import { eq, desc, and, like, count, gte, notInArray, sql } from "drizzle-orm";
import { db } from "../db";
import {
  users,
  roles,
  auditLogs,
  mediaAssets,
  trips,
  reports,
  roleAssignments,
  quickTrips,
  chatThreads,
  userInteractions,
  type User,
  type Role,
  type AuditLog,
  type MediaAsset,
  type UserWithRole,
  type AdminPermissions,
  type InsertRole,
  type InsertAuditLog,
  type InsertMediaAsset
} from "@shared/schema";
import { ROLE_DEFAULTS, PermKey, validatePermissions } from "../admin/permissions";
import { validateRolePermissions, sanitizePermissions, newToLegacyPermissions } from "../admin/validation";
import { getExcludedUserIds } from "../utils/testDataFilter";

// The three route clusters HiBowan launched with (client/src/pages/landing.tsx),
// classified by substring match against a trip's from/to location. A trip can
// count toward more than one cluster if it touches more than one.
const ROUTE_CLUSTERS: { name: string; cities: string[] }[] = [
  { name: 'Colombo–Galle–Ella', cities: ['colombo', 'galle', 'ella', 'mirissa', 'unawatuna', 'hikkaduwa', 'bentota', 'weligama', 'matara', 'nuwara eliya'] },
  { name: 'Ella–Arugam Bay', cities: ['ella', 'arugam bay', 'pottuvil'] },
  { name: 'Yala–Udawalawe', cities: ['yala', 'udawalawe', 'tissamaharama', 'embilipitiya'] },
];

function excludeIds(column: any, excludedUserIds: string[]) {
  return excludedUserIds.length > 0 ? notInArray(column, excludedUserIds) : sql`true`;
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export class AdminService {
  // Initialize admin system with default roles and validation
  async initializeAdminSystem(): Promise<void> {
    try {
      // Check if roles exist, if not create them
      const existingRoles = await db.select().from(roles);
      
      if (existingRoles.length === 0) {
        console.log('🔧 Initializing admin system with new permission registry...');
        
        // Create roles with new permission format
        const rolesToCreate = Object.entries(ROLE_DEFAULTS).map(([name, permissions]) => ({
          name,
          displayName: name,
          permissions: permissions, // Use new array-based format
        }));

        await db.insert(roles).values(rolesToCreate);
        console.log('✅ Admin roles initialized with new permission system');
      } else {
        // Skip validation during startup for fast deployment
        console.log('✅ Existing roles found, skipping validation for fast startup');
        console.log('💡 Role validation available at POST /api/admin/validate-roles');
      }
    } catch (error) {
      console.error('❌ Failed to initialize admin system:', error);
      throw error;
    }
  }

  // Setup superadmin on first login
  async setupSuperadmin(email: string): Promise<UserWithRole | null> {
    try {
      const superadminEmails = process.env.SUPERADMIN_EMAILS?.split(',') || [];
      
      if (!superadminEmails.includes(email)) {
        return null;
      }

      // Find user by email
      const [user] = await db.select().from(users).where(eq(users.email, email));
      if (!user) return null;

      // Get superadmin role
      const [superadminRole] = await db.select().from(roles).where(eq(roles.name, 'superadmin'));
      if (!superadminRole) {
        throw new Error('Superadmin role not found');
      }

      // Update user role if not already set
      if (user.roleId !== superadminRole.id) {
        await db.update(users)
          .set({ roleId: superadminRole.id })
          .where(eq(users.id, user.id));

        // Log the action
        await this.logAction({
          actorUserId: user.id,
          action: 'superadmin_setup',
          targetType: 'user',
          targetId: user.id,
          meta: { email },
        });
      }

      return { ...user, role: superadminRole };
    } catch (error) {
      console.error('❌ Failed to setup superadmin:', error);
      return null;
    }
  }

  // Get user with role details
  async getUserWithRole(userId: string): Promise<UserWithRole | null> {
    try {
      const [result] = await db
        .select({
          user: users,
          role: roles,
        })
        .from(users)
        .leftJoin(roles, eq(users.roleId, roles.id))
        .where(eq(users.id, userId));

      if (!result) return null;

      return {
        ...result.user,
        role: result.role || undefined,
      };
    } catch (error) {
      console.error('❌ Failed to get user with role:', error);
      return null;
    }
  }

  // Check if user has admin access
  async hasAdminAccess(userId: string): Promise<boolean> {
    try {
      const userWithRole = await this.getUserWithRole(userId);
      if (!userWithRole?.role) return false;

      const adminRoles = ['superadmin', 'admin', 'moderator'];
      return adminRoles.includes(userWithRole.role.name);
    } catch (error) {
      console.error('❌ Failed to check admin access:', error);
      return false;
    }
  }

  // Get dashboard summary - matches frontend DashboardStats interface
  async getDashboardSummary(): Promise<{
    users: { total: number; active24h: number; newToday: number };
    trips: { total: number; active: number; pending: number };
    reports: { total: number; open: number; resolved24h: number };
    chat: { activeThreads: number; flaggedMessages: number };
    activityChart: { date: string; signups: number; trips: number }[];
    routeClusters: { name: string; count: number }[];
    recentSignups: { id: string; name: string; email: string; createdAt: string }[];
    recentTrips: { id: string; title: string; fromLocation: string; toLocation: string; type: string; createdAt: string }[];
    recentActions: AuditLog[];
  }> {
    const empty = {
      users: { total: 0, active24h: 0, newToday: 0 },
      trips: { total: 0, active: 0, pending: 0 },
      reports: { total: 0, open: 0, resolved24h: 0 },
      chat: { activeThreads: 0, flaggedMessages: 0 },
      activityChart: [],
      routeClusters: [],
      recentSignups: [],
      recentTrips: [],
      recentActions: [],
    };

    try {
      const excludedUserIds = await getExcludedUserIds();
      const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const [
        [{ totalUsers }],
        [{ newToday }],
        [{ active24h }],
        [{ totalTrips }],
        [{ totalQuickTrips }],
        [{ activeTrips }],
        [{ activeQuickTrips }],
        [{ pendingTripReports }],
        [{ totalReports }],
        [{ openReports }],
        [{ resolved24h }],
        [{ activeThreads }],
        [{ flaggedMessages }],
        recentActions,
      ] = await Promise.all([
        db.select({ totalUsers: count() }).from(users).where(excludeIds(users.id, excludedUserIds)),
        db.select({ newToday: count() }).from(users).where(and(gte(users.createdAt, since24h), excludeIds(users.id, excludedUserIds))),
        db.select({ active24h: sql<number>`count(distinct ${userInteractions.userId})::int` }).from(userInteractions)
          .where(and(gte(userInteractions.createdAt, since24h), excludeIds(userInteractions.userId, excludedUserIds))),
        db.select({ totalTrips: count() }).from(trips).where(excludeIds(trips.organizerId, excludedUserIds)),
        db.select({ totalQuickTrips: count() }).from(quickTrips).where(excludeIds(quickTrips.organizerId, excludedUserIds)),
        db.select({ activeTrips: count() }).from(trips).where(and(eq(trips.status, 'active'), excludeIds(trips.organizerId, excludedUserIds))),
        db.select({ activeQuickTrips: count() }).from(quickTrips).where(and(eq(quickTrips.status, 'active'), excludeIds(quickTrips.organizerId, excludedUserIds))),
        // Trips have no "pending" status (check_status_valid only allows
        // active/inactive/cancelled/completed/archived) — the closest real
        // "needs review" signal is an open report against a trip.
        db.select({ pendingTripReports: count() }).from(reports).where(and(eq(reports.context, 'trip'), eq(reports.status, 'open'))),
        db.select({ totalReports: count() }).from(reports),
        db.select({ openReports: count() }).from(reports).where(eq(reports.status, 'open')),
        db.select({ resolved24h: count() }).from(reports).where(gte(reports.resolvedAt, since24h)),
        db.select({ activeThreads: count() }).from(chatThreads).where(eq(chatThreads.status, 'open')),
        db.select({ flaggedMessages: count() }).from(reports).where(and(eq(reports.context, 'chat_message'), eq(reports.status, 'open'))),
        db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(20),
      ]);

      // --- 30-day activity chart (signups vs. trips posted per day) ---
      const [signupRows, tripDateRows, quickTripDateRows] = await Promise.all([
        db.select({ createdAt: users.createdAt }).from(users)
          .where(and(gte(users.createdAt, since30d), excludeIds(users.id, excludedUserIds))),
        db.select({ createdAt: trips.createdAt }).from(trips)
          .where(and(gte(trips.createdAt, since30d), excludeIds(trips.organizerId, excludedUserIds))),
        db.select({ createdAt: quickTrips.createdAt }).from(quickTrips)
          .where(and(gte(quickTrips.createdAt, since30d), excludeIds(quickTrips.organizerId, excludedUserIds))),
      ]);

      const signupsByDay = new Map<string, number>();
      const tripsByDay = new Map<string, number>();
      for (const row of signupRows) {
        const key = dayKey(row.createdAt);
        signupsByDay.set(key, (signupsByDay.get(key) || 0) + 1);
      }
      for (const row of [...tripDateRows, ...quickTripDateRows]) {
        const key = dayKey(row.createdAt);
        tripsByDay.set(key, (tripsByDay.get(key) || 0) + 1);
      }

      const activityChart: { date: string; signups: number; trips: number }[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const key = dayKey(d);
        activityChart.push({ date: key, signups: signupsByDay.get(key) || 0, trips: tripsByDay.get(key) || 0 });
      }

      // --- Route cluster breakdown ---
      const [tripLocationRows, quickTripLocationRows] = await Promise.all([
        db.select({ fromLocation: trips.fromLocation, toLocation: trips.toLocation }).from(trips)
          .where(excludeIds(trips.organizerId, excludedUserIds)),
        db.select({ fromLocation: quickTrips.fromLocation, toLocation: quickTrips.toLocation }).from(quickTrips)
          .where(excludeIds(quickTrips.organizerId, excludedUserIds)),
      ]);
      const allLocations = [...tripLocationRows, ...quickTripLocationRows];
      const routeClusters = ROUTE_CLUSTERS.map((cluster) => ({
        name: cluster.name,
        count: allLocations.filter((t) => {
          const from = (t.fromLocation || '').toLowerCase();
          const to = (t.toLocation || '').toLowerCase();
          return cluster.cities.some((city) => from.includes(city) || to.includes(city));
        }).length,
      }));

      // --- Recent signups / recent trips (last 20 each, newest first) ---
      const recentSignupRows = await db
        .select({ id: users.id, displayName: users.displayName, username: users.username, email: users.email, createdAt: users.createdAt })
        .from(users)
        .where(excludeIds(users.id, excludedUserIds))
        .orderBy(desc(users.createdAt))
        .limit(20);

      const [recentTripRows, recentQuickTripRows] = await Promise.all([
        db.select({ id: trips.id, title: trips.title, fromLocation: trips.fromLocation, toLocation: trips.toLocation, createdAt: trips.createdAt })
          .from(trips).where(excludeIds(trips.organizerId, excludedUserIds)).orderBy(desc(trips.createdAt)).limit(20),
        db.select({ id: quickTrips.id, title: quickTrips.title, fromLocation: quickTrips.fromLocation, toLocation: quickTrips.toLocation, createdAt: quickTrips.createdAt })
          .from(quickTrips).where(excludeIds(quickTrips.organizerId, excludedUserIds)).orderBy(desc(quickTrips.createdAt)).limit(20),
      ]);

      const recentTrips = [
        ...recentTripRows.map((t) => ({ ...t, type: 'Detailed Trip' })),
        ...recentQuickTripRows.map((t) => ({ ...t, type: 'Quick Trip' })),
      ]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 20)
        .map((t) => ({ ...t, createdAt: t.createdAt.toISOString() }));

      return {
        users: { total: totalUsers || 0, active24h: active24h || 0, newToday: newToday || 0 },
        trips: { total: (totalTrips || 0) + (totalQuickTrips || 0), active: (activeTrips || 0) + (activeQuickTrips || 0), pending: pendingTripReports || 0 },
        reports: { total: totalReports || 0, open: openReports || 0, resolved24h: resolved24h || 0 },
        chat: { activeThreads: activeThreads || 0, flaggedMessages: flaggedMessages || 0 },
        activityChart,
        routeClusters,
        recentSignups: recentSignupRows.map((u) => ({
          id: u.id,
          name: u.displayName?.trim() || u.username?.trim() || 'Unnamed',
          email: u.email || '(no email)',
          createdAt: u.createdAt.toISOString(),
        })),
        recentTrips,
        recentActions,
      };
    } catch (error) {
      console.error('❌ Failed to get dashboard summary:', error);
      return empty;
    }
  }

  // Get paginated users with search
  async getUsers(search: string = '', page: number = 1, limit: number = 20): Promise<{
    users: UserWithRole[];
    total: number;
    pages: number;
  }> {
    try {
      const offset = (page - 1) * limit;
      
      const whereClause = search 
        ? like(users.email, `%${search}%`)
        : undefined;

      const [userResults, [{ total }]] = await Promise.all([
        db
          .select({
            user: users,
            role: roles,
          })
          .from(users)
          .leftJoin(roles, eq(users.roleId, roles.id))
          .where(whereClause)
          .orderBy(desc(users.createdAt))
          .offset(offset)
          .limit(limit),
        db.select({ total: count() }).from(users).where(whereClause),
      ]);

      const usersWithRoles = userResults.map(result => ({
        ...result.user,
        role: result.role || undefined,
      }));

      return {
        users: usersWithRoles,
        total: total || 0,
        pages: Math.ceil((total || 0) / limit),
      };
    } catch (error) {
      console.error('❌ Failed to get users:', error);
      return { users: [], total: 0, pages: 0 };
    }
  }

  async getTrips(status: string = '', page: number = 1, limit: number = 20): Promise<{
    trips: any[];
    total: number;
    pages: number;
  }> {
    try {
      const offset = (page - 1) * limit;
      
      const whereClause = status 
        ? eq(trips.status, status)
        : undefined;

      const [tripResults, [{ total }]] = await Promise.all([
        db
          .select()
          .from(trips)
          .where(whereClause)
          .orderBy(desc(trips.createdAt))
          .offset(offset)
          .limit(limit),
        db.select({ total: count() }).from(trips).where(whereClause),
      ]);

      return {
        trips: tripResults,
        total: total || 0,
        pages: Math.ceil((total || 0) / limit),
      };
    } catch (error) {
      console.error('❌ Failed to get trips:', error);
      return { trips: [], total: 0, pages: 0 };
    }
  }

  // Update user role
  async updateUserRole(userId: string, roleId: string, actorId: string): Promise<boolean> {
    try {
      await db.update(users)
        .set({ roleId, updatedAt: new Date() })
        .where(eq(users.id, userId));

      // Log the action
      await this.logAction({
        actorUserId: actorId,
        action: 'role_change',
        targetType: 'user',
        targetId: userId,
        meta: { newRoleId: roleId },
      });

      return true;
    } catch (error) {
      console.error('❌ Failed to update user role:', error);
      return false;
    }
  }

  // Get all roles
  async getRoles(): Promise<Role[]> {
    try {
      return await db.select().from(roles).orderBy(roles.name);
    } catch (error) {
      console.error('❌ Failed to get roles:', error);
      return [];
    }
  }

  // Create new role
  async createRole(roleData: InsertRole, actorId: string): Promise<Role | null> {
    try {
      const [newRole] = await db.insert(roles).values(roleData).returning();

      // Log the action
      await this.logAction({
        actorUserId: actorId,
        action: 'role_create',
        targetType: 'role',
        targetId: newRole.id,
        meta: { roleName: roleData.name },
      });

      return newRole;
    } catch (error) {
      console.error('❌ Failed to create role:', error);
      return null;
    }
  }

  // Update role permissions
  async updateRole(roleId: string, permissions: AdminPermissions, actorId: string): Promise<boolean> {
    try {
      await db.update(roles)
        .set({ permissions, updatedAt: new Date() })
        .where(eq(roles.id, roleId));

      // Log the action
      await this.logAction({
        actorUserId: actorId,
        action: 'role_update',
        targetType: 'role',
        targetId: roleId,
        meta: { newPermissions: permissions },
      });

      return true;
    } catch (error) {
      console.error('❌ Failed to update role:', error);
      return false;
    }
  }

  // Get media assets
  async getMediaAssets(type: string = 'image', page: number = 1, limit: number = 20): Promise<{
    assets: MediaAsset[];
    total: number;
    pages: number;
  }> {
    try {
      const offset = (page - 1) * limit;
      
      const [assetResults, [{ total }]] = await Promise.all([
        db
          .select()
          .from(mediaAssets)
          .where(eq(mediaAssets.type, type))
          .orderBy(desc(mediaAssets.createdAt))
          .offset(offset)
          .limit(limit),
        db.select({ total: count() }).from(mediaAssets).where(eq(mediaAssets.type, type)),
      ]);

      return {
        assets: assetResults,
        total: total || 0,
        pages: Math.ceil((total || 0) / limit),
      };
    } catch (error) {
      console.error('❌ Failed to get media assets:', error);
      return { assets: [], total: 0, pages: 0 };
    }
  }

  // Save uploaded media asset
  async saveMediaAsset(assetData: InsertMediaAsset, actorId: string): Promise<MediaAsset | null> {
    try {
      const [newAsset] = await db.insert(mediaAssets).values(assetData).returning();

      // Log the action
      await this.logAction({
        actorUserId: actorId,
        action: 'upload',
        targetType: 'media',
        targetId: newAsset.id,
        meta: { filename: assetData.filename, type: assetData.type },
      });

      return newAsset;
    } catch (error) {
      console.error('❌ Failed to save media asset:', error);
      return null;
    }
  }

  // Get audit logs with pagination
  async getAuditLogs(page: number = 1, limit: number = 50): Promise<{
    logs: AuditLog[];
    total: number;
    pages: number;
  }> {
    try {
      const offset = (page - 1) * limit;
      
      const [logResults, [{ total }]] = await Promise.all([
        db
          .select()
          .from(auditLogs)
          .orderBy(desc(auditLogs.createdAt))
          .offset(offset)
          .limit(limit),
        db.select({ total: count() }).from(auditLogs),
      ]);

      return {
        logs: logResults,
        total: total || 0,
        pages: Math.ceil((total || 0) / limit),
      };
    } catch (error) {
      console.error('❌ Failed to get audit logs:', error);
      return { logs: [], total: 0, pages: 0 };
    }
  }

  // Log admin action
  async logAction(logData: InsertAuditLog): Promise<void> {
    try {
      await db.insert(auditLogs).values(logData);
    } catch (error) {
      console.error('❌ Failed to log action:', error);
    }
  }

  // Get role assignments
  async getRoleAssignments(): Promise<any[]> {
    try {
      const assignments = await db
        .select({
          id: roleAssignments.id,
          userId: roleAssignments.userId,
          roleId: roleAssignments.roleId,
          assignedBy: roleAssignments.assignedBy,
          assignedAt: roleAssignments.assignedAt,
          isActive: roleAssignments.isActive,
          user: users,
          role: roles,
        })
        .from(roleAssignments)
        .leftJoin(users, eq(roleAssignments.userId, users.id))
        .leftJoin(roles, eq(roleAssignments.roleId, roles.id))
        .where(eq(roleAssignments.isActive, true))
        .orderBy(desc(roleAssignments.assignedAt));

      return assignments.map(a => ({
        id: a.id,
        userId: a.userId,
        roleId: a.roleId,
        user: a.user ? {
          id: a.user.id,
          email: a.user.email,
          displayName: a.user.displayName,
          username: a.user.username,
        } : null,
        role: a.role,
        assignedBy: a.assignedBy,
        assignedAt: a.assignedAt,
        isActive: a.isActive,
      }));
    } catch (error) {
      console.error('❌ Failed to get role assignments:', error);
      return [];
    }
  }

  // Get reports for moderation
  async getReports(
    priority?: string,
    status?: string,
    search?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ reports: any[]; total: number; pages: number }> {
    try {
      const offset = (page - 1) * limit;
      
      let whereConditions = [];
      if (status && status !== 'all') {
        whereConditions.push(eq(reports.status, status as any));
      }

      const reportResults = await db
        .select({
          report: reports,
          reporter: users,
        })
        .from(reports)
        .leftJoin(users, eq(reports.reporterId, users.id))
        .orderBy(desc(reports.createdAt))
        .offset(offset)
        .limit(limit);

      const [{ total }] = await db.select({ total: count() }).from(reports);

      return {
        reports: reportResults.map(r => ({
          ...r.report,
          reporter: r.reporter ? {
            id: r.reporter.id,
            email: r.reporter.email,
            displayName: r.reporter.displayName,
            username: r.reporter.username,
          } : null,
        })),
        total: total || 0,
        pages: Math.ceil((total || 0) / limit),
      };
    } catch (error) {
      console.error('❌ Failed to get reports:', error);
      return { reports: [], total: 0, pages: 0 };
    }
  }

  // Update report status
  async updateReport(
    reportId: string,
    status: string,
    resolution: string,
    notes: string,
    actorId: string
  ): Promise<boolean> {
    try {
      await db.update(reports)
        .set({
          status: status as any,
          resolutionNotes: notes,
          resolvedAt: status === 'resolved' ? new Date() : undefined,
        })
        .where(eq(reports.id, reportId));

      await this.logAction({
        actorUserId: actorId,
        action: 'report_update',
        targetType: 'report',
        targetId: reportId,
        meta: { status, resolution, notes },
      });

      return true;
    } catch (error) {
      console.error('❌ Failed to update report:', error);
      return false;
    }
  }
}

export const adminService = new AdminService();