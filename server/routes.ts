import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authRouter, authGuard } from "./auth/routes";
import { JWTUser } from "./auth/jwt";
import { clerkHealth } from "./routes/clerkHealth";

// Unified auth helper function
async function getAuthenticatedUser(req: any): Promise<UnifiedUser | null> {
  // Checking authentication methods
  try {
    // First try Clerk authentication
    const { getClerkUser } = await import('./auth/clerk');
    const clerkUser = getClerkUser(req);
    if (clerkUser) {
      // Clerk user authenticated
      return {
        id: clerkUser.id,
        email: clerkUser.email,
        name: clerkUser.name,
        provider: 'clerk',
        // Additional properties for Clerk integration (not in UnifiedUser interface)
      };
    }
    
    // Then try JWT authentication (for Google/Facebook OAuth users)
    const { getCurrentUser } = await import('./auth/jwt');
    const jwtUser = await getCurrentUser(req);
    
    if (jwtUser) {
      // JWT user authenticated
      return {
        id: jwtUser.id,
        email: jwtUser.email,
        phone: jwtUser.phone,
        name: jwtUser.name,
        provider: jwtUser.provider || 'jwt'
      };
    }
    
    // Fallback to Replit Auth
    // Trying Replit Auth fallback
    if (req.isAuthenticated && req.isAuthenticated()) {
      const user = req.user as any;
      if ((user as any)?.claims?.sub) {
        // Replit user authenticated
        return {
          id: user.claims.sub,
          email: user.claims.email,
          name: user.claims.first_name || user.claims.profile?.name,
          provider: 'replit',
          claims: user.claims
        };
      }
    }
    // No authentication method worked
    
    return null;
  } catch (error) {
    console.error("❌ Auth error:", error);
    return null;
  }
}

// Unified auth guard middleware
const unifiedAuthGuard = async (req: any, res: any, next: any) => {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  req.user = user;
  next();
};
import { setupAuth, isAuthenticated } from "./auth";
import cookieParser from 'cookie-parser';
import cors from 'cors';
import passport from 'passport';

// Unified user interface for both JWT and Replit Auth
interface UnifiedUser {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  provider?: string;
  claims?: any; // For Replit Auth compatibility
}

// Extend Express Request to include our unified user
declare module 'express-serve-static-core' {
  interface Request {
    user?: UnifiedUser;
  }
}
import { 
  insertTripSchema, 
  insertCommentSchema, 
  insertRatingSchema, 
  insertReportSchema,
  insertTopicSchema,
  insertQuestionSchema,
  insertAnswerSchema,
  insertUserInteractionSchema,
  insertChatMessageSchema,
  insertSiteSettingSchema,
  travelStyleSettingsSchema,
  type TravelStyleSettings
} from "@shared/schema";
import { enhancedRecommendationService } from "./ml/enhancedRecommendationService";
import { z } from "zod";
import { errorTracker } from "./utils/errorTracking";
import { normalizeUserForUI, normalizeUsersForUI, trackUserNormalizationFallback } from "./utils/userNormalization";
import type { NormalizedUser } from "./utils/userNormalization";

export async function registerRoutes(app: Express): Promise<Server> {
  // CORS and cookie middleware - strict origin validation
  const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS 
    ? process.env.CORS_ALLOWED_ORIGINS.split(',')
    : [
      'https://www.theceylonx.com', 
      'http://localhost:5173', 
      'http://localhost:5000',
      // Allow current Replit domain in development
      ...(process.env.NODE_ENV === 'development' ? [process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : ''] : [])
    ].filter(Boolean);
    
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      
      // Allow Replit and localhost development domains
      if (origin && (origin.includes('.replit.dev') || origin.includes('127.0.0.1') || origin.includes('localhost'))) {
        return callback(null, true);
      }
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked request from origin: ${origin}`);
        callback(new Error('CORS policy violation'), false);
      }
    },
    credentials: true
  }));
  app.use(cookieParser());
  
  // Setup Replit Auth first
  await setupAuth(app);

  // Re-enable Google OAuth routes for user sign-in
  app.use('/api/auth', authRouter);
  
  // Clerk health routes
  app.use(clerkHealth);

  // Public site settings endpoint for unauthenticated access
  app.get('/api/site-settings/:key', async (req, res) => {
    try {
      const { key } = req.params;
      const setting = await storage.getSiteSetting(key);
      if (setting) {
        res.json(setting);
      } else {
        res.status(404).json({ message: 'Setting not found' });
      }
    } catch (error) {
      console.error('❌ Public site settings error:', error);
      res.status(500).json({ message: 'Failed to load setting' });
    }
  });

  // Initialize admin system and setup admin routes
  const { adminService } = await import('./services/adminService');
  const { setupSuperadmin } = await import('./middleware/adminAuth');
  const adminRoutes = await import('./routes/adminRoutes');
  
  // Initialize admin system
  await adminService.initializeAdminSystem();
  
  // Setup superadmin middleware (runs after auth)
  app.use(setupSuperadmin);
  
  // Enhanced Admin routes (new permission-based system)
  app.use('/api/admin', adminRoutes.default);
  
  // Preferences routes
  const { registerPreferencesRoutes } = await import('./modules/preferences/routes');
  registerPreferencesRoutes(app);
  
  // Serve admin uploads
  app.use('/uploads/admin', express.static('uploads/admin'));
  
  // Create upload directory if it doesn't exist
  const { existsSync, mkdirSync } = await import('fs');
  if (!existsSync('uploads/admin')) {
    mkdirSync('uploads/admin', { recursive: true });
  }

  // User profile routes
  app.get('/api/user', async (req, res) => {
    try {
      const user = await getAuthenticatedUser(req);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userData = await storage.getUser(user.id);
      if (!userData) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Normalize user data for UI consumption
      const normalizedUser = normalizeUserForUI(userData);
      if (!normalizedUser) {
        return res.status(500).json({ message: "Failed to process user data" });
      }
      
      res.json(normalizedUser);
    } catch (error) {
      console.error("❌ Error in /api/user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch('/api/user', unifiedAuthGuard, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { username, phoneNumber, bio, profileImageUrl } = req.body;
      
      // Profile update request received
      
      // Check if username is already taken by another user
      if (username && username.trim()) {
        const existingUser = await storage.getUserByUsername(username.trim());
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: "Username is already taken" });
        }
      }
      
      // Clean the data before updating
      const updateData = {
        username: username?.trim() || undefined,
        profileImageUrl: profileImageUrl?.trim() || undefined,
        phoneNumber: phoneNumber?.trim() || undefined,
        bio: bio?.trim() || undefined,
      };
      
      // Updating user profile data
      
      const updatedUser = await storage.updateUser(userId, updateData);
      
      // Profile update completed successfully
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      
      if (error instanceof Error) {
        if (error.message.includes('unique')) {
          if (error.message.includes('username')) {
            return res.status(400).json({ message: "Username is already taken" });
          } else if (error.message.includes('phone')) {
            return res.status(400).json({ message: "Phone number is already in use" });
          }
          return res.status(400).json({ message: "Username or phone number is already in use" });
        }
      }
      
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // User data deletion endpoint for OAuth compliance
  app.delete('/api/user/delete', unifiedAuthGuard, async (req, res) => {
    try {
      const userId = req.user!.id;
      // User deletion request received
      
      // Perform comprehensive user data deletion
      await storage.deleteUser(userId);
      
      // User deletion completed
      res.json({ message: "User account and all associated data has been permanently deleted" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user account" });
    }
  });

  // User deletion confirmation page (for OAuth providers)
  app.post('/api/user/deletion-request', async (req, res) => {
    try {
      const { userId, confirmationToken } = req.body;
      
      if (!userId || !confirmationToken) {
        return res.status(400).json({ message: "Missing required parameters" });
      }
      
      // This endpoint is for OAuth providers to request user deletion
      // In a production environment, you might want to add additional verification
      console.log("Deletion request via OAuth provider for user:", userId);
      
      await storage.deleteUser(userId);
      
      console.log("User deletion completed via OAuth provider for user:", userId);
      res.json({ 
        message: "User data deletion completed successfully",
        status: "deleted",
        deleted_at: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error processing deletion request:", error);
      res.status(500).json({ message: "Failed to process deletion request" });
    }
  });

  // Legacy endpoint - no longer needed since we removed Sri Lanka images
  app.post('/api/trips/migrate-to-categories', unifiedAuthGuard, async (req, res) => {
    res.json({ message: "Migration not needed - using Ceylon Expand logo for default images" });
  });

  // Category management routes
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = [
        { value: 'roadtrip', label: 'Road Trip' },
        { value: 'hiking', label: 'Hiking & Trekking' },
        { value: 'beach', label: 'Beach & Coastal' },
        { value: 'culture', label: 'Cultural Experience' },
        { value: 'wellness', label: 'Wellness & Spa' },
        { value: 'festival', label: 'Festival & Events' },
        { value: 'workshop', label: 'Workshop & Learning' },
        { value: 'wildlife', label: 'Wildlife Safari' },
        { value: 'food', label: 'Food & Culinary' },
        { value: 'adventure_sport', label: 'Adventure Sports' },
        { value: 'unknown', label: 'Other' }
      ];
      res.json({ categories });
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get('/api/categories/:category/images', async (req, res) => {
    // No longer providing category-specific images - users upload their own or get Ceylon Expand logo
    res.json({ images: [] });
  });

  // Trip routes
  app.post('/api/trips', unifiedAuthGuard, async (req, res) => {
    try {
      const userId = req.user!.id;
      // Extract image fields - use mediaUrls from form
      const { imageUrl, imageProvider, imageAttribution, imageFetchedAt, selectedCategoryImage, images, ...clientData } = req.body;
      
      const tripData = insertTripSchema.parse({ ...clientData, organizerId: userId });
      
      let finalImageData;
      
      // Priority 1: Use user-uploaded mediaUrls if available
      if (tripData.mediaUrls && tripData.mediaUrls.length > 0) {
        const coverIndex = tripData.coverImageIndex || 0;
        const coverImageUrl = tripData.mediaUrls[Math.min(coverIndex, tripData.mediaUrls.length - 1)];
        
        finalImageData = {
          imageUrl: coverImageUrl, // Use cover image from mediaUrls
          imageProvider: 'user_upload',
          imageAttribution: null,
          imageFetchedAt: new Date(),
          mediaUrls: tripData.mediaUrls,
          coverImageIndex: coverIndex
        };
        // Using user-uploaded image as cover
      } else {
        // Priority 2: Use Ceylon Expand logo as fallback
        finalImageData = {
          imageUrl: '/assets/5_1756417819316.png', // Ceylon Expand logo
          imageProvider: 'ceylon_expand_logo',
          imageAttribution: null,
          imageFetchedAt: new Date(),
          mediaUrls: [],
          coverImageIndex: 0
        };
        // Using Ceylon Expand logo as fallback
      }
      
      // Use the category as-is, no need for validation since we removed Sri Lanka images
      // The category might come from the original clientData if not in tripData
      const safeCategory = (tripData as any).category || req.body.category || 'unknown';
      
      // Merge image data with trip data
      const tripWithImage = {
        ...tripData,
        category: safeCategory,
        ...finalImageData
      };
      
      // Image assignment completed
      
      const trip = await storage.createTrip(tripWithImage);
      res.json(trip);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Trip validation errors:", error.errors);
        return res.status(400).json({ message: "Invalid trip data", errors: error.errors });
      }
      console.error("Error creating trip:", error);
      res.status(500).json({ message: "Failed to create trip" });
    }
  });

  app.get('/api/trips', async (req, res) => {
    try {
      const userId = (req as any).user?.id; // May be undefined for unauthenticated users  
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 8;
      const offset = (page - 1) * limit;
      
      const filters = {
        from: req.query.from as string,
        to: req.query.to as string,
        date: req.query.date as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        region: req.query.region as string,
        category: req.query.category as string,
        minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        search: req.query.search as string,
        limit,
        offset,
      };
      
      const result = await storage.searchTrips(filters);
      
      // For authenticated users, add flag status to each trip
      let tripsWithFlags = result.trips;
      if ((req as any).user?.id) {
        const userId = (req as any).user.id;
        tripsWithFlags = await Promise.all(
          result.trips.map(async (trip) => {
            // Trip flags functionality temporarily disabled  
            return { 
              ...trip, 
              isPinned: false,
              isInterested: false
            };
          })
        );
      } else {
        // For non-authenticated users, set flags to false
        tripsWithFlags = result.trips.map(trip => ({ 
          ...trip, 
          isPinned: false, 
          isInterested: false 
        }));
      }
      
      // Normalize organizer data in all trips
      const normalizedTrips = tripsWithFlags.map(trip => {
        const normalizedOrganizer = normalizeUserForUI(trip.organizer);
        return {
          ...trip,
          organizer: normalizedOrganizer
        };
      });

      res.json({
        trips: normalizedTrips,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        }
      });
    } catch (error) {
      console.error("Error fetching trips:", error);
      res.status(500).json({ message: "Failed to fetch trips" });
    }
  });

  app.get('/api/trips/:id', async (req, res) => {
    try {
      const userId = (req as any).user?.id; // May be undefined for unauthenticated users
      const trip = await storage.getTrip(req.params.id, userId);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      // Track trip view (for authenticated users and anonymous users)
      const viewerUserId = userId; // Use already defined userId
      const viewerIp = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');
      
      try {
        await storage.createTripView({
          tripId: req.params.id,
          userId: userId || null,
          viewerIp,
          userAgent,
        });
        
        // Check if this trip has reached milestone view counts and notify organizer
        if (userId !== trip.organizerId) {
          const viewCount = await storage.getTripViewCount(req.params.id);
          
          // Notify at milestones: 5, 10, 25, 50, 100, 250, 500, 1000 views
          const milestones = [5, 10, 25, 50, 100, 250, 500, 1000];
          if (milestones.includes(viewCount)) {
            await storage.createNotification({
              userId: trip.organizerId,
              type: "trip_viewed",
              category: "trips",
              priority: "info",
              title: "Trip View Milestone!",
              message: `Your trip "${trip.title}" has reached ${viewCount} views! 🎉`,
              relatedTripId: req.params.id,
              actionUrl: `/trips/${req.params.id}`,
              isRead: false,
            });
          }
        }
      } catch (viewError) {
        // Don't fail the request if view tracking fails
        console.error("Error tracking trip view:", viewError);
      }
      
      // Normalize user data in trip response
      const normalizedTrip = {
        ...trip,
        organizer: normalizeUserForUI(trip.organizer),
        comments: trip.comments?.map((comment: any) => ({
          ...comment,
          user: normalizeUserForUI(comment.user)
        })) || []
      };

      res.json(normalizedTrip);
    } catch (error) {
      console.error("Error fetching trip:", error);
      res.status(500).json({ message: "Failed to fetch trip" });
    }
  });

  app.patch('/api/trips/:id', unifiedAuthGuard, async (req, res) => {
    try {
      const userId = req.user!.id;
      const tripId = req.params.id;
      
      // Check if user is the organizer or admin
      const trip = await storage.getTrip(tripId);
      const isAdmin = req.user?.role === 'admin';
      if (!trip || (trip.organizerId !== userId && !isAdmin)) {
        return res.status(403).json({ message: "Not authorized to update this trip" });
      }
      
      const { selectedCategoryImage, ...updateData } = req.body;
      let finalUpdateData = { ...updateData };
      
      // No longer handling category-based image selection - users upload their own images or get Ceylon Expand logo
      if (updateData.category) {
        // Just update the category without changing images
        finalUpdateData.category = updateData.category;
      }
      
      const updatedTrip = await storage.updateTrip(tripId, finalUpdateData);
      res.json(updatedTrip);
    } catch (error) {
      console.error("Error updating trip:", error);
      res.status(500).json({ message: "Failed to update trip" });
    }
  });

  // Trip status update endpoint for visibility control
  app.patch('/api/trips/:id/status', unifiedAuthGuard, async (req, res) => {
    try {
      const userId = req.user!.id;
      const tripId = req.params.id;
      const { status } = req.body;
      
      // Validate status value
      const validStatuses = ['active', 'inactive', 'full', 'completed', 'cancelled', 'deleted', 'under_review'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      
      // Check if user is the organizer
      const trip = await storage.getTrip(tripId);
      if (!trip || trip.organizerId !== userId) {
        return res.status(403).json({ message: "Only the trip organizer can change trip status" });
      }
      
      const updatedTrip = await storage.updateTrip(tripId, { status });
      res.json({ id: tripId, status: updatedTrip.status });
    } catch (error) {
      console.error("Error updating trip status:", error);
      res.status(500).json({ message: "Failed to update trip status" });
    }
  });

  app.delete('/api/trips/:id', unifiedAuthGuard, async (req, res) => {
    try {
      const userId = req.user!.id;
      const tripId = req.params.id;
      
      // Check if user is the organizer
      const trip = await storage.getTrip(tripId);
      if (!trip || trip.organizerId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this trip" });
      }
      
      await storage.deleteTrip(tripId);
      res.json({ message: "Trip deleted successfully" });
    } catch (error) {
      console.error("Error deleting trip:", error);
      res.status(500).json({ message: "Failed to delete trip" });
    }
  });

  // Saved trips management endpoints
  // Upsert saved trip (pin or mark as interested)
  app.post('/api/trips/:tripId/save', unifiedAuthGuard, async (req, res) => {
    try {
      const userId = req.user!.id;
      const tripId = req.params.tripId;
      const { saveType } = req.body;

      if (!['pinned', 'interested'].includes(saveType)) {
        return res.status(400).json({ message: "Save type must be 'pinned' or 'interested'" });
      }

      // Check if trip exists
      const trip = await storage.getTrip(tripId);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      const savedTrip = await storage.upsertSavedTrip(userId, tripId, saveType);
      res.json({ 
        message: `Trip ${saveType} successfully`,
        savedTrip: {
          id: savedTrip.id,
          saveType: savedTrip.saveType,
          savedAt: savedTrip.updatedAt
        }
      });
    } catch (error) {
      console.error("Error saving trip:", error);
      res.status(500).json({ message: "Failed to save trip" });
    }
  });

  // Remove saved trip
  app.delete('/api/trips/:tripId/save', unifiedAuthGuard, async (req, res) => {
    try {
      const userId = req.user!.id;
      const tripId = req.params.tripId;
      
      await storage.removeSavedTrip(userId, tripId);
      
      // Create notification about save removal
      await storage.createSaveNotification(userId, tripId, 'save_removed');
      
      res.status(204).send(); // No content - idempotent success
    } catch (error) {
      console.error("Error removing saved trip:", error);
      res.status(500).json({ message: "Failed to remove saved trip" });
    }
  });

  // Get save status for a specific trip
  app.get('/api/trips/:tripId/save-status', unifiedAuthGuard, async (req, res) => {
    try {
      const userId = req.user!.id;
      const tripId = req.params.tripId;
      
      const savedTrip = await storage.getSavedTrip(userId, tripId);
      
      res.json({
        isSaved: !!savedTrip,
        saveType: savedTrip?.saveType || null,
        savedAt: savedTrip?.updatedAt || null
      });
    } catch (error) {
      console.error("Error getting save status:", error);
      res.status(500).json({ message: "Failed to get save status" });
    }
  });

  // Get user's saved trips with pagination and filtering
  app.get('/api/user/saved-trips', unifiedAuthGuard, async (req, res) => {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const offset = (page - 1) * limit;
      const saveType = req.query.saveType as 'pinned' | 'interested' | undefined;

      // Get all saved trips first
      const allSavedTrips = await storage.getUserSavedTrips(userId, saveType);
      
      // Apply pagination
      const total = allSavedTrips.length;
      const items = allSavedTrips.slice(offset, offset + limit).map(savedTrip => ({
        ...savedTrip.trip,
        organizer: normalizeUserForUI(savedTrip.trip.organizer),
        saveType: savedTrip.saveType,
        savedAt: savedTrip.updatedAt
      }));

      res.json({
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        saveType: saveType || 'all'
      });
    } catch (error) {
      console.error("Error fetching saved trips:", error);
      res.status(500).json({ message: "Failed to fetch saved trips" });
    }
  });

  app.get('/api/interested-trips', unifiedAuthGuard, async (req, res) => {
    try {
      const userId = req.user!.id;
      // Get trips marked as interested (regardless of pinned status)
      const interestedTrips = await storage.getUserInterestedTrips(userId);
      res.json(interestedTrips);
    } catch (error) {
      console.error("Error fetching interested trips:", error);
      res.status(500).json({ message: "Failed to fetch interested trips" });
    }
  });

  // Interest request lifecycle endpoints
  app.post('/api/trips/:tripId/interest', unifiedAuthGuard, async (req, res) => {
    try {
      const { userActionsService } = await import('./services/userActionsService');
      const userId = req.user!.id;
      const tripId = req.params.tripId;
      const { message } = req.body;

      const result = await userActionsService.createOrGetInterest(userId, tripId, message);
      
      if (result.isNew) {
        res.status(201).json({ 
          requestId: result.requestId, 
          status: result.status 
        });
      } else {
        res.status(409).json({ 
          message: "Interest request already exists or reactivated",
          requestId: result.requestId, 
          status: result.status 
        });
      }
    } catch (error) {
      console.error("Error creating interest request:", error);
      if (error instanceof Error) {
        if (error.message === 'Trip not found') {
          return res.status(404).json({ message: "Trip not found" });
        }
        if (error.message.includes('already exists') || error.message.includes('already accepted')) {
          return res.status(409).json({ message: error.message });
        }
      }
      res.status(500).json({ message: "Failed to create interest request" });
    }
  });

  // Withdraw interest request
  app.post('/api/trips/:tripId/interest/withdraw', unifiedAuthGuard, async (req, res) => {
    try {
      const { userActionsService } = await import('./services/userActionsService');
      const userId = req.user!.id;
      const tripId = req.params.tripId;
      
      await userActionsService.withdrawInterest(userId, tripId);
      res.status(204).send(); // No content - idempotent success
    } catch (error) {
      console.error("Error withdrawing interest:", error);
      if (error instanceof Error && error.message === 'No interest request found') {
        return res.status(404).json({ message: "No interest request found" });
      }
      res.status(500).json({ message: "Failed to withdraw interest" });
    }
  });

  // Get user action history with pagination
  app.get('/api/user/history', unifiedAuthGuard, async (req, res) => {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const offset = (page - 1) * limit;

      // Get user history with trip and organizer details
      const { db } = await import('./db');
      const { userHistory, trips, users } = await import('../shared/schema');
      const { eq, desc } = await import('drizzle-orm');
      
      const historyData = await db
        .select({
          history: userHistory,
          trip: trips,
          organizer: users
        })
        .from(userHistory)
        .innerJoin(trips, eq(userHistory.tripId, trips.id))
        .innerJoin(users, eq(trips.organizerId, users.id))
        .where(eq(userHistory.userId, userId))
        .orderBy(desc(userHistory.createdAt))
        .limit(limit)
        .offset(offset);

      // Get total count
      const { sql } = await import('drizzle-orm');
      const [totalResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(userHistory)
        .where(eq(userHistory.userId, userId));

      const total = totalResult.count;

      // Format response with normalized user data
      const items = historyData.map(item => ({
        action: item.history.action,
        tripId: item.history.tripId,
        createdAt: item.history.createdAt,
        meta: item.history.meta,
        trip: {
          ...item.trip,
          organizer: normalizeUserForUI(item.organizer)
        }
      }));

      res.json({
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      console.error("Error fetching user history:", error);
      res.status(500).json({ message: "Failed to fetch user history" });
    }
  });

  // Get trip state for current user (pinned, interested status)
  app.get('/api/trips/:tripId/user-state', unifiedAuthGuard, async (req, res) => {
    try {
      const { userActionsService } = await import('./services/userActionsService');
      const userId = req.user!.id;
      const tripId = req.params.tripId;
      
      const [pinned, interestedStatus] = await Promise.all([
        userActionsService.isPinned(userId, tripId),
        userActionsService.getInterestStatus(userId, tripId)
      ]);
      
      res.json({
        pinned,
        interestedStatus
      });
    } catch (error) {
      console.error("Error fetching user trip state:", error);
      res.status(500).json({ message: "Failed to fetch trip state" });
    }
  });

  app.get('/api/trips/:id/interest-request', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const tripId = req.params.id;

      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const interestRequest = await storage.getTripInterestRequestByUserAndTrip(userId, tripId);
      if (!interestRequest) {
        return res.status(404).json({ message: "No interest request found" });
      }

      res.json(interestRequest);
    } catch (error) {
      console.error("Error fetching interest request:", error);
      res.status(500).json({ message: "Failed to fetch interest request" });
    }
  });

  // Get all interest requests for trips organized by the current user
  app.get('/api/my-trips/interest-requests', unifiedAuthGuard, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      const requests = await storage.getInterestRequestsForOrganizer(userId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching interest requests:", error);
      res.status(500).json({ message: "Failed to fetch interest requests" });
    }
  });

  // Get interest requests for a specific trip (for organizer)
  app.get('/api/trips/:tripId/interest-requests', unifiedAuthGuard, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { tripId } = req.params;
      
      // Verify user is the trip organizer
      const trip = await storage.getTrip(tripId);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      if (trip.organizerId !== userId) {
        return res.status(403).json({ message: "Not authorized to view requests for this trip" });
      }
      
      const requests = await storage.getTripInterestRequests(tripId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching trip interest requests:", error);
      res.status(500).json({ message: "Failed to fetch trip interest requests" });
    }
  });

  // Update interest request status (accept/reject)
  app.put('/api/interest-requests/:requestId', isAuthenticated, async (req, res) => {
    try {
      const { requestId } = req.params;
      const { status } = req.body;
      const userId = (req.user as any)?.claims?.sub;

      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      if (!["accepted", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const updatedRequest = await storage.updateInterestRequestStatus(requestId, status, userId);
      
      // Create notification for the requester
      await storage.createNotification({
        userId: updatedRequest.userId,
        type: status === 'accepted' ? 'interest_accepted' : 'interest_rejected',
        category: 'trips',
        priority: 'high',
        title: status === 'accepted' ? 'Interest Request Accepted!' : 'Interest Request Update',
        message: status === 'accepted' 
          ? 'Your interest request has been accepted. You can now chat with the organizer!'
          : 'Your interest request was not accepted for this trip.',
        relatedTripId: updatedRequest.tripId,
        threadId: updatedRequest.chatThreadId,
        actionUrl: status === 'accepted' && updatedRequest.chatThreadId 
          ? `/chat/${updatedRequest.chatThreadId}` 
          : `/trips/${updatedRequest.tripId}`,
        isRead: false
      });

      res.json(updatedRequest);
    } catch (error) {
      console.error("Error updating interest request:", error);
      res.status(500).json({ message: "Failed to update interest request" });
    }
  });

  // Update trip status (mark as completed/inactive)
  app.patch('/api/trips/:id/status', unifiedAuthGuard, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.id;

      // Verify valid status
      if (!["active", "inactive", "completed", "cancelled"].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be active, inactive, completed, or cancelled" });
      }

      // Verify the user owns this trip
      const trip = await storage.getTrip(id);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      if (trip.organizerId !== userId) {
        return res.status(403).json({ message: "You can only update your own trips" });
      }

      const updatedTrip = await storage.updateTrip(id, { status });
      res.json(updatedTrip);
    } catch (error) {
      console.error("Error updating trip status:", error);
      res.status(500).json({ message: "Failed to update trip status" });
    }
  });

  // Get user's participation status for a specific trip (for Chat Buddy)
  app.get('/api/trips/:id/status', unifiedAuthGuard, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Check if user has an interest request for this trip
      const interestRequest = await storage.getTripInterestRequestByUserAndTrip(userId, id);
      
      if (!interestRequest) {
        return res.json({ status: 'none' });
      }

      // Return the status of the interest request
      res.json({ status: interestRequest.status });
    } catch (error) {
      console.error("Error fetching trip status:", error);
      res.status(500).json({ message: "Failed to fetch trip status" });
    }
  });

  // User trip routes
  // Get user's questions
  app.get('/api/users/questions', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const questions = await storage.getUserQuestions(userId);
      res.json(questions);
    } catch (error) {
      console.error('Error fetching user questions:', error);
      res.status(500).json({ message: 'Failed to fetch user questions' });
    }
  });

  app.get('/api/users/trips', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const trips = await storage.getUserTrips(userId);
      res.json(trips);
    } catch (error) {
      console.error("Error fetching user trips:", error);
      res.status(500).json({ message: "Failed to fetch user trips" });
    }
  });








  // Comment routes
  app.post('/api/trips/:id/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const tripId = req.params.id;

      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const commentData = insertCommentSchema.parse({
        ...req.body,
        tripId,
        userId,
      });
      
      const comment = await storage.createComment(commentData);
      
      // Notification temporarily disabled due to database schema issue
      // TODO: Re-enable after database migration is complete
      console.log(`Comment created successfully on trip ${tripId} by user ${userId}`);
      
      res.json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      }
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.get('/api/trips/:id/comments', async (req, res) => {
    try {
      const comments = await storage.getTripComments(req.params.id);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Update comment route
  app.put('/api/comments/:id', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const commentId = req.params.id;
      const { content } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({ message: "Content is required" });
      }

      // Check ownership - need to get comment first
      const comment = await storage.getComment(commentId);
      
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      if (comment.userId !== userId) {
        return res.status(403).json({ message: "You can only edit your own comments" });
      }
      
      const updatedComment = await storage.updateComment(commentId, content.trim());
      res.json(updatedComment);
    } catch (error) {
      console.error("Error updating comment:", error);
      res.status(500).json({ message: "Failed to update comment" });
    }
  });

  // Enhanced comment deletion with trip owner moderation
  app.delete('/api/comments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const commentId = req.params.id;

      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get comment details to check ownership and trip ownership
      const comment = await storage.getComment(commentId);
      
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      // Get trip details to check if user is trip owner
      const trip = await storage.getTrip(comment.tripId);
      
      // Allow deletion if user is comment author OR trip owner
      if (comment.userId !== userId && trip?.organizerId !== userId) {
        return res.status(403).json({ message: "You can only delete your own comments or comments on your trips" });
      }
      
      await storage.deleteComment(commentId);
      res.json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // Rating routes
  app.post('/api/trips/:id/ratings', unifiedAuthGuard, async (req: any, res) => {
    try {
      const raterId = req.user!.id;
      const tripId = req.params.id;
      const ratingData = insertRatingSchema.parse({
        ...req.body,
        tripId,
        raterId,
      });
      
      const rating = await storage.createRating(ratingData);
      res.json(rating);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid rating data", errors: error.errors });
      }
      console.error("Error creating rating:", error);
      res.status(500).json({ message: "Failed to create rating" });
    }
  });

  app.get('/api/trips/:id/ratings', async (req, res) => {
    try {
      const ratings = await storage.getTripRatings(req.params.id);
      res.json(ratings);
    } catch (error) {
      console.error("Error fetching ratings:", error);
      res.status(500).json({ message: "Failed to fetch ratings" });
    }
  });

  app.get('/api/users/:id/ratings', async (req, res) => {
    try {
      const ratings = await storage.getUserRatings(req.params.id);
      res.json(ratings);
    } catch (error) {
      console.error("Error fetching user ratings:", error);
      res.status(500).json({ message: "Failed to fetch user ratings" });
    }
  });

  // Report routes
  app.post('/api/reports', unifiedAuthGuard, async (req: any, res) => {
    try {
      const reporterId = req.user.id; // Fixed: use req.user.id instead of req.user.claims.sub
      const reportData = insertReportSchema.parse({
        ...req.body,
        reporterId,
      });
      
      const report = await storage.createReport(reportData);
      
      // Notification temporarily disabled due to database schema issue
      // TODO: Re-enable after database migration is complete
      console.log(`Report created successfully for trip ${report.tripId} by user ${reporterId}`);
      
      res.json(report);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid report data", errors: error.errors });
      }
      console.error("Error creating report:", error);
      res.status(500).json({ message: "Failed to create report" });
    }
  });

  // Admin route to get all reports
  app.get('/api/admin/reports', unifiedAuthGuard, async (req: any, res) => {
    try {
      // Check if user is admin (add your admin user IDs here)
      const adminUserIds = [
        "bcc1d79a-d83a-4a99-8556-e1d367140e88", // PraDas S Agnya
        "313a0e58-6745-4db7-91bd-31e69c7496ab", // Add more admin IDs as needed
        "dev-admin-001", // Development Admin
        "9848130a-1ba7-4b9c-9a2f-3e1a696160e1", // Current test user (temporary for testing)
      ];
      
      if (!adminUserIds.includes(req.user.id)) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      const reports = await storage.getReports();
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  // Admin route to update report status with enhanced actions
  app.patch('/api/admin/reports/:id/status', unifiedAuthGuard, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status, action } = req.body; // action: 'resolve' | 'dismiss' | 'delete_trip' | 'suspend_user' | 'edit_trip'
      
      // Check if user is admin
      const adminUserIds = [
        "bcc1d79a-d83a-4a99-8556-e1d367140e88", // PraDas S Agnya
        "313a0e58-6745-4db7-91bd-31e69c7496ab", // Add more admin IDs as needed
        "dev-admin-001", // Development Admin
        "9848130a-1ba7-4b9c-9a2f-3e1a696160e1", // Current test user (temporary for testing)
      ];
      
      if (!adminUserIds.includes(req.user.id)) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      // Validate status
      if (!["pending", "resolved", "dismissed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be pending, resolved, or dismissed" });
      }

      // Get the report details first
      const reports = await storage.getReports();
      const report = reports.find(r => r.id === id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      // Handle different admin actions
      if (status === 'resolved' && action) {
        switch (action) {
          case 'delete_trip':
            // Delete the reported trip
            if (report.tripId) {
              await storage.deleteTrip(report.tripId);
            }
            console.log(`Admin deleted trip ${report.tripId} due to report ${id}`);
            break;
          
          case 'suspend_user':
            // In a real app, you'd implement user suspension
            // For now, we'll just log it
            // Get the trip to find the organizer ID
            if (report.tripId) {
              const reportedTrip = await storage.getTrip(report.tripId);
              console.log(`Admin would suspend user ${reportedTrip?.organizerId} due to report ${id}`);
            }
            // TODO: Implement user suspension logic
            break;
          
          case 'edit_trip':
            // This would redirect to trip edit interface
            if (report.tripId) {
              console.log(`Admin initiated edit for trip ${report.tripId} due to report ${id}`);
            }
            break;
        }
      }

      // Handle dismiss action - send notification to reporter
      if (status === 'dismissed') {
        // TODO: Send notification to reporter
        console.log(`Report ${id} dismissed - should notify reporter ${report.reporterId}`);
      }

      const updatedReport = await storage.updateReportStatus(id, status);
      res.json({ 
        ...updatedReport, 
        actionTaken: action,
        tripDeleted: action === 'delete_trip' && status === 'resolved'
      });
    } catch (error) {
      console.error("Error updating report status:", error);
      res.status(500).json({ message: "Failed to update report status" });
    }
  });

  // Admin Chat endpoints for report investigations
  
  // Create or get admin chat thread for a report
  app.post('/api/admin/reports/:reportId/chat', unifiedAuthGuard, async (req: any, res) => {
    try {
      const { reportId } = req.params;
      const adminId = req.user.id;
      
      // Check if user is admin
      const adminUserIds = [
        "bcc1d79a-d83a-4a99-8556-e1d367140e88", // PraDas S Agnya
        "313a0e58-6745-4db7-91bd-31e69c7496ab", // Add more admin IDs as needed
        "dev-admin-001", // Development Admin
        "9848130a-1ba7-4b9c-9a2f-3e1a696160e1", // Current test user (temporary for testing)
      ];
      
      if (!adminUserIds.includes(adminId)) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      // Check if thread already exists
      let thread = await storage.getAdminChatThread(reportId);
      
      if (!thread) {
        // Get the report to find organizer
        const reports = await storage.getReports();
        const report = reports.find(r => r.id === reportId);
        
        if (!report || !report.tripId) {
          return res.status(404).json({ message: "Report or trip not found" });
        }

        // Get the trip to find organizer
        const trip = await storage.getTrip(report.tripId);
        if (!trip) {
          return res.status(404).json({ message: "Trip not found" });
        }

        // Create new thread
        const newThread = await storage.createAdminChatThread({
          reportId,
          adminId,
          organizerId: trip.organizerId,
        });
        
        thread = await storage.getAdminChatThread(reportId);
      }

      res.json(thread);
    } catch (error) {
      console.error("Error creating/getting admin chat thread:", error);
      res.status(500).json({ message: "Failed to create chat thread" });
    }
  });

  // Get admin chat messages
  app.get('/api/admin/chat/:threadId/messages', unifiedAuthGuard, async (req: any, res) => {
    try {
      const { threadId } = req.params;
      const userId = req.user.id;
      
      // Check if user is admin or the organizer
      const adminUserIds = [
        "bcc1d79a-d83a-4a99-8556-e1d367140e88", // PraDas S Agnya
        "313a0e58-6745-4db7-91bd-31e69c7496ab", // Add more admin IDs as needed
      ];
      
      // Get thread details to check permissions
      const reports = await storage.getReports();
      let hasAccess = false;
      
      for (const report of reports) {
        const thread = await storage.getAdminChatThread(report.id);
        if (thread?.id === threadId) {
          hasAccess = adminUserIds.includes(userId) || thread.organizerId === userId;
          break;
        }
      }
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      const messages = await storage.getAdminChatMessages(threadId);
      
      // Mark messages as read
      await storage.markAdminChatMessagesAsRead(threadId, userId);
      
      res.json(messages);
    } catch (error) {
      console.error("Error fetching admin chat messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send admin chat message
  app.post('/api/admin/chat/:threadId/messages', unifiedAuthGuard, async (req: any, res) => {
    try {
      const { threadId } = req.params;
      const { content } = req.body;
      const userId = req.user.id;
      
      if (!content || !content.trim()) {
        return res.status(400).json({ message: "Message content is required" });
      }

      // Check if user is admin or organizer and thread is not blocked
      const adminUserIds = [
        "bcc1d79a-d83a-4a99-8556-e1d367140e88", // PraDas S Agnya
        "313a0e58-6745-4db7-91bd-31e69c7496ab", // Add more admin IDs as needed
      ];
      
      const reports = await storage.getReports();
      let thread = null;
      let hasAccess = false;
      let senderType = '';
      
      for (const report of reports) {
        const foundThread = await storage.getAdminChatThread(report.id);
        if (foundThread?.id === threadId) {
          thread = foundThread;
          if (adminUserIds.includes(userId)) {
            hasAccess = true;
            senderType = 'admin';
          } else if (foundThread.organizerId === userId) {
            hasAccess = true;
            senderType = 'organizer';
          }
          break;
        }
      }
      
      if (!hasAccess || !thread) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      if (thread.isBlocked && senderType === 'organizer') {
        return res.status(403).json({ message: "Chat is blocked by admin" });
      }

      const message = await storage.createAdminChatMessage({
        threadId,
        senderId: userId,
        senderType,
        content: content.trim(),
      });

      res.json(message);
    } catch (error) {
      console.error("Error sending admin chat message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Block/unblock admin chat
  app.patch('/api/admin/chat/:threadId/block', unifiedAuthGuard, async (req: any, res) => {
    try {
      const { threadId } = req.params;
      const { isBlocked } = req.body;
      const adminId = req.user.id;
      
      // Check if user is admin
      const adminUserIds = [
        "bcc1d79a-d83a-4a99-8556-e1d367140e88", // PraDas S Agnya
        "313a0e58-6745-4db7-91bd-31e69c7496ab", // Add more admin IDs as needed
        "dev-admin-001", // Development Admin
        "9848130a-1ba7-4b9c-9a2f-3e1a696160e1", // Current test user (temporary for testing)
      ];
      
      if (!adminUserIds.includes(adminId)) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      const updatedThread = await storage.toggleAdminChatBlock(threadId, adminId, isBlocked);
      
      res.json({
        ...updatedThread,
        action: isBlocked ? 'blocked' : 'unblocked'
      });
    } catch (error) {
      console.error("Error blocking/unblocking admin chat:", error);
      res.status(500).json({ message: "Failed to update chat status" });
    }
  });

  // Admin route to delete trip
  app.delete('/api/admin/trips/:id', unifiedAuthGuard, async (req: any, res) => {
    try {
      // Check if user is admin
      const adminUserIds = [
        "bcc1d79a-d83a-4a99-8556-e1d367140e88", // PraDas S Agnya
        "313a0e58-6745-4db7-91bd-31e69c7496ab", // Add more admin IDs as needed
        "dev-admin-001", // Development Admin
        "9848130a-1ba7-4b9c-9a2f-3e1a696160e1", // Current test user (temporary for testing)
      ];
      
      if (!adminUserIds.includes(req.user.id)) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      const { id } = req.params;
      await storage.deleteTrip(id);
      res.json({ success: true, message: "Trip deleted successfully" });
    } catch (error) {
      console.error("Error deleting trip:", error);
      res.status(500).json({ message: "Failed to delete trip" });
    }
  });

  // Admin endpoint for viewing contact sharing activity
  app.get('/api/admin/contact-shares', unifiedAuthGuard, async (req: any, res) => {
    try {
      // Check if user is admin
      const adminUserIds = [
        "bcc1d79a-d83a-4a99-8556-e1d367140e88", // PraDas S Agnya
        "313a0e58-6745-4db7-91bd-31e69c7496ab", // Add more admin IDs as needed
        "dev-admin-001", // Development Admin
        "9848130a-1ba7-4b9c-9a2f-3e1a696160e1", // Current test user (temporary for testing)
      ];
      
      if (!adminUserIds.includes(req.user.id)) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      const filters = {
        threadId: req.query.threadId as string,
        userId: req.query.userId as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : 50
      };

      const contactShares = await storage.getContactSharesForAdmin(filters);
      res.json({ contactShares });
    } catch (error) {
      console.error("Error fetching contact shares:", error);
      res.status(500).json({ message: "Failed to fetch contact shares" });
    }
  });

  // Admin endpoint for viewing audit logs
  app.get('/api/admin/audit-logs', unifiedAuthGuard, async (req: any, res) => {
    try {
      // Check if user is admin
      const adminUserIds = [
        "bcc1d79a-d83a-4a99-8556-e1d367140e88", // PraDas S Agnya
        "313a0e58-6745-4db7-91bd-31e69c7496ab", // Add more admin IDs as needed
        "dev-admin-001", // Development Admin
        "9848130a-1ba7-4b9c-9a2f-3e1a696160e1", // Current test user (temporary for testing)
      ];
      
      if (!adminUserIds.includes(req.user.id)) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      const filters = {
        action: req.query.action as string,
        userId: req.query.userId as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : 100
      };

      const auditLogs = await storage.getAuditLogs(filters);
      res.json({ auditLogs });
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // Admin route to edit trip
  app.patch('/api/admin/trips/:id', unifiedAuthGuard, async (req: any, res) => {
    try {
      // Check if user is admin
      const adminUserIds = [
        "bcc1d79a-d83a-4a99-8556-e1d367140e88", // PraDas S Agnya
        "313a0e58-6745-4db7-91bd-31e69c7496ab", // Add more admin IDs as needed
        "dev-admin-001", // Development Admin
        "9848130a-1ba7-4b9c-9a2f-3e1a696160e1", // Current test user (temporary for testing)
      ];
      
      if (!adminUserIds.includes(req.user.id)) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      const { id } = req.params;
      const tripData = req.body;
      
      const updatedTrip = await storage.updateTrip(id, tripData);
      res.json(updatedTrip);
    } catch (error) {
      console.error("Error updating trip:", error);
      res.status(500).json({ message: "Failed to update trip" });
    }
  });

  // Community Q&A Routes
  
  // Topics
  app.post('/api/topics', unifiedAuthGuard, async (req: any, res) => {
    try {
      const topicData = insertTopicSchema.parse(req.body);
      const topic = await storage.createTopic(topicData);
      res.json(topic);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid topic data", errors: error.errors });
      }
      console.error("Error creating topic:", error);
      res.status(500).json({ message: "Failed to create topic" });
    }
  });

  app.get('/api/topics', async (req, res) => {
    try {
      const topics = await storage.getTopics();
      res.json(topics);
    } catch (error) {
      console.error("Error fetching topics:", error);
      res.status(500).json({ message: "Failed to fetch topics" });
    }
  });

  app.get('/api/topics/:slug', async (req, res) => {
    try {
      const topic = await storage.getTopic(req.params.slug);
      if (!topic) {
        return res.status(404).json({ message: "Topic not found" });
      }
      res.json(topic);
    } catch (error) {
      console.error("Error fetching topic:", error);
      res.status(500).json({ message: "Failed to fetch topic" });
    }
  });

  // Questions
  app.post('/api/questions', async (req: any, res) => {
    try {
      console.log("📝 POST /api/questions - attempting to create question");
      
      // Use the same authentication logic as /api/user
      let userId = null;
      
      // First try JWT authentication (for Google/Facebook OAuth users)
      const { getCurrentUser } = await import('./auth/jwt');
      const jwtUser = await getCurrentUser(req);
      
      if (jwtUser) {
        userId = jwtUser.id;
        console.log("✅ Question creation - JWT auth successful:", jwtUser.email);
      } else {
        // Fallback to Replit Auth
        if (req.isAuthenticated && req.isAuthenticated()) {
          const user = req.user as any;
          if ((user as any)?.claims?.sub) {
            userId = (user as any).claims.sub;
            console.log("✅ Question creation - Replit Auth successful:", userId);
          }
        }
      }
      
      if (!userId) {
        console.log("❌ Question creation - No authentication found");
        return res.status(401).json({ message: "Authentication required" });
      }
      
      console.log("📝 Received question data:", JSON.stringify(req.body, null, 2));
      
      const questionData = insertQuestionSchema.parse({ ...req.body, userId });
      console.log("📝 Creating question:", { 
        title: questionData.title, 
        topicId: questionData.topicId, 
        isAnonymous: questionData.isAnonymous,
        userId: questionData.userId 
      });
      
      const question = await storage.createQuestion(questionData);
      console.log("✅ Question created successfully:", question.id);
      res.json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log("❌ Question validation error:", error.errors);
        return res.status(400).json({ message: "Invalid question data", errors: error.errors });
      }
      console.error("❌ Error creating question:", error);
      res.status(500).json({ message: "Failed to create question" });
    }
  });

  app.get('/api/questions', async (req, res) => {
    try {
      const filters = {
        search: req.query.q as string,
        topic: req.query.topic as string,
        sort: req.query.sort as 'top' | 'new' | 'unanswered',
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        offset: req.query.offset ? Number(req.query.offset) : undefined,
      };
      const result = await storage.getQuestions(filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  app.get('/api/questions/:id', async (req, res) => {
    try {
      const question = await storage.getQuestion(req.params.id);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.json(question);
    } catch (error) {
      console.error("Error fetching question:", error);
      res.status(500).json({ message: "Failed to fetch question" });
    }
  });

  app.patch('/api/questions/:id', unifiedAuthGuard, async (req: any, res) => {
    try {
      console.log("📝 PATCH /api/questions/:id - attempting to update question");
      
      const userId = req.user?.id;
      
      // First check if the question exists and belongs to the user
      const existingQuestion = await storage.getQuestion(req.params.id);
      if (!existingQuestion) {
        return res.status(404).json({ message: "Question not found" });
      }
      if (existingQuestion.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to edit this question" });
      }
      
      const questionData = insertQuestionSchema.partial().parse(req.body);
      console.log("📝 Updating question:", { id: req.params.id, isAnonymous: questionData.isAnonymous });
      
      const question = await storage.updateQuestion(req.params.id, questionData);
      console.log("✅ Question updated successfully:", question.id);
      res.json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log("❌ Question update validation error:", error.errors);
        return res.status(400).json({ message: "Invalid question data", errors: error.errors });
      }
      console.error("❌ Error updating question:", error);
      res.status(500).json({ message: "Failed to update question" });
    }
  });

  // Question visibility update endpoint for visibility control
  app.patch('/api/questions/:id/visibility', unifiedAuthGuard, async (req: any, res) => {
    try {
      console.log("📝 PATCH /api/questions/:id/visibility - attempting to update question visibility");
      
      const userId = req.user?.id;
      const questionId = req.params.id;
      const { visibility } = req.body;
      
      // Validate visibility value
      if (!['public', 'hidden'].includes(visibility)) {
        return res.status(400).json({ message: "Invalid visibility value. Must be 'public' or 'hidden'" });
      }
      
      // Check if the question exists and belongs to the user
      const existingQuestion = await storage.getQuestion(questionId);
      if (!existingQuestion) {
        return res.status(404).json({ message: "Question not found" });
      }
      if (existingQuestion.userId !== userId) {
        return res.status(403).json({ message: "Only the question author can change question visibility" });
      }
      
      const question = await storage.updateQuestion(questionId, { visibility });
      console.log("✅ Question visibility updated successfully:", { id: questionId, visibility });
      res.json({ id: questionId, visibility: question.visibility });
    } catch (error) {
      console.error("❌ Error updating question visibility:", error);
      res.status(500).json({ message: "Failed to update question visibility" });
    }
  });

  app.delete('/api/questions/:id', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      
      // First check if the question exists and belongs to the user
      const existingQuestion = await storage.getQuestion(req.params.id);
      if (!existingQuestion) {
        return res.status(404).json({ message: "Question not found" });
      }
      if (existingQuestion.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this question" });
      }
      
      console.log("🗑️ Deleting question:", req.params.id);
      await storage.deleteQuestion(req.params.id);
      console.log("✅ Question deleted successfully:", req.params.id);
      res.json({ message: "Question deleted successfully" });
    } catch (error) {
      console.error("❌ Error deleting question:", error);
      res.status(500).json({ message: "Failed to delete question" });
    }
  });

  // Answers
  app.post('/api/questions/:questionId/answers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const answerData = insertAnswerSchema.parse({ 
        ...req.body, 
        userId, 
        questionId: req.params.questionId 
      });
      const answer = await storage.createAnswer(answerData);
      
      // Create notification for question author when someone answers their question
      const question = await storage.getQuestion(req.params.questionId);
      if (question && question.userId !== userId) {
        const answerer = await storage.getUser(userId);
        await storage.createNotification({
          userId: question.userId,
          type: "question_answered",
          category: "social",
          priority: "normal",
          title: "Your Question Got an Answer!",
          message: `${answerer?.firstName || 'Someone'} answered your question "${question.title}".`,
          relatedUserId: userId,
          actionUrl: `/community/questions/${question.id}#answer-${answer.id}`,
          isRead: false,
        });
      }
      
      res.json(answer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid answer data", errors: error.errors });
      }
      console.error("Error creating answer:", error);
      res.status(500).json({ message: "Failed to create answer" });
    }
  });

  app.get('/api/questions/:questionId/answers', async (req, res) => {
    try {
      const answers = await storage.getQuestionAnswers(req.params.questionId);
      res.json(answers);
    } catch (error) {
      console.error("Error fetching answers:", error);
      res.status(500).json({ message: "Failed to fetch answers" });
    }
  });

  app.post('/api/questions/:questionId/accept/:answerId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      
      // Check if the user owns the question
      const question = await storage.getQuestion(req.params.questionId);
      if (!question || question.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to accept answers for this question" });
      }
      
      // Get answer details before accepting
      const answer = await storage.getAnswer(req.params.answerId);
      if (!answer) {
        return res.status(404).json({ message: "Answer not found" });
      }
      
      await storage.acceptAnswer(req.params.questionId, req.params.answerId);
      
      // Create notification for answer author when their answer is accepted
      if (answer.userId !== userId) {
        const questionAuthor = await storage.getUser(userId);
        await storage.createNotification({
          userId: answer.userId,
          type: "answer_accepted",
          category: "social",
          priority: "normal",
          title: "Your Answer Was Accepted!",
          message: `${questionAuthor?.firstName || 'Someone'} accepted your answer to "${question.title}".`,
          relatedUserId: userId,
          actionUrl: `/community/questions/${question.id}#answer-${answer.id}`,
          isRead: false,
        });
      }
      
      res.json({ message: "Answer accepted successfully" });
    } catch (error) {
      console.error("Error accepting answer:", error);
      res.status(500).json({ message: "Failed to accept answer" });
    }
  });

  // Update answer
  app.patch('/api/answers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const answerId = req.params.id;
      
      // First check if the answer exists and belongs to the user
      const existingAnswer = await storage.getAnswer(answerId);
      if (!existingAnswer) {
        return res.status(404).json({ message: "Answer not found" });
      }
      if (existingAnswer.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to edit this answer" });
      }
      
      const answerData = insertAnswerSchema.partial().parse(req.body);
      const answer = await storage.updateAnswer(answerId, answerData);
      res.json(answer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid answer data", errors: error.errors });
      }
      console.error("Error updating answer:", error);
      res.status(500).json({ message: "Failed to update answer" });
    }
  });

  // Delete answer
  app.delete('/api/answers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const answerId = req.params.id;
      
      // First check if the answer exists and belongs to the user
      const existingAnswer = await storage.getAnswer(answerId);
      if (!existingAnswer) {
        return res.status(404).json({ message: "Answer not found" });
      }
      if (existingAnswer.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this answer" });
      }
      
      await storage.deleteAnswer(answerId);
      res.json({ message: "Answer deleted successfully" });
    } catch (error) {
      console.error("Error deleting answer:", error);
      res.status(500).json({ message: "Failed to delete answer" });
    }
  });

  // New Upvote System
  app.post('/api/upvotes/toggle', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { itemType, itemId } = req.body;
      
      // Validate input
      if (!['question', 'answer'].includes(itemType)) {
        return res.status(400).json({ message: "Invalid item type" });
      }
      if (!itemId) {
        return res.status(400).json({ message: "Item ID is required" });
      }
      
      const result = await storage.toggleUpvote(userId, itemType, itemId);
      
      // Determine response message
      const message = result.hasUpvoted ? "Upvoted successfully" : "Upvote removed";
      
      // Create notification for upvotes only (to reduce spam)
      if (result.hasUpvoted) {
        try {
          if (itemType === 'question') {
            const question = await storage.getQuestion(itemId);
            if (question && question.userId !== userId) {
              const voter = await storage.getUser(userId);
              await storage.createNotification({
                userId: question.userId,
                type: "question_voted",
                category: "social",
                priority: "low",
                title: "Your Question Received an Upvote!",
                message: `${voter?.firstName || 'Someone'} upvoted your question "${question.title}".`,
                relatedUserId: userId,
                actionUrl: `/community/questions/${question.id}`,
                isRead: false,
              });
            }
          } else if (itemType === 'answer') {
            const answer = await storage.getAnswer(itemId);
            if (answer && answer.userId !== userId) {
              const voter = await storage.getUser(userId);
              await storage.createNotification({
                userId: answer.userId,
                type: "answer_voted",
                category: "social",
                priority: "low",
                title: "Your Answer Received an Upvote!",
                message: `${voter?.firstName || 'Someone'} upvoted your answer.`,
                relatedUserId: userId,
                actionUrl: `/community/questions/${answer.questionId}#answer-${answer.id}`,
                isRead: false,
              });
            }
          }
        } catch (notificationError) {
          console.error("Error creating vote notification:", notificationError);
          // Don't fail the vote due to notification error
        }
      }
      
      res.json({
        hasUpvoted: result.hasUpvoted,
        score: result.newScore,
        item: result.item,
        message: message
      });
    } catch (error) {
      console.error("Error processing upvote:", error);
      res.status(500).json({ message: "Failed to process upvote" });
    }
  });

  // Get current user's upvote status for an item
  app.get('/api/upvotes/:type/:id', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { type, id } = req.params;
      
      if (!['question', 'answer'].includes(type)) {
        return res.status(400).json({ message: "Invalid type" });
      }
      
      const upvote = await storage.getUserUpvote(userId, type as 'question' | 'answer', id);
      res.json({ hasUpvoted: !!upvote });
    } catch (error) {
      console.error("Error fetching user upvote:", error);
      res.status(500).json({ message: "Failed to fetch upvote status" });
    }
  });

  // Popular destinations endpoint
  app.get('/api/popular-destinations', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const destinations = await storage.getPopularDestinations(limit);
      res.json(destinations);
    } catch (error) {
      console.error("Error fetching popular destinations:", error);
      res.status(500).json({ message: "Failed to fetch popular destinations" });
    }
  });

  // ML Recommendation endpoints
  app.get('/api/recommendations/trips', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { limit = 10, region, minPrice, maxPrice, date } = req.query;
      
      const filters: any = {};
      if (region) filters.region = region;
      if (minPrice) filters.minPrice = parseFloat(minPrice);
      if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
      if (date) filters.date = new Date(date);

      const recommendations = await enhancedRecommendationService.getPersonalizedRecommendations(
        userId, 
        parseInt(limit), 
        filters
      );
      
      res.json(recommendations);
    } catch (error) {
      console.error("Error getting trip recommendations:", error);
      res.status(500).json({ message: "Failed to get recommendations" });
    }
  });

  app.get('/api/user/preferences', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const preferences = await storage.getUserPreferences(userId);
      res.json(preferences || {});
    } catch (error) {
      console.error("Error getting user preferences:", error);
      res.status(500).json({ message: "Failed to get preferences" });
    }
  });

  // NEW PROFILE SYSTEM - /api/me/* endpoints
  
  // Get aggregated profile data
  app.get('/api/me', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get user profile
      const profile = await storage.getUser(userId);
      if (!profile) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get preferences (existing)
      const preferences = await storage.getUserPreferences(userId);
      
      // Get privacy settings - using placeholder for now
      const privacy = null; // await storage.getUserPrivacy(userId);
      
      // Get notification settings - using existing notifications
      const notifications = await storage.getUserNotifications(userId);
      
      // Get stats - using existing methods
      const [userQuestions, userTrips] = await Promise.all([
        storage.getUserQuestions(userId),
        storage.getUserTrips(userId)
      ]);
      
      // Calculate profile completion percentage
      const calculateProfileCompletion = (profile: any, preferences: any) => {
        let completed = 0;
        let total = 6; // Total completion criteria
        
        // Basic profile fields (4 criteria)
        if (profile.profileImageUrl || profile.image) completed++; // Profile Picture
        if (profile.displayName || profile.name || profile.firstName || profile.lastName) completed++; // Display Name
        if (profile.bio) completed++; // Bio
        if (profile.location) completed++; // Location
        
        // Preferences completion (2 criteria)
        if (preferences) {
          let prefsCompleted = 0;
          let prefsTotal = 4; // vibe, companions, interests, months
          
          if (preferences.vibe?.length > 0) prefsCompleted++;
          if (preferences.companions?.length > 0) prefsCompleted++;
          if (preferences.interests?.length > 0) prefsCompleted++;
          if (preferences.months?.length > 0) prefsCompleted++;
          
          // Travel preferences count as 1 point if 50%+ complete, 2 points if 100% complete
          if (prefsCompleted >= 2) completed++; // 50%+ preferences
          if (prefsCompleted === prefsTotal) completed++; // 100% preferences
        }
        
        return Math.round((completed / total) * 100);
      };
      
      const profileCompletePct = calculateProfileCompletion(profile, preferences);
      
      res.json({
        profile: {
          ...profile,
          profileCompletePct
        },
        preferences,
        privacy,
        notifications,
        stats: {
          questions_count: userQuestions?.length || 0,
          trips_count: userTrips?.length || 0,
          saved_count: 0 // Implement if needed
        }
      });
    } catch (error) {
      console.error("Error fetching profile data:", error);
      res.status(500).json({ message: "Failed to fetch profile data" });
    }
  });
  
  // Update profile
  app.patch('/api/me/profile', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { displayName, username, bio, location, languages, links, profileImageUrl } = req.body;
      
      // Check username uniqueness if provided
      if (username && username.trim()) {
        const existingUser = await storage.getUserByUsername(username.trim());
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: "Username is already taken" });
        }
      }
      
      const updateData = {
        displayName: displayName?.trim() || null,
        username: username?.trim() || null,
        bio: bio?.trim() || null,
        location: location?.trim() || null,
        languages: languages || null,
        linksJson: links || null,
        profileImageUrl: profileImageUrl?.trim() || null,
      };
      
      const updatedUser = await storage.updateUser(userId, updateData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      if (error instanceof Error && error.message.includes('unique')) {
        return res.status(400).json({ message: "Username is already taken" });
      }
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Avatar upload endpoint
  app.post('/api/me/avatar', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Return Cloudinary signature for upload
      // This would be implemented with Cloudinary SDK
      res.json({
        signature: "placeholder_signature",
        upload_url: "placeholder_upload_url",
        folder: `users/${userId}`
      });
    } catch (error) {
      console.error("Error generating avatar upload URL:", error);
      res.status(500).json({ message: "Failed to generate upload URL" });
    }
  });

  // Update notification settings
  app.patch('/api/me/notifications', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { emailOn, pushOn, categoriesJson, digest } = req.body;
      
      // Placeholder for notification settings
      const settings = { emailOn, pushOn, categoriesJson, digest };
      
      res.json(settings);
    } catch (error) {
      console.error("Error updating notification settings:", error);
      res.status(500).json({ message: "Failed to update notification settings" });
    }
  });

  // Update privacy settings
  app.patch('/api/me/privacy', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { visibility, dmPolicy, showOnline, showJoinedTrips, cityVisibility } = req.body;
      
      // Placeholder for privacy settings
      const settings = { visibility, dmPolicy, showOnline, showJoinedTrips, cityVisibility };
      
      res.json(settings);
    } catch (error) {
      console.error("Error updating privacy settings:", error);
      res.status(500).json({ message: "Failed to update privacy settings" });
    }
  });

  // Get user activity (questions)
  app.get('/api/me/activity/questions', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const questions = await storage.getUserQuestions(userId);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching user questions:", error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  // Get user activity (trips)
  // Account management routes
  app.get('/api/me/export', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Gather all user data for export
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get user's trips, ratings, and preferences
      const [trips, ratings, preferences] = await Promise.all([
        storage.getUserTrips(userId),
        storage.getUserRatings(userId), 
        storage.getUserPreferences(userId)
      ]);
      
      // Prepare export data
      const exportData = {
        exportDate: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          bio: user.bio,
          phoneNumber: user.phoneNumber,
          profileImageUrl: user.profileImageUrl,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        trips: trips || [],
        comments: comments || [],
        ratings: ratings || [],
        preferences: preferences || {},
        note: "This export contains all your personal data from Ceylon Expand as of the export date."
      };
      
      // Set headers for file download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="ceylon-expand-data-${userId}-${new Date().toISOString().split('T')[0]}.json"`);
      
      res.json(exportData);
    } catch (error) {
      console.error("Error exporting user data:", error);
      res.status(500).json({ message: "Failed to export user data" });
    }
  });

  app.delete('/api/me', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // TODO: In a production system, you might want to:
      // 1. Mark account as "deleted" instead of hard delete
      // 2. Anonymize data instead of deleting
      // 3. Keep trip data but anonymize user info
      // 4. Implement a grace period for account recovery
      
      // For now, we'll delete the user account
      await storage.deleteUser(userId);
      
      res.json({ 
        message: "Account deleted successfully",
        deletedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error deleting user account:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  app.get('/api/me/activity/trips', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const trips = await storage.getUserTrips(userId);
      res.json(trips);
    } catch (error) {
      console.error("Error fetching user trips:", error);
      res.status(500).json({ message: "Failed to fetch trips" });
    }
  });

  app.put('/api/user/preferences', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Validate using the new Travel Style Settings schema
      const validatedData = travelStyleSettingsSchema.parse(req.body);
      
      // Update preferences using the new format
      // Travel style settings update temporarily using updateUserPreferences
      const preferences = await storage.updateUserPreferences(userId, validatedData);
      
      res.json(preferences);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid preferences data", 
          errors: error.errors 
        });
      }
      console.error("Error updating user preferences:", error);
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });

  app.post('/api/user/interactions', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { tripId, interactionType, duration } = req.body;
      
      // Track interaction via enhanced ML service (which also updates trip features)
      await enhancedRecommendationService.trackUserInteraction(userId, tripId, interactionType, duration);
      
      res.json({ message: "Interaction tracked successfully" });
    } catch (error) {
      console.error("Error tracking user interaction:", error);
      res.status(500).json({ message: "Failed to track interaction" });
    }
  });

  // Enhanced recommendation routes with A/B testing support
  app.get('/api/recommendations/enhanced', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { 
        limit = 10, 
        region, 
        minPrice, 
        maxPrice, 
        date, 
        abTestGroup 
      } = req.query;
      
      const filters: any = {};
      if (region) filters.region = region;
      if (minPrice) filters.minPrice = parseFloat(minPrice);
      if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
      if (date) filters.date = new Date(date);
      if (abTestGroup) filters.abTestGroup = abTestGroup;

      const recommendations = await enhancedRecommendationService.getPersonalizedRecommendations(
        userId, 
        parseInt(limit), 
        filters
      );
      
      res.json(recommendations);
    } catch (error) {
      console.error("Error getting enhanced recommendations:", error);
      res.status(500).json({ message: "Failed to get recommendations" });
    }
  });

  // User preferences routes
  app.get('/api/user/preferences', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const preferences = await storage.getUserPreferences(userId);
      res.json(preferences || {});
    } catch (error) {
      console.error("Error getting user preferences:", error);
      res.status(500).json({ message: "Failed to get preferences" });
    }
  });

  app.post('/api/user/preferences', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { vibe, whenTravel, travelStyle } = req.body;
      
      await storage.upsertUserPreferences(userId, {
        vibe,
        whenTravel,
        travelStyle,
      });
      
      res.json({ message: "Preferences saved successfully" });
    } catch (error) {
      console.error("Error saving user preferences:", error);
      res.status(500).json({ message: "Failed to save preferences" });
    }
  });

  // User personalization controls
  app.get('/api/user/personalization', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const personalization = await storage.getUserPersonalization(userId);
      res.json(personalization || { isPaused: false, abTestGroup: 'personalized' });
    } catch (error) {
      console.error("Error getting personalization settings:", error);
      res.status(500).json({ message: "Failed to get personalization settings" });
    }
  });

  app.put('/api/user/personalization/toggle', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { isPaused } = req.body;
      
      await enhancedRecommendationService.togglePersonalization(userId, isPaused);
      
      res.json({ message: "Personalization settings updated" });
    } catch (error) {
      console.error("Error updating personalization:", error);
      res.status(500).json({ message: "Failed to update personalization" });
    }
  });

  app.post('/api/user/personalization/reset', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      await enhancedRecommendationService.resetUserRecommendations(userId);
      
      res.json({ message: "Recommendations reset successfully" });
    } catch (error) {
      console.error("Error resetting recommendations:", error);
      res.status(500).json({ message: "Failed to reset recommendations" });
    }
  });

  // Trending trips endpoint (public, no authentication required)
  app.get('/api/recommendations/trending', async (req, res) => {
    try {
      const { limit = 10 } = req.query;
      
      const trendingTrips = await enhancedRecommendationService.getTrendingTrips(
        parseInt(limit as string)
      );
      
      res.json(trendingTrips);
    } catch (error) {
      console.error("Error getting trending trips:", error);
      res.status(500).json({ message: "Failed to get trending trips" });
    }
  });

  // Enhanced interaction tracking with session support
  app.post('/api/user/interactions/enhanced', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { 
        tripId, 
        interactionType, 
        duration, 
        sessionId, 
        abTestGroup 
      } = req.body;
      
      await enhancedRecommendationService.trackUserInteraction(
        userId, 
        tripId, 
        interactionType, 
        duration, 
        sessionId, 
        abTestGroup
      );
      
      res.json({ message: "Interaction tracked successfully" });
    } catch (error) {
      console.error("Error tracking enhanced interaction:", error);
      res.status(500).json({ message: "Failed to track interaction" });
    }
  });

  // KPI tracking endpoints
  app.post('/api/kpi/event', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { 
        eventType, 
        tripId, 
        abTestGroup, 
        eventData, 
        sessionId 
      } = req.body;
      
      await enhancedRecommendationService.trackKpiEvent({
        userId,
        sessionId,
        eventType,
        tripId,
        abTestGroup,
        eventData
      });
      
      res.json({ message: "KPI event tracked successfully" });
    } catch (error) {
      console.error("Error tracking KPI event:", error);
      res.status(500).json({ message: "Failed to track KPI event" });
    }
  });

  // Analytics endpoint for admin dashboard
  app.get('/api/analytics/kpi', unifiedAuthGuard, async (req: any, res) => {
    try {
      const { 
        eventType, 
        abTestGroup, 
        startDate, 
        endDate 
      } = req.query;
      
      const filters: any = {};
      if (eventType) filters.eventType = eventType;
      if (abTestGroup) filters.abTestGroup = abTestGroup;
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);
      
      const events = await storage.getKpiEvents(filters);
      
      // Calculate metrics
      const totalEvents = events.length;
      const groupedByType = events.reduce((acc, event) => {
        acc[event.eventType] = (acc[event.eventType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const groupedByABTest = events.reduce((acc, event) => {
        const group = event.abTestGroup || 'unknown';
        acc[group] = (acc[group] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      res.json({
        totalEvents,
        eventsByType: groupedByType,
        eventsByABTest: groupedByABTest,
        events: events.slice(0, 100) // Latest 100 events
      });
    } catch (error) {
      console.error("Error getting KPI analytics:", error);
      res.status(500).json({ message: "Failed to get analytics" });
    }
  });

  app.get('/api/user/interactions', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { limit = 50 } = req.query;
      
      const interactions = await storage.getUserInteractions(userId, parseInt(limit));
      res.json(interactions);
    } catch (error) {
      console.error("Error getting user interactions:", error);
      res.status(500).json({ message: "Failed to get interactions" });
    }
  });

  // Notification routes (REMOVED - duplicate route, using improved version below)

  app.get('/api/notifications/unread-count', unifiedAuthGuard, async (req, res) => {
    try {
      const userId = req.user!.id;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread notification count:", error);
      res.status(500).json({ message: "Failed to fetch notification count" });
    }
  });

  app.patch('/api/notifications/:id/read', unifiedAuthGuard, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.markNotificationAsRead(id);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.patch('/api/notifications/read-all', unifiedAuthGuard, async (req, res) => {
    try {
      const userId = req.user!.id;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  app.delete('/api/notifications/:id', unifiedAuthGuard, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteNotification(id);
      res.json({ message: "Notification deleted" });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Chat Buddy inbox routes
  app.get('/api/threads', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const threads = await storage.getUserChatThreads(userId);
      res.json(threads);
    } catch (error) {
      console.error("Error fetching chat threads:", error);
      res.status(500).json({ message: "Failed to fetch chat threads" });
    }
  });

  app.get('/api/threads/:threadId/messages', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const threadId = req.params.threadId;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const cursor = req.query.cursor as string;

      // Verify user is in the thread
      const isInThread = await storage.isUserInThread(threadId, userId);
      if (!isInThread) {
        return res.status(403).json({ message: "You are not a member of this chat thread" });
      }

      const messages = await storage.getThreadMessages(threadId, limit, cursor);
      // Normalize user data in messages
      const normalizedMessages = messages.map((message: any) => ({
        ...message,
        sender: normalizeUserForUI(message.sender)
      }));
      res.json(normalizedMessages);
    } catch (error) {
      console.error("Error fetching thread messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/threads/:threadId/messages', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const threadId = req.params.threadId;
      const { body } = req.body;

      if (!body || body.trim().length === 0) {
        return res.status(400).json({ message: "Message body is required" });
      }

      // Verify user is in the thread
      const isInThread = await storage.isUserInThread(threadId, userId);
      if (!isInThread) {
        return res.status(403).json({ message: "You are not a member of this chat thread" });
      }

      // Create message
      const message = await storage.createMessage({
        threadId,
        senderId: userId,
        body: body.trim()
      });

      // Get other users in thread for notifications
      const threadUsers = await storage.getThreadUsers(threadId);
      const otherUsers = threadUsers.filter(user => user.id !== userId);

      // Create notifications for other users
      const currentUser = await storage.getUser(userId);
      for (const otherUser of otherUsers) {
        await storage.createNotification({
          userId: otherUser.id,
          type: "chat_message",
          category: "social",
          priority: "normal",
          title: "New Message",
          message: `${currentUser?.firstName || 'Someone'}: ${body.substring(0, 60)}${body.length > 60 ? '...' : ''}`,
          threadId: threadId,
          relatedUserId: userId,
          actionUrl: `/chat/${threadId}`,
          isRead: false,
        });
      }

      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // Share contact details in chat thread
  app.post('/api/threads/:threadId/share-contact', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const threadId = req.params.threadId;
      const { phoneNumber, email } = req.body;

      // Permission check: Ensure user is the organizer
      const isOrganizer = await storage.isThreadOrganizer(userId, threadId);
      if (!isOrganizer) {
        return res.status(403).json({ error: "Only trip organizers can share contact details" });
      }

      // Rate limiting check: 3 shares per hour per thread
      const recentShares = await storage.getRecentContactShares(threadId, 1);
      if (recentShares.length >= 3) {
        return res.status(429).json({ 
          error: "Rate limit exceeded: Maximum 3 contact shares per hour per thread",
          nextAllowedTime: new Date(recentShares[0].sharedAt.getTime() + 60 * 60 * 1000)
        });
      }

      // Contact validation and normalization
      const { normalizePhoneNumber, validateAndNormalizeEmail } = await import('./utils/contactValidation');
      const normalizedContact = {
        phoneNumber: phoneNumber ? normalizePhoneNumber(phoneNumber) : null,
        email: email ? validateAndNormalizeEmail(email) : null
      };

      if (!normalizedContact.phoneNumber && !normalizedContact.email) {
        return res.status(400).json({ error: "At least one contact method (phone or email) is required" });
      }

      // Check for idempotency - prevent duplicate shares with same contact info
      const isDuplicate = recentShares.some(share => 
        share.phoneNumber === normalizedContact.phoneNumber && 
        share.email === normalizedContact.email
      );
      
      if (isDuplicate) {
        return res.status(409).json({ error: "Contact details already shared recently" });
      }

      // Generate unique IDs
      const { nanoid } = await import('nanoid');
      const contactShareId = nanoid();

      // Create contact share record for audit trail
      const contactShare = await storage.createContactShare({
        id: contactShareId,
        threadId,
        sharedBy: userId,
        phoneNumber: normalizedContact.phoneNumber,
        email: normalizedContact.email,
        sharedAt: new Date()
      });

      // Create audit log entry
      await storage.createAuditLog('SHARE_CONTACT', userId, {
        threadId,
        contactShareId: contactShare.id,
        phoneNumber: !!normalizedContact.phoneNumber,
        email: !!normalizedContact.email,
        ipAddress: req.ip
      });

      // Create contact sharing message
      const message = await storage.createMessage({
        threadId,
        senderId: userId,
        body: `📞 Contact shared:\\n${normalizedContact.phoneNumber ? `WhatsApp: ${normalizedContact.phoneNumber}` : ''}${normalizedContact.email ? `\\nEmail: ${normalizedContact.email}` : ''}`,
        type: "CONTACT_SHARE",
        payload: {
          contactShareId: contactShare.id,
          sharedContact: normalizedContact,
          note: "Contact details shared by organizer"
        },
      });

      // Get other users in thread for notifications
      const threadUsers = await storage.getThreadUsers(threadId);
      const otherUsers = threadUsers.filter(user => user.id !== userId);

      // Create notifications for other users
      const currentUser = await storage.getUser(userId);
      for (const otherUser of otherUsers) {
        await storage.createNotification({
          userId: otherUser.id,
          type: "contact_shared",
          category: "social",
          priority: "high",
          title: "Contact Details Shared",
          message: `${currentUser?.firstName || 'Trip organizer'} shared their contact details with you`,
          threadId: threadId,
          relatedUserId: userId,
          actionUrl: `/chat/${threadId}`,
          isRead: false,
        });
      }

      res.json({ 
        success: true, 
        message,
        shareId: contactShare.id,
        remainingShares: Math.max(0, 3 - recentShares.length - 1)
      });
    } catch (error) {
      console.error("Error sharing contact:", error);
      res.status(500).json({ message: "Failed to share contact details" });
    }
  });

  app.get('/api/threads/:threadId', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const threadId = req.params.threadId;

      // Verify user is in the thread
      const isInThread = await storage.isUserInThread(threadId, userId);
      if (!isInThread) {
        return res.status(403).json({ message: "You are not a member of this chat thread" });
      }

      const thread = await storage.getChatThread(threadId);
      if (!thread) {
        return res.status(404).json({ message: "Chat thread not found" });
      }

      const threadUsers = await storage.getThreadUsers(threadId);
      
      // Get trip information if thread is associated with a trip
      let trip = null;
      if (thread.tripId) {
        trip = await storage.getTrip(thread.tripId);
      }

      // Normalize user data in thread response
      const normalizedThreadUsers = normalizeUsersForUI(threadUsers);
      const normalizedTrip = trip ? {
        ...trip,
        organizer: normalizeUserForUI(trip.organizer)
      } : null;
      
      res.json({ ...thread, users: normalizedThreadUsers, trip: normalizedTrip });
    } catch (error) {
      console.error("Error fetching chat thread:", error);
      res.status(500).json({ message: "Failed to fetch chat thread" });
    }
  });

  // NEW: Trip-specific chat endpoints for Chat Buddy functionality
  
  // Get trip participation status for current user
  app.get('/api/trips/:tripId/status', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const tripId = req.params.tripId;

      const interestRequest = await storage.getTripInterestRequestByUserAndTrip(userId, tripId);
      const status = interestRequest?.status || 'none';
      
      res.json({ status, chatThreadId: interestRequest?.chatThreadId || null });
    } catch (error) {
      console.error("Error fetching trip status:", error);
      res.status(500).json({ message: "Failed to fetch trip status" });
    }
  });

  // Get chat-eligible users for a trip (only for accepted participants)
  app.get('/api/chat/users', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const tripId = req.query.tripId as string;

      if (!tripId) {
        return res.status(400).json({ message: "tripId is required" });
      }

      // Check if user has accepted status for this trip
      const userRequest = await storage.getTripInterestRequestByUserAndTrip(userId, tripId);
      if (userRequest?.status !== 'accepted') {
        return res.status(403).json({ message: "Access denied. Trip request not accepted." });
      }

      // Get all accepted participants for this trip
      const acceptedUsers = await storage.getAcceptedTripParticipants(tripId);
      const normalizedUsers = normalizeUsersForUI(acceptedUsers);
      res.json(normalizedUsers);
    } catch (error) {
      console.error("Error fetching chat users:", error);
      res.status(500).json({ message: "Failed to fetch chat users" });
    }
  });

  // Get chat thread for a specific user within a trip context
  app.get('/api/chat/:userId', unifiedAuthGuard, async (req: any, res) => {
    try {
      const currentUserId = req.user.id;
      const otherUserId = req.params.userId;
      const tripId = req.query.tripId as string;

      if (!tripId) {
        return res.status(400).json({ message: "tripId is required" });
      }

      // Verify both users are accepted participants
      const [currentUserRequest, otherUserRequest] = await Promise.all([
        storage.getTripInterestRequestByUserAndTrip(currentUserId, tripId),
        storage.getTripInterestRequestByUserAndTrip(otherUserId, tripId)
      ]);

      if (currentUserRequest?.status !== 'accepted' || otherUserRequest?.status !== 'accepted') {
        return res.status(403).json({ message: "Access denied. Both users must have accepted trip requests." });
      }

      // Find or create chat thread for this trip + user pair
      let chatThread = await storage.getTripChatThread(tripId, currentUserId, otherUserId);
      
      if (!chatThread) {
        // Create new thread
        chatThread = await storage.createChatThread({ tripId });
        await storage.addUserToThread({ threadId: chatThread.id, userId: currentUserId });
        await storage.addUserToThread({ threadId: chatThread.id, userId: otherUserId });
      }

      const messages = await storage.getThreadMessages(chatThread.id);
      // Normalize user data in messages
      const normalizedMessages = messages.map((message: any) => ({
        ...message,
        sender: normalizeUserForUI(message.sender)
      }));
      res.json({ thread: chatThread, messages: normalizedMessages });
    } catch (error) {
      console.error("Error fetching chat thread:", error);
      res.status(500).json({ message: "Failed to fetch chat thread" });
    }
  });

  // Send message with trip context validation
  app.post('/api/chat/:userId', unifiedAuthGuard, async (req: any, res) => {
    try {
      const currentUserId = req.user.id;
      const otherUserId = req.params.userId;
      const tripId = req.query.tripId as string;
      const { message } = req.body;

      if (!tripId || !message?.trim()) {
        return res.status(400).json({ message: "tripId and message are required" });
      }

      // Verify both users are accepted participants
      const [currentUserRequest, otherUserRequest] = await Promise.all([
        storage.getTripInterestRequestByUserAndTrip(currentUserId, tripId),
        storage.getTripInterestRequestByUserAndTrip(otherUserId, tripId)
      ]);

      if (currentUserRequest?.status !== 'accepted' || otherUserRequest?.status !== 'accepted') {
        return res.status(403).json({ message: "Access denied. Both users must have accepted trip requests." });
      }

      // Get or create chat thread
      let chatThread = await storage.getTripChatThread(tripId, currentUserId, otherUserId);
      
      if (!chatThread) {
        chatThread = await storage.createChatThread({ tripId });
        await storage.addUserToThread({ threadId: chatThread.id, userId: currentUserId });
        await storage.addUserToThread({ threadId: chatThread.id, userId: otherUserId });
      }

      // Create message
      const newMessage = await storage.createMessage({
        threadId: chatThread.id,
        senderId: currentUserId,
        body: message.trim()
      });

      // Update unread count for other user
      await storage.incrementUnreadCount(chatThread.id, otherUserId);

      // Create notification for other user
      const currentUser = await storage.getUser(currentUserId);
      await storage.createNotification({
        userId: otherUserId,
        type: "chat_message",
        category: "social", 
        priority: "normal",
        title: "New Trip Message",
        message: `${currentUser?.firstName || 'Someone'}: ${message.substring(0, 60)}${message.length > 60 ? '...' : ''}`,
        threadId: chatThread.id,
        relatedUserId: currentUserId,
        actionUrl: `/chat-buddy?tripId=${tripId}&userId=${currentUserId}`,
        isRead: false,
      });

      res.json(newMessage);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Mark thread as read (reset unread count)
  app.post('/api/chat/:userId/read', unifiedAuthGuard, async (req: any, res) => {
    try {
      const currentUserId = req.user.id;
      const otherUserId = req.params.userId;
      const tripId = req.query.tripId as string;

      if (!tripId) {
        return res.status(400).json({ message: "tripId is required" });
      }

      const chatThread = await storage.getTripChatThread(tripId, currentUserId, otherUserId);
      if (chatThread) {
        await storage.resetUnreadCount(chatThread.id, currentUserId);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error marking as read:", error);
      res.status(500).json({ message: "Failed to mark as read" });
    }
  });

  // Calendar Events API
  app.get("/api/calendar/events", unifiedAuthGuard, async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      const { startDate, endDate } = req.query;
      
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      
      const events = await storage.getUserCalendarEvents(userId, start, end);
      res.json(events);
    } catch (error) {
      console.error("Failed to get calendar events:", error);
      res.status(500).json({ message: "Failed to get calendar events" });
    }
  });
  
  app.post("/api/calendar/events", unifiedAuthGuard, async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      const eventData = { ...req.body, userId };
      
      const event = await storage.createCalendarEvent(eventData);
      res.status(201).json(event);
    } catch (error) {
      console.error("Failed to create calendar event:", error);
      res.status(500).json({ message: "Failed to create calendar event" });
    }
  });

  // New unified calendar endpoint with view filtering
  app.get("/api/calendar", unifiedAuthGuard, async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      const { view = 'upcoming', tz = 'UTC' } = req.query;
      
      // Helper function to get week boundaries based on timezone
      const getWeekBoundaries = (timezone: string) => {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // End of current week (Saturday)
        endOfWeek.setHours(23, 59, 59, 999);
        
        return { startOfWeek, endOfWeek };
      };

      // Helper function to generate event icons based on flags and context
      const generateEventIcons = (trip: any, isMyTrip: boolean, isPinned: boolean, isInterested: boolean, isFree: boolean) => {
        const icons: string[] = [];
        if (isInterested) icons.push('⭐');
        if (isPinned) icons.push('📌');  
        if (isMyTrip) icons.push('👤');
        if (isFree) icons.push('💚');
        return icons;
      };

      // Helper function to format event data
      const formatTripEvent = (trip: any, isPinned: boolean, isInterested: boolean) => {
        const isMyTrip = trip.organizerId === userId;
        const numPrice = trip.price ? parseFloat(trip.price) : 0;
        const isFree = !trip.price || numPrice === 0 || isNaN(numPrice);
        const icons = generateEventIcons(trip, isMyTrip, isPinned, isInterested, isFree);
        
        return {
          id: `trip_${trip.id}`,
          title: trip.title,
          start: `${trip.date}T${trip.time || '00:00'}:00`,
          end: `${trip.date}T${trip.time ? (trip.time.split(':').map((n: string) => n === '23' ? '23' : String(Number(n) + 1).padStart(2, '0')).join(':')) : '01:00'}:00`,
          location: `${trip.fromLocation} → ${trip.toLocation}`,
          icons,
          meta: {
            price_amount: trip.price || 0,
            organizerId: trip.organizerId,
            user_flags: { pinned: isPinned, interested: isInterested }
          }
        };
      };

      let events: any[] = [];

      switch (view) {
        case 'upcoming': {
          const { startOfWeek, endOfWeek } = getWeekBoundaries(tz);
          const trips = await storage.getUserTrips(userId);
          const pinnedTripIds = new Set((await storage.getUserPinnedTrips(userId)).map(trip => trip.id));
          const interestedTripIds = new Set((await storage.getUserInterestedTrips(userId)).map(trip => trip.id));
          
          events = trips
            .filter(trip => {
              const tripDate = new Date(trip.date);
              return tripDate >= startOfWeek && tripDate <= endOfWeek;
            })
            .map(trip => formatTripEvent(trip, pinnedTripIds.has(trip.id), interestedTripIds.has(trip.id)));
          break;
        }

        case 'pinned': {
          const pinnedTrips = await storage.getUserPinnedTrips(userId);
          const interestedTripIds = new Set((await storage.getUserInterestedTrips(userId)).map(trip => trip.id));
          
          events = pinnedTrips.map(trip => formatTripEvent(trip, true, interestedTripIds.has(trip.id)));
          break;
        }

        case 'interested': {
          const interestedTrips = await storage.getUserInterestedTrips(userId);
          const pinnedTripIds = new Set((await storage.getUserPinnedTrips(userId)).map(trip => trip.id));
          
          events = interestedTrips.map(trip => formatTripEvent(trip, pinnedTripIds.has(trip.id), true));
          break;
        }

        case 'mine': {
          const myTrips = await storage.getUserTrips(userId);
          const pinnedTripIds = new Set((await storage.getUserPinnedTrips(userId)).map(trip => trip.id));
          const interestedTripIds = new Set((await storage.getUserInterestedTrips(userId)).map(trip => trip.id));
          
          events = myTrips.map((trip: any) => formatTripEvent(trip, pinnedTripIds.has(trip.id), interestedTripIds.has(trip.id)));
          break;
        }

        case 'free': {
          const trips = await storage.getUserTrips(userId);
          const pinnedTripIds = new Set((await storage.getUserPinnedTrips(userId)).map(trip => trip.id));
          const interestedTripIds = new Set((await storage.getUserInterestedTrips(userId)).map(trip => trip.id));
          
          events = trips
            .filter((trip: any) => !trip.price || trip.price === 0)
            .map(trip => formatTripEvent(trip, pinnedTripIds.has(trip.id), interestedTripIds.has(trip.id)));
          break;
        }

        default:
          return res.status(400).json({ message: "Invalid view parameter" });
      }

      // Sort events by start time
      events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
      
      res.json(events);
    } catch (error) {
      console.error("Failed to get calendar events:", error);
      res.status(500).json({ message: "Failed to get calendar events" });
    }
  });

  // Enhanced calendar day endpoint with multi-filter support and proper timezone handling
  app.get('/api/calendar/day', async (req: any, res: any) => {
    try {
      const { date, filters = '', region, tags, page = '1', limit = '20' } = req.query;
      
      // Validate required parameters
      if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ message: 'Date parameter is required (YYYY-MM-DD format)' });
      }
      
      // Parse and validate pagination
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.max(1, Math.min(50, parseInt(limit) || 20)); // Clamp limit to max 50
      const offset = (pageNum - 1) * limitNum;
      
      // Parse filters (CSV format: "pinned,interested,my,truly_free,all")
      const requestedFilters = filters.split(',').map((f: string) => f.trim()).filter(Boolean);
      const userSpecificFilters = ['pinned', 'interested', 'my'];
      // Don't require auth for "all" or "truly_free" filters, or when no filters are specified
      const requiresAuth = requestedFilters.length > 0 && requestedFilters.some((f: string) => userSpecificFilters.includes(f)) && !requestedFilters.includes('all');
      
      
      // Check authentication for user-specific filters
      let userId: string | null = null;
      if (requiresAuth) {
        try {
          const authResult = await new Promise((resolve) => {
            unifiedAuthGuard(req, res, (err?: any) => resolve(!err));
          });
          if (!authResult || !req.user?.id) {
            return res.status(401).json({ message: 'Authentication required for user-specific filters' });
          }
          userId = req.user.id;
        } catch (authError) {
          return res.status(401).json({ message: 'Authentication required for user-specific filters' });
        }
      }
      
      // Simple date boundaries for now
      const startOfDayLocal = new Date(`${date}T00:00:00Z`);
      const endOfDayLocal = new Date(`${date}T23:59:59.999Z`);
      
      // Get all trips for the date range
      const allTrips = await storage.getTripsInDateRange(startOfDayLocal, endOfDayLocal);
      
      
      // Apply region and tags filters on the retrieved trips
      let filteredTrips = allTrips;
      
      // Apply region filter if specified
      if (region && region !== 'any') {
        filteredTrips = filteredTrips.filter(trip => trip.region === region);
      }
      
      // Apply tags filter if specified (partial match)
      if (tags) {
        const tagList = tags.split(',').map((t: string) => t.trim()).filter(Boolean);
        if (tagList.length > 0) {
          filteredTrips = filteredTrips.filter(trip => {
            const tripTags = trip.tags || [];
            return tagList.some(tag => 
              tripTags.some((tripTag: string) => 
                tripTag.toLowerCase().includes(tag.toLowerCase())
              )
            );
          });
        }
      }
      
      // If no filters requested or "all" filter is included, return all active trips
      if (requestedFilters.length === 0 || requestedFilters.includes('all')) {
        const activeTrips = filteredTrips.filter(trip => trip.status === 'active');
        const total = activeTrips.length;
        const paginatedTrips = activeTrips.slice(offset, offset + limitNum);
        
        const items = paginatedTrips.map(trip => ({
          id: trip.id,
          title: trip.title,
          fromLocation: trip.fromLocation,
          toLocation: trip.toLocation,
          date: trip.date,
          time: trip.time,
          seatsAvailable: trip.seatsAvailable,
          price: trip.price,
          region: trip.region,
          tags: trip.tags,
          status: trip.status,
          // Redact contact info for privacy
          organizer: {
            id: trip.organizerId,
            // Add other safe organizer fields if needed, but no contact info
          }
        }));
        
        return res.json({
          items,
          total,
          page: pageNum,
          limit: limitNum
        });
      }
      
      // For user-specific filtering, we need user data
      if (requiresAuth && !userId) {
        return res.status(401).json({ message: 'Authentication required for filtering' });
      }
      
      // If only "truly_free" filter (without user-specific filters), handle directly
      if (requestedFilters.length === 1 && requestedFilters[0] === 'truly_free') {
        const freeTrips = filteredTrips.filter(trip => {
          const price = trip.price;
          const numPrice = price ? parseFloat(price) : 0;
          const isFree = !price || price === null || price === 'null' || price === 'NaN' || numPrice === 0 || isNaN(numPrice);
          return trip.status === 'active' && trip.seatsAvailable > 0 && isFree;
        });
        const total = freeTrips.length;
        const paginatedTrips = freeTrips.slice(offset, offset + limitNum);
        
        const items = paginatedTrips.map(trip => ({
          id: trip.id,
          title: trip.title,
          fromLocation: trip.fromLocation,
          toLocation: trip.toLocation,
          date: trip.date,
          time: trip.time,
          seatsAvailable: trip.seatsAvailable,
          price: trip.price,
          region: trip.region,
          tags: trip.tags,
          status: trip.status,
          organizer: {
            id: trip.organizerId,
          }
        }));
        
        return res.json({
          items,
          total,
          page: pageNum,
          limit: limitNum
        });
      }
      
      // Get user's pinned and interested trips for filtering (only if user is authenticated)
      const [pinnedTrips, interestedRequests] = await Promise.all([
        requestedFilters.includes('pinned') && userId ? storage.getUserPinnedTrips(userId) : Promise.resolve([]),
        requestedFilters.includes('interested') && userId ? storage.getUserInterestedTrips(userId) : Promise.resolve([])
      ]);
      
      const pinnedTripIds = new Set(pinnedTrips.map(trip => trip.id));
      const interestedTripIds = new Set(interestedRequests.map(trip => trip.id));
      
      // Apply filters (logical AND across selected filters)
      let userFilteredTrips = filteredTrips.filter(trip => {
        // Check each requested filter
        const filterResults = requestedFilters.map(filter => {
          switch (filter) {
            case 'pinned':
              return pinnedTripIds.has(trip.id);
            case 'interested':
              return interestedTripIds.has(trip.id);
            case 'my':
              return userId ? trip.organizerId === userId : false;
            case 'truly_free':
              const price = trip.price;
              const numPrice = price ? parseFloat(price) : 0;
              const isFree = !price || price === null || price === 'null' || price === 'NaN' || numPrice === 0 || isNaN(numPrice);
              return trip.status === 'active' && trip.seatsAvailable > 0 && isFree;
            default:
              return true; // Unknown filters are ignored
          }
        });
        
        // All filters must pass (logical AND)
        return filterResults.every(result => result);
      });
      
      const total = userFilteredTrips.length;
      const paginatedTrips = userFilteredTrips.slice(offset, offset + limitNum);
      
      // Format response with privacy redaction
      const items = paginatedTrips.map(trip => ({
        id: trip.id,
        title: trip.title,
        fromLocation: trip.fromLocation,
        toLocation: trip.toLocation,
        date: trip.date,
        time: trip.time,
        seatsAvailable: trip.seatsAvailable,
        price: trip.price,
        region: trip.region,
        tags: trip.tags,
        status: trip.status,
        // Add user-specific flags for frontend
        flags: {
          pinned: pinnedTripIds.has(trip.id),
          interested: interestedTripIds.has(trip.id),
          mine: trip.organizerId === userId,
          free: !trip.price || Number(trip.price) === 0
        },
        // Redacted organizer info (no contact details)
        organizer: {
          id: trip.organizerId,
          // Add other safe fields if needed, but never contact info
        }
      }));
      
      res.json({
        items,
        total,
        page: pageNum,
        limit: limitNum
      });
      
    } catch (error) {
      console.error("Failed to get calendar day events:", error);
      res.status(500).json({ message: "Failed to get calendar day events" });
    }
  });

  // Calendar month endpoint for month view and day counts
  app.get('/api/calendar/month', async (req: any, res: any) => {
    try {
      const { month, summary = 'false', filters = '', region, tags } = req.query;
      
      // Validate month parameter (YYYY-MM format)
      if (!month || typeof month !== 'string' || !/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({ message: 'Month parameter is required (YYYY-MM format)' });
      }
      
      const isSummary = summary === 'true';
      
      // Parse filters for authentication check
      const requestedFilters = filters.split(',').map((f: string) => f.trim()).filter(Boolean);
      const userSpecificFilters = ['pinned', 'interested', 'my'];
      // Don't require auth for "all" or "truly_free" filters, or when no filters are specified
      const requiresAuth = requestedFilters.length > 0 && requestedFilters.some((f: string) => userSpecificFilters.includes(f)) && !requestedFilters.includes('all') && !requestedFilters.includes('truly_free');
      
      // Check authentication if needed
      let userId: string | null = null;
      if (requiresAuth) {
        try {
          const authResult = await new Promise((resolve) => {
            unifiedAuthGuard(req, res, (err?: any) => resolve(!err));
          });
          if (!authResult || !req.user?.id) {
            return res.status(401).json({ message: 'Authentication required for user-specific filters' });
          }
          userId = req.user.id;
        } catch (authError) {
          return res.status(401).json({ message: 'Authentication required for user-specific filters' });
        }
      }
      
      // Calculate month boundaries
      const [year, monthNum] = month.split('-').map(Number);
      const startOfMonth = new Date(`${year}-${monthNum.toString().padStart(2, '0')}-01T00:00:00Z`);
      const endOfMonth = new Date(startOfMonth);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setMilliseconds(endOfMonth.getMilliseconds() - 1); // Last millisecond of month
      
      // Get all trips in the month
      const allTrips = await storage.getTripsInDateRange(startOfMonth, endOfMonth);
      
      
      // Apply base filters (region, tags)
      let filteredTrips = allTrips;
      
      if (region && region !== 'any') {
        filteredTrips = filteredTrips.filter(trip => trip.region === region);
      }
      
      if (tags) {
        const tagList = tags.split(',').map((t: string) => t.trim()).filter(Boolean);
        if (tagList.length > 0) {
          filteredTrips = filteredTrips.filter(trip => {
            const tripTags = trip.tags || [];
            return tagList.some(tag => 
              tripTags.some((tripTag: string) => 
                tripTag.toLowerCase().includes(tag.toLowerCase())
              )
            );
          });
        }
      }
      
      // Apply filters if requested (skip if "all" filter is active)
      if (requestedFilters.length > 0 && !requestedFilters.includes('all')) {
        const [pinnedTrips, interestedTrips] = await Promise.all([
          requestedFilters.includes('pinned') && userId ? storage.getUserPinnedTrips(userId) : Promise.resolve([]),
          requestedFilters.includes('interested') && userId ? storage.getUserInterestedTrips(userId) : Promise.resolve([])
        ]);
        
        const pinnedTripIds = new Set(pinnedTrips.map(trip => trip.id));
        const interestedTripIds = new Set(interestedTrips.map(trip => trip.id));
        
        filteredTrips = filteredTrips.filter(trip => {
          const filterResults = requestedFilters.map(filter => {
            switch (filter) {
              case 'pinned':
                return pinnedTripIds.has(trip.id);
              case 'interested':
                return interestedTripIds.has(trip.id);
              case 'my':
                return userId ? trip.organizerId === userId : false;
              case 'truly_free':
                const price = trip.price;
                const numPrice = price ? parseFloat(price) : 0;
                const isFree = !price || price === null || price === 'null' || price === 'NaN' || numPrice === 0 || isNaN(numPrice);
                return trip.status === 'active' && trip.seatsAvailable > 0 && isFree;
              default:
                return true;
            }
          });
          return filterResults.every(result => result);
        });
      }
      
      if (isSummary) {
        // Return daily counts for the month
        const dayCounts = new Map<string, number>();
        
        // Only count active trips to match day API behavior
        filteredTrips
          .filter(trip => trip.status === 'active')
          .forEach(trip => {
            const tripDate = new Date(trip.date);
            const dateKey = tripDate.toISOString().split('T')[0]; // YYYY-MM-DD
            dayCounts.set(dateKey, (dayCounts.get(dateKey) || 0) + 1);
          });
        
        const days = Array.from(dayCounts.entries()).map(([date, count]) => ({
          date,
          count
        }));
        
        res.json({ days });
      } else {
        // Return full trip data with pagination
        const { page = '1', limit = '50' } = req.query;
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.max(1, Math.min(50, parseInt(limit) || 50));
        const offset = (pageNum - 1) * limitNum;
        
        const total = filteredTrips.length;
        const paginatedTrips = filteredTrips.slice(offset, offset + limitNum);
        
        const items = paginatedTrips.map(trip => ({
          id: trip.id,
          title: trip.title,
          fromLocation: trip.fromLocation,
          toLocation: trip.toLocation,
          date: trip.date,
          time: trip.time,
          seatsAvailable: trip.seatsAvailable,
          price: trip.price,
          region: trip.region,
          tags: trip.tags,
          status: trip.status,
          organizer: {
            id: trip.organizerId,
            // No contact info for privacy
          }
        }));
        
        res.json({
          items,
          total,
          page: pageNum,
          limit: limitNum
        });
      }
      
    } catch (error) {
      console.error("Failed to get calendar month data:", error);
      res.status(500).json({ message: "Failed to get calendar month data" });
    }
  });

  app.get("/api/calendar/aggregate", unifiedAuthGuard, async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      const { startDate, endDate } = req.query;
      
      const start = startDate ? new Date(startDate as string) : new Date();
      const end = endDate ? new Date(endDate as string) : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
      
      // Get user's trips as calendar events with flag status
      const trips = await storage.getUserTrips(userId);
      const pinnedTripIds = new Set((await storage.getUserPinnedTrips(userId)).map(trip => trip.id));
      const interestedTripIds = new Set((await storage.getUserInterestedTrips(userId)).map(trip => trip.id));
      
      const tripEvents = trips.map(trip => {
        const isPinned = pinnedTripIds.has(trip.id);
        const isInterested = interestedTripIds.has(trip.id);
        
        // Determine title prefix based on flag status (interested takes precedence)
        let titlePrefix = '';
        if (isInterested) {
          titlePrefix = '⭐ ';
        } else if (isPinned) {
          titlePrefix = '📌 ';
        }
        
        return {
          id: `trip-${trip.id}`,
          title: titlePrefix + trip.title,
          description: `${trip.fromLocation} → ${trip.toLocation}`,
          eventDate: trip.date,
          eventType: 'trip' as const,
          entityId: trip.id,
          entityType: 'trip' as const,
          location: `${trip.fromLocation} - ${trip.toLocation}`,
          isAllDay: false,
          startTime: trip.time,
          metadata: {
            price: trip.price,
            seatsAvailable: trip.seatsAvailable,
            region: trip.region,
            isPinned: isPinned,
            isInterested: isInterested
          }
        };
      });
      
      // Get custom calendar events - disabled due to schema mismatch
      // const calendarEvents = await storage.getUserCalendarEvents(userId, start, end);
      const calendarEvents: any[] = [];
      
      // Combine all events, filter by date range, and sort
      const allEvents = [...tripEvents, ...calendarEvents]
        .filter(event => {
          const eventDate = new Date(event.eventDate);
          return eventDate >= start && eventDate <= end;
        })
        .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
      
      res.json(allEvents);
    } catch (error) {
      console.error("Failed to get aggregated calendar events:", error);
      res.status(500).json({ message: "Failed to get calendar events" });
    }
  });

  // Health endpoint for monitoring
  app.get('/api/health', async (req, res) => {
    try {
      // Test database connectivity
      const dbStart = Date.now();
      await storage.getUser('health-check-user-that-does-not-exist');
      const dbTime = Date.now() - dbStart;
      
      const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database: {
          status: dbTime < 1000 ? 'ok' : 'slow',
          responseTime: dbTime + 'ms'
        },
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime()
      };
      
      if (dbTime > 1000) {
        console.warn(`⚠️ Slow database response: ${dbTime}ms`);
      }
      
      res.json(health);
    } catch (error) {
      console.error('Health check failed:', error);
      res.status(503).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Database connectivity failed'
      });
    }
  });

  // Object Storage Routes for Profile Pictures
  try {
    const { ObjectStorageService } = await import('./objectStorage');
    const objectStorageService = new ObjectStorageService();

    // Get upload URL for profile picture
    app.post('/api/profile/upload-url', unifiedAuthGuard, async (req: any, res) => {
      try {
        const uploadURL = await objectStorageService.getObjectEntityUploadURL();
        res.json({ uploadURL });
      } catch (error) {
        console.error("Error getting upload URL:", error);
        res.status(500).json({ error: "Failed to get upload URL" });
      }
    });

    // Serve uploaded profile pictures
    app.get("/objects/:objectPath(*)", async (req, res) => {
      try {
        const objectFile = await objectStorageService.getObjectEntityFile(req.path);
        objectStorageService.downloadObject(objectFile, res);
      } catch (error) {
        console.error("Error serving object:", error);
        res.status(404).json({ error: "Object not found" });
      }
    });

    // Update profile picture after upload
    app.put('/api/profile/picture', unifiedAuthGuard, async (req: any, res) => {
      try {
        const userId = req.user.id;
        const { profileImageUrl } = req.body;

        if (!profileImageUrl) {
          return res.status(400).json({ error: "profileImageUrl is required" });
        }

        // Normalize the object path
        const normalizedPath = objectStorageService.normalizeObjectEntityPath(profileImageUrl);
        
        // Update user profile with new image URL
        const updatedProfile = await storage.updateUser(userId, {
          profileImageUrl: normalizedPath
        });

        res.json(updatedProfile);
      } catch (error) {
        console.error("Error updating profile picture:", error);
        res.status(500).json({ error: "Failed to update profile picture" });
      }
    });
  } catch (error) {
    console.warn('Object storage not available:', error);
  }

  // Notifications API endpoints
  app.get('/api/notifications', unifiedAuthGuard, async (req, res) => {
    try {
      const userId = req.user!.id;
      const page = Number(req.query.page) || 1;
      const limit = Math.min(Number(req.query.limit) || 20, 50);
      const unreadOnly = req.query.unread === 'true';
      
      const notifications = await storage.getUserNotifications(userId, limit * page);
      const filtered = unreadOnly ? notifications.filter(n => !n.isRead) : notifications;
      const paginated = filtered.slice((page - 1) * limit, page * limit);
      
      // Return direct array to match frontend expectations  
      console.log(`🔍 API returning ${paginated.length} notifications for user ${userId}`);
      res.json(paginated);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  });

  app.post('/api/notifications/mark-read', unifiedAuthGuard, async (req, res) => {
    try {
      const { ids } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'Invalid notification IDs' });
      }

      // Mark notifications as read
      for (const id of ids) {
        await storage.markNotificationAsRead(id);
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      res.status(500).json({ message: 'Failed to mark notifications as read' });
    }
  });

  // Admin endpoints for system monitoring (placeholder - would need proper admin auth)
  app.get('/api/admin/errors', unifiedAuthGuard, async (req, res) => {
    try {
      // For now, just return recent errors. In production, implement proper admin role check
      const errors = errorTracker.getRecentErrors(100);
      res.json({ errors });
    } catch (error) {
      console.error('Error fetching admin errors:', error);
      res.status(500).json({ message: 'Failed to fetch error logs' });
    }
  });

  // ===== ENHANCED CHAT SYSTEM API =====
  // Based on the comprehensive chat specification

  // Chat Threads Management
  app.post('/api/chat/threads/open', unifiedAuthGuard, async (req: any, res) => {
    try {
      const organizerId = req.user.id;
      const { tripId, userId } = req.body;

      if (!tripId || !userId) {
        return res.status(400).json({ message: 'Trip ID and User ID are required' });
      }

      // Verify the requester is the trip organizer
      const trip = await storage.getTrip(tripId);
      if (!trip || trip.organizerId !== organizerId) {
        return res.status(403).json({ message: 'Only trip organizers can open chat threads' });
      }

      // Check if there's already an existing thread
      const existingThread = await storage.getChatThreadByTripAndUsers(tripId, organizerId, userId);
      if (existingThread) {
        return res.json({ thread: existingThread, existed: true });
      }

      // Create new chat thread
      const thread = await storage.createChatThread({
        tripId,
        organizerId,
        userId,
        status: 'open'
      });

      // Create participant state for both users
      await storage.createChatParticipantState({
        threadId: thread.id,
        userId: organizerId,
        unreadCount: 0
      });

      await storage.createChatParticipantState({
        threadId: thread.id,
        userId: userId,
        unreadCount: 0
      });

      // Create notification for the interested user
      await storage.createNotification({
        userId: userId,
        type: 'chat_opened',
        category: 'social',
        priority: 'normal',
        title: 'Chat Opened',
        message: `Your chat for "${trip.title}" is now open`,
        threadId: thread.id,
        actionUrl: `/chat/${thread.id}`,
        isRead: false
      });

      res.json({ thread, existed: false });
    } catch (error) {
      console.error('Error opening chat thread:', error);
      res.status(500).json({ message: 'Failed to open chat thread' });
    }
  });

  app.get('/api/chat/threads', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get all threads for the user with basic info
      const threads = await storage.getChatThreadsForUser(userId);
      
      res.json({ threads });
    } catch (error) {
      console.error('Error fetching chat threads:', error);
      res.status(500).json({ message: 'Failed to fetch chat threads' });
    }
  });

  app.get('/api/chat/threads/:id', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const threadId = req.params.id;
      
      // 🔥 FORCE NO CACHING - Cache busting headers
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      // Get thread details
      const thread = await storage.getChatThread(threadId);
      if (!thread) {
        return res.status(404).json({ message: 'Chat thread not found' });
      }

      // Verify user is a participant
      if (thread.organizerId !== userId && thread.userId !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Get trip info for context (include userId for proper organizer data)
      const trip = await storage.getTrip(thread.tripId, userId);
      
      // Log chat API access for monitoring
      if (process.env.NODE_ENV === 'development') {
        console.log('Chat API accessed:', { threadId, userId, tripId: thread.tripId });
      }
      
      res.json({ 
        thread, 
        trip: trip ? {
          id: trip.id,
          title: trip.title,
          fromLocation: trip.fromLocation,
          toLocation: trip.toLocation,
          date: trip.date,
          status: trip.status,
          organizer: trip.organizer // Include full organizer data with contact info
        } : null,
        metadata: {
          hasContact: !!(trip?.organizer?.phone || trip?.organizer?.email)
        }
      });
    } catch (error) {
      console.error('Error fetching chat thread:', error);
      res.status(500).json({ message: 'Failed to fetch chat thread' });
    }
  });

  app.post('/api/chat/threads/:id/close', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const threadId = req.params.id;

      // Get thread and verify organizer permission
      const thread = await storage.getChatThread(threadId);
      if (!thread || thread.organizerId !== userId) {
        return res.status(403).json({ message: 'Only organizers can close chat threads' });
      }

      // Close thread and purge content
      await storage.closeChatThread(threadId);

      // Create notification for other participant
      const otherUserId = thread.userId;
      await storage.createNotification({
        userId: otherUserId,
        type: 'chat_closed',
        category: 'social',
        priority: 'normal',
        title: 'Chat Closed',
        message: 'A chat thread has been closed',
        isRead: false
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error closing chat thread:', error);
      res.status(500).json({ message: 'Failed to close chat thread' });
    }
  });

  // Image Upload URL Generation for Chat (MUST BE BEFORE /:userId route)
  app.post('/api/chat-images/upload-url', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Generate a unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const filename = `chat-image-${userId}-${timestamp}-${randomId}.jpg`;
      
      // For demo purposes, create a local storage URL that will work
      const uploadUrl = `${req.protocol}://${req.get('host')}/api/chat-images/${filename}?upload=true`;
      
      if (process.env.NODE_ENV === 'development') {
        console.log("Generated upload URL:", uploadUrl);
      }
      
      res.json({ uploadUrl });
    } catch (error) {
      console.error('Error generating upload URL:', error);
      res.status(500).json({ message: 'Failed to generate upload URL' });
    }
  });

  // Simple image storage endpoint for demo
  app.put('/api/chat-images/:filename', unifiedAuthGuard, async (req: any, res) => {
    try {
      const { filename } = req.params;
      if (process.env.NODE_ENV === 'development') {
        console.log("Image upload received for:", filename);
      }
      
      // For demo: just return success
      // In production, this would save to actual object storage
      res.status(200).json({ 
        success: true, 
        url: `${req.protocol}://${req.get('host')}/api/chat-images/${filename}`
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({ message: 'Failed to upload image' });
    }
  });

  // Serve uploaded images (demo endpoint)
  app.get('/api/chat-images/:filename', async (req, res) => {
    try {
      const { filename } = req.params;
      if (process.env.NODE_ENV === 'development') {
        console.log("Image request for:", filename);
      }
      
      // For demo: return a placeholder image URL
      // In production, this would fetch from object storage
      const placeholderUrl = 'https://via.placeholder.com/400x300/4f46e5/ffffff?text=Image+Uploaded';
      res.redirect(placeholderUrl);
    } catch (error) {
      console.error('Error serving image:', error);
      res.status(404).json({ message: 'Image not found' });
    }
  });

  // Chat Messages Management
  app.post('/api/chat/threads/:id/messages', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const threadId = req.params.id;
      const { text, attachmentId, ephemeral } = req.body;

      // Get thread and verify access
      const thread = await storage.getChatThread(threadId);
      if (!thread) {
        return res.status(404).json({ message: 'Chat thread not found' });
      }

      if (thread.organizerId !== userId && thread.userId !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      if (thread.status !== 'open') {
        return res.status(423).json({ message: 'Chat is locked or closed' });
      }

      if (!text && !attachmentId) {
        return res.status(400).json({ message: 'Message text or attachment is required' });
      }

      // 🔥 CEYLONX DEBUG: Log request data 🔥
      console.log("🔥 Message API Request:", { text, attachmentId, ephemeral, threadId, userId });

      // Create message
      const message = await storage.createChatMessage({
        threadId,
        senderId: userId,
        kind: attachmentId ? 'media' : 'text',
        text: text || null,
        meta: attachmentId ? { attachmentId, ephemeral } : null
      });

      // Update unread counts for other participant
      const otherUserId = thread.organizerId === userId ? thread.userId : thread.organizerId;
      await storage.incrementUnreadCount(threadId, otherUserId);

      res.json({ message });
    } catch (error) {
      console.error('Error creating chat message:', error);
      res.status(500).json({ message: 'Failed to send message' });
    }
  });

  app.get('/api/chat/threads/:id/messages', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const threadId = req.params.id;
      const { cursor, limit = 50 } = req.query;

      // Get thread and verify access
      const thread = await storage.getChatThread(threadId);
      if (!thread) {
        return res.status(404).json({ message: 'Chat thread not found' });
      }

      if (thread.organizerId !== userId && thread.userId !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      if (thread.status === 'closed') {
        return res.status(410).json({ message: 'Chat history has been purged' });
      }

      // Get messages
      const messages = await storage.getChatMessages(threadId, {
        cursor: cursor as string,
        limit: Number(limit)
      });

      // Mark messages as read
      await storage.markChatMessagesAsRead(threadId, userId);

      res.json({ messages });
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      res.status(500).json({ message: 'Failed to fetch messages' });
    }
  });

  // Contact Sharing (Organizer Only)
  app.post('/api/chat/threads/:id/share-contact', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const threadId = req.params.id;
      const { fields } = req.body; // Array of field names to share

      // Get thread and verify organizer permission
      const thread = await storage.getChatThread(threadId);
      if (!thread || thread.organizerId !== userId) {
        return res.status(403).json({ message: 'Only organizers can share contact details' });
      }

      // Get trip contact info
      const trip = await storage.getTrip(thread.tripId);
      if (!trip) {
        return res.status(404).json({ message: 'Trip not found' });
      }

      // Create contact share message
      const contactData = {};
      if (trip.organizerId) {
        const organizer = await storage.getUser(trip.organizerId);
        if (fields.includes('phone') && organizer?.phoneNumber) {
          contactData.phone = organizer.phoneNumber;
        }
        if (fields.includes('email') && organizer?.email) {
          contactData.email = organizer.email;
        }
      }

      const message = await storage.createChatMessage({
        threadId,
        senderId: userId,
        kind: 'contact_share',
        text: 'Shared contact details',
        meta: { contactData, fields }
      });

      // Update unread count
      await storage.incrementUnreadCount(threadId, thread.userId);

      res.json({ message });
    } catch (error) {
      console.error('Error sharing contact:', error);
      res.status(500).json({ message: 'Failed to share contact' });
    }
  });

  // Chat Message Reporting
  app.post('/api/chat/messages/:id/report', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const messageId = req.params.id;
      const { reason, notes } = req.body;

      if (!reason) {
        return res.status(400).json({ message: 'Report reason is required' });
      }

      // Get message and verify access
      const message = await storage.getChatMessage(messageId);
      if (!message) {
        return res.status(404).json({ message: 'Message not found' });
      }

      const thread = await storage.getChatThread(message.threadId);
      if (!thread || (thread.organizerId !== userId && thread.userId !== userId)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Create report
      const report = await storage.createReport({
        context: 'chat_message',
        threadId: message.threadId,
        messageId: messageId,
        reporterId: userId,
        reason,
        description: notes || null,
        status: 'open'
      });

      // Mute thread for reporter (optional)
      await storage.muteChatThread(message.threadId, userId);

      res.json({ report });
    } catch (error) {
      console.error('Error reporting chat message:', error);
      res.status(500).json({ message: 'Failed to report message' });
    }
  });

  // User profile viewing endpoints with privacy controls
  app.get('/api/users/:userId/profile', unifiedAuthGuard, async (req, res) => {
    try {
      const { userId } = req.params;
      const requesterId = req.user!.id;
      
      // Get user profile with privacy filtering
      const userProfile = await storage.getUserProfile(userId, requesterId);
      if (!userProfile) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if profile is accessible based on privacy settings
      if (userProfile.profileVisibility === 'private' && userId !== requesterId) {
        return res.status(403).json({ message: "Profile is private" });
      }
      
      // Filter profile data based on privacy settings
      const filteredProfile = {
        id: userProfile.id,
        displayName: userProfile.displayName || userProfile.username || 'Ceylon Traveler',
        firstName: userProfile.showRealName ? userProfile.firstName : undefined,
        lastName: userProfile.showRealName ? userProfile.lastName : undefined,
        username: userProfile.username,
        profileImageUrl: userProfile.profileImageUrl,
        bio: userProfile.showBio ? userProfile.bio : undefined,
        location: userProfile.showLocation ? userProfile.location : undefined,
        languages: userProfile.languages || [],
        emailVerified: userProfile.emailVerified,
        isVerifiedUser: userProfile.isVerifiedUser || false,
        verificationBadges: userProfile.verificationBadges || [],
        verificationLevel: userProfile.verificationLevel || 0,
        profileVisibility: userProfile.profileVisibility,
        showEmail: userProfile.showEmail,
        showPhone: userProfile.showPhone,
        showRealName: userProfile.showRealName,
        showBio: userProfile.showBio,
        showLocation: userProfile.showLocation,
        showInterests: userProfile.showInterests,
        showTravelHistory: userProfile.showTravelHistory,
        email: userProfile.showEmail ? userProfile.email : undefined,
        phoneNumber: userProfile.showPhone ? userProfile.phoneNumber : undefined,
        interests: userProfile.showInterests ? userProfile.interests : [],
        vibe: userProfile.showInterests ? userProfile.vibe : [],
        regions: userProfile.showInterests ? userProfile.regions : [],
        createdAt: userProfile.createdAt,
        // TODO: Add trip stats calculation
        tripsOrganized: 0,
        tripsJoined: 0,
        totalRating: 0,
        reviewCount: 0
      };
      
      res.json(filteredProfile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
