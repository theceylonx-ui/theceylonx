import { db } from '../server/db';
import { trips, tripMetadata, users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { SEED_USERS, SAMPLE_TRIPS } from './sampleTripsData';

async function seedUsers() {
  for (const userData of SEED_USERS) {
    const existing = await db.select().from(users).where(eq(users.email, userData.email));
    if (existing.length === 0) {
      await db.insert(users).values({
        id: nanoid(),
        ...userData,
        isTestData: true,
      });
    } else if (!existing[0].isTestData) {
      // Backfill: a user created by an earlier version of this script,
      // before isTestData existed.
      await db.update(users).set({ isTestData: true }).where(eq(users.id, existing[0].id));
    }
  }
}

async function resolveOrganizerIds(): Promise<Record<string, string>> {
  const ids: Record<string, string> = {};
  for (const u of SEED_USERS) {
    const [row] = await db.select().from(users).where(eq(users.email, u.email));
    if (row) ids[u.email] = row.id;
  }
  return ids;
}

async function seedSampleTrips() {
  console.log("Starting sample trips seeding...");

  try {
    await db.select().from(users).limit(1);
    console.log("✅ Database connection verified for trips seeding");

    await seedUsers();
    const organizerIds = await resolveOrganizerIds();
    const fallbackOrganizerId = organizerIds[SEED_USERS[0].email];

    if (!fallbackOrganizerId) {
      console.error("Seed user not found");
      return;
    }

    let tripCount = 0;

    for (const trip of SAMPLE_TRIPS) {
      const existing = await db.select().from(trips).where(eq(trips.id, trip.id));
      let tripReady = existing.length > 0;
      if (existing.length === 0) {
        try {
          const { notes, ...tripData } = trip;
          const organizerId = organizerIds[trip.organizerEmail] || fallbackOrganizerId;
          await db.insert(trips).values([{ ...tripData, organizerId }]);
          tripReady = true;
          tripCount++;
          console.log(`✅ Created trip: ${trip.title}`);
        } catch (error) {
          console.error(`❌ Failed to create trip ${trip.title}:`, error);
        }
      } else {
        console.log(`⚠️ Trip already exists: ${trip.title}`);
      }
      if (tripReady) {
        await db.insert(tripMetadata).values({
          tripId: trip.id,
          notes: trip.notes,
        }).onConflictDoUpdate({
          target: tripMetadata.tripId,
          set: { notes: trip.notes },
        });
      }
    }

    console.log(`✅ Seeded ${tripCount} sample trips`);
  } catch (error) {
    console.error("❌ Error in seedSampleTrips:", error);
    throw error;
  }
}

async function main() {
  try {
    console.log("🌱 Starting trips seeding...");
    await seedSampleTrips();
    console.log("🎉 Trips seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding trips:", error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { seedSampleTrips };
