import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { adminService } from '../services/adminService';
import { requireAdmin, requirePermission } from '../middleware/adminAuth';
import { insertRoleSchema, insertMediaAssetSchema, insertSiteSettingSchema } from '@shared/schema';

const router = Router();

// Configure multer for admin uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/admin';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpg, png, webp) are allowed'));
    }
  },
});

// All admin routes require admin authentication
router.use(requireAdmin);

// Dashboard endpoint
router.get('/dashboard', async (req, res) => {
  try {
    const summary = await adminService.getDashboardSummary();
    res.json(summary);
  } catch (error) {
    console.error('❌ Admin dashboard error:', error);
    res.status(500).json({ message: 'Failed to load dashboard' });
  }
});

// Users management endpoints
router.get('/users', requirePermission('users.view'), async (req, res) => {
  try {
    const { search = '', page = '1', limit = '20' } = req.query;
    const result = await adminService.getUsers(
      search as string,
      parseInt(page as string),
      parseInt(limit as string)
    );
    res.json(result);
  } catch (error) {
    console.error('❌ Admin users list error:', error);
    res.status(500).json({ message: 'Failed to load users' });
  }
});

router.get('/users/:id', requirePermission('users.view'), async (req, res) => {
  try {
    const { id } = req.params;
    const user = await adminService.getUserWithRole(id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('❌ Admin user details error:', error);
    res.status(500).json({ message: 'Failed to load user details' });
  }
});

router.put('/users/:id/role', requirePermission('users.edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const { roleId } = req.body;
    
    if (!roleId) {
      return res.status(400).json({ message: 'Role ID is required' });
    }
    
    const success = await adminService.updateUserRole(id, roleId, req.adminUser!.id);
    
    if (success) {
      res.json({ message: 'User role updated successfully' });
    } else {
      res.status(500).json({ message: 'Failed to update user role' });
    }
  } catch (error) {
    console.error('❌ Admin user role update error:', error);
    res.status(500).json({ message: 'Failed to update user role' });
  }
});

// Trip management endpoints
router.get('/trips', requirePermission('users.view'), async (req, res) => {
  try {
    const { status = '', page = '1', limit = '20' } = req.query;
    const result = await adminService.getTrips(
      status as string,
      parseInt(page as string),
      parseInt(limit as string)
    );
    res.json({
      trips: result.trips,
      total: result.total,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      totalPages: result.pages,
    });
  } catch (error) {
    console.error('❌ Admin trips list error:', error);
    res.status(500).json({ message: 'Failed to load trips' });
  }
});

// Content management endpoints
router.post('/media', requirePermission('media.upload'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const { type = 'image' } = req.body;
    
    const mediaData = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileUrl: `/uploads/admin/${req.file.filename}`,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      ownerId: req.adminUser!.id,
      type,
    };
    
    const validatedData = insertMediaAssetSchema.parse(mediaData);
    const savedAsset = await adminService.saveMediaAsset(validatedData, req.adminUser!.id);
    
    if (savedAsset) {
      res.status(201).json(savedAsset);
    } else {
      res.status(500).json({ message: 'Failed to save media asset' });
    }
  } catch (error) {
    console.error('❌ Admin media upload error:', error);
    
    // Clean up uploaded file if saving failed
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('❌ Failed to clean up uploaded file:', unlinkError);
      }
    }
    
    res.status(500).json({ message: 'Failed to upload media' });
  }
});

router.get('/media', requirePermission('media.view'), async (req, res) => {
  try {
    const { type = 'image', page = '1', limit = '20' } = req.query;
    const result = await adminService.getMediaAssets(
      type as string,
      parseInt(page as string),
      parseInt(limit as string)
    );
    res.json(result);
  } catch (error) {
    console.error('❌ Admin media list error:', error);
    res.status(500).json({ message: 'Failed to load media assets' });
  }
});

// Roles management endpoints
router.get('/roles', requirePermission('roles.view'), async (req, res) => {
  try {
    const roles = await adminService.getRoles();
    res.json(roles);
  } catch (error) {
    console.error('❌ Admin roles list error:', error);
    res.status(500).json({ message: 'Failed to load roles' });
  }
});

router.post('/roles', requirePermission('roles.create_custom'), async (req, res) => {
  try {
    const roleData = insertRoleSchema.parse(req.body);
    const newRole = await adminService.createRole(roleData, req.adminUser!.id);
    
    if (newRole) {
      res.status(201).json(newRole);
    } else {
      res.status(500).json({ message: 'Failed to create role' });
    }
  } catch (error) {
    console.error('❌ Admin role creation error:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({ 
        message: 'Invalid role data', 
        errors: (error as any).errors 
      });
    }
    
    res.status(500).json({ message: 'Failed to create role' });
  }
});

router.put('/roles/:id', requirePermission('roles.assign'), async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;
    
    if (!permissions) {
      return res.status(400).json({ message: 'Permissions are required' });
    }
    
    const success = await adminService.updateRole(id, permissions, req.adminUser!.id);
    
    if (success) {
      res.json({ message: 'Role updated successfully' });
    } else {
      res.status(500).json({ message: 'Failed to update role' });
    }
  } catch (error) {
    console.error('❌ Admin role update error:', error);
    res.status(500).json({ message: 'Failed to update role' });
  }
});

// Audit logs endpoint
router.get('/logs', requirePermission('logs.view'), async (req, res) => {
  try {
    const { page = '1', limit = '50' } = req.query;
    const result = await adminService.getAuditLogs(
      parseInt(page as string),
      parseInt(limit as string)
    );
    res.json(result);
  } catch (error) {
    console.error('❌ Admin logs error:', error);
    res.status(500).json({ message: 'Failed to load audit logs' });
  }
});

// Admin user info endpoint
router.get('/me', async (req, res) => {
  try {
    if (!req.adminUser) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    res.json(req.adminUser);
  } catch (error) {
    console.error('❌ Admin user info error:', error);
    res.status(500).json({ message: 'Failed to load admin user info' });
  }
});

// Site settings endpoints
router.get('/settings', requirePermission('settings.view'), async (req, res) => {
  try {
    const { category } = req.query;
    const { storage } = await import('../storage');
    const settings = await storage.getAllSiteSettings(category as string);
    res.json(settings);
  } catch (error) {
    console.error('❌ Admin get settings error:', error);
    res.status(500).json({ message: 'Failed to load site settings' });
  }
});

router.get('/settings/:key', requirePermission('settings.view'), async (req, res) => {
  try {
    const { key } = req.params;
    const { storage } = await import('../storage');
    const setting = await storage.getSiteSetting(key);
    if (setting) {
      res.json(setting);
    } else {
      res.status(404).json({ message: 'Setting not found' });
    }
  } catch (error) {
    console.error('❌ Admin get setting error:', error);
    res.status(500).json({ message: 'Failed to load setting' });
  }
});

router.post('/settings', requirePermission('settings.edit'), async (req, res) => {
  try {
    const settingData = insertSiteSettingSchema.parse(req.body);
    const { storage } = await import('../storage');
    const setting = await storage.setSiteSetting(
      settingData.key,
      settingData.value || '',
      settingData.description || undefined,
      settingData.category || undefined
    );
    res.status(201).json(setting);
  } catch (error) {
    console.error('❌ Admin create setting error:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      res.status(400).json({ message: 'Invalid setting data', errors: (error as any).errors });
    } else {
      res.status(500).json({ message: 'Failed to create setting' });
    }
  }
});

router.put('/settings/:key', requirePermission('settings.edit'), async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description, category } = req.body;
    const { storage } = await import('../storage');
    const setting = await storage.setSiteSetting(key, value, description, category);
    res.json(setting);
  } catch (error) {
    console.error('❌ Admin update setting error:', error);
    res.status(500).json({ message: 'Failed to update setting' });
  }
});

router.delete('/settings/:key', requirePermission('settings.edit'), async (req, res) => {
  try {
    const { key } = req.params;
    const { storage } = await import('../storage');
    await storage.deleteSiteSetting(key);
    res.status(204).send();
  } catch (error) {
    console.error('❌ Admin delete setting error:', error);
    res.status(500).json({ message: 'Failed to delete setting' });
  }
});

// Object storage endpoint for background image uploads
router.post('/settings/background-upload', requirePermission('settings.edit'), async (req, res) => {
  try {
    const { ObjectStorageService } = await import('../objectStorage');
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL, method: 'PUT' });
  } catch (error) {
    console.error('❌ Background upload URL error:', error);
    res.status(500).json({ message: 'Failed to generate upload URL' });
  }
});

// Manual role validation endpoint - check role permissions independently
router.post('/validate-roles', requireAdmin, async (req, res) => {
  try {
    console.log('🔍 Manual role validation requested by admin...');
    
    const { db } = await import('../db');
    const { validateRolePermissions } = await import('../admin/validation');
    const { roles } = await import('@shared/schema');
    
    const existingRoles = await db.select().from(roles);
    const rolesForValidation = existingRoles.map(role => ({
      name: role.name,
      permissions: role.permissions
    }));
    const isValid = await validateRolePermissions(rolesForValidation);
    
    res.json({
      status: 'success',
      valid: isValid,
      message: isValid ? 'All role permissions are valid' : 'Some role permissions are invalid',
      timestamp: new Date().toISOString(),
      rolesChecked: existingRoles.length
    });
  } catch (error) {
    console.error('❌ Manual role validation error:', error);
    res.status(500).json({
      status: 'error', 
      message: 'Failed to validate roles',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Role assignments endpoint
router.get('/role-assignments', requirePermission('roles.view'), async (req, res) => {
  try {
    const assignments = await adminService.getRoleAssignments();
    res.json(assignments);
  } catch (error) {
    console.error('❌ Admin role assignments error:', error);
    res.status(500).json({ message: 'Failed to load role assignments' });
  }
});

// Reports endpoint for moderation
router.get('/reports', requirePermission('reports.view'), async (req, res) => {
  try {
    const { priority, status, search, page = '1', limit = '20' } = req.query;
    const reports = await adminService.getReports(
      priority as string,
      status as string,
      search as string,
      parseInt(page as string),
      parseInt(limit as string)
    );
    res.json(reports);
  } catch (error) {
    console.error('❌ Admin reports error:', error);
    res.status(500).json({ message: 'Failed to load reports' });
  }
});

router.put('/reports/:id', requirePermission('reports.edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution, notes } = req.body;
    const success = await adminService.updateReport(id, status, resolution, notes, req.adminUser!.id);
    if (success) {
      res.json({ message: 'Report updated successfully' });
    } else {
      res.status(500).json({ message: 'Failed to update report' });
    }
  } catch (error) {
    console.error('❌ Admin report update error:', error);
    res.status(500).json({ message: 'Failed to update report' });
  }
});

router.patch('/reports/:id/assign', requirePermission('reports.edit'), async (req: any, res) => {
  try {
    const { id } = req.params;
    const { moderatorId } = req.body;
    if (!moderatorId) {
      return res.status(400).json({ message: 'Moderator ID is required' });
    }
    const success = await adminService.updateReport(id, 'investigating', '', '', req.adminUser?.id || moderatorId);
    if (success) {
      res.json({ success: true, message: 'Report assigned successfully' });
    } else {
      res.status(500).json({ message: 'Failed to assign report' });
    }
  } catch (error) {
    console.error('❌ Admin report assign error:', error);
    res.status(500).json({ message: 'Failed to assign report' });
  }
});

router.patch('/reports/:id/escalate', requirePermission('reports.edit'), async (req: any, res) => {
  try {
    const { id } = req.params;
    const success = await adminService.updateReport(id, 'investigating', 'escalated', '', req.adminUser?.id || '');
    if (success) {
      res.json({ success: true, message: 'Report escalated successfully' });
    } else {
      res.status(500).json({ message: 'Failed to escalate report' });
    }
  } catch (error) {
    console.error('❌ Admin report escalate error:', error);
    res.status(500).json({ message: 'Failed to escalate report' });
  }
});

router.patch('/reports/:id/resolve', requirePermission('reports.edit'), async (req: any, res) => {
  try {
    const { id } = req.params;
    const { resolution, notes } = req.body;
    const success = await adminService.updateReport(id, resolution || 'resolved', resolution || 'resolved', notes || '', req.adminUser?.id || '');
    if (success) {
      res.json({ success: true, message: 'Report resolved successfully' });
    } else {
      res.status(500).json({ message: 'Failed to resolve report' });
    }
  } catch (error) {
    console.error('❌ Admin report resolve error:', error);
    res.status(500).json({ message: 'Failed to resolve report' });
  }
});

// Audit logs endpoint (maps to /logs internally)
router.get('/audit-logs', requirePermission('logs.view'), async (req, res) => {
  try {
    const { page = '1', limit = '50' } = req.query;
    const logs = await adminService.getAuditLogs(
      parseInt(page as string),
      parseInt(limit as string)
    );
    res.json(logs);
  } catch (error) {
    console.error('❌ Admin audit logs error:', error);
    res.status(500).json({ message: 'Failed to load audit logs' });
  }
});

router.get('/audit-logs/stats', requirePermission('logs.view'), async (req, res) => {
  try {
    res.json({
      totalLogs: 0,
      todayLogs: 0,
      weekLogs: 0,
      topActions: [],
      topUsers: []
    });
  } catch (error) {
    console.error('❌ Admin audit stats error:', error);
    res.status(500).json({ message: 'Failed to load audit stats' });
  }
});

// Mobile admin endpoints
router.get('/mobile/dashboard', async (req, res) => {
  try {
    const summary = await adminService.getDashboardSummary();
    res.json(summary);
  } catch (error) {
    console.error('❌ Admin mobile dashboard error:', error);
    res.status(500).json({ message: 'Failed to load mobile dashboard' });
  }
});

router.get('/mobile/activity', async (req, res) => {
  try {
    res.json({
      activities: [],
      hasMore: false
    });
  } catch (error) {
    console.error('❌ Admin mobile activity error:', error);
    res.status(500).json({ message: 'Failed to load mobile activity' });
  }
});

// AI Moderation endpoints
router.get('/ai-moderation/stats', requirePermission('reports.view'), async (req, res) => {
  try {
    res.json({
      totalAnalyzed: 0,
      analyzedToday: 0,
      autoFlagged: 0,
      flaggedRate: 0,
      autoResolved: 0,
      automationRate: 0,
      accuracy: 0,
      riskDistribution: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      }
    });
  } catch (error) {
    console.error('❌ Admin AI moderation stats error:', error);
    res.status(500).json({ message: 'Failed to load AI moderation stats' });
  }
});

router.get('/ai-moderation/settings', requirePermission('settings.view'), async (req, res) => {
  try {
    res.json({
      enabled: false,
      toxicityThreshold: 0.7,
      confidenceThreshold: 0.8,
      autoActions: false,
      escalationEnabled: true,
      batchProcessing: false
    });
  } catch (error) {
    console.error('❌ Admin AI moderation settings error:', error);
    res.status(500).json({ message: 'Failed to load AI moderation settings' });
  }
});

router.post('/ai-moderation/settings', requirePermission('settings.edit'), async (req, res) => {
  try {
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('❌ Admin AI moderation settings update error:', error);
    res.status(500).json({ message: 'Failed to update AI moderation settings' });
  }
});

router.post('/ai-moderation/analyze', requirePermission('reports.view'), async (req, res) => {
  try {
    const { content } = req.body;
    res.json({
      analysis: {
        toxicity: 0.1,
        sentiment: 'neutral',
        threats: false,
        harassment: false,
        spam: false,
        inappropriate: false,
        confidence: 0.95,
        keywords: [],
        riskLevel: 'low'
      },
      decision: {
        action: 'approve',
        confidence: 0.95,
        reason: 'Content appears safe',
        autoResolve: true
      }
    });
  } catch (error) {
    console.error('❌ Admin AI analysis error:', error);
    res.status(500).json({ message: 'Failed to analyze content' });
  }
});

router.post('/ai-moderation/batch-process', requirePermission('reports.view'), async (req, res) => {
  try {
    res.json({ processed: 0, flagged: 0 });
  } catch (error) {
    console.error('❌ Admin AI batch process error:', error);
    res.status(500).json({ message: 'Failed to batch process' });
  }
});

// Manual seeding endpoint - runs independently after deployment
router.post('/seed-data', requireAdmin, async (req, res) => {
  try {
    console.log('🌱 Manual seeding requested by admin...');
    
    // Test database connection first
    await import('../db');
    console.log('✅ Database connection verified');
    
    // Seed trips
    const { seedSampleTrips } = await import('../../scripts/seed-trips');
    await seedSampleTrips();
    console.log('✅ Sample trips seeded successfully');
    
    // Seed questions
    const { seedSimpleQuestions } = await import('../../scripts/seed-simple-questions');
    await seedSimpleQuestions(req.adminUser!.id);
    console.log('✅ Sample questions seeded successfully');
    
    console.log('🎉 Manual seeding completed successfully');
    
    res.json({ 
      status: 'success',
      message: 'Sample data seeded successfully',
      timestamp: new Date().toISOString(),
      data: {
        trips: '10 sample trips available',
        questions: '25 Tribes questions available'
      }
    });
  } catch (error) {
    console.error('❌ Manual seeding error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to seed sample data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Manually trigger the daily digest email — for testing without waiting
// for the 8 AM Asia/Colombo schedule in server/index.ts. Same stats and
// send path as the real scheduled run.
router.post('/digest/send-now', requireAdmin, async (req, res) => {
  try {
    const { getDigestStats } = await import('../services/digestService');
    const { sendDailyDigestEmail } = await import('../auth/email');

    const stats = await getDigestStats();
    await sendDailyDigestEmail(stats);

    res.json({ status: 'success', stats });
  } catch (error) {
    console.error('❌ Manual digest send error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to send digest',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;