import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authRouter, authGuard } from "./auth/routes";
import { JWTUser } from "./auth/jwt";

// Unified auth helper function
async function getAuthenticatedUser(req: any): Promise<UnifiedUser | null> {
  try {
    // First try JWT authentication (for Google/Facebook OAuth users)
    const { getCurrentUser } = await import('./auth/jwt');
    const jwtUser = await getCurrentUser(req);
    
    if (jwtUser) {
      return {
        id: jwtUser.id,
        email: jwtUser.email,
        phone: jwtUser.phone,
        name: jwtUser.name,
        provider: jwtUser.provider || 'jwt'
      };
    }
    
    // Fallback to Replit Auth
    if (req.isAuthenticated && req.isAuthenticated()) {
      const user = req.user as any;
      if ((user as any)?.claims?.sub) {
        return {
          id: user.claims.sub,
          email: user.claims.email,
          name: user.claims.first_name || user.claims.profile?.name,
          provider: 'replit',
          claims: user.claims
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error("Auth error:", error);
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
  insertVoteSchema,
  insertUserPreferencesSchema,
  insertUserInteractionSchema,
  insertMessageSchema,
  travelStyleSettingsSchema,
  type TravelStyleSettings
} from "@shared/schema";
import { enhancedRecommendationService } from "./ml/enhancedRecommendationService";
import { z } from "zod";
import { errorTracker } from "./utils/errorTracking";

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
      
      res.json(userData);
    } catch (error) {
      console.error("❌ Error in /api/user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch('/api/user', unifiedAuthGuard, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { username, phoneNumber, bio, profileImageUrl } = req.body;
      
      console.log("Profile update request:", { userId, username, phoneNumber: phoneNumber ? "***" : null, bio: bio ? bio.substring(0, 50) : null });
      
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
      
      console.log("Updating user with data:", { ...updateData, phoneNumber: updateData.phoneNumber ? "***" : null });
      
      const updatedUser = await storage.updateUser(userId, updateData);
      
      console.log("Profile update successful for user:", userId);
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
      console.log("User deletion request for user:", userId);
      
      // Perform comprehensive user data deletion
      await storage.deleteUser(userId);
      
      console.log("User deletion completed for user:", userId);
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

  // Backfill images for existing trips
  app.post('/api/trips/backfill-images', unifiedAuthGuard, async (req, res) => {
    try {
      const { getSriLankanTripImage } = await import('@shared/sriLankaImages');
      
      // Get all trips without images
      const tripsWithoutImages = await storage.getTripsWithoutImages();
      let updateCount = 0;
      
      for (const trip of tripsWithoutImages) {
        const imageUrl = getSriLankanTripImage(trip.region, trip.fromLocation, trip.toLocation);
        await storage.updateTripImage(trip.id, imageUrl);
        updateCount++;
      }
      
      console.log(`Backfilled images for ${updateCount} trips`);
      res.json({ message: `Successfully assigned images to ${updateCount} trips` });
    } catch (error) {
      console.error("Error during image backfill:", error);
      res.status(500).json({ message: "Failed to backfill images" });
    }
  });

  // Trip routes
  app.post('/api/trips', unifiedAuthGuard, async (req, res) => {
    try {
      const userId = req.user!.id;
      console.log("Creating trip with data:", { ...req.body, organizerId: userId });
      
      const tripData = insertTripSchema.parse({ ...req.body, organizerId: userId });
      console.log("Trip data validated successfully:", tripData);
      
      // Auto-assign image if none provided
      if (!tripData.imageUrl) {
        const { getSriLankanTripImage } = await import('@shared/sriLankaImages');
        tripData.imageUrl = getSriLankanTripImage(tripData.region, tripData.fromLocation, tripData.toLocation);
        console.log("Auto-assigned image for trip:", tripData.imageUrl);
      }
      
      const trip = await storage.createTrip(tripData);
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
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 8;
      const offset = (page - 1) * limit;
      
      const filters = {
        from: req.query.from as string,
        to: req.query.to as string,
        date: req.query.date as string,
        region: req.query.region as string,
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
            const flags = await storage.getUserTripFlags(userId, trip.id);
            return { 
              ...trip, 
              isPinned: flags?.pinned ?? false,
              isInterested: flags?.interested ?? false
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
      
      res.json({
        trips: tripsWithFlags,
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
      const trip = await storage.getTrip(req.params.id);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      // Track trip view (for authenticated users and anonymous users)
      const userId = (req as any).user?.id; // Get user if authenticated
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
      
      res.json(trip);
    } catch (error) {
      console.error("Error fetching trip:", error);
      res.status(500).json({ message: "Failed to fetch trip" });
    }
  });

  app.patch('/api/trips/:id', unifiedAuthGuard, async (req, res) => {
    try {
      const userId = req.user!.id;
      const tripId = req.params.id;
      
      // Check if user is the organizer
      const trip = await storage.getTrip(tripId);
      if (!trip || trip.organizerId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this trip" });
      }
      
      const updatedTrip = await storage.updateTrip(tripId, req.body);
      res.json(updatedTrip);
    } catch (error) {
      console.error("Error updating trip:", error);
      res.status(500).json({ message: "Failed to update trip" });
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

  // Pinned trips endpoints
  app.post('/api/trips/:id/pin', unifiedAuthGuard, async (req, res) => {
    try {
      const userId = req.user!.id;
      const tripId = req.params.id;
      const { pinned } = req.body;
      
      // Check if trip exists
      const trip = await storage.getTrip(tripId);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      // Check current flags
      const currentFlags = await storage.getUserTripFlags(userId, tripId);
      
      // Option A: Prevent pinning if already interested
      if (pinned && currentFlags?.interested) {
        return res.status(409).json({ 
          error: "INTERESTED_ACTIVE", 
          message: "This trip is marked as interested. Unmark to pin." 
        });
      }
      
      // Update or create the user trip flags
      const tripFlags = await storage.upsertUserTripFlags(userId, tripId, { pinned });
      
      res.json({
        trip_id: tripId,
        user_id: userId,
        pinned: tripFlags.pinned,
        interested: tripFlags.interested
      });
    } catch (error) {
      console.error("Error updating pin status:", error);
      res.status(500).json({ message: "Failed to update pin status" });
    }
  });

  app.delete('/api/trips/:id/pin', unifiedAuthGuard, async (req, res) => {
    try {
      const userId = req.user!.id;
      const tripId = req.params.id;
      
      // Check if trip exists
      const trip = await storage.getTrip(tripId);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      // Update flags to unpin
      const tripFlags = await storage.upsertUserTripFlags(userId, tripId, { pinned: false });
      
      res.json({
        trip_id: tripId,
        user_id: userId,
        pinned: tripFlags.pinned,
        interested: tripFlags.interested
      });
    } catch (error) {
      console.error("Error unpinning trip:", error);
      res.status(500).json({ message: "Failed to unpin trip" });
    }
  });

  app.get('/api/pinned-trips', unifiedAuthGuard, async (req, res) => {
    try {
      const userId = req.user!.id;
      // Get only trips that are pinned but NOT interested (following precedence rules)
      const pinnedTrips = await storage.getUserPinnedTripsOnly(userId);
      res.json(pinnedTrips);
    } catch (error) {
      console.error("Error fetching pinned trips:", error);
      res.status(500).json({ message: "Failed to fetch pinned trips" });
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

  // New unified flag-based interest system
  app.post('/api/trips/:id/interest', unifiedAuthGuard, async (req, res) => {
    try {
      const userId = req.user!.id;
      const tripId = req.params.id;
      const { interested } = req.body;

      // Check if trip exists
      const trip = await storage.getTrip(tripId);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      // Cannot mark interest on own trip
      if (trip.organizerId === userId) {
        return res.status(400).json({ message: "Cannot mark interest on your own trip" });
      }

      // Update or create the user trip flags with precedence rule: interested=true forces pinned=false
      const tripFlags = await storage.upsertUserTripFlags(userId, tripId, { interested });
      
      // Create notification for trip organizer if marking as interested
      if (interested) {
        await storage.createNotification({
          userId: trip.organizerId,
          type: "interest_request",
          category: "trips",
          priority: "high",
          title: "Trip Marked as Interested",
          message: `Someone is interested in your trip "${trip.title}"`,
          relatedTripId: tripId,
          actionUrl: `/trips/${tripId}`,
          isRead: false,
        });
      }

      res.json({
        trip_id: tripId,
        user_id: userId,
        pinned: tripFlags.pinned,
        interested: tripFlags.interested
      });
    } catch (error) {
      console.error("Error updating interest flag:", error);
      res.status(500).json({ message: "Failed to update interest" });
    }
  });

  // Get current user's flags for a specific trip
  app.get('/api/trips/:id/flags', unifiedAuthGuard, async (req, res) => {
    try {
      const userId = req.user!.id;
      const tripId = req.params.id;
      
      const flags = await storage.getUserTripFlags(userId, tripId);
      
      res.json({
        trip_id: tripId,
        user_id: userId,
        pinned: flags?.pinned ?? false,
        interested: flags?.interested ?? false
      });
    } catch (error) {
      console.error("Error fetching trip flags:", error);
      res.status(500).json({ message: "Failed to fetch trip flags" });
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
      if (!["active", "completed", "cancelled"].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be active, completed, or cancelled" });
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
      
      // Trigger notification for trip organizer if commenter is not the organizer
      const trip = await storage.getTrip(tripId);
      if (trip && trip.organizerId !== userId) {
        const commenter = await storage.getUser(userId);
        await storage.createNotification({
          userId: trip.organizerId,
          type: "trip_commented",
          category: "social",
          priority: "normal",
          title: "New Comment on Your Trip",
          message: `${commenter?.firstName || 'Someone'} commented on your trip "${trip.title}".`,
          relatedTripId: tripId,
          relatedUserId: userId,
          actionUrl: `/trips/${tripId}`,
          isRead: false,
        });
      }
      
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
  app.patch('/api/comments/:id', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const commentId = req.params.id;
      const { content } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({ message: "Content is required" });
      }

      // Check ownership - need to get comment first
      const allComments = await storage.getTripComments(""); // TODO: Implement getComment method
      const comment = allComments.find(c => c.id === commentId);
      
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
      const comments = await storage.getTripComments(""); // We need a better way to get a single comment
      const comment = comments.find(c => c.id === commentId);
      
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
      
      // If this is a trip report, notify the trip organizer
      if (report.tripId) {
        const trip = await storage.getTrip(report.tripId);
        if (trip && trip.organizerId !== reporterId) {
          await storage.createNotification({
            userId: trip.organizerId,
            type: "trip_reported",
            category: "safety",
            priority: "critical",
            title: "Trip Report Submitted",
            message: `Your trip "${trip.title}" has been reported and is under review.`,
            relatedTripId: report.tripId,
            relatedUserId: reporterId,
            actionUrl: `/trips/${report.tripId}`,
            isRead: false,
          });
        }
      }
      
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

  // Admin route to delete trip
  app.delete('/api/admin/trips/:id', unifiedAuthGuard, async (req: any, res) => {
    try {
      // Check if user is admin
      const adminUserIds = [
        "bcc1d79a-d83a-4a99-8556-e1d367140e88", // PraDas S Agnya
        "313a0e58-6745-4db7-91bd-31e69c7496ab", // Add more admin IDs as needed
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

  // Admin route to edit trip
  app.patch('/api/admin/trips/:id', unifiedAuthGuard, async (req: any, res) => {
    try {
      // Check if user is admin
      const adminUserIds = [
        "bcc1d79a-d83a-4a99-8556-e1d367140e88", // PraDas S Agnya
        "313a0e58-6745-4db7-91bd-31e69c7496ab", // Add more admin IDs as needed
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

  app.patch('/api/questions/:id', async (req: any, res) => {
    try {
      console.log("📝 PATCH /api/questions/:id - attempting to update question");
      
      // Use the same authentication logic as /api/questions POST
      let userId = null;
      
      // First try JWT authentication (for Google/Facebook OAuth users)
      const { getCurrentUser } = await import('./auth/jwt');
      const jwtUser = await getCurrentUser(req);
      
      if (jwtUser) {
        userId = jwtUser.id;
        console.log("✅ Question update - JWT auth successful:", jwtUser.email);
      } else {
        // Fallback to Replit Auth
        if (req.isAuthenticated && req.isAuthenticated()) {
          const user = req.user as any;
          if ((user as any)?.claims?.sub) {
            userId = (user as any).claims.sub;
            console.log("✅ Question update - Replit Auth successful:", userId);
          }
        }
      }
      
      if (!userId) {
        console.log("❌ Question update - No authentication found");
        return res.status(401).json({ message: "Authentication required" });
      }
      
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

  app.delete('/api/questions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      
      // First check if the question exists and belongs to the user
      const existingQuestion = await storage.getQuestion(req.params.id);
      if (!existingQuestion) {
        return res.status(404).json({ message: "Question not found" });
      }
      if (existingQuestion.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this question" });
      }
      
      await storage.deleteQuestion(req.params.id);
      res.json({ message: "Question deleted successfully" });
    } catch (error) {
      console.error("Error deleting question:", error);
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

  // Enhanced Voting System
  app.post('/api/votes', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { votableType, votableId, value } = req.body;
      
      // Validate input
      if (!['question', 'answer'].includes(votableType)) {
        return res.status(400).json({ message: "Invalid votable type" });
      }
      if (!votableId) {
        return res.status(400).json({ message: "Votable ID is required" });
      }
      if (![1, -1, 0].includes(value)) {
        return res.status(400).json({ message: "Vote value must be 1 (upvote), -1 (downvote), or 0 (clear)" });
      }
      
      const result = await storage.upsertVote(userId, votableType, votableId, value);
      
      // Create notification for upvotes only (to reduce spam)
      if (value === 1) {
        try {
          if (votableType === 'question') {
            const question = await storage.getQuestion(votableId);
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
          } else if (votableType === 'answer') {
            const answer = await storage.getAnswer(votableId);
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
        vote: result.vote,
        score: result.score,
        message: value === 0 ? "Vote cleared" : value === 1 ? "Upvoted" : "Downvoted"
      });
    } catch (error) {
      console.error("Error processing vote:", error);
      res.status(500).json({ message: "Failed to process vote" });
    }
  });

  // Get current user's vote for an item
  app.get('/api/votes/:type/:id', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { type, id } = req.params;
      
      if (!['question', 'answer'].includes(type)) {
        return res.status(400).json({ message: "Invalid type" });
      }
      
      const vote = await storage.getUserVote(userId, type as 'question' | 'answer', id);
      res.json({ vote });
    } catch (error) {
      console.error("Error fetching user vote:", error);
      res.status(500).json({ message: "Failed to fetch vote" });
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

  app.put('/api/user/preferences', unifiedAuthGuard, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Validate using the new Travel Style Settings schema
      const validatedData = travelStyleSettingsSchema.parse(req.body);
      
      // Update preferences using the new format
      const preferences = await storage.updateTravelStyleSettings(userId, validatedData);
      
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

  // Notification routes
  app.get('/api/notifications', unifiedAuthGuard, async (req, res) => {
    try {
      const userId = req.user!.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const notifications = await storage.getUserNotifications(userId, limit);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

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
      res.json(messages);
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
        authorId: userId,
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

      res.json({ ...thread, users: threadUsers, trip });
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
      res.json(acceptedUsers);
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
      res.json({ thread: chatThread, messages });
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
        authorId: currentUserId,
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
        const isFree = !trip.price || trip.price === 0;
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

  // Day-specific calendar endpoint with view filtering  
  app.get('/api/calendar/day', unifiedAuthGuard, async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      const { date, view = 'all', tz = 'Asia/Colombo' } = req.query;
      
      if (!date || typeof date !== 'string') {
        return res.status(400).json({ message: 'Date parameter is required (YYYY-MM-DD format)' });
      }
      
      // Parse the date and create day boundaries in user timezone
      const targetDate = new Date(date + 'T00:00:00');
      if (isNaN(targetDate.getTime())) {
        return res.status(400).json({ message: 'Invalid date format' });
      }
      
      // Create start and end of day boundaries
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      let events: any[] = [];
      
      // Helper function to format trip events with proper flags
      const formatTripEventForDay = (trip: any, flags: { pinned: boolean; interested: boolean; mine: boolean; free: boolean }) => ({
        id: `trip_${trip.id}`,
        title: trip.title,
        start: trip.startAt || trip.start_at,
        end: trip.endAt || trip.end_at,
        location: `${trip.fromLocation} → ${trip.toLocation}`,
        flags
      });
      
      // Filter trips that overlap with the selected date
      const filterByDate = (trips: any[]) => {
        return trips.filter(trip => {
          const tripStart = new Date(trip.startAt || trip.start_at);
          const tripEnd = new Date(trip.endAt || trip.end_at);
          
          // Include if trip overlaps with the selected day
          return tripStart <= endOfDay && tripEnd >= startOfDay;
        });
      };
      
      switch (view) {
        case 'all': {
          const trips = await storage.getUserTrips(userId);
          const pinnedTripIds = new Set((await storage.getUserPinnedTrips(userId)).map(trip => trip.id));
          const interestedTripIds = new Set((await storage.getUserInterestedTrips(userId)).map(trip => trip.id));
          
          const filteredTrips = filterByDate(trips);
          events = filteredTrips.map(trip => formatTripEventForDay(trip, {
            pinned: pinnedTripIds.has(trip.id),
            interested: interestedTripIds.has(trip.id),
            mine: trip.organizerId === userId,
            free: !trip.price || Number(trip.price) === 0
          }));
          break;
        }

        case 'pinned': {
          const pinnedTrips = await storage.getUserPinnedTrips(userId);
          const interestedTripIds = new Set((await storage.getUserInterestedTrips(userId)).map(trip => trip.id));
          
          const filteredTrips = filterByDate(pinnedTrips);
          events = filteredTrips.map(trip => formatTripEventForDay(trip, {
            pinned: true,
            interested: interestedTripIds.has(trip.id),
            mine: trip.organizerId === userId,
            free: !trip.price || Number(trip.price) === 0
          }));
          break;
        }

        case 'interested': {
          const interestedTrips = await storage.getUserInterestedTrips(userId);
          const pinnedTripIds = new Set((await storage.getUserPinnedTrips(userId)).map(trip => trip.id));
          
          const filteredTrips = filterByDate(interestedTrips);
          events = filteredTrips.map(trip => formatTripEventForDay(trip, {
            pinned: pinnedTripIds.has(trip.id),
            interested: true,
            mine: trip.organizerId === userId,
            free: !trip.price || Number(trip.price) === 0
          }));
          break;
        }

        case 'mine': {
          const myTrips = await storage.getUserTrips(userId);
          const pinnedTripIds = new Set((await storage.getUserPinnedTrips(userId)).map(trip => trip.id));
          const interestedTripIds = new Set((await storage.getUserInterestedTrips(userId)).map(trip => trip.id));
          
          const filteredTrips = filterByDate(myTrips.filter(trip => trip.organizerId === userId));
          events = filteredTrips.map(trip => formatTripEventForDay(trip, {
            pinned: pinnedTripIds.has(trip.id),
            interested: interestedTripIds.has(trip.id),
            mine: true,
            free: !trip.price || Number(trip.price) === 0
          }));
          break;
        }

        case 'free': {
          const trips = await storage.getUserTrips(userId);
          const pinnedTripIds = new Set((await storage.getUserPinnedTrips(userId)).map(trip => trip.id));
          const interestedTripIds = new Set((await storage.getUserInterestedTrips(userId)).map(trip => trip.id));
          
          const freeTrips = trips.filter(trip => !trip.price || Number(trip.price) === 0);
          const filteredTrips = filterByDate(freeTrips);
          events = filteredTrips.map(trip => formatTripEventForDay(trip, {
            pinned: pinnedTripIds.has(trip.id),
            interested: interestedTripIds.has(trip.id),
            mine: trip.organizerId === userId,
            free: true
          }));
          break;
        }

        default:
          return res.status(400).json({ message: "Invalid view parameter" });
      }
      
      // Sort events by start time
      events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
      
      res.json(events);
    } catch (error) {
      console.error("Failed to get calendar day events:", error);
      res.status(500).json({ message: "Failed to get calendar day events" });
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
      
      res.json({
        notifications: paginated,
        pagination: {
          page,
          limit,
          total: filtered.length,
          hasMore: filtered.length > page * limit
        }
      });
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

  const httpServer = createServer(app);
  return httpServer;
}
