import { eq, desc, and, like, count } from "drizzle-orm";
import { db } from "../db";
import { 
  users, 
  roles, 
  auditLogs, 
  mediaAssets, 
  trips, 
  reports,
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
      const superadminEmails = process.env.SUPERADMIN_EMAILS?.split(',') || ['theceylonx@gmail.com'];
      
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
    recentActions: AuditLog[];
  }> {
    try {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const [
        [{ totalUsers }],
        [{ totalTrips }],
        [{ activeTrips }],
        [{ pendingReports }],
        [{ totalReports }],
        recentActions,
      ] = await Promise.all([
        db.select({ totalUsers: count() }).from(users).where(eq(users.isDeleted, false)),
        db.select({ totalTrips: count() }).from(trips),
        db.select({ activeTrips: count() }).from(trips).where(eq(trips.status, 'published')),
        db.select({ pendingReports: count() }).from(reports).where(eq(reports.status, 'pending')),
        db.select({ totalReports: count() }).from(reports),
        db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(20),
      ]);

      return {
        users: {
          total: totalUsers || 0,
          active24h: 0,
          newToday: 0,
        },
        trips: {
          total: totalTrips || 0,
          active: activeTrips || 0,
          pending: 0,
        },
        reports: {
          total: totalReports || 0,
          open: pendingReports || 0,
          resolved24h: 0,
        },
        chat: {
          activeThreads: 0,
          flaggedMessages: 0,
        },
        recentActions,
      };
    } catch (error) {
      console.error('❌ Failed to get dashboard summary:', error);
      return {
        users: { total: 0, active24h: 0, newToday: 0 },
        trips: { total: 0, active: 0, pending: 0 },
        reports: { total: 0, open: 0, resolved24h: 0 },
        chat: { activeThreads: 0, flaggedMessages: 0 },
        recentActions: [],
      };
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
        ? and(
            eq(users.isDeleted, false),
            like(users.email, `%${search}%`)
          )
        : eq(users.isDeleted, false);

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
}

export const adminService = new AdminService();