import { ReactNode } from "react";
import { useAdminAuth, usePermission, useRole } from "@/hooks/useAdminAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Lock } from "lucide-react";

interface PermissionGuardProps {
  permission?: string;
  role?: string;
  any?: string[]; // Has any of these permissions
  all?: string[]; // Has all of these permissions
  fallback?: ReactNode;
  showError?: boolean;
  children: ReactNode;
}

export function PermissionGuard({ 
  permission, 
  role, 
  any, 
  all, 
  fallback, 
  showError = false, 
  children 
}: PermissionGuardProps) {
  const { adminUser, isLoading, hasPermission, hasAnyPermission, hasAllPermissions } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-ceylon-green"></div>
      </div>
    );
  }

  if (!adminUser) {
    if (showError) {
      return (
        <Alert variant="destructive">
          <Lock className="h-4 w-4" />
          <AlertDescription>
            Admin authentication required to access this feature.
          </AlertDescription>
        </Alert>
      );
    }
    return fallback || null;
  }

  // Check role requirement
  if (role && adminUser.role !== role && adminUser.role !== 'superadmin') {
    if (showError) {
      return (
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            {role} role required. Your role: {adminUser.role}
          </AlertDescription>
        </Alert>
      );
    }
    return fallback || null;
  }

  // Check permission requirements
  let hasRequiredAccess = true;

  if (permission && !hasPermission(permission)) {
    hasRequiredAccess = false;
  }

  if (any && !hasAnyPermission(any)) {
    hasRequiredAccess = false;
  }

  if (all && !hasAllPermissions(all)) {
    hasRequiredAccess = false;
  }

  if (!hasRequiredAccess) {
    if (showError) {
      return (
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Insufficient permissions. Required: {permission || any?.join(', ') || all?.join(', ')}
          </AlertDescription>
        </Alert>
      );
    }
    return fallback || null;
  }

  return <>{children}</>;
}

// Specialized guards for common use cases
export function SuperAdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard role="superadmin" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function AdminOrAbove({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const { hasRole } = useRole('admin', 'superadmin');
  return hasRole ? <>{children}</> : (fallback || null);
}

export function ModeratorOrAbove({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const { hasRole } = useRole('moderator', 'admin', 'superadmin');
  return hasRole ? <>{children}</> : (fallback || null);
}