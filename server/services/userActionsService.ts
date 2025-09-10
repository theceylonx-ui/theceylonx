import { db } from '../db';
import { pinnedTrips, userHistory, tripInterestRequests, trips, users } from '../../shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import type { InsertUserHistoryEntry, InsertTripInterestRequest } from '../../shared/schema';
import { storage } from '../storage';

export type UserActionType = 'PIN' | 'UNPIN' | 'INTEREST' | 'WITHDRAW' | 'INTEREST_ACCEPTED' | 'INTEREST_DECLINED';

export class UserActionsService {
  
  /**
   * Log user action to history table
   */
  private async logAction(
    userId: string, 
    action: UserActionType, 
    tripId: string, 
    meta?: Record<string, any>
  ): Promise<void> {
    const historyEntry: InsertUserHistoryEntry = {
      userId,
      action,
      tripId,
      meta: meta || { source: 'ui' }
    };
    
    await db.insert(userHistory).values(historyEntry);
  }

  /**
   * Pin a trip for a user (idempotent)
   */
  async pinTrip(userId: string, tripId: string): Promise<void> {
    // Check if trip exists
    const [trip] = await db.select().from(trips).where(eq(trips.id, tripId));
    if (!trip) {
      throw new Error('Trip not found');
    }

    // Check if already pinned
    const [existingPin] = await db
      .select()
      .from(pinnedTrips)
      .where(and(eq(pinnedTrips.userId, userId), eq(pinnedTrips.tripId, tripId)));

    // If not already pinned, create pin
    if (!existingPin) {
      await db.insert(pinnedTrips).values({
        userId,
        tripId
      });

      // Log the action
      await this.logAction(userId, 'PIN', tripId);
    }
  }

  /**
   * Unpin a trip for a user (idempotent)
   */
  async unpinTrip(userId: string, tripId: string): Promise<void> {
    const result = await db
      .delete(pinnedTrips)
      .where(and(eq(pinnedTrips.userId, userId), eq(pinnedTrips.tripId, tripId)));

    // Log action only if something was actually deleted
    if (result.rowCount && result.rowCount > 0) {
      await this.logAction(userId, 'UNPIN', tripId);
    }
  }

  /**
   * Create or get existing interest request (idempotent with status handling)
   */
  async createOrGetInterest(
    userId: string, 
    tripId: string, 
    message?: string
  ): Promise<{ requestId: string; status: string; isNew: boolean }> {
    // Check if trip exists
    const [trip] = await db.select().from(trips).where(eq(trips.id, tripId));
    if (!trip) {
      throw new Error('Trip not found');
    }

    // Check for existing interest request
    const [existingRequest] = await db
      .select()
      .from(tripInterestRequests)
      .where(and(
        eq(tripInterestRequests.userId, userId),
        eq(tripInterestRequests.tripId, tripId)
      ));

    if (existingRequest) {
      // If request exists but was withdrawn, reactivate it
      if (existingRequest.status === 'withdrawn') {
        await db
          .update(tripInterestRequests)
          .set({ 
            status: 'pending', 
            updatedAt: new Date(),
            message: message || existingRequest.message
          })
          .where(eq(tripInterestRequests.id, existingRequest.id));

        await this.logAction(userId, 'INTEREST', tripId, { 
          action: 'reactivated',
          message: message 
        });

        // Create notification for the trip organizer when reactivated
        if (trip.organizerId !== userId) {
          await storage.createNotification({
            userId: trip.organizerId,
            tripId: tripId,
            type: null,
            category: 'trips',
            priority: 'normal',
            title: 'Trip Interest Renewed',
            content: `Someone renewed their interest in your trip "${trip.title}"`,
            actionUrl: `/trips/${tripId}/requests`,
            isRead: false
          });
        }

        return { 
          requestId: existingRequest.id, 
          status: 'pending', 
          isNew: false 
        };
      }

      // If already pending or accepted, return existing
      if (existingRequest.status === 'pending') {
        throw new Error('Interest request already exists and is pending');
      }
      if (existingRequest.status === 'accepted') {
        throw new Error('Interest request already accepted');
      }
      if (existingRequest.status === 'declined') {
        throw new Error('Interest request was declined');
      }
    }

    // Create new interest request
    const newRequest: InsertTripInterestRequest = {
      userId,
      tripId,
      status: 'pending',
      message: message || null
    };

    const [created] = await db
      .insert(tripInterestRequests)
      .values(newRequest)
      .returning();

    // Log the action
    await this.logAction(userId, 'INTEREST', tripId, { message });

    // Create notification for the trip organizer
    if (trip.organizerId !== userId) { // Don't notify yourself
      await storage.createNotification({
        userId: trip.organizerId,
        tripId: tripId,
        type: null, // Will use enum value
        category: 'trips',
        priority: 'normal',
        title: 'New Trip Interest',
        content: `Someone is interested in your trip "${trip.title}"`,
        actionUrl: `/trips/${tripId}/requests`,
        isRead: false
      });
    }

    return { 
      requestId: created.id, 
      status: 'pending', 
      isNew: true 
    };
  }

  /**
   * Withdraw interest request
   */
  async withdrawInterest(userId: string, tripId: string): Promise<void> {
    const [existingRequest] = await db
      .select()
      .from(tripInterestRequests)
      .where(and(
        eq(tripInterestRequests.userId, userId),
        eq(tripInterestRequests.tripId, tripId)
      ));

    if (!existingRequest) {
      throw new Error('No interest request found');
    }

    if (existingRequest.status === 'withdrawn') {
      return; // Already withdrawn, idempotent
    }

    // Update status to withdrawn
    await db
      .update(tripInterestRequests)
      .set({ 
        status: 'withdrawn', 
        updatedAt: new Date() 
      })
      .where(eq(tripInterestRequests.id, existingRequest.id));

    // Log the action
    await this.logAction(userId, 'WITHDRAW', tripId);
  }

  /**
   * Accept interest request (called by trip organizer)
   */
  async acceptInterest(
    organizerId: string, 
    requestId: string
  ): Promise<void> {
    const [request] = await db
      .select({
        id: tripInterestRequests.id,
        userId: tripInterestRequests.userId,
        tripId: tripInterestRequests.tripId,
        status: tripInterestRequests.status,
        organizerId: trips.organizerId
      })
      .from(tripInterestRequests)
      .innerJoin(trips, eq(tripInterestRequests.tripId, trips.id))
      .where(eq(tripInterestRequests.id, requestId));

    if (!request) {
      throw new Error('Interest request not found');
    }

    // Verify organizer permission
    if (request.organizerId !== organizerId) {
      throw new Error('Not authorized to accept this request');
    }

    if (request.status !== 'pending') {
      throw new Error('Request is not in pending status');
    }

    // Update status to accepted
    await db
      .update(tripInterestRequests)
      .set({ 
        status: 'accepted', 
        updatedAt: new Date() 
      })
      .where(eq(tripInterestRequests.id, requestId));

    // Log action for the interested user
    await this.logAction(request.userId, 'INTEREST_ACCEPTED', request.tripId, {
      acceptedBy: organizerId
    });

    // Create notification for the interested user
    const [trip] = await db.select().from(trips).where(eq(trips.id, request.tripId));
    if (trip) {
      await storage.createNotification({
        userId: request.userId,
        tripId: request.tripId,
        type: null, // This will be handled by the notification enum
        category: 'trips',
        priority: 'normal',
        title: 'Trip Request Accepted!',
        message: `Your interest in "${trip.title}" has been accepted by the organizer. You can now chat with them to coordinate details.`,
        relatedUserId: organizerId,
        actionUrl: `/trips/${request.tripId}`,
        primaryActionLabel: 'View Trip',
        primaryActionUrl: `/trips/${request.tripId}`,
        secondaryActionLabel: 'Start Chat',
        secondaryActionUrl: `/chat`, // Will be updated with thread ID later
        metadata: {
          action: 'interest_accepted',
          tripTitle: trip.title,
          organizerId: organizerId
        }
      });
    }
  }

  /**
   * Decline interest request (called by trip organizer)
   */
  async declineInterest(
    organizerId: string, 
    requestId: string
  ): Promise<void> {
    const [request] = await db
      .select({
        id: tripInterestRequests.id,
        userId: tripInterestRequests.userId,
        tripId: tripInterestRequests.tripId,
        status: tripInterestRequests.status,
        organizerId: trips.organizerId
      })
      .from(tripInterestRequests)
      .innerJoin(trips, eq(tripInterestRequests.tripId, trips.id))
      .where(eq(tripInterestRequests.id, requestId));

    if (!request) {
      throw new Error('Interest request not found');
    }

    // Verify organizer permission
    if (request.organizerId !== organizerId) {
      throw new Error('Not authorized to decline this request');
    }

    if (request.status !== 'pending') {
      throw new Error('Request is not in pending status');
    }

    // Update status to declined
    await db
      .update(tripInterestRequests)
      .set({ 
        status: 'declined', 
        updatedAt: new Date() 
      })
      .where(eq(tripInterestRequests.id, requestId));

    // Log action for the interested user
    await this.logAction(request.userId, 'INTEREST_DECLINED', request.tripId, {
      declinedBy: organizerId
    });
  }

  /**
   * Get user's pinned trips count
   */
  async getPinnedCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(pinnedTrips)
      .where(eq(pinnedTrips.userId, userId));
    
    return result[0]?.count || 0;
  }

  /**
   * Get user's interest requests count by status
   */
  async getInterestCount(userId: string, status?: string): Promise<number> {
    let query = db
      .select({ count: sql<number>`count(*)` })
      .from(tripInterestRequests)
      .where(eq(tripInterestRequests.userId, userId));

    if (status) {
      query = query.where(and(
        eq(tripInterestRequests.userId, userId),
        eq(tripInterestRequests.status, status)
      ));
    }

    const result = await query;
    return result[0]?.count || 0;
  }

  /**
   * Check if user has pinned a specific trip
   */
  async isPinned(userId: string, tripId: string): Promise<boolean> {
    const [pin] = await db
      .select()
      .from(pinnedTrips)
      .where(and(eq(pinnedTrips.userId, userId), eq(pinnedTrips.tripId, tripId)));

    return !!pin;
  }

  /**
   * Get user's interest status for a specific trip
   */
  async getInterestStatus(userId: string, tripId: string): Promise<string | null> {
    const [request] = await db
      .select({ status: tripInterestRequests.status })
      .from(tripInterestRequests)
      .where(and(
        eq(tripInterestRequests.userId, userId),
        eq(tripInterestRequests.tripId, tripId)
      ));

    return request?.status || null;
  }
}

export const userActionsService = new UserActionsService();