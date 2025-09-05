import { storage } from '../storage';
import { validatePermissions } from '../admin/validation';
import type { AdminPermission } from '../admin/permissions';

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
  isActive: boolean;
  hierarchy: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface RoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  assignedBy: string;
  assignedAt: Date;
  reason?: string;
  isActive: boolean;
  revokedAt?: Date;
  revokedBy?: string;
  revokeReason?: string;
}

// Role hierarchy levels for access control
export const ROLE_HIERARCHY = {
  user: 0,
  moderator: 10,
  admin: 20,
  superadmin: 100
} as const;

export class RoleService {
  // ===== SUPERADMIN INITIALIZATION =====
  
  /**
   * Initialize the first superadmin user via secure email-based setup
   */
  async initializeSuperadmin(email: string, initToken: string): Promise<{ success: boolean; message: string }> {
    try {
      // Validate initialization token (should be set in environment)
      const expectedToken = process.env.SUPERADMIN_INIT_TOKEN;
      if (!expectedToken || initToken !== expectedToken) {
        return { success: false, message: 'Invalid initialization token' };
      }

      // Check if any superadmin already exists
      const existingSuperadmins = await this.getUsersByRole('superadmin');
      if (existingSuperadmins.length > 0) {
        return { success: false, message: 'Superadmin already exists' };
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return { success: false, message: 'User not found with this email' };
      }

      // Create superadmin role if it doesn't exist
      await this.ensureSystemRoles();

      // Assign superadmin role
      const superadminRole = await this.getRoleByName('superadmin');
      if (!superadminRole) {
        return { success: false, message: 'Failed to create superadmin role' };
      }

      await this.assignRole(user.id, superadminRole.id, user.id, 'Initial superadmin setup');

      return { success: true, message: 'Superadmin initialized successfully' };
    } catch (error) {
      console.error('Error initializing superadmin:', error);
      return { success: false, message: 'Failed to initialize superadmin' };
    }
  }

  // ===== ROLE MANAGEMENT =====

  /**
   * Ensure all system roles exist with proper permissions
   */
  async ensureSystemRoles(): Promise<void> {
    const systemRoles = [
      {
        name: 'user',
        displayName: 'User',
        description: 'Standard user with basic permissions',
        permissions: ['users.view_own', 'trips.view', 'trips.create'],
        hierarchy: ROLE_HIERARCHY.user,
        isSystem: true
      },
      {
        name: 'moderator',
        displayName: 'Moderator',
        description: 'Community moderator with content management permissions',
        permissions: [
          'users.view', 'users.edit_basic', 'trips.view', 'trips.edit', 
          'reports.view', 'reports.edit', 'chat.view', 'chat.moderate'
        ],
        hierarchy: ROLE_HIERARCHY.moderator,
        isSystem: true
      },
      {
        name: 'admin',
        displayName: 'Administrator',
        description: 'System administrator with full content and user management',
        permissions: [
          'users.view', 'users.edit', 'users.ban', 'trips.view', 'trips.edit', 'trips.delete',
          'reports.view', 'reports.edit', 'reports.delete', 'chat.view', 'chat.moderate', 'chat.purge',
          'roles.view', 'taxonomy.view', 'taxonomy.edit', 'media.view', 'media.upload', 'logs.view'
        ],
        hierarchy: ROLE_HIERARCHY.admin,
        isSystem: true
      },
      {
        name: 'superadmin',
        displayName: 'Super Administrator',
        description: 'System superadmin with all permissions including role management',
        permissions: [
          'users.view', 'users.edit', 'users.ban', 'users.delete',
          'trips.view', 'trips.edit', 'trips.delete',
          'reports.view', 'reports.edit', 'reports.delete',
          'chat.view', 'chat.moderate', 'chat.purge',
          'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
          'taxonomy.view', 'taxonomy.edit', 'taxonomy.delete',
          'media.view', 'media.upload', 'media.delete',
          'logs.view', 'logs.delete',
          'settings.view', 'settings.edit', 'settings.secrets'
        ],
        hierarchy: ROLE_HIERARCHY.superadmin,
        isSystem: true
      }
    ];

    for (const roleData of systemRoles) {
      try {
        const existingRole = await this.getRoleByName(roleData.name);
        if (!existingRole) {
          await this.createRole(roleData, 'system');
        } else {
          // Update permissions for existing system roles
          await this.updateRolePermissions(existingRole.id, roleData.permissions, 'system');
        }
      } catch (error) {
        console.error(`Failed to ensure system role ${roleData.name}:`, error);
      }
    }
  }

  /**
   * Create a new role
   */
  async createRole(roleData: {
    name: string;
    displayName: string;
    description?: string;
    permissions: string[];
    hierarchy?: number;
    isSystem?: boolean;
  }, createdBy: string): Promise<Role> {
    // Validate permissions
    const validation = validatePermissions(roleData.permissions);
    if (!validation.isValid) {
      throw new Error(`Invalid permissions: ${validation.errors.join(', ')}`);
    }

    // Create role in database (simplified - would use actual storage)
    const role: Role = {
      id: `role_${Date.now()}`,
      name: roleData.name,
      displayName: roleData.displayName,
      description: roleData.description,
      permissions: roleData.permissions,
      isSystem: roleData.isSystem || false,
      isActive: true,
      hierarchy: roleData.hierarchy || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: createdBy === 'system' ? undefined : createdBy
    };

    // TODO: Implement actual database storage
    console.log('Creating role:', role);
    return role;
  }

  /**
   * Get role by name
   */
  async getRoleByName(name: string): Promise<Role | null> {
    // TODO: Implement actual database lookup
    return null;
  }

  /**
   * Get users with a specific role
   */
  async getUsersByRole(roleName: string): Promise<any[]> {
    // TODO: Implement actual database lookup
    return [];
  }

  /**
   * Update role permissions
   */
  async updateRolePermissions(roleId: string, permissions: string[], updatedBy: string): Promise<void> {
    // Validate permissions
    const validation = validatePermissions(permissions);
    if (!validation.isValid) {
      throw new Error(`Invalid permissions: ${validation.errors.join(', ')}`);
    }

    // TODO: Implement actual database update
    console.log(`Updating role ${roleId} permissions:`, permissions);
  }

  // ===== ROLE ASSIGNMENT =====

  /**
   * Assign a role to a user
   */
  async assignRole(userId: string, roleId: string, assignedBy: string, reason?: string): Promise<RoleAssignment> {
    // Check if assignment already exists
    const existingAssignment = await this.getActiveRoleAssignment(userId, roleId);
    if (existingAssignment) {
      throw new Error('User already has this role');
    }

    // Validate hierarchy - can't assign higher role than your own
    const assignerRole = await this.getUserHighestRole(assignedBy);
    const targetRole = await this.getRoleById(roleId);
    
    if (assignerRole && targetRole && targetRole.hierarchy >= assignerRole.hierarchy) {
      throw new Error('Cannot assign role with equal or higher hierarchy than your own');
    }

    const assignment: RoleAssignment = {
      id: `assignment_${Date.now()}`,
      userId,
      roleId,
      assignedBy,
      assignedAt: new Date(),
      reason,
      isActive: true
    };

    // TODO: Implement actual database storage
    console.log('Assigning role:', assignment);
    return assignment;
  }

  /**
   * Revoke a role assignment
   */
  async revokeRole(userId: string, roleId: string, revokedBy: string, reason?: string): Promise<void> {
    const assignment = await this.getActiveRoleAssignment(userId, roleId);
    if (!assignment) {
      throw new Error('Active role assignment not found');
    }

    // TODO: Implement actual database update
    console.log(`Revoking role assignment ${assignment.id} by ${revokedBy}: ${reason}`);
  }

  /**
   * Get active role assignment
   */
  async getActiveRoleAssignment(userId: string, roleId: string): Promise<RoleAssignment | null> {
    // TODO: Implement actual database lookup
    return null;
  }

  /**
   * Get user's highest role by hierarchy
   */
  async getUserHighestRole(userId: string): Promise<Role | null> {
    // TODO: Implement actual database lookup
    return null;
  }

  /**
   * Get role by ID
   */
  async getRoleById(roleId: string): Promise<Role | null> {
    // TODO: Implement actual database lookup
    return null;
  }

  // ===== PERMISSION CHECKING =====

  /**
   * Check if user has specific permission
   */
  async userHasPermission(userId: string, permission: AdminPermission): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId);
    return userRoles.some(role => 
      role.isActive && role.permissions.includes(permission)
    );
  }

  /**
   * Get all active roles for a user
   */
  async getUserRoles(userId: string): Promise<Role[]> {
    // TODO: Implement actual database lookup
    return [];
  }

  /**
   * Get all available roles
   */
  async getAllRoles(): Promise<Role[]> {
    // TODO: Implement actual database lookup
    return [];
  }
}

export const roleService = new RoleService();