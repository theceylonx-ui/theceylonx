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

declare module 'express' {
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
  insertMessageSchema
} from "@shared/schema";
import { enhancedRecommendationService } from "./ml/enhancedRecommendationService";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // CORS and cookie middleware
  app.use(cors({
    origin: process.env.APP_URL || 'http://localhost:5000',
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

  // Trip routes
  app.post('/api/trips', unifiedAuthGuard, async (req, res) => {
    try {
      const userId = req.user!.id;
      console.log("Creating trip with data:", { ...req.body, organizerId: userId });
      
      const tripData = insertTripSchema.parse({ ...req.body, organizerId: userId });
      console.log("Trip data validated successfully:", tripData);
      
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
      
      // For authenticated users, add pin status to each trip
      let tripsWithPinStatus = result.trips;
      if ((req as any).user?.id) {
        const userId = (req as any).user.id;
        tripsWithPinStatus = await Promise.all(
          result.trips.map(async (trip) => {
            const isPinned = await storage.getTripPinStatus(userId, trip.id);
            return { ...trip, isPinned };
          })
        );
      } else {
        // For non-authenticated users, set isPinned to false
        tripsWithPinStatus = result.trips.map(trip => ({ ...trip, isPinned: false }));
      }
      
      res.json({
        trips: tripsWithPinStatus,
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
      
      // Check if trip exists
      const trip = await storage.getTrip(tripId);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      // Check if already pinned
      const isAlreadyPinned = await storage.getTripPinStatus(userId, tripId);
      if (isAlreadyPinned) {
        return res.status(400).json({ message: "Trip is already pinned" });
      }
      
      const pinnedTrip = await storage.pinTrip(userId, tripId);
      res.status(201).json({ message: "Trip pinned successfully", pinnedTrip });
    } catch (error) {
      console.error("Error pinning trip:", error);
      res.status(500).json({ message: "Failed to pin trip" });
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
      
      // Check if actually pinned
      const isPinned = await storage.getTripPinStatus(userId, tripId);
      if (!isPinned) {
        return res.status(400).json({ message: "Trip is not pinned" });
      }
      
      await storage.unpinTrip(userId, tripId);
      res.json({ message: "Trip unpinned successfully" });
    } catch (error) {
      console.error("Error unpinning trip:", error);
      res.status(500).json({ message: "Failed to unpin trip" });
    }
  });

  app.get('/api/pinned-trips', unifiedAuthGuard, async (req, res) => {
    try {
      const userId = req.user!.id;
      const pinnedTrips = await storage.getUserPinnedTrips(userId);
      res.json(pinnedTrips);
    } catch (error) {
      console.error("Error fetching pinned trips:", error);
      res.status(500).json({ message: "Failed to fetch pinned trips" });
    }
  });

  // Interest request routes
  app.post('/api/trips/:id/interest', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const tripId = req.params.id;
      const { message } = req.body;

      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Check if trip exists
      const trip = await storage.getTrip(tripId);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      // Cannot send interest to own trip
      if (trip.organizerId === userId) {
        return res.status(400).json({ message: "Cannot send interest to your own trip" });
      }

      // Check if user already has a pending/accepted request
      const existingRequest = await storage.getTripInterestRequestByUserAndTrip(userId, tripId);
      if (existingRequest) {
        return res.status(400).json({ message: "You have already sent an interest request for this trip" });
      }

      // Create interest request
      const interestRequest = await storage.createTripInterestRequest({
        tripId,
        userId,
        message: message || "I'm interested in joining this trip!",
        status: 'pending'
      });

      // Create notification for trip organizer
      await storage.createNotification({
        userId: trip.organizerId,
        type: "interest_request",
        category: "trips",
        priority: "high",
        title: "New Interest Request",
        message: `Someone is interested in your trip "${trip.title}"`,
        relatedTripId: tripId,
        actionUrl: `/trips/${tripId}`,
        isRead: false,
      });

      res.status(201).json(interestRequest);
    } catch (error) {
      console.error("Error creating interest request:", error);
      res.status(500).json({ message: "Failed to send interest request" });
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
            await storage.deleteTrip(report.tripId);
            console.log(`Admin deleted trip ${report.tripId} due to report ${id}`);
            break;
          
          case 'suspend_user':
            // In a real app, you'd implement user suspension
            // For now, we'll just log it
            console.log(`Admin would suspend user ${report.tripOrganizerId} due to report ${id}`);
            // TODO: Implement user suspension logic
            break;
          
          case 'edit_trip':
            // This would redirect to trip edit interface
            console.log(`Admin initiated edit for trip ${report.tripId} due to report ${id}`);
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

  // Votes
  app.post('/api/vote', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const voteData = insertVoteSchema.parse({ ...req.body, userId });
      
      // Check if user already voted
      const existingVote = await storage.getUserVote(userId, voteData.questionId || undefined, voteData.answerId || undefined);
      
      if (existingVote) {
        if (existingVote.voteType === voteData.voteType) {
          // Same vote type - remove vote
          await storage.deleteVote(userId, voteData.questionId || undefined, voteData.answerId || undefined);
          res.json({ message: "Vote removed" });
        } else {
          // Different vote type - update vote
          const vote = await storage.updateVote(userId, voteData.questionId || undefined, voteData.answerId || undefined, voteData.voteType as 'up' | 'down');
          
          // Create notification for vote on question or answer (only for upvotes to reduce spam)
          if (voteData.voteType === 'up') {
            if (voteData.questionId) {
              const question = await storage.getQuestion(voteData.questionId);
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
            } else if (voteData.answerId) {
              const answer = await storage.getAnswer(voteData.answerId);
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
          }
          
          res.json(vote);
        }
      } else {
        // New vote
        const vote = await storage.createVote(voteData);
        
        // Create notification for new vote (only for upvotes to reduce spam)
        if (voteData.voteType === 'up') {
          if (voteData.questionId) {
            const question = await storage.getQuestion(voteData.questionId);
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
          } else if (voteData.answerId) {
            const answer = await storage.getAnswer(voteData.answerId);
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
        }
        
        res.json(vote);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid vote data", errors: error.errors });
      }
      console.error("Error processing vote:", error);
      res.status(500).json({ message: "Failed to process vote" });
    }
  });

  app.get('/api/vote/:type/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const { type, id } = req.params;
      
      const questionId = type === 'question' ? id : undefined;
      const answerId = type === 'answer' ? id : undefined;
      
      const vote = await storage.getUserVote(userId, questionId, answerId);
      res.json(vote);
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
      const preferencesData = insertUserPreferencesSchema.parse(req.body);
      
      const preferences = await storage.upsertUserPreferences(userId, preferencesData);
      res.json(preferences);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid preferences data", errors: error.errors });
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
      res.json({ ...thread, users: threadUsers });
    } catch (error) {
      console.error("Error fetching chat thread:", error);
      res.status(500).json({ message: "Failed to fetch chat thread" });
    }
  });

  // Calendar Events API
  app.get("/api/calendar/events", unifiedAuthGuard, async (req, res) => {
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
  
  app.post("/api/calendar/events", unifiedAuthGuard, async (req, res) => {
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

  app.get("/api/calendar/aggregate", unifiedAuthGuard, async (req, res) => {
    try {
      const userId = req.user.id;
      const { startDate, endDate } = req.query;
      
      const start = startDate ? new Date(startDate as string) : new Date();
      const end = endDate ? new Date(endDate as string) : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
      
      // Get user's trips as calendar events with pin status
      const trips = await storage.getUserTrips(userId);
      const pinnedTripIds = new Set((await storage.getUserPinnedTrips(userId)).map(trip => trip.id));
      
      const tripEvents = trips.map(trip => {
        const isPinned = pinnedTripIds.has(trip.id);
        return {
          id: `trip-${trip.id}`,
          title: isPinned ? `📌 ${trip.title}` : trip.title,
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
            isPinned: isPinned
          }
        };
      });
      
      // Get custom calendar events
      const calendarEvents = await storage.getUserCalendarEvents(userId, start, end);
      
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

  const httpServer = createServer(app);
  return httpServer;
}
