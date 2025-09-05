import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

// Re-export for convenience
export { PermissionGuard, SuperAdminOnly, AdminOrAbove, ModeratorOrAbove } from "@/components/admin/PermissionGuard";

// Admin user interface matching server-side structure
export interface AdminUser {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  legacyPermissions: {
    canManageUsers: boolean;
    canManageContent: boolean;
    canViewLogs: boolean;
    canManageRoles: boolean;
  };
  isEmailVerified: boolean;
  lastAuthTime?: string;
}

// Permission helper functions
export function hasPermission(userPermissions: string[], required: string): boolean {
  return userPermissions.includes(required);
}

export function hasAnyPermission(userPermissions: string[], required: string[]): boolean {
  return required.some(perm => userPermissions.includes(perm));
}

export function hasAllPermissions(userPermissions: string[], required: string[]): boolean {
  return required.every(perm => userPermissions.includes(perm));
}

export function isDestructivePermission(permission: string): boolean {
  const destructivePerms = [
    'users.ban', 'users.delete', 'trips.delete', 'chat.purge',
    'reports.delete', 'logs.delete', 'settings.secrets', 'roles.delete',
    'taxonomy.delete', 'media.delete'
  ];
  return destructivePerms.includes(permission);
}

// Main admin auth hook
export function useAdminAuth() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  
  const { data: adminUser, isLoading: adminLoading, error } = useQuery({
    queryKey: ['/api/admin/me'],
    enabled: !!isAuthenticated && !!user,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const isLoading = authLoading || adminLoading;
  const isAdmin = !!adminUser && !error;
  const isSuperAdmin = adminUser?.role === 'superadmin';
  const isAdminRole = adminUser?.role === 'admin';
  const isModerator = adminUser?.role === 'moderator';

  return {
    user,
    adminUser: adminUser as AdminUser | undefined,
    isLoading,
    isAuthenticated,
    isAdmin,
    isSuperAdmin,
    isAdminRole,
    isModerator,
    error,
    // Permission helpers bound to current user
    hasPermission: (permission: string) => 
      adminUser ? hasPermission(adminUser.permissions, permission) : false,
    hasAnyPermission: (permissions: string[]) => 
      adminUser ? hasAnyPermission(adminUser.permissions, permissions) : false,
    hasAllPermissions: (permissions: string[]) => 
      adminUser ? hasAllPermissions(adminUser.permissions, permissions) : false,
    canAccess: (requiredRole?: string, requiredPermission?: string) => {
      if (!adminUser) return false;
      if (requiredRole && adminUser.role !== requiredRole && adminUser.role !== 'superadmin') {
        return false;
      }
      if (requiredPermission && !hasPermission(adminUser.permissions, requiredPermission)) {
        return false;
      }
      return true;
    }
  };
}

// Hook for checking specific permissions
export function usePermission(permission: string) {
  const { adminUser, isLoading } = useAdminAuth();
  
  return {
    hasPermission: adminUser ? hasPermission(adminUser.permissions, permission) : false,
    isLoading,
    isDestructive: isDestructivePermission(permission)
  };
}

// Hook for role-based access
export function useRole(...allowedRoles: string[]) {
  const { adminUser, isLoading } = useAdminAuth();
  
  return {
    hasRole: adminUser ? allowedRoles.includes(adminUser.role) || adminUser.role === 'superadmin' : false,
    userRole: adminUser?.role,
    isLoading
  };
}