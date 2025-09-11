/**
 * Idempotency handler for critical API operations
 * Prevents duplicate operations and ensures safe retries
 */

import { db } from "../db";
import { sql } from "drizzle-orm";
import { eq } from "drizzle-orm";

// Idempotency key storage table schema
export const idempotencyKeys = `
CREATE TABLE IF NOT EXISTS idempotency_keys (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  operation_type VARCHAR(100) NOT NULL,
  user_id VARCHAR(255),
  request_hash VARCHAR(255),
  response_data JSONB,
  status VARCHAR(50) NOT NULL DEFAULT 'processing', -- 'processing', 'completed', 'failed'
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  CONSTRAINT check_status CHECK (status IN ('processing', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_idempotency_key ON idempotency_keys(key);
CREATE INDEX IF NOT EXISTS idx_idempotency_user_type ON idempotency_keys(user_id, operation_type);
CREATE INDEX IF NOT EXISTS idx_idempotency_expires ON idempotency_keys(expires_at);
`;

export interface IdempotencyOptions {
  key: string;
  operationType: string;
  userId?: string;
  requestHash?: string;
  expiryMinutes?: number; // Default: 60 minutes
}

export interface IdempotencyResult<T> {
  isNewOperation: boolean;
  result?: T;
  status: 'processing' | 'completed' | 'failed';
}

/**
 * Create hash from request data for duplicate detection
 */
export function createRequestHash(data: any): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

/**
 * Check if operation is idempotent and either return existing result or mark as processing
 * FIXED: Implements single-flight execution using INSERT ON CONFLICT DO NOTHING to prevent race conditions
 */
export async function withIdempotency<T>(
  options: IdempotencyOptions,
  operation: () => Promise<T>
): Promise<T> {
  const { key, operationType, userId, requestHash, expiryMinutes = 60 } = options;
  
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
  const { pool } = await import("../db");
  
  try {
    // CRITICAL FIX: Use single atomic operation to check and claim the operation
    // This prevents race conditions by ensuring only ONE request can proceed
    const claimQuery = `
      INSERT INTO idempotency_keys (key, operation_type, user_id, request_hash, status, expires_at)
      VALUES ($1, $2, $3, $4, 'processing', $5)
      ON CONFLICT (key) DO NOTHING
      RETURNING key, status
    `;
    
    const claimResult = await pool.query(claimQuery, [key, operationType, userId, requestHash, expiresAt]);
    
    if (claimResult.rows.length > 0) {
      // SUCCESS: This request successfully claimed the operation - proceed with execution
      try {
        console.log(`🔒 Idempotency: Executing operation for key ${key}`);
        const result = await operation();
        
        // Mark as completed with result
        await pool.query(
          `UPDATE idempotency_keys 
           SET status = 'completed', response_data = $2, completed_at = NOW() 
           WHERE key = $1`,
          [key, JSON.stringify(result)]
        );
        
        return result;
        
      } catch (operationError) {
        // Mark as failed if operation throws
        await pool.query(
          `UPDATE idempotency_keys SET status = 'failed', completed_at = NOW() WHERE key = $1`,
          [key]
        );
        throw operationError;
      }
    } else {
      // COLLISION: Another request already claimed this operation
      // Check existing record status and handle accordingly
      const checkQuery = `
        SELECT key, status, response_data, created_at
        FROM idempotency_keys 
        WHERE key = $1 AND expires_at > NOW()
      `;
      const existing = await pool.query(checkQuery, [key]);
      
      if (existing.rows.length === 0) {
        // Key expired between insert attempt and check - retry once
        console.log(`⚡ Idempotency: Key ${key} expired, retrying`);
        return withIdempotency(options, operation);
      }
      
      const record = existing.rows[0];
      
      if (record.status === 'completed') {
        // Return cached result
        console.log(`✅ Idempotency: Returning cached result for key ${key}`);
        return record.response_data as T;
      } else if (record.status === 'processing') {
        // Check if it's been processing too long (>5 minutes), then allow retry
        const processingTime = Date.now() - new Date(record.created_at).getTime();
        if (processingTime > 5 * 60 * 1000) {
          console.log(`⏰ Idempotency: Processing timeout for key ${key}, allowing retry`);
          // Reset to failed status to allow retry
          await pool.query(
            `UPDATE idempotency_keys SET status = 'failed', completed_at = NOW() WHERE key = $1`,
            [key]
          );
          // Retry the entire operation
          return withIdempotency(options, operation);
        } else {
          // Still processing, caller should wait and retry
          console.log(`⏳ Idempotency: Operation ${key} still processing, rejecting duplicate`);
          throw new Error('Operation already in progress. Please wait and retry.');
        }
      } else if (record.status === 'failed') {
        // Previous attempt failed, allow retry by attempting to claim again
        console.log(`🔄 Idempotency: Previous attempt failed for key ${key}, allowing retry`);
        
        const retryClaimQuery = `
          UPDATE idempotency_keys 
          SET status = 'processing', created_at = NOW(), completed_at = NULL
          WHERE key = $1 AND status = 'failed'
          RETURNING key
        `;
        const retryClaim = await pool.query(retryClaimQuery, [key]);
        
        if (retryClaim.rows.length > 0) {
          // Successfully claimed retry
          return withIdempotency(options, operation);
        } else {
          // Another request beat us to the retry
          throw new Error('Operation retry already in progress. Please wait and retry.');
        }
      }
      
      throw new Error(`Unknown idempotency status: ${record.status}`);
    }
    
  } catch (error) {
    // Only mark as failed if we actually claimed the operation
    // (Don't interfere with other requests' operations)
    console.error(`❌ Idempotency error for key ${key}:`, error);
    throw error;
  }
}

/**
 * Generate idempotency key for trip creation
 */
export function generateTripCreationKey(userId: string, tripData: any): string {
  const hash = createRequestHash({
    title: tripData.title,
    fromLocation: tripData.fromLocation,
    toLocation: tripData.toLocation,
    date: tripData.date,
    organizerId: userId
  });
  return `trip_create_${userId}_${hash}`;
}

/**
 * Generate idempotency key for user registration
 */
export function generateUserRegistrationKey(email: string, provider: string): string {
  return `user_register_${provider}_${email}`;
}

/**
 * Generate idempotency key for trip interest requests
 */
export function generateTripInterestKey(userId: string, tripId: string): string {
  return `trip_interest_${userId}_${tripId}`;
}

/**
 * Generate idempotency key for rating submissions
 */
export function generateRatingKey(raterId: string, tripId: string, ratedId: string): string {
  return `rating_${raterId}_${tripId}_${ratedId}`;
}

/**
 * Clean up expired idempotency keys (should be run periodically)
 */
export async function cleanupExpiredKeys(): Promise<number> {
  try {
    const { pool } = await import("../db");
    const result = await pool.query(`
      DELETE FROM idempotency_keys 
      WHERE expires_at < NOW()
    `);
    return result.rowCount || 0;
  } catch (error) {
    console.error('Failed to cleanup expired idempotency keys:', error);
    throw error;
  }
}

/**
 * Initialize idempotency table (run during app startup)
 * FIXED: Enhanced error handling and verification
 */
export async function initializeIdempotencyTable(): Promise<void> {
  try {
    const { pool } = await import("../db");
    
    // Execute the table creation and indexes
    await pool.query(idempotencyKeys);
    
    // Verify table was created successfully
    const verifyQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'idempotency_keys'
    `;
    const verification = await pool.query(verifyQuery);
    
    if (verification.rows.length === 0) {
      throw new Error('Idempotency table creation verification failed');
    }
    
    console.log('✅ Idempotency table and indexes initialized successfully');
    
    // Clean up any expired keys from previous runs
    const cleanedCount = await cleanupExpiredKeys();
    console.log(`🧹 Cleaned up ${cleanedCount} expired idempotency keys`);
    
  } catch (error) {
    console.error('❌ Failed to initialize idempotency table:', error);
    
    // Log additional debug info
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    
    // Re-throw to prevent app startup if idempotency is broken
    throw new Error(`Idempotency initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}