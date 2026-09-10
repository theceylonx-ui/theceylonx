import { db } from '../db';
import { trips, tripInterestRequests, notifications } from '@shared/schema';
import { eq, and, inArray } from 'drizzle-orm';
import type { WebSocketService } from './websocketService';

/**
 * Trip Completion Service
 * Handles trip completion workflow and notifications to interested users
 */

export class TripCompletionService {
  constructor(private wsService: WebSocketService) {}
  
  /**
   * Mark a trip as completed
   * Notifies all interested users that the trip is now occupied/filled
   */
  async completeTrip(tripId: string, organizerId: string): Promise<{ success: boolean; notifiedUsers: number }> {
    try {
      console.log(`🎯 Completing trip ${tripId} by organizer ${organizerId}`);
      
      // Update trip status to completed
      const updatedTrip = await db
        .update(trips)
        .set({
          status: 'completed',
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(trips.id, tripId),
            eq(trips.organizerId, organizerId) // Only organizer can complete
          )
        )
        .returning();
      
      if (updatedTrip.length === 0) {
        console.log('❌ Trip not found or unauthorized');
        return { success: false, notifiedUsers: 0 };
      }
      
      console.log('✅ Trip marked as completed');
      
      // Get all users who showed interest (pending or accepted status)
      const interestedUsers = await db
        .select()
        .from(tripInterestRequests)
        .where(
          and(
            eq(tripInterestRequests.tripId, tripId),
            inArray(tripInterestRequests.status, ['pending', 'accepted'])
          )
        );
      
      console.log(`📢 Notifying ${interestedUsers.length} interested user(s)`);
      
      // Send notifications to all interested users
      const notificationPromises = interestedUsers.map(async (interest) => {
        // Create notification in database
        const [notification] = await db
          .insert(notifications)
          .values({
            userId: interest.userId,
            type: 'trip_completed',
            title: 'Trip Now Occupied',
            message: `A trip you showed interest in has been marked as completed/occupied by the organizer.`,
            category: 'trip_updates',
            priority: 'normal',
            tripId,
            isRead: false,
          })
          .returning();
        
        // Send real-time WebSocket notification
        this.wsService.broadcastNotification({
          type: 'notification',
          data: {
            id: notification.id,
            userId: interest.userId,
            type: 'trip_completed',
            title: notification.title!,
            message: notification.message!,
            category: notification.category!,
            priority: notification.priority!,
            isRead: false,
            createdAt: notification.createdAt!.toISOString(),
          }
        });
        
        return notification;
      });
      
      await Promise.all(notificationPromises);
      
      console.log(`✅ Successfully notified ${interestedUsers.length} user(s)`);
      
      return {
        success: true,
        notifiedUsers: interestedUsers.length,
      };
    } catch (error) {
      console.error('❌ Error completing trip:', error);
      throw error;
    }
  }
  
  /**
   * Reopen a completed trip (mark as active again)
   */
  async reopenTrip(tripId: string, organizerId: string): Promise<boolean> {
    try {
      const result = await db
        .update(trips)
        .set({
          status: 'active',
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(trips.id, tripId),
            eq(trips.organizerId, organizerId),
            eq(trips.status, 'completed')
          )
        )
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error('❌ Error reopening trip:', error);
      throw error;
    }
  }
}
