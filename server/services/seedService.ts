import { db } from '../db';
import { trips, users, topics, questions } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

async function ensureSeedUsers() {
  const usersData = [
    { email: "seed@hibowan.com", name: "HiBowan" },
    { email: "traveler1@hibowan.com", name: "Traveler One" },
    { email: "traveler2@hibowan.com", name: "Traveler Two" },
    { email: "traveler3@hibowan.com", name: "Traveler Three" },
    { email: "traveler4@hibowan.com", name: "Fellow Traveler" },
    { email: "explorer@hibowan.com", name: "Adventure Explorer" },
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

export async function seedSampleTrips() {
  console.log("Starting sample trips seeding...");
  
  await ensureSeedUsers();
  
  const seedUser = await db.select().from(users).where(eq(users.email, "seed@hibowan.com"));
  const traveler1 = await db.select().from(users).where(eq(users.email, "traveler1@hibowan.com"));
  
  if (seedUser.length === 0) {
    throw new Error("Seed user not found");
  }

  const futureDate1 = new Date();
  futureDate1.setDate(futureDate1.getDate() + 7);
  
  const futureDate2 = new Date();
  futureDate2.setDate(futureDate2.getDate() + 14);
  
  const futureDate3 = new Date();
  futureDate3.setDate(futureDate3.getDate() + 21);

  const sampleTrips = [
    {
      id: "sample-trip-001",
      title: "Colombo to Kandy Cultural Journey",
      fromLocation: "Colombo",
      toLocation: "Kandy",
      date: futureDate1,
      time: "08:00",
      seatsAvailable: 3,
      price: "2500.00",
      region: "Central",
      category: "culture" as const,
      organizerId: seedUser[0].id,
      organizerPhone: "771234567",
      organizerEmail: "seed@hibowan.com",
      organizerCountryCode: "+94",
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
      date: futureDate2,
      time: "14:00",
      seatsAvailable: 4,
      price: "3000.00",
      region: "Southern",
      category: "culture" as const,
      organizerId: traveler1[0]?.id || seedUser[0].id,
      organizerPhone: "772345678",
      organizerEmail: "traveler1@hibowan.com",
      organizerCountryCode: "+94",
      contactInfo: "Call or WhatsApp",
      status: "active",
      notes: "Explore Dutch colonial architecture and local cafes",
      tags: ["galle", "fort", "sunset", "colonial"]
    },
    {
      id: "sample-trip-003",
      title: "Ella Adventure Trek",
      fromLocation: "Kandy",
      toLocation: "Ella",
      date: futureDate3,
      time: "06:00",
      seatsAvailable: 5,
      price: "4500.00",
      region: "Uva",
      category: "adventure" as const,
      organizerId: seedUser[0].id,
      organizerPhone: "773456789",
      organizerEmail: "seed@hibowan.com",
      organizerCountryCode: "+94",
      contactInfo: "WhatsApp preferred",
      status: "active",
      notes: "Hike Little Adam's Peak and Nine Arch Bridge",
      tags: ["ella", "hiking", "adventure", "scenic"]
    }
  ];

  let seededCount = 0;
  for (const trip of sampleTrips) {
    const existing = await db.select().from(trips).where(eq(trips.id, trip.id));
    if (existing.length === 0) {
      await db.insert(trips).values([trip]);
      seededCount++;
    }
  }
  
  console.log(`✅ Seeded ${seededCount} sample trips`);
  return seededCount;
}

export async function seedSampleQuestions() {
  console.log("Starting sample questions seeding...");
  
  await ensureSeedUsers();
  
  const seedUser = await db.select().from(users).where(eq(users.email, "seed@hibowan.com"));
  if (seedUser.length === 0) {
    throw new Error("Seed user not found");
  }
  const userId = seedUser[0].id;

  let defaultTopic = await db.select().from(topics).limit(1);
  if (defaultTopic.length === 0) {
    await db.insert(topics).values({
      id: nanoid(),
      slug: "general",
      name: "General Travel",
      description: "General travel questions and tips"
    });
    defaultTopic = await db.select().from(topics).where(eq(topics.slug, "general"));
  }
  
  const topicId = defaultTopic[0].id;

  const sampleQuestions = [
    {
      id: "sample-q-001",
      title: "Best time to visit Sigiriya Rock Fortress?",
      body: "Planning to visit Sigiriya. What's the best time of day and season to avoid crowds and get the best views?",
      slug: "best-time-visit-sigiriya-rock-fortress",
      tags: ["sigiriya", "timing", "crowds"],
      userId,
      topicId,
      isAnonymous: false,
      views: 45,
      votesCount: 12,
      answersCount: 3
    },
    {
      id: "sample-q-002",
      title: "Temple etiquette in Sri Lanka - what should I know?",
      body: "First time visiting Buddhist temples in Sri Lanka. What are the dos and don'ts I should be aware of?",
      slug: "temple-etiquette-sri-lanka-dos-donts",
      tags: ["temple", "etiquette", "culture", "buddhist"],
      userId,
      topicId,
      isAnonymous: false,
      views: 67,
      votesCount: 18,
      answersCount: 5
    },
    {
      id: "sample-q-003",
      title: "Train from Kandy to Ella - booking tips?",
      body: "I want to take the scenic train from Kandy to Ella. How far in advance should I book? Any tips for getting window seats?",
      slug: "train-kandy-ella-booking-tips",
      tags: ["train", "kandy", "ella", "booking", "scenic"],
      userId,
      topicId,
      isAnonymous: false,
      views: 89,
      votesCount: 25,
      answersCount: 7
    },
    {
      id: "sample-q-004",
      title: "Whale watching in Mirissa - best season?",
      body: "When is the best time to spot blue whales and dolphins off the coast of Mirissa? How early should I book tours?",
      slug: "whale-watching-mirissa-best-season",
      tags: ["mirissa", "whales", "dolphins", "season", "tours"],
      userId,
      topicId,
      isAnonymous: false,
      views: 34,
      votesCount: 9,
      answersCount: 2
    },
    {
      id: "sample-q-005",
      title: "Yala National Park safari - morning or evening?",
      body: "Planning a safari at Yala National Park. Is morning or evening better for wildlife spotting, especially leopards?",
      slug: "yala-national-park-safari-morning-evening",
      tags: ["yala", "safari", "wildlife", "leopards", "timing"],
      userId,
      topicId,
      isAnonymous: false,
      views: 56,
      votesCount: 14,
      answersCount: 4
    }
  ];

  let seededCount = 0;
  for (const question of sampleQuestions) {
    const existing = await db.select().from(questions).where(eq(questions.id, question.id));
    if (existing.length === 0) {
      await db.insert(questions).values(question);
      seededCount++;
    }
  }
  
  console.log(`✅ Seeded ${seededCount} sample questions`);
  return seededCount;
}
