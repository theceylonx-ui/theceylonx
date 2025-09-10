import { db } from '../server/db';
import { questions, users, topics } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

async function seedSimpleQuestions() {
  console.log("🌱 Starting simple questions seeding...");
  
  // Ensure seed user exists
  const seedUser = await db.select().from(users).where(eq(users.email, "seed@theceylonx.com"));
  if (seedUser.length === 0) {
    await db.insert(users).values({
      id: nanoid(),
      email: "seed@theceylonx.com",
      name: "CeylonX"
    });
  }
  
  const user = await db.select().from(users).where(eq(users.email, "seed@theceylonx.com"));
  const userId = user[0].id;
  
  // Create a default topic if none exists
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
    },
    {
      id: "sample-q-006",
      title: "Budget for 2 weeks in Sri Lanka?",
      body: "What's a realistic budget for two people traveling Sri Lanka for 2 weeks? Including accommodation, food, transport, and activities.",
      slug: "budget-2-weeks-sri-lanka-realistic",
      tags: ["budget", "planning", "2weeks", "accommodation", "transport"],
      userId,
      topicId,
      isAnonymous: false,
      views: 123,
      votesCount: 31,
      answersCount: 8
    },
    {
      id: "sample-q-007",
      title: "Nuwara Eliya tea plantation tours - which one?",
      body: "There are so many tea plantations around Nuwara Eliya. Which ones offer the best tours with tastings?",
      slug: "nuwara-eliya-tea-plantation-tours-best",
      tags: ["nuwara-eliya", "tea", "plantation", "tours", "tasting"],
      userId,
      topicId,
      isAnonymous: false,
      views: 41,
      votesCount: 11,
      answersCount: 3
    },
    {
      id: "sample-q-008",
      title: "Galle Fort - one day enough?",
      body: "Visiting Galle Fort for the first time. Can I see everything in one day or should I stay overnight?",
      slug: "galle-fort-one-day-enough",
      tags: ["galle", "fort", "one-day", "itinerary"],
      userId,
      topicId,
      isAnonymous: false,
      views: 38,
      votesCount: 8,
      answersCount: 2
    },
    {
      id: "sample-q-009",
      title: "Local SIM card in Sri Lanka - which provider?",
      body: "Need a local SIM card for data and calls. Which mobile provider has the best coverage and tourist packages?",
      slug: "local-sim-card-sri-lanka-provider",
      tags: ["sim-card", "mobile", "data", "provider", "tourist"],
      userId,
      topicId,
      isAnonymous: false,
      views: 67,
      votesCount: 15,
      answersCount: 6
    },
    {
      id: "sample-q-010",
      title: "Anuradhapura vs Polonnaruwa - which ancient city?",
      body: "I can only visit one ancient city. Between Anuradhapura and Polonnaruwa, which would you recommend and why?",
      slug: "anuradhapura-vs-polonnaruwa-which-ancient-city",
      tags: ["anuradhapura", "polonnaruwa", "ancient", "cities", "recommendation"],
      userId,
      topicId,
      isAnonymous: false,
      views: 52,
      votesCount: 19,
      answersCount: 5
    }
  ];

  let questionCount = 0;
  
  for (const question of sampleQuestions) {
    const existing = await db.select().from(questions).where(eq(questions.id, question.id));
    if (existing.length === 0) {
      try {
        await db.insert(questions).values(question);
        questionCount++;
        console.log(`✅ Created question: ${question.title}`);
      } catch (error) {
        console.error(`❌ Failed to create question ${question.title}:`, error);
      }
    } else {
      console.log(`⚠️ Question already exists: ${question.title}`);
    }
  }
  
  console.log(`✅ Seeded ${questionCount} sample questions`);
}

async function main() {
  try {
    console.log("🌱 Starting simple questions seeding...");
    await seedSimpleQuestions();
    console.log("🎉 Questions seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding questions:", error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { seedSimpleQuestions };