/**
 * Ceylon Expand - Trips API Routes Tests
 * Comprehensive API testing with database integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../index';
import { db } from '../../db';
import { trips, users } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

// Mock authentication middleware
const mockAuthMiddleware = vi.fn((req, res, next) => {
  req.user = {
    id: 'test-user-id',
    email: 'test@ceylonexpand.com',
    role: 'user',
  };
  next();
});

vi.mock('../../middleware/auth', () => ({
  requireAuth: mockAuthMiddleware,
}));

describe('Trips API Routes', () => {
  let testUser: any;
  let testTrip: any;

  beforeEach(async () => {
    // Clean up database
    await db.delete(trips);
    await db.delete(users);

    // Create test user
    [testUser] = await db.insert(users).values({
      id: 'test-user-id',
      email: 'test@ceylonexpand.com',
      name: 'Test User',
      provider: 'email',
    }).returning();

    // Create test trip
    [testTrip] = await db.insert(trips).values({
      title: 'Test Adventure',
      fromLocation: 'Colombo',
      toLocation: 'Kandy',
      date: new Date('2024-12-01'),
      time: '09:00',
      seatsAvailable: 4,
      price: '5000.00',
      region: 'central',
      category: 'roadtrip',
      organizerId: testUser.id,
      organizerPhone: '771234567',
      organizerEmail: testUser.email,
    }).returning();
  });

  afterEach(async () => {
    // Clean up database
    await db.delete(trips);
    await db.delete(users);
    vi.clearAllMocks();
  });

  describe('GET /api/trips', () => {
    it('should return list of trips with proper structure', async () => {
      const response = await request(app)
        .get('/api/trips')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        trips: expect.arrayContaining([
          expect.objectContaining({
            id: testTrip.id,
            title: 'Test Adventure',
            fromLocation: 'Colombo',
            toLocation: 'Kandy',
            seatsAvailable: 4,
          }),
        ]),
        total: 1,
        page: 1,
        limit: 20,
      });
    });

    it('should support pagination', async () => {
      // Create multiple trips
      const tripPromises = Array.from({ length: 25 }, (_, i) =>
        db.insert(trips).values({
          title: `Trip ${i + 2}`,
          fromLocation: 'Colombo',
          toLocation: 'Galle',
          date: new Date('2024-12-01'),
          time: '10:00',
          seatsAvailable: 3,
          region: 'southern',
          category: 'beach',
          organizerId: testUser.id,
          organizerPhone: '771234567',
        }).returning()
      );
      await Promise.all(tripPromises);

      const response = await request(app)
        .get('/api/trips?page=2&limit=10')
        .expect(200);

      expect(response.body.trips).toHaveLength(10);
      expect(response.body.page).toBe(2);
      expect(response.body.total).toBeGreaterThan(20);
    });

    it('should support filtering by region', async () => {
      const response = await request(app)
        .get('/api/trips?region=central')
        .expect(200);

      expect(response.body.trips).toHaveLength(1);
      expect(response.body.trips[0].region).toBe('central');
    });

    it('should support date range filtering', async () => {
      const response = await request(app)
        .get('/api/trips?startDate=2024-11-01&endDate=2024-12-31')
        .expect(200);

      expect(response.body.trips).toHaveLength(1);
    });
  });

  describe('GET /api/trips/:id', () => {
    it('should return specific trip details', async () => {
      const response = await request(app)
        .get(`/api/trips/${testTrip.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testTrip.id,
        title: 'Test Adventure',
        fromLocation: 'Colombo',
        toLocation: 'Kandy',
        organizerId: testUser.id,
      });
    });

    it('should return 404 for non-existent trip', async () => {
      const response = await request(app)
        .get('/api/trips/non-existent-id')
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Trip not found',
      });
    });
  });

  describe('POST /api/trips', () => {
    const validTripData = {
      title: 'New Adventure Trip',
      fromLocation: 'Negombo',
      toLocation: 'Sigiriya',
      date: '2024-12-15',
      time: '08:00',
      seatsAvailable: 6,
      price: 8000,
      region: 'central',
      category: 'culture',
      organizerPhone: '772345678',
    };

    it('should create new trip with valid data', async () => {
      const response = await request(app)
        .post('/api/trips')
        .send(validTripData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        title: validTripData.title,
        fromLocation: validTripData.fromLocation,
        toLocation: validTripData.toLocation,
        organizerId: testUser.id,
      });

      // Verify in database
      const createdTrip = await db.select()
        .from(trips)
        .where(eq(trips.id, response.body.id))
        .limit(1);
      
      expect(createdTrip).toHaveLength(1);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        title: 'Incomplete Trip',
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/trips')
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        error: expect.stringContaining('validation'),
      });
    });

    it('should validate future dates', async () => {
      const pastDateTrip = {
        ...validTripData,
        date: '2020-01-01', // Past date
      };

      const response = await request(app)
        .post('/api/trips')
        .send(pastDateTrip)
        .expect(400);

      expect(response.body.error).toContain('future');
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      vi.spyOn(db, 'insert').mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/trips')
        .send(validTripData)
        .expect(500);

      expect(response.body).toMatchObject({
        error: 'Internal server error',
      });
    });
  });

  describe('PATCH /api/trips/:id', () => {
    it('should update trip by organizer', async () => {
      const updateData = {
        title: 'Updated Adventure',
        seatsAvailable: 2,
      };

      const response = await request(app)
        .patch(`/api/trips/${testTrip.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testTrip.id,
        title: 'Updated Adventure',
        seatsAvailable: 2,
      });
    });

    it('should prevent non-organizer from updating', async () => {
      // Create trip by different user
      const [otherUser] = await db.insert(users).values({
        id: 'other-user-id',
        email: 'other@test.com',
        name: 'Other User',
        provider: 'email',
      }).returning();

      const [otherTrip] = await db.insert(trips).values({
        title: 'Other User Trip',
        fromLocation: 'Galle',
        toLocation: 'Matara',
        date: new Date('2024-12-01'),
        time: '10:00',
        seatsAvailable: 3,
        region: 'southern',
        category: 'beach',
        organizerId: otherUser.id,
        organizerPhone: '773456789',
      }).returning();

      const response = await request(app)
        .patch(`/api/trips/${otherTrip.id}`)
        .send({ title: 'Hacked Title' })
        .expect(403);

      expect(response.body.error).toContain('permission');
    });
  });

  describe('DELETE /api/trips/:id', () => {
    it('should delete trip by organizer', async () => {
      await request(app)
        .delete(`/api/trips/${testTrip.id}`)
        .expect(204);

      // Verify trip is deleted
      const deletedTrip = await db.select()
        .from(trips)
        .where(eq(trips.id, testTrip.id))
        .limit(1);
      
      expect(deletedTrip).toHaveLength(0);
    });

    it('should prevent non-organizer from deleting', async () => {
      // Mock different user
      mockAuthMiddleware.mockImplementationOnce((req, res, next) => {
        req.user = { id: 'different-user-id', role: 'user' };
        next();
      });

      const response = await request(app)
        .delete(`/api/trips/${testTrip.id}`)
        .expect(403);

      expect(response.body.error).toContain('permission');
    });
  });

  describe('Performance & Security', () => {
    it('should handle concurrent requests', async () => {
      const concurrentRequests = Array.from({ length: 10 }, () =>
        request(app).get('/api/trips')
      );

      const responses = await Promise.all(concurrentRequests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.trips).toBeDefined();
      });
    });

    it('should prevent SQL injection', async () => {
      const maliciousInput = "'; DROP TABLE trips; --";
      
      const response = await request(app)
        .get('/api/trips')
        .query({ region: maliciousInput })
        .expect(200); // Should not crash

      // Verify trips table still exists
      const tripsCount = await db.select().from(trips);
      expect(tripsCount).toBeDefined();
    });

    it('should rate limit API requests', async () => {
      // Make many requests rapidly
      const rapidRequests = Array.from({ length: 100 }, () =>
        request(app).get('/api/trips')
      );

      const responses = await Promise.allSettled(rapidRequests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(
        result => result.status === 'fulfilled' && result.value.status === 429
      );
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});