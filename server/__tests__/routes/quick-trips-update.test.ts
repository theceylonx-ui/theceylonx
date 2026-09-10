// @vitest-environment node

import express, { type Express } from "express";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { authState, storageState, storageMock } = vi.hoisted(() => {
  const authState = { userId: null as string | null };
  const storageState = { trip: null as Record<string, any> | null };
  const storageMock = {
    getQuickTrip: vi.fn(async () => storageState.trip),
    updateQuickTrip: vi.fn(async (_id: string, update: Record<string, unknown>) => {
      storageState.trip = { ...storageState.trip, ...update };
      return storageState.trip;
    }),
  };

  return { authState, storageState, storageMock };
});

vi.mock("../../storage", () => ({ storage: storageMock }));
vi.mock("../../auth/clerk", () => ({
  getClerkUser: vi.fn(() => null),
}));
vi.mock("../../auth/jwt", () => ({
  getCurrentUser: vi.fn(async () =>
    authState.userId
      ? {
          id: authState.userId,
          email: `${authState.userId}@example.com`,
          provider: "test",
        }
      : null,
  ),
}));

import { registerRoutes } from "../../routes";

const organizerId = "quick-trip-organizer";
const otherUserId = "quick-trip-other-user";
const tripId = "quick-trip-id";

function dateWithinQuickTripWindow(daysFromNow = 2) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
}

function validUpdate(overrides: Record<string, unknown> = {}) {
  return {
    fromLocation: "Colombo Fort",
    toLocation: "Galle Fort",
    region: "southern",
    date: dateWithinQuickTripWindow(),
    time: "08:30",
    title: "Updated coastal day trip",
    description: "Take the coastal train and explore Galle Fort together.",
    category: "culture",
    seatsAvailable: 6,
    isFree: false,
    seatPrice: 2500,
    ...overrides,
  };
}

function originalTrip() {
  return {
    id: tripId,
    organizerId,
    title: "Original quick trip",
    description: "The original quick trip description.",
    category: "roadtrip",
    fromLocation: "Colombo",
    toLocation: "Kandy",
    region: "central",
    date: new Date(dateWithinQuickTripWindow(1)),
    time: "09:00",
    seatsAvailable: 4,
    isFree: true,
    seatPrice: null,
    status: "active",
    imageUrl: "/assets/original-trip.png",
    createdAt: new Date("2026-01-02T03:04:05.000Z"),
    expiresAt: new Date("2026-01-07T03:04:05.000Z"),
    organizer: {
      id: organizerId,
      displayName: "Trip Organizer",
      username: "organizer",
      profileImageUrl: null,
    },
  };
}

async function createTestApp() {
  const app = express();
  app.use(express.json());
  await registerRoutes(app);
  return app;
}

describe("PATCH /api/quick-trips/:id", () => {
  let app: Express;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(() => {
    authState.userId = organizerId;
    storageState.trip = originalTrip();
    storageMock.getQuickTrip.mockClear();
    storageMock.updateQuickTrip.mockClear();
  });

  it("returns 401 when the request is unauthenticated", async () => {
    authState.userId = null;

    await request(app)
      .patch(`/api/quick-trips/${tripId}`)
      .send(validUpdate())
      .expect(401);

    expect(storageMock.getQuickTrip).not.toHaveBeenCalled();
    expect(storageMock.updateQuickTrip).not.toHaveBeenCalled();
  });

  it("returns 403 for a non-organizer and leaves the trip unchanged", async () => {
    authState.userId = otherUserId;
    const before = structuredClone(storageState.trip);

    await request(app)
      .patch(`/api/quick-trips/${tripId}`)
      .send(validUpdate({ title: "Unauthorized change" }))
      .expect(403);

    expect(storageMock.updateQuickTrip).not.toHaveBeenCalled();
    expect(storageState.trip).toEqual(before);
  });

  it("allows the organizer to update every editable field", async () => {
    const update = validUpdate();

    const response = await request(app)
      .patch(`/api/quick-trips/${tripId}`)
      .send(update)
      .expect(200);

    expect(response.body).toMatchObject({
      id: tripId,
      ...update,
      tripType: "quick",
    });
    expect(new Date(response.body.date).toISOString()).toBe(update.date);
    expect(storageMock.updateQuickTrip).toHaveBeenCalledWith(
      tripId,
      expect.objectContaining({
        ...update,
        date: expect.any(Date),
      }),
    );
    expect(storageState.trip).toMatchObject({
      ...update,
      date: expect.any(Date),
    });
  });

  it.each([
    ["an invalid date", { date: "not-a-date" }],
    ["fractional seats", { seatsAvailable: 2.5 }],
    ["an oversized title", { title: "x".repeat(101) }],
    ["oversized description text", { description: "x".repeat(501) }],
    ["an oversized departure location", { fromLocation: "x".repeat(101) }],
    ["invalid paid pricing", { isFree: false, seatPrice: 0 }],
  ])("returns 400 for %s", async (_label, invalidFields) => {
    await request(app)
      .patch(`/api/quick-trips/${tripId}`)
      .send(validUpdate(invalidFields))
      .expect(400);

    expect(storageMock.updateQuickTrip).not.toHaveBeenCalled();
  });

  it("ignores protected fields instead of allowing them to change", async () => {
    const before = storageState.trip!;
    const protectedValues = {
      organizerId: "attacker-controlled-organizer",
      createdAt: "2030-01-01T00:00:00.000Z",
      expiresAt: "2030-01-02T00:00:00.000Z",
      status: "expired",
      imageUrl: "/assets/attacker-controlled.png",
    };

    await request(app)
      .patch(`/api/quick-trips/${tripId}`)
      .send({ ...validUpdate(), ...protectedValues })
      .expect(200);

    const persisted = storageState.trip!;
    expect(persisted.organizerId).toBe(before.organizerId);
    expect(persisted.createdAt).toBe(before.createdAt);
    expect(persisted.expiresAt).toBe(before.expiresAt);
    expect(persisted.status).toBe(before.status);
    expect(persisted.imageUrl).toBe(before.imageUrl);
    expect(storageMock.updateQuickTrip).toHaveBeenCalledWith(
      tripId,
      expect.not.objectContaining(protectedValues),
    );
  });
});