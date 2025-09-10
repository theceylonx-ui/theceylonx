import { db } from '../server/db';
import { trips, users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

async function seedUsers() {
  const usersData = [
    { email: "seed@theceylonx.com", name: "CeylonX" },
    { email: "traveler1@theceylonx.com", name: "Traveler One" },
    { email: "traveler2@theceylonx.com", name: "Traveler Two" },
    { email: "traveler3@theceylonx.com", name: "Traveler Three" },
    { email: "guide@theceylonx.com", name: "Local Guide" },
    { email: "explorer@theceylonx.com", name: "Adventure Explorer" },
  ];

  for (const userData of usersData) {
    const existing = await db.select().from(users).where(eq(users.email, userData.email));
    if (existing.length === 0) {
      await db.insert(users).values({
        id: nanoid(),
        ...userData
      });
    }
  }
}

async function seedSampleTrips() {
  console.log("Starting sample trips seeding...");
  
  // Ensure seed users exist first
  await seedUsers();
  
  const seedUser = await db.select().from(users).where(eq(users.email, "seed@theceylonx.com"));
  const traveler1 = await db.select().from(users).where(eq(users.email, "traveler1@theceylonx.com"));
  const traveler2 = await db.select().from(users).where(eq(users.email, "traveler2@theceylonx.com"));
  const guide = await db.select().from(users).where(eq(users.email, "guide@theceylonx.com"));
  const explorer = await db.select().from(users).where(eq(users.email, "explorer@theceylonx.com"));
  
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
      date: new Date("2025-01-15"),
      time: "08:00",
      seatsAvailable: 3,
      price: "2500.00",
      region: "Central",
      category: "cultural",
      organizerId: seedUser[0].id,
      organizerPhone: "771234567",
      organizerEmail: "seed@theceylonx.com",
      contactInfo: "Contact via WhatsApp",
      status: "active",
      notes: "Visit Temple of the Tooth and Royal Botanical Gardens",
      tags: ["temple", "culture", "gardens"]
    },
    {
      id: "sample-trip-002", 
      title: "Galle Fort Sunset Tour",
      fromLocation: "Colombo",
      toLocation: "Galle",
      date: new Date("2025-01-18"),
      time: "14:00",
      seatsAvailable: 4,
      price: "3000.00",
      region: "Southern",
      category: "cultural",
      organizerId: traveler1[0]?.id || seedUser[0].id,
      organizerPhone: "776543210",
      organizerEmail: "traveler1@theceylonx.com",
      contactInfo: "Contact via phone or email",
      status: "active",
      notes: "Historic fort walls and amazing sunset views",
      tags: ["fort", "sunset", "photography"]
    },
    {
      id: "sample-trip-003",
      title: "Sigiriya Rock Fortress Adventure",
      fromLocation: "Kandy",
      toLocation: "Sigiriya",
      date: new Date("2025-01-20"),
      time: "06:00",
      seatsAvailable: 2,
      price: "4500.00",
      region: "Central",
      category: "adventure",
      organizerId: traveler2[0]?.id || seedUser[0].id,
      organizerPhone: "771122334",
      organizerEmail: "traveler2@theceylonx.com",
      contactInfo: "Early morning start for best views",
      status: "active",
      notes: "Ancient rock fortress with frescoes and water gardens",
      tags: ["sigiriya", "adventure", "history"]
    },
    {
      id: "sample-trip-004",
      title: "Ella Nine Arch Bridge & Little Adam's Peak",
      fromLocation: "Kandy",
      toLocation: "Ella",
      date: new Date("2025-01-22"),
      time: "07:30",
      seatsAvailable: 3,
      price: "2800.00",
      region: "Central",
      category: "nature",
      organizerId: guide[0]?.id || seedUser[0].id,
      organizerPhone: "774455667",
      organizerEmail: "guide@theceylonx.com",
      contactInfo: "Professional guide included",
      status: "active",
      notes: "Scenic train journey views and easy hiking",
      tags: ["ella", "bridge", "hiking", "train"]
    },
    {
      id: "sample-trip-005",
      title: "Yala National Park Safari",
      fromLocation: "Colombo",
      toLocation: "Yala",
      date: new Date("2025-01-25"),
      time: "05:00",
      seatsAvailable: 6,
      price: "5500.00",
      region: "Southern",
      category: "wildlife",
      organizerId: explorer[0]?.id || seedUser[0].id,
      organizerPhone: "777888999",
      organizerEmail: "explorer@theceylonx.com",
      contactInfo: "Safari vehicle and guide included",
      status: "active",
      notes: "Best chance to spot leopards and elephants",
      tags: ["safari", "wildlife", "leopards", "elephants"]
    },
    {
      id: "sample-trip-006",
      title: "Nuwara Eliya Tea Plantation Tour",
      fromLocation: "Kandy",
      toLocation: "Nuwara Eliya",
      date: new Date("2025-01-28"),
      time: "09:00",
      seatsAvailable: 4,
      price: "3200.00",
      region: "Central",
      category: "nature",
      organizerId: seedUser[0].id,
      organizerPhone: "771234567",
      organizerEmail: "seed@theceylonx.com",
      contactInfo: "Tea tasting included",
      status: "active",
      notes: "Cool climate and beautiful tea estates",
      tags: ["tea", "plantation", "mountains"]
    },
    {
      id: "sample-trip-007",
      title: "Anuradhapura Ancient City",
      fromLocation: "Colombo",
      toLocation: "Anuradhapura",
      date: new Date("2025-02-01"),
      time: "07:00",
      seatsAvailable: 5,
      price: "4000.00",
      region: "North Central",
      category: "cultural",
      organizerId: guide[0]?.id || seedUser[0].id,
      organizerPhone: "774455667",
      organizerEmail: "guide@theceylonx.com",
      contactInfo: "Archaeological guide included",
      status: "active",
      notes: "Ancient Buddhist temples and dagobas",
      tags: ["ancient", "buddhist", "temples", "history"]
    },
    {
      id: "sample-trip-008",
      title: "Mirissa Whale Watching",
      fromLocation: "Galle",
      toLocation: "Mirissa",
      date: new Date("2025-02-05"),
      time: "06:30",
      seatsAvailable: 8,
      price: "3500.00",
      region: "Southern",
      category: "wildlife",
      organizerId: explorer[0]?.id || seedUser[0].id,
      organizerPhone: "777888999",
      organizerEmail: "explorer@theceylonx.com",
      contactInfo: "Boat trip included",
      status: "active",
      notes: "Blue whales and dolphins season",
      tags: ["whales", "dolphins", "boat", "ocean"]
    }
  ];

  let tripCount = 0;
  
  for (const trip of sampleTrips) {
    const existing = await db.select().from(trips).where(eq(trips.id, trip.id));
    if (existing.length === 0) {
      try {
        await db.insert(trips).values(trip);
        tripCount++;
        console.log(`✅ Created trip: ${trip.title}`);
      } catch (error) {
        console.error(`❌ Failed to create trip ${trip.title}:`, error);
      }
    } else {
      console.log(`⚠️ Trip already exists: ${trip.title}`);
    }
  }
  
  console.log(`✅ Seeded ${tripCount} sample trips`);
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