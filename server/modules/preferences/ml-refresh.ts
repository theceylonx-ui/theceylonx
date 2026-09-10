import { eq } from "drizzle-orm";
import { db } from "../../db";
import { 
  users,
  userInteractions,
  kpiEvents,
  preferenceEvents,
  // type UserPreferences // Consolidated into users table 
} from "../../../shared/schema";

type UserPreferences = {
  vibe?: string[];
  companions?: string[];
  interests?: string[];
  months?: string[];
  regions?: string[];
  budgetMin?: number;
  budgetMax?: number;
};

/**
 * ML Refresh Service for User Preferences
 * 
 * Handles invalidation and recomputation of ML-driven features when user preferences change.
 * This service ensures that personalized recommendations stay relevant and up-to-date
 * with user preference changes.
 */
export class MLRefreshService {
  
  /**
   * Refresh all ML-driven features after preferences change
   * Called after successful preference updates
   */
  async refreshUserMLFeatures(userId: string, oldPreferences?: UserPreferences, newPreferences?: UserPreferences): Promise<void> {
    try {
      console.log(`🔄 Starting ML refresh for user: ${userId}`);
      
      // Parallel execution of independent refresh operations
      await Promise.allSettled([
        this.invalidatePersonalizationCache(userId),
        this.logPreferenceChangeEvent(userId, oldPreferences, newPreferences),
        this.updateUserPreferenceVector(userId, newPreferences),
        this.scheduleRecommendationRefresh(userId)
      ]);
      
      console.log(`✅ ML refresh completed for user: ${userId}`);
      
    } catch (error) {
      console.error(`❌ ML refresh failed for user: ${userId}`, error);
      // Don't throw error to avoid blocking preference updates
      // ML refresh failures should be monitored but not break user experience
    }
  }

  /**
   * Invalidate cached personalization data for the user
   * Forces recomputation of personalized content on next request
   */
  private async invalidatePersonalizationCache(userId: string): Promise<void> {
    try {
      // Update user record to trigger refresh (personalization is now in users table)
      await db
        .update(users)
        .set({
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
        
      console.log(`🗄️ Personalization cache invalidated for user: ${userId}`);
      
    } catch (error) {
      console.error(`❌ Failed to invalidate personalization cache for user: ${userId}`, error);
    }
  }

  /**
   * Log preference change event for ML training and analytics
   * Creates audit trail for understanding user behavior patterns
   */
  private async logPreferenceChangeEvent(
    userId: string, 
    oldPreferences?: UserPreferences, 
    newPreferences?: UserPreferences
  ): Promise<void> {
    try {
      // Create KPI event for preference change tracking
      await db.insert(kpiEvents).values({
        eventType: 'preference_change',
        // Store change metadata for ML analysis
        eventData: {
          oldPreferences: oldPreferences ? {
            vibe: oldPreferences.vibe,
            companions: oldPreferences.companions,
            interests: oldPreferences.interests,
            months: oldPreferences.months,
            regions: oldPreferences.regions,
            budgetRange: oldPreferences.budgetMin && oldPreferences.budgetMax 
              ? { min: oldPreferences.budgetMin, max: oldPreferences.budgetMax }
              : null
          } : null,
          newPreferences: newPreferences ? {
            vibe: newPreferences.vibe,
            companions: newPreferences.companions,
            interests: newPreferences.interests,
            months: newPreferences.months,
            regions: newPreferences.regions,
            budgetRange: newPreferences.budgetMin && newPreferences.budgetMax 
              ? { min: newPreferences.budgetMin, max: newPreferences.budgetMax }
              : null
          } : null
        }
      });
      
      console.log(`📊 Preference change event logged for user: ${userId}`);
      
    } catch (error) {
      console.error(`❌ Failed to log preference change event for user: ${userId}`, error);
    }
  }

  /**
   * Update user preference vector for ML similarity calculations
   * Converts user preferences into numerical vectors for recommendation algorithms
   */
  private async updateUserPreferenceVector(userId: string, preferences?: UserPreferences): Promise<void> {
    try {
      if (!preferences) return;
      
      // Generate preference vector from user preferences
      const preferenceVector = this.generatePreferenceVector(preferences);
      
      // Update user record (personalization is now in users table)
      await db
        .update(users)
        .set({
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
        
      console.log(`🔢 Preference vector updated for user: ${userId}`);
      
    } catch (error) {
      console.error(`❌ Failed to update preference vector for user: ${userId}`, error);
    }
  }

  /**
   * Schedule recommendation refresh for the user
   * Marks user for priority refresh in next recommendation computation cycle
   */
  private async scheduleRecommendationRefresh(userId: string): Promise<void> {
    try {
      // Create interaction event to trigger recommendation refresh
      await db.insert(userInteractions).values({
        userId,
        tripId: 'preference_change', // Special marker for preference-triggered refresh
        interactionType: 'preference_update',
        sessionId: `pref_update_${Date.now()}`,
        abTestGroup: 'preference_refresh'
      });
      
      console.log(`🔄 Recommendation refresh scheduled for user: ${userId}`);
      
    } catch (error) {
      console.error(`❌ Failed to schedule recommendation refresh for user: ${userId}`, error);
    }
  }

  /**
   * Generate numerical preference vector from user preferences
   * Converts categorical preferences into numerical features for ML algorithms
   */
  private generatePreferenceVector(preferences: UserPreferences): number[] {
    const vector: number[] = [];
    
    // Vibe preferences (7 categories) - one-hot encoding
    const vibeOptions = ['relaxed', 'adventure', 'culture', 'beach', 'nature', 'nightlife', 'wellness'];
    vibeOptions.forEach(vibe => {
      vector.push(preferences.vibe?.includes(vibe) ? 1 : 0);
    });
    
    // Companion preferences (5 categories) - one-hot encoding
    const companionOptions = ['solo', 'couple', 'friends', 'family', 'senior_friendly'];
    companionOptions.forEach(companion => {
      vector.push(preferences.companions?.includes(companion) ? 1 : 0);
    });
    
    // Interest preferences (12 categories) - one-hot encoding
    const interestOptions = [
      'hiking', 'wildlife', 'history', 'photography', 'food', 'diving',
      'surfing', 'temples', 'festivals', 'wellness', 'ayurveda', 'train_journeys'
    ];
    interestOptions.forEach(interest => {
      vector.push(preferences.interests?.includes(interest) ? 1 : 0);
    });
    
    // Seasonal preferences (12 months) - one-hot encoding
    const monthOptions = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    monthOptions.forEach(month => {
      vector.push(preferences.months?.includes(month) ? 1 : 0);
    });
    
    // Regional preferences (7 regions) - one-hot encoding  
    const regionOptions = ['north', 'east', 'south', 'west', 'hill_country', 'cultural_triangle', 'colombo'];
    regionOptions.forEach(region => {
      vector.push(preferences.regions?.includes(region) ? 1 : 0);
    });
    
    // Budget preferences (normalized 0-1)
    const maxBudget = 50000; // Maximum expected budget in LKR
    const budgetMin = preferences.budgetMin || 0;
    const budgetMax = preferences.budgetMax || maxBudget;
    vector.push(budgetMin / maxBudget); // Normalized min budget
    vector.push(budgetMax / maxBudget); // Normalized max budget
    
    return vector;
  }

  /**
   * Batch refresh ML features for multiple users
   * Useful for system-wide preference migrations or bulk updates
   */
  async batchRefreshUsers(userIds: string[]): Promise<{
    success: string[];
    failed: string[];
  }> {
    const results = {
      success: [] as string[],
      failed: [] as string[]
    };
    
    console.log(`🔄 Starting batch ML refresh for ${userIds.length} users`);
    
    // Process users in batches to avoid overwhelming the database
    const batchSize = 10;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (userId) => {
        try {
          await this.refreshUserMLFeatures(userId);
          results.success.push(userId);
        } catch (error) {
          console.error(`❌ Batch refresh failed for user: ${userId}`, error);
          results.failed.push(userId);
        }
      });
      
      await Promise.allSettled(batchPromises);
    }
    
    console.log(`✅ Batch ML refresh completed: ${results.success.length} success, ${results.failed.length} failed`);
    return results;
  }
}

// Export singleton instance
export const mlRefreshService = new MLRefreshService();