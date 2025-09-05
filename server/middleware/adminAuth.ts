import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/adminService';
import { PermKey, isDestructiveAction, hasPermission } from '../admin/permissions';
import { sanitizePermissions } from '../admin/validation';

// Extend Request type to include admin user info with enhanced security
declare global {
  namespace Express {
    interface Request {
      adminUser?: {
        id: string;
        email: string;
        role: string;
        permissions: PermKey[];
        legacyPermissions: any; // For backward compatibility
        isEmailVerified: boolean;
        lastAuthTime?: Date;
      };
    }
  }
}

// Admin access logging and debugging
const logAdminAccess = (req: Request, action: string, result: 'allow' | 'deny', reason?: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔐 Admin Access [${action}]:`, {
      userId: req.user?.id || req.user?.claims?.sub,
      email: req.user?.email || req.user?.claims?.email,
      role: req.adminUser?.role,
      permissions: req.adminUser?.permissions,
      route: req.path,
      method: req.method,
      result,
      reason,
      ip: req.ip,
      userAgent: req.get('User-Agent')?.substring(0, 100)
    });
  }
};

// Enhanced admin middleware with permission validation
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if user is authenticated (using existing auth)
    if (!req.user) {
      logAdminAccess(req, 'requireAdmin', 'deny', 'No authentication');
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userId = req.user.id || req.user.claims?.sub;
    const email = req.user.email || req.user.claims?.email;
    
    if (!userId) {
      logAdminAccess(req, 'requireAdmin', 'deny', 'Invalid user session');
      return res.status(401).json({ message: 'Invalid user session' });
    }

    // Check admin access
    const hasAccess = await adminService.hasAdminAccess(userId);
    if (!hasAccess) {
      logAdminAccess(req, 'requireAdmin', 'deny', 'No admin role assigned');
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Get user with role details
    const userWithRole = await adminService.getUserWithRole(userId);
    if (!userWithRole?.role) {
      logAdminAccess(req, 'requireAdmin', 'deny', 'No role assigned');
      return res.status(403).json({ message: 'No role assigned' });
    }

    // Sanitize and validate permissions
    const sanitizedPermissions = sanitizePermissions(userWithRole.role.permissions);
    
    // Add enhanced admin user info to request
    req.adminUser = {
      id: userWithRole.id,
      email: userWithRole.email || '',
      role: userWithRole.role.name,
      permissions: sanitizedPermissions,
      legacyPermissions: userWithRole.role.permissions, // For backward compatibility
      isEmailVerified: userWithRole.emailVerified || false,
      lastAuthTime: new Date(), // Track when auth was verified
    };

    logAdminAccess(req, 'requireAdmin', 'allow');
    next();
  } catch (error) {
    console.error('❌ Admin auth middleware error:', error);
    logAdminAccess(req, 'requireAdmin', 'deny', 'Middleware error');
    res.status(500).json({ message: 'Authentication error' });
  }
};

// Enhanced permission middleware using new permission registry
export const requirePermission = (permission: PermKey) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.adminUser) {
      logAdminAccess(req, `requirePermission(${permission})`, 'deny', 'No admin authentication');
      return res.status(403).json({ message: 'Admin authentication required' });
    }

    const userHasPermission = hasPermission(req.adminUser.permissions, permission);
    if (!userHasPermission) {
      logAdminAccess(req, `requirePermission(${permission})`, 'deny', 'Permission denied');
      return res.status(403).json({ 
        message: `Permission required: ${permission}`,
        required: permission,
        userRole: req.adminUser.role,
        userPermissions: req.adminUser.permissions 
      });
    }

    logAdminAccess(req, `requirePermission(${permission})`, 'allow');
    next();
  };
};

// Legacy permission middleware for backward compatibility
export const requireLegacyPermission = (permission: keyof import('@shared/schema').AdminPermissions) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.adminUser) {
      return res.status(403).json({ message: 'Admin authentication required' });
    }

    const hasLegacyPermission = req.adminUser.legacyPermissions?.[permission];
    if (!hasLegacyPermission) {
      return res.status(403).json({ 
        message: `Permission required: ${permission}`,
        required: permission,
        userRole: req.adminUser.role 
      });
    }

    next();
  };
};

// Step-up authentication middleware for destructive actions
export const requireStepUp = (maxAgeMinutes: number = 10) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.adminUser) {
      return res.status(403).json({ 
        message: 'Admin authentication required',
        stepUpRequired: true 
      });
    }

    // Check if email is verified
    if (!req.adminUser.isEmailVerified) {
      logAdminAccess(req, 'requireStepUp', 'deny', 'Email not verified');
      return res.status(403).json({
        message: 'Email verification required for this action',
        stepUpRequired: true,
        reason: 'email_verification_required'
      });
    }

    // Check if authentication is fresh enough
    const lastAuth = req.adminUser.lastAuthTime;
    if (!lastAuth) {
      logAdminAccess(req, 'requireStepUp', 'deny', 'No auth timestamp');
      return res.status(403).json({
        message: 'Fresh authentication required',
        stepUpRequired: true,
        reason: 'fresh_auth_required'
      });
    }

    const authAge = (Date.now() - lastAuth.getTime()) / (1000 * 60); // Age in minutes
    if (authAge > maxAgeMinutes) {
      logAdminAccess(req, 'requireStepUp', 'deny', `Auth too old: ${authAge.toFixed(1)}min`);
      return res.status(403).json({
        message: `Fresh authentication required (max ${maxAgeMinutes} minutes)`,
        stepUpRequired: true,
        reason: 'auth_expired',
        authAgeMinutes: Math.round(authAge)
      });
    }

    logAdminAccess(req, 'requireStepUp', 'allow', `Auth age: ${authAge.toFixed(1)}min`);
    next();
  };
};

// Combined middleware for destructive permissions + step-up
export const requireDestructivePermission = (permission: PermKey, stepUpMinutes: number = 5) => {
  return [
    requirePermission(permission),
    (req: Request, res: Response, next: NextFunction) => {
      // Additional check: is this actually a destructive action?
      if (isDestructiveAction(permission)) {
        return requireStepUp(stepUpMinutes)(req, res, next);
      }
      next();
    }
  ];
};

// Role-based middleware factories
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.adminUser) {
      return res.status(403).json({ message: 'Admin authentication required' });
    }

    if (!allowedRoles.includes(req.adminUser.role)) {
      logAdminAccess(req, `requireRole(${allowedRoles.join(',')})`, 'deny', `User role: ${req.adminUser.role}`);
      return res.status(403).json({
        message: `Role required: one of ${allowedRoles.join(', ')}`,
        userRole: req.adminUser.role,
        requiredRoles: allowedRoles
      });
    }

    logAdminAccess(req, `requireRole(${allowedRoles.join(',')})`, 'allow');
    next();
  };
};

// IP allowlist middleware (optional security layer)
export const requireAllowedIP = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const allowedIPs = process.env.ADMIN_IP_ALLOWLIST?.split(',') || [];
    
    if (allowedIPs.length === 0) {
      // No IP restriction configured
      return next();
    }
    
    const clientIP = req.ip || req.connection.remoteAddress;
    const isAllowed = allowedIPs.some(allowedIP => {
      if (allowedIP.includes('/')) {
        // CIDR notation - basic implementation
        return clientIP?.startsWith(allowedIP.split('/')[0]);
      }
      return clientIP === allowedIP;
    });

    if (!isAllowed) {
      logAdminAccess(req, 'requireAllowedIP', 'deny', `IP: ${clientIP}`);
      return res.status(403).json({
        message: 'Access denied from this IP address',
        clientIP: process.env.NODE_ENV === 'development' ? clientIP : undefined
      });
    }

    next();
  };
};

// Superadmin setup middleware (for first-time login)
export const setupSuperadmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next();
    }

    const email = req.user.email || req.user.claims?.email;
    if (!email) {
      return next();
    }

    // Try to setup superadmin if eligible
    const superadminUser = await adminService.setupSuperadmin(email);
    if (superadminUser) {
      console.log(`✅ Superadmin setup completed for: ${email}`);
    }

    next();
  } catch (error) {
    console.error('❌ Superadmin setup error:', error);
    next(); // Continue even if setup fails
  }
};

// Audit trail middleware - logs all admin actions
export const auditAction = (action: string, targetType: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store audit info for post-action logging
    req.auditInfo = {
      action,
      targetType,
      targetId: req.params.id || req.body.id,
      startTime: new Date(),
      ip: req.ip,
      userAgent: req.get('User-Agent')
    };
    
    next();
  };
};

// Response interceptor for audit logging
export const completeAudit = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log the audit trail if admin action was successful
      if (req.adminUser && req.auditInfo && res.statusCode < 400) {
        adminService.logAction({
          actorUserId: req.adminUser.id,
          action: req.auditInfo.action,
          targetType: req.auditInfo.targetType,
          targetId: req.auditInfo.targetId,
          meta: {
            ip: req.auditInfo.ip,
            userAgent: req.auditInfo.userAgent,
            duration: Date.now() - req.auditInfo.startTime.getTime(),
            statusCode: res.statusCode
          }
        }).catch(error => {
          console.error('❌ Failed to log audit action:', error);
        });
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

// Extend Request interface for audit info
declare global {
  namespace Express {
    interface Request {
      auditInfo?: {
        action: string;
        targetType: string;
        targetId?: string;
        startTime: Date;
        ip: string;
        userAgent?: string;
      };
    }
  }
}