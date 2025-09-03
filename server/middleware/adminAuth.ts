import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/adminService';

// Extend Request type to include admin user info
declare global {
  namespace Express {
    interface Request {
      adminUser?: {
        id: string;
        email: string;
        role: string;
        permissions: any;
      };
    }
  }
}

// Middleware to check if user has admin access
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if user is authenticated (using existing auth)
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userId = req.user.id || req.user.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Invalid user session' });
    }

    // Check admin access
    const hasAccess = await adminService.hasAdminAccess(userId);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Get user with role details
    const userWithRole = await adminService.getUserWithRole(userId);
    if (!userWithRole?.role) {
      return res.status(403).json({ message: 'No role assigned' });
    }

    // Add admin user info to request
    req.adminUser = {
      id: userWithRole.id,
      email: userWithRole.email || '',
      role: userWithRole.role.name,
      permissions: userWithRole.role.permissions,
    };

    next();
  } catch (error) {
    console.error('❌ Admin auth middleware error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
};

// Middleware to check specific permissions
export const requirePermission = (permission: keyof import('@shared/schema').AdminPermissions) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.adminUser) {
      return res.status(403).json({ message: 'Admin authentication required' });
    }

    const hasPermission = req.adminUser.permissions?.[permission];
    if (!hasPermission) {
      return res.status(403).json({ 
        message: `Permission required: ${permission}`,
        required: permission,
        userRole: req.adminUser.role 
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