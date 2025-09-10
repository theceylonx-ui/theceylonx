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
router.get('/users', requirePermission('canManageUsers'), async (req, res) => {
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

router.get('/users/:id', requirePermission('canManageUsers'), async (req, res) => {
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

router.put('/users/:id/role', requirePermission('canManageUsers'), async (req, res) => {
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

// Content management endpoints
router.post('/media', requirePermission('canManageContent'), upload.single('file'), async (req, res) => {
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

router.get('/media', requirePermission('canManageContent'), async (req, res) => {
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
router.get('/roles', requirePermission('canManageRoles'), async (req, res) => {
  try {
    const roles = await adminService.getRoles();
    res.json(roles);
  } catch (error) {
    console.error('❌ Admin roles list error:', error);
    res.status(500).json({ message: 'Failed to load roles' });
  }
});

router.post('/roles', requirePermission('canManageRoles'), async (req, res) => {
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
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        message: 'Invalid role data', 
        errors: error.errors 
      });
    }
    
    res.status(500).json({ message: 'Failed to create role' });
  }
});

router.put('/roles/:id', requirePermission('canManageRoles'), async (req, res) => {
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
router.get('/logs', requirePermission('canViewLogs'), async (req, res) => {
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
      settingData.description,
      settingData.category
    );
    res.status(201).json(setting);
  } catch (error) {
    console.error('❌ Admin create setting error:', error);
    if (error.name === 'ZodError') {
      res.status(400).json({ message: 'Invalid setting data', errors: error.errors });
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
    const isValid = await validateRolePermissions(existingRoles);
    
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
      error: error.message || 'Unknown error'
    });
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
    await seedSimpleQuestions();
    console.log('✅ Sample questions seeded successfully');
    
    console.log('🎉 Manual seeding completed successfully');
    
    res.json({ 
      status: 'success',
      message: 'Sample data seeded successfully',
      timestamp: new Date().toISOString(),
      data: {
        trips: '8 sample trips created',
        questions: '10 sample questions created'
      }
    });
  } catch (error) {
    console.error('❌ Manual seeding error:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to seed sample data',
      error: error.message || 'Unknown error'
    });
  }
});

export default router;