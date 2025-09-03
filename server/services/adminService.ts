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

export class AdminService {
  // Default permission sets for different roles
  private static readonly DEFAULT_PERMISSIONS: Record<string, AdminPermissions> = {
    superadmin: {
      canManageUsers: true,
      canManageContent: true,
      canViewLogs: true,
      canManageRoles: true,
    },
    admin: {
      canManageUsers: true,
      canManageContent: true,
      canViewLogs: true,
      canManageRoles: false,
    },
    moderator: {
      canManageUsers: false,
      canManageContent: true,
      canViewLogs: true,
      canManageRoles: false,
    },
    user: {
      canManageUsers: false,
      canManageContent: false,
      canViewLogs: false,
      canManageRoles: false,
    },
  };

  // Initialize admin system with default roles
  async initializeAdminSystem(): Promise<void> {
    try {
      // Check if roles exist, if not create them
      const existingRoles = await db.select().from(roles);
      
      if (existingRoles.length === 0) {
        const rolesToCreate = Object.entries(this.DEFAULT_PERMISSIONS).map(([name, permissions]) => ({
          name,
          permissions,
        }));

        await db.insert(roles).values(rolesToCreate);
        console.log('✅ Admin roles initialized');
      }
    } catch (error) {
      console.error('❌ Failed to initialize admin system:', error);
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

  // Get dashboard summary
  async getDashboardSummary(): Promise<{
    totalUsers: number;
    totalTrips: number;
    flaggedReports: number;
    recentActions: AuditLog[];
  }> {
    try {
      const [
        [{ totalUsers }],
        [{ totalTrips }],
        [{ flaggedReports }],
        recentActions,
      ] = await Promise.all([
        db.select({ totalUsers: count() }).from(users),
        db.select({ totalTrips: count() }).from(trips),
        db.select({ flaggedReports: count() }).from(reports).where(eq(reports.status, 'pending')),
        db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(20),
      ]);

      return {
        totalUsers: totalUsers || 0,
        totalTrips: totalTrips || 0,
        flaggedReports: flaggedReports || 0,
        recentActions,
      };
    } catch (error) {
      console.error('❌ Failed to get dashboard summary:', error);
      return {
        totalUsers: 0,
        totalTrips: 0,
        flaggedReports: 0,
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