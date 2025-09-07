import type { Express } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { 
  // userPreferences, // Consolidated into users table 
  preferenceEvents,
  // type InsertUserPreferences, // Consolidated into users table
  type PreferenceEvent
} from "../../../shared/schema";

// Server-side type that includes version and updatedAt for upserts
type ServerUserPreferences = {
  userId?: string;
  vibe?: string[];
  companions?: string[];
  interests?: string[];
  months?: string[];
  regions?: string[];
  budgetMin?: number | null;
  budgetMax?: number | null;
  version?: number;
  updatedAt?: Date;
};
import { isAuthenticated } from "../../auth";
import { 
  validateUserPreferences, 
  type ValidationResult,
  DEFAULT_PREFERENCES 
} from "./schema";
import { mlRefreshService } from "./ml-refresh";

/**
 * Register preferences API routes
 * Handles CRUD operations with versioning, conflict resolution, and audit trail
 */
export function registerPreferencesRoutes(app: Express) {
  
  // GET /api/preferences - Get user preferences with fallback to defaults  
  app.get("/api/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Use storage method instead of direct DB access
      const storage = (await import("../../storage")).storage;
      const preferences = await storage.getUserPreferences(userId);
      
      if (!preferences || Object.keys(preferences).length === 0) {
        // Return default preferences if none exist
        res.json({
          ...DEFAULT_PREFERENCES,
          userId,
          version: 1,
          updatedAt: new Date().toISOString()
        });
        return;
      }
      
      res.json({
        ...preferences,
        userId,
        version: 1,
        updatedAt: new Date().toISOString()
      });
      
    } catch (error) {
      console.error("Error fetching preferences:", error);
      res.status(500).json({ 
        error: "Failed to fetch preferences",
        message: "An unexpected error occurred"
      });
    }
  });

  // PUT /api/preferences - Create or update preferences with conflict resolution
  app.put("/api/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const clientVersion = req.body.version;
      
      // Validate and canonicalize input
      const validation: ValidationResult = validateUserPreferences(req.body);
      
      if (!validation.isValid) {
        return res.status(400).json({
          error: "Invalid preferences data",
          details: validation.errors,
          rejectedValues: validation.rejectedValues
        });
      }
      
      const validatedData = validation.data!;
      
      // Use storage method to update preferences
      const storage = (await import("../../storage")).storage;
      const result = await storage.updateUserPreferences(userId, validatedData);
      
      // Create audit trail event
      await db.insert(preferenceEvents).values({
        userId,
        event: 'updated',
        diff: {
          old: null,
          new: validatedData
        }
      });
      
      // Trigger ML refresh asynchronously (don't block response)
      mlRefreshService.refreshUserMLFeatures(
        userId, 
        undefined, 
        result
      ).catch(error => {
        console.error("ML refresh failed but preferences saved:", error);
      });
      
      res.json({
        success: true,
        preferences: result,
        message: "Preferences updated"
      });
      
    } catch (error) {
      console.error("Error updating preferences:", error);
      
      // Handle unique constraint violations (race conditions)
      if (error instanceof Error && error.message.includes('version')) {
        return res.status(409).json({
          error: "Conflict detected",
          message: "Preferences were modified during update"
        });
      }
      
      res.status(500).json({ 
        error: "Failed to update preferences",
        message: "An unexpected error occurred"
      });
    }
  });

  // DELETE /api/preferences - Reset preferences to defaults
  app.delete("/api/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Use storage method to reset preferences
      const storage = (await import("../../storage")).storage;
      const current = await storage.getUserPreferences(userId);
      
      if (!current) {
        return res.status(404).json({
          error: "No preferences found", 
          message: "User has no preferences to delete"
        });
      }
      
      // Reset to defaults using storage method
      const result = await storage.updateUserPreferences(userId, DEFAULT_PREFERENCES);
      
      // Create audit trail event
      await db.insert(preferenceEvents).values({
        userId,
        event: 'reset',
        diff: {
          old: current,
          new: DEFAULT_PREFERENCES
        }
      });
      
      // Trigger ML refresh asynchronously for reset
      mlRefreshService.refreshUserMLFeatures(
        userId, 
        current, 
        result
      ).catch(error => {
        console.error("ML refresh failed but preferences reset:", error);
      });
      
      res.json({
        success: true,
        preferences: result,
        message: "Preferences reset to defaults"
      });
      
    } catch (error) {
      console.error("Error resetting preferences:", error);
      res.status(500).json({ 
        error: "Failed to reset preferences",
        message: "An unexpected error occurred"
      });
    }
  });

  // GET /api/preferences/taxonomy - Get available preference options
  app.get("/api/preferences/taxonomy", async (req, res) => {
    try {
      // Import the taxonomy dynamically to avoid circular imports
      const { PREFERENCES_TAXONOMY } = await import("../../config/preferences_taxonomy");
      
      res.json({
        vibe: PREFERENCES_TAXONOMY.vibe,
        companions: PREFERENCES_TAXONOMY.companions,
        interests: PREFERENCES_TAXONOMY.interests,
        months: PREFERENCES_TAXONOMY.months,
        regions: PREFERENCES_TAXONOMY.regions
      });
      
    } catch (error) {
      console.error("Error fetching taxonomy:", error);
      res.status(500).json({ 
        error: "Failed to fetch preference options",
        message: "An unexpected error occurred"
      });
    }
  });

  // GET /api/preferences/events - Get preference change history (admin/debug)
  app.get("/api/preferences/events", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      
      const events = await db
        .select()
        .from(preferenceEvents)
        .where(eq(preferenceEvents.userId, userId))
        .orderBy(preferenceEvents.createdAt)
        .limit(limit);
      
      res.json({
        events,
        count: events.length
      });
      
    } catch (error) {
      console.error("Error fetching preference events:", error);
      res.status(500).json({ 
        error: "Failed to fetch preference history",
        message: "An unexpected error occurred"
      });
    }
  });
}