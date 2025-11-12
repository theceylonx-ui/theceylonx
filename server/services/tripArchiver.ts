import { db } from '../db';
import { trips } from '@shared/schema';
import { lt, and, inArray, sql } from 'drizzle-orm';

/**
 * Auto-Archive Service for Outdated Trips
 * Automatically marks trips as "archived" when their date has passed
 */

export class TripArchiverService {
  /**
   * Archive all trips that are past their date AND time
   * Runs via cron job or can be called manually
   */
  static async archiveOutdatedTrips(): Promise<number> {
    try {
      const now = new Date();
      
      console.log('🗄️  Running trip auto-archive check...');
      
      // Find trips that are past their date+time and still active/inactive
      // Combine date and time columns to get full trip start datetime
      const result = await db
        .update(trips)
        .set({
          status: 'archived',
          archivedAt: now,
          updatedAt: now,
        })
        .where(
          and(
            // Combine date and time to check if trip start datetime has passed
            sql`(${trips.date}::date + ${trips.time}::time) < ${now}`,
            inArray(trips.status, ['active', 'inactive']), // Only archive active/inactive trips
            sql`${trips.archivedAt} IS NULL` // Not already archived
          )
        )
        .returning({ id: trips.id });
      
      const archivedCount = result.length;
      
      if (archivedCount > 0) {
        console.log(`✅ Archived ${archivedCount} outdated trip(s)`);
      } else {
        console.log('✅ No trips to archive');
      }
      
      return archivedCount;
    } catch (error) {
      console.error('❌ Error archiving trips:', error);
      throw error;
    }
  }
  
  /**
   * Get all archived trips for a specific organizer
   */
  static async getArchivedTripsForOrganizer(organizerId: string) {
    try {
      const archivedTrips = await db
        .select()
        .from(trips)
        .where(
          and(
            sql`${trips.organizerId} = ${organizerId}`,
            sql`${trips.status} = 'archived'`
          )
        )
        .orderBy(sql`${trips.archivedAt} DESC`);
      
      return archivedTrips;
    } catch (error) {
      console.error('❌ Error fetching archived trips:', error);
      throw error;
    }
  }
  
  /**
   * Manually archive a trip (organizer action)
   */
  static async manualArchiveTrip(tripId: string, organizerId: string): Promise<boolean> {
    try {
      const result = await db
        .update(trips)
        .set({
          status: 'archived',
          archivedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            sql`${trips.id} = ${tripId}`,
            sql`${trips.organizerId} = ${organizerId}`, // Only organizer can archive
            inArray(trips.status, ['active', 'inactive', 'cancelled']) // Can't archive completed trips
          )
        )
        .returning({ id: trips.id });
      
      return result.length > 0;
    } catch (error) {
      console.error('❌ Error manually archiving trip:', error);
      throw error;
    }
  }
}
