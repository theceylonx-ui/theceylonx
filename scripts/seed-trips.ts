import { db } from '../server/db';
import { trips, tripMetadata, users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

const SEED_USERS = [
  { email: "seed@hibowan.com", name: "HiBowan Team", displayName: "HiBowan Team" },
  { email: "traveler1@hibowan.com", name: "Nimal Perera", displayName: "Nimal Perera" },
  { email: "traveler2@hibowan.com", name: "Sanduni Silva", displayName: "Sanduni Silva" },
  { email: "guide@hibowan.com", name: "Ruwan Jayawardena", displayName: "Ruwan Jayawardena" },
  { email: "explorer@hibowan.com", name: "Kasun Fernando", displayName: "Kasun Fernando" },
];

async function seedUsers() {
  for (const userData of SEED_USERS) {
    const existing = await db.select().from(users).where(eq(users.email, userData.email));
    if (existing.length === 0) {
      await db.insert(users).values({
        id: nanoid(),
        ...userData,
      });
    }
  }
}

function futureDate(daysFromNow: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d;
}

async function seedSampleTrips() {
  console.log("Starting sample trips seeding...");

  try {
    await db.select().from(users).limit(1);
    console.log("✅ Database connection verified for trips seeding");

    await seedUsers();

    const seedUser = await db.select().from(users).where(eq(users.email, "seed@hibowan.com"));
    const traveler1 = await db.select().from(users).where(eq(users.email, "traveler1@hibowan.com"));
    const traveler2 = await db.select().from(users).where(eq(users.email, "traveler2@hibowan.com"));
    const guide = await db.select().from(users).where(eq(users.email, "guide@hibowan.com"));
    const explorer = await db.select().from(users).where(eq(users.email, "explorer@hibowan.com"));

    if (seedUser.length === 0) {
      console.error("Seed user not found");
      return;
    }

    const sampleTrips = [
      {
        id: "sample-trip-001",
        title: "Colombo to Kandy Cultural Journey",
        fromLocation: "Colombo",
        toLocation: "Kandy",
        date: futureDate(7),
        time: "08:00",
        seatsAvailable: 3,
        price: "2500.00",
        region: "central",
        category: "culture" as const,
        organizerId: seedUser[0].id,
        organizerPhone: "771234567",
        organizerEmail: "seed@hibowan.com",
        contactInfo: "Contact via WhatsApp",
        status: "active",
        notes: "Visit the Temple of the Tooth and the Royal Botanical Gardens in Peradeniya, then a walk around Kandy Lake.",
        tags: ["temple", "culture", "gardens"],
      },
      {
        id: "sample-trip-002",
        title: "Galle Fort Sunset Tour",
        fromLocation: "Colombo",
        toLocation: "Galle",
        date: futureDate(10),
        time: "14:00",
        seatsAvailable: 4,
        price: "3000.00",
        region: "southern",
        category: "culture" as const,
        organizerId: traveler1[0]?.id || seedUser[0].id,
        organizerPhone: "772345678",
        organizerEmail: "traveler1@hibowan.com",
        contactInfo: "Call or WhatsApp",
        status: "active",
        notes: "Historic Dutch colonial fort walls, boutique cafes, and one of the best sunset viewpoints on the south coast.",
        tags: ["fort", "sunset", "photography"],
      },
      {
        id: "sample-trip-003",
        title: "Sigiriya Rock Fortress Adventure",
        fromLocation: "Kandy",
        toLocation: "Sigiriya",
        date: futureDate(13),
        time: "06:00",
        seatsAvailable: 2,
        price: "4500.00",
        region: "north_central",
        category: "adventure_sport" as const,
        organizerId: traveler2[0]?.id || seedUser[0].id,
        organizerPhone: "771122334",
        organizerEmail: "traveler2@hibowan.com",
        contactInfo: "Early morning start for the best views",
        status: "active",
        notes: "Climb the ancient rock fortress to see the ruins, frescoes, and water gardens before the midday heat and crowds.",
        tags: ["sigiriya", "adventure", "history"],
      },
      {
        id: "sample-trip-004",
        title: "Ella Nine Arch Bridge & Little Adam's Peak",
        fromLocation: "Kandy",
        toLocation: "Ella",
        date: futureDate(16),
        time: "07:30",
        seatsAvailable: 3,
        price: "2800.00",
        region: "uva",
        category: "hiking" as const,
        organizerId: guide[0]?.id || seedUser[0].id,
        organizerPhone: "774455667",
        organizerEmail: "guide@hibowan.com",
        contactInfo: "Local guide included",
        status: "active",
        notes: "Scenic train-route views, an easy hike up Little Adam's Peak, and a stop at the iconic Nine Arch Bridge.",
        tags: ["ella", "bridge", "hiking", "train"],
      },
      {
        id: "sample-trip-005",
        title: "Yala National Park Safari",
        fromLocation: "Colombo",
        toLocation: "Yala",
        date: futureDate(19),
        time: "05:00",
        seatsAvailable: 6,
        price: "5500.00",
        region: "southern",
        category: "wildlife" as const,
        organizerId: explorer[0]?.id || seedUser[0].id,
        organizerPhone: "777888999",
        organizerEmail: "explorer@hibowan.com",
        contactInfo: "Safari jeep and guide included",
        status: "active",
        notes: "Best chance in Sri Lanka to spot leopards, elephants, and sloth bears on a morning and evening game drive.",
        tags: ["safari", "wildlife", "leopards", "elephants"],
      },
      {
        id: "sample-trip-006",
        title: "Nuwara Eliya Tea Plantation Tour",
        fromLocation: "Kandy",
        toLocation: "Nuwara Eliya",
        date: futureDate(22),
        time: "09:00",
        seatsAvailable: 4,
        price: "3200.00",
        region: "central",
        category: "hiking" as const,
        organizerId: seedUser[0].id,
        organizerPhone: "771234567",
        organizerEmail: "seed@hibowan.com",
        contactInfo: "Tea factory tour and tasting included",
        status: "active",
        notes: "Cool hill-country climate, working tea estates, a factory tour and tasting, plus Horton Plains in the afternoon.",
        tags: ["tea", "plantation", "mountains"],
      },
      {
        id: "sample-trip-007",
        title: "Anuradhapura Ancient City",
        fromLocation: "Colombo",
        toLocation: "Anuradhapura",
        date: futureDate(25),
        time: "07:00",
        seatsAvailable: 5,
        price: "4000.00",
        region: "north_central",
        category: "culture" as const,
        organizerId: guide[0]?.id || seedUser[0].id,
        organizerPhone: "774455667",
        organizerEmail: "guide@hibowan.com",
        contactInfo: "Archaeological guide included",
        status: "active",
        notes: "Sri Lanka's ancient capital — Buddhist temples, dagobas, and ruins dating back over two thousand years.",
        tags: ["ancient", "buddhist", "temples", "history"],
      },
      {
        id: "sample-trip-008",
        title: "Mirissa Whale Watching",
        fromLocation: "Galle",
        toLocation: "Mirissa",
        date: futureDate(28),
        time: "06:30",
        seatsAvailable: 8,
        price: "3500.00",
        region: "southern",
        category: "wildlife" as const,
        organizerId: explorer[0]?.id || seedUser[0].id,
        organizerPhone: "777888999",
        organizerEmail: "explorer@hibowan.com",
        contactInfo: "Boat trip included",
        status: "active",
        notes: "Peak whale-watching season — blue whales, sperm whales, and dolphins off the south coast.",
        tags: ["whales", "dolphins", "boat", "ocean"],
      },
      {
        id: "sample-trip-009",
        title: "Arugam Bay Surf Trip",
        fromLocation: "Colombo",
        toLocation: "Arugam Bay",
        date: futureDate(31),
        time: "22:00",
        seatsAvailable: 3,
        price: "4500.00",
        region: "eastern",
        category: "beach" as const,
        organizerId: traveler1[0]?.id || seedUser[0].id,
        organizerPhone: "772345678",
        organizerEmail: "traveler1@hibowan.com",
        contactInfo: "Rental boards available on site",
        status: "active",
        notes: "Overnight drive to Sri Lanka's east-coast surf capital. Beginners welcome, boards available to rent at the beach.",
        tags: ["surf", "beach", "eastcoast"],
      },
      {
        id: "sample-trip-010",
        title: "Jaffna Cultural Discovery",
        fromLocation: "Colombo",
        toLocation: "Jaffna",
        date: futureDate(34),
        time: "05:30",
        seatsAvailable: 4,
        price: "6000.00",
        region: "northern",
        category: "culture" as const,
        organizerId: traveler2[0]?.id || seedUser[0].id,
        organizerPhone: "771122334",
        organizerEmail: "traveler2@hibowan.com",
        contactInfo: "Contact via WhatsApp",
        status: "active",
        notes: "One of Sri Lanka's most underrated regions — Nallur Kandaswamy Temple, Jaffna Fort, Casuarina Beach, and Tamil cuisine.",
        tags: ["jaffna", "culture", "northcoast"],
      },
    ];

    let tripCount = 0;

    for (const trip of sampleTrips) {
      const existing = await db.select().from(trips).where(eq(trips.id, trip.id));
      let tripReady = existing.length > 0;
      if (existing.length === 0) {
        try {
          const { notes, ...tripData } = trip;
          await db.insert(trips).values([tripData]);
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
