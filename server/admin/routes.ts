import express from 'express';
import { 
  requireAdmin, 
  requirePermission, 
  requireStepUp 
} from '../middleware/adminAuth';
import { storage } from '../storage';
import { validatePermissions } from './validation';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

const roleUpdateSchema = z.object({
  role: z.enum(['user', 'moderator', 'admin', 'superadmin']),
  permissions: z.array(z.string()).optional(),
});

// Apply base admin auth to all routes
router.use(requireAdmin);

// ===== ADMIN AUTHENTICATION & SESSION ROUTES =====

// Get current admin user info
router.get('/me', async (req: any, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Get user from storage to get full data
    const userData = await storage.getUser(user.id);
    if (!userData) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Mock admin user structure for the frontend
    res.json({
      id: userData.id,
      email: userData.email,
      role: userData.role || 'admin',
      permissions: userData.adminPermissions || [],
      legacyPermissions: {
        canManageUsers: true,
        canManageContent: true,
        canViewLogs: true,
        canManageRoles: true
      },
      isEmailVerified: true,
      lastAuthTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching admin user:', error);
    res.status(500).json({ message: 'Failed to fetch admin user data' });
  }
});

// Refresh admin session
router.post('/refresh', async (req: any, res) => {
  try {
    res.json({ 
      message: 'Session refreshed',
      lastAuthTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error refreshing admin session:', error);
    res.status(500).json({ message: 'Failed to refresh session' });
  }
});

// ===== DASHBOARD & OVERVIEW ROUTES =====

// Admin dashboard statistics
router.get('/dashboard', async (req: any, res) => {
  try {
    // Get basic stats from existing data
    const [allUsers, allTrips, allReports] = await Promise.all([
      storage.getAllUsers(),
      storage.getTrips({}),
      storage.getReports()
    ]);

    // Calculate stats
    const users = {
      total: allUsers.length,
      active24h: allUsers.filter(u => {
        const lastSeen = new Date(u.updatedAt || u.createdAt);
        return Date.now() - lastSeen.getTime() < 24 * 60 * 60 * 1000;
      }).length,
      newToday: allUsers.filter(u => {
        const created = new Date(u.createdAt);
        return Date.now() - created.getTime() < 24 * 60 * 60 * 1000;
      }).length
    };

    const trips = {
      total: allTrips.length,
      active: allTrips.filter(t => t.status === 'active').length,
      pending: allTrips.filter(t => t.status === 'pending').length
    };

    const reports = {
      total: allReports.length,
      open: allReports.filter(r => r.status === 'pending').length,
      resolved24h: allReports.filter(r => {
        const updated = new Date(r.updatedAt || r.createdAt);
        return r.status === 'resolved' && Date.now() - updated.getTime() < 24 * 60 * 60 * 1000;
      }).length
    };

    const chat = {
      activeThreads: 0,
      flaggedMessages: 0
    };

    res.json({
      users,
      trips,
      reports,
      chat
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
  }
});

// ===== USER MANAGEMENT ROUTES =====

// List users with pagination and search
router.get('/users', async (req: any, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { search, role, status } = req.query;
    
    // Get all users and filter
    let users = await storage.getAllUsers();
    
    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(u => 
        u.email?.toLowerCase().includes(searchLower) ||
        u.firstName?.toLowerCase().includes(searchLower) ||
        u.lastName?.toLowerCase().includes(searchLower) ||
        u.username?.toLowerCase().includes(searchLower)
      );
    }
    
    if (role) {
      users = users.filter(u => u.role === role);
    }
    
    // Pagination
    const total = users.length;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const paginatedUsers = users.slice(offset, offset + parseInt(limit));
    
    res.json({
      users: paginatedUsers,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Get specific user details
router.get('/users/:id', async (req: any, res) => {
  try {
    const { id } = req.params;
    const user = await storage.getUser(id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// ===== TRIP MANAGEMENT ROUTES =====

// List trips with admin filters
router.get('/trips', async (req: any, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { status, organizer } = req.query;
    
    // Get all trips and filter
    let trips = await storage.getTrips({});
    
    // Apply filters
    if (status) {
      trips = trips.filter(t => t.status === status);
    }
    
    if (organizer) {
      trips = trips.filter(t => t.organizerId === organizer);
    }
    
    // Pagination
    const total = trips.length;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const paginatedTrips = trips.slice(offset, offset + parseInt(limit));
    
    res.json({
      trips: paginatedTrips,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({ message: 'Failed to fetch trips' });
  }
});

// ===== REPORTS MANAGEMENT ROUTES =====

// List reports
router.get('/reports', async (req: any, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { status, type } = req.query;
    
    // Get all reports and filter
    let reports = await storage.getReports();
    
    // Apply filters
    if (status) {
      reports = reports.filter(r => r.status === status);
    }
    
    if (type) {
      reports = reports.filter(r => r.reason === type);
    }
    
    // Pagination
    const total = reports.length;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const paginatedReports = reports.slice(offset, offset + parseInt(limit));
    
    res.json({
      reports: paginatedReports,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Failed to fetch reports' });
  }
});

// Update report status (existing implementation)
router.patch('/reports/:id/status', async (req: any, res) => {
  try {
    const { id } = req.params;
    const { status, action } = req.body;
    
    const updatedReport = await storage.updateReportStatus(id, status);
    
    res.json({
      ...updatedReport,
      actionTaken: action
    });
  } catch (error) {
    console.error('Error updating report status:', error);
    res.status(500).json({ message: 'Failed to update report status' });
  }
});

export default router;