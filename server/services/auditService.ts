import { storage } from '../storage';

export interface AuditEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userEmail?: string;
  action: string;
  resource: string;
  resourceId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface AuditSearchFilters {
  userId?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  success?: boolean;
  ipAddress?: string;
  limit?: number;
  offset?: number;
}

export class AuditService {
  // Log an audit entry
  async log(entry: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<void> {
    try {
      const auditEntry = {
        ...entry,
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date()
      };

      // Store in database using existing audit log functionality
      await storage.createAuditLog({
        action: entry.action,
        userId: entry.userId,
        ...{
          resource: entry.resource,
          resourceId: entry.resourceId,
          oldValues: entry.oldValues,
          newValues: entry.newValues,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          sessionId: entry.sessionId,
          success: entry.success,
          errorMessage: entry.errorMessage,
          metadata: entry.metadata,
          userEmail: entry.userEmail
        }
      });

      console.log('📋 Audit logged:', {
        action: entry.action,
        resource: entry.resource,
        userId: entry.userId,
        success: entry.success
      });
    } catch (error) {
      console.error('Failed to log audit entry:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  // Search audit logs
  async search(filters: AuditSearchFilters): Promise<AuditEntry[]> {
    try {
      const logs = await storage.getAuditLogs({
        action: filters.action,
        userId: filters.userId,
        startDate: filters.startDate,
        endDate: filters.endDate,
        limit: filters.limit
      });

      // Transform to AuditEntry format
      return logs.map(log => ({
        id: log.id || `log_${log.timestamp?.getTime()}`,
        timestamp: log.timestamp || new Date(),
        userId: log.userId || 'unknown',
        userEmail: log.metadata?.userEmail,
        action: log.action,
        resource: log.metadata?.resource || 'unknown',
        resourceId: log.metadata?.resourceId || 'unknown',
        oldValues: log.metadata?.oldValues,
        newValues: log.metadata?.newValues,
        ipAddress: log.metadata?.ipAddress,
        userAgent: log.metadata?.userAgent,
        sessionId: log.metadata?.sessionId,
        success: log.metadata?.success !== false,
        errorMessage: log.metadata?.errorMessage,
        metadata: log.metadata
      }));
    } catch (error) {
      console.error('Error searching audit logs:', error);
      return [];
    }
  }

  // Get audit statistics
  async getStatistics(days: number = 30): Promise<{
    totalActions: number;
    uniqueUsers: number;
    successRate: number;
    topActions: Array<{ action: string; count: number }>;
    topUsers: Array<{ userId: string; userEmail?: string; count: number }>;
    dailyActivity: Array<{ date: string; count: number }>;
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const logs = await this.search({
        startDate,
        endDate,
        limit: 10000 // Large limit to get comprehensive stats
      });

      // Calculate statistics
      const totalActions = logs.length;
      const uniqueUsers = new Set(logs.map(log => log.userId)).size;
      const successfulActions = logs.filter(log => log.success).length;
      const successRate = totalActions > 0 ? (successfulActions / totalActions) * 100 : 0;

      // Top actions
      const actionCounts = logs.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topActions = Object.entries(actionCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([action, count]) => ({ action, count }));

      // Top users
      const userCounts = logs.reduce((acc, log) => {
        const key = log.userId;
        if (!acc[key]) {
          acc[key] = { userId: log.userId, userEmail: log.userEmail, count: 0 };
        }
        acc[key].count++;
        return acc;
      }, {} as Record<string, { userId: string; userEmail?: string; count: number }>);

      const topUsers = Object.values(userCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Daily activity
      const dailyActivity = this.generateDailyActivity(logs, days);

      return {
        totalActions,
        uniqueUsers,
        successRate,
        topActions,
        topUsers,
        dailyActivity
      };
    } catch (error) {
      console.error('Error getting audit statistics:', error);
      return {
        totalActions: 0,
        uniqueUsers: 0,
        successRate: 0,
        topActions: [],
        topUsers: [],
        dailyActivity: []
      };
    }
  }

  private generateDailyActivity(logs: AuditEntry[], days: number): Array<{ date: string; count: number }> {
    const dailyCount = {} as Record<string, number>;
    
    // Initialize all days with 0
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      dailyCount[dateKey] = 0;
    }

    // Count actual activity
    logs.forEach(log => {
      const dateKey = log.timestamp.toISOString().split('T')[0];
      if (dailyCount.hasOwnProperty(dateKey)) {
        dailyCount[dateKey]++;
      }
    });

    return Object.entries(dailyCount)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }

  // Log specific admin actions
  async logUserAction(userId: string, action: string, targetUserId: string, changes?: any, req?: any): Promise<void> {
    await this.log({
      userId,
      action: `admin.user.${action}`,
      resource: 'user',
      resourceId: targetUserId,
      newValues: changes,
      ipAddress: req?.ip,
      userAgent: req?.get('User-Agent'),
      sessionId: req?.sessionID,
      success: true
    });
  }

  async logTripAction(userId: string, action: string, tripId: string, changes?: any, req?: any): Promise<void> {
    await this.log({
      userId,
      action: `admin.trip.${action}`,
      resource: 'trip',
      resourceId: tripId,
      newValues: changes,
      ipAddress: req?.ip,
      userAgent: req?.get('User-Agent'),
      sessionId: req?.sessionID,
      success: true
    });
  }

  async logReportAction(userId: string, action: string, reportId: string, changes?: any, req?: any): Promise<void> {
    await this.log({
      userId,
      action: `admin.report.${action}`,
      resource: 'report',
      resourceId: reportId,
      newValues: changes,
      ipAddress: req?.ip,
      userAgent: req?.get('User-Agent'),
      sessionId: req?.sessionID,
      success: true
    });
  }

  async logSystemAction(userId: string, action: string, details?: any, req?: any): Promise<void> {
    await this.log({
      userId,
      action: `admin.system.${action}`,
      resource: 'system',
      resourceId: 'global',
      newValues: details,
      ipAddress: req?.ip,
      userAgent: req?.get('User-Agent'),
      sessionId: req?.sessionID,
      success: true
    });
  }

  async logError(userId: string, action: string, resource: string, resourceId: string, error: Error, req?: any): Promise<void> {
    await this.log({
      userId,
      action,
      resource,
      resourceId,
      ipAddress: req?.ip,
      userAgent: req?.get('User-Agent'),
      sessionId: req?.sessionID,
      success: false,
      errorMessage: error.message,
      metadata: { stack: error.stack }
    });
  }
}

export const auditService = new AuditService();