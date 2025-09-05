import { z } from 'zod';
import { 
  ALL_PERMS, 
  validatePermissions, 
  ROLE_DEFAULTS,
  type PermKey 
} from './permissions';

/**
 * Zod schemas for validating admin permission structures
 */

// Validate individual permission key
export const permissionKeySchema = z.string().refine(
  (val): val is PermKey => ALL_PERMS.includes(val as PermKey),
  {
    message: `Permission must be one of: ${ALL_PERMS.join(', ')}`
  }
);

// Validate array of permissions
export const permissionsArraySchema = z.array(permissionKeySchema).transform(
  (perms) => validatePermissions(perms)
);

// Legacy AdminPermissions object schema (for backward compatibility)
export const legacyPermissionsSchema = z.object({
  canManageUsers: z.boolean().optional().default(false),
  canManageContent: z.boolean().optional().default(false), 
  canViewLogs: z.boolean().optional().default(false),
  canManageRoles: z.boolean().optional().default(false),
});

// New flexible permissions schema (array-based)
export const newPermissionsSchema = z.union([
  permissionsArraySchema,
  legacyPermissionsSchema.transform(legacyToNewPermissions)
]);

// Role creation/update schema
export const roleSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  permissions: newPermissionsSchema,
});

// Role assignment schema
export const roleAssignmentSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  roleId: z.string().uuid('Invalid role ID'),
});

// Audit log schema
export const auditLogSchema = z.object({
  actorUserId: z.string().uuid('Invalid actor user ID'),
  action: z.string().min(1, 'Action is required'),
  targetType: z.enum(['user', 'role', 'trip', 'report', 'chat', 'media', 'settings']),
  targetId: z.string().optional(),
  meta: z.record(z.any()).optional().default({}),
});

/**
 * Convert legacy permissions object to new permission array format
 */
function legacyToNewPermissions(legacy: z.infer<typeof legacyPermissionsSchema>): PermKey[] {
  const permissions: PermKey[] = [];
  
  if (legacy.canManageUsers) {
    permissions.push('users.view', 'users.edit', 'users.ban');
  }
  
  if (legacy.canManageContent) {
    permissions.push('trips.view', 'trips.moderate', 'trips.edit', 'media.view', 'media.moderate');
  }
  
  if (legacy.canViewLogs) {
    permissions.push('logs.view');
  }
  
  if (legacy.canManageRoles) {
    permissions.push('roles.view', 'roles.assign', 'roles.create_custom');
  }
  
  return permissions;
}

/**
 * Convert new permissions array to legacy format (for backward compatibility)
 */
export function newToLegacyPermissions(permissions: PermKey[]): z.infer<typeof legacyPermissionsSchema> {
  return {
    canManageUsers: permissions.some(p => p.startsWith('users.')),
    canManageContent: permissions.some(p => p.startsWith('trips.') || p.startsWith('media.')),
    canViewLogs: permissions.includes('logs.view'),
    canManageRoles: permissions.some(p => p.startsWith('roles.')),
  };
}

/**
 * Validate role permissions on startup
 */
export async function validateRolePermissions(roles: Array<{ name: string; permissions: any }>): Promise<boolean> {
  let isValid = true;
  
  for (const role of roles) {
    try {
      // Try to parse as new format first
      const parsed = newPermissionsSchema.safeParse(role.permissions);
      
      if (!parsed.success) {
        console.error(`❌ Invalid permissions for role "${role.name}":`, parsed.error.errors);
        isValid = false;
        
        // In development, show suggestions
        if (process.env.NODE_ENV === 'development') {
          console.log(`💡 Suggested permissions for "${role.name}":`, ROLE_DEFAULTS[role.name] || []);
        }
      } else {
        console.log(`✅ Valid permissions for role "${role.name}"`);
      }
    } catch (error) {
      console.error(`❌ Failed to validate permissions for role "${role.name}":`, error);
      isValid = false;
    }
  }
  
  return isValid;
}

/**
 * Sanitize permissions by removing invalid ones
 */
export function sanitizePermissions(permissions: any): PermKey[] {
  if (Array.isArray(permissions)) {
    return validatePermissions(permissions);
  }
  
  // Handle legacy format
  const legacy = legacyPermissionsSchema.safeParse(permissions);
  if (legacy.success) {
    return legacyToNewPermissions(legacy.data);
  }
  
  console.warn('❌ Could not sanitize permissions:', permissions);
  return [];
}

// Export validation functions
export {
  validatePermissions,
  ALL_PERMS,
  ROLE_DEFAULTS,
  PermKey
};