import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { topics, questions, answers, users } from "../shared/schema.ts";
import { nanoid } from "nanoid";
import { eq, and } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function seedTopics() {
  const topicsData = [
    { slug: "hidden-trails", name: "Hidden Trails & Trekking", description: "Knuckles, Pekoe Trail, secret waterfalls" },
    { slug: "culture-rituals", name: "Culture & Rituals", description: "Festivals, temple etiquette, customs" },
    { slug: "food-kitchens", name: "Food & Local Kitchens", description: "Home cooking, street food, regional dishes" },
    { slug: "coast-surf-sea", name: "Coast, Surf & Sea", description: "Uncrowded beaches, surfing, diving" },
    { slug: "wellness-ayurveda", name: "Wellness & Ayurveda", description: "Retreats, meditation, healing" },
    { slug: "transport-logistics", name: "Transport & Logistics", description: "Getting around, train schedules, bus routes" },
    { slug: "accommodation", name: "Accommodation", description: "Hotels, guesthouses, homestays, camping" },
    { slug: "budget-travel", name: "Budget Travel", description: "Affordable options, cost-saving tips" },
    { slug: "safety-tips", name: "Safety & Tips", description: "Travel safety, local customs, what to avoid" },
    { slug: "photography", name: "Photography", description: "Best spots for photos, sunrise/sunset locations" },
    { slug: "wildlife-nature", name: "Wildlife & Nature", description: "National parks, elephants, leopards, bird watching" },
    { slug: "others", name: "Others", description: "General questions and topics not covered above" },
  ];

  for (const topic of topicsData) {
    const existing = await db.select().from(topics).where(eq(topics.slug, topic.slug));
    if (existing.length === 0) {
      await db.insert(topics).values({
        id: nanoid(),
        ...topic
      });
    }
  }
}

async function seedUsers() {
  const usersData = [
    { email: "seed@theceylonx.com", name: "CeylonX" },
    { email: "traveler1@theceylonx.com", name: "Traveler One" },
    { email: "traveler2@theceylonx.com", name: "Traveler Two" },
    { email: "traveler3@theceylonx.com", name: "Traveler Three" },
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

const QA = [
  // HIDDEN TRAILS & TREKKING
  {
    topicSlug: "hidden-trails",
    title: "Is the Knuckles Range suitable for a beginner-friendly day hike with viewpoints?",
    bodyHtml:
      "<p>Looking for a quiet, beginner-friendly trail in the Knuckles Range with viewpoints but without crowded paths. Any route tips, entry points, and safety basics?</p>",
    tags: ["knuckles", "hike", "dayhike", "viewpoints"],
    votes: 6,
    answers: [
      {
        authorEmail: "seed@theceylonx.com",
        bodyHtml:
          "<p>Yes. Try the <strong>Mini World's End (Pitawala Pathana)</strong> boardwalk loop. It's short (≈1.5–2 km), relatively flat, and offers a dramatic escarpment view. Go early (before 9am) for clear skies. Bring water, a hat, and keep to the marked path—edges can be windy.</p>",
        votes: 7,
        accepted: true,
      },
      {
        authorEmail: "traveler1@theceylonx.com",
        bodyHtml:
          "<p>If you want a bit more challenge, the <em>Deanston</em> nature trail is easy-moderate, with shade and river sounds. Check weather—mist can roll in fast.</p>",
      },
    ],
  },
  {
    topicSlug: "hidden-trails",
    title: "How do I find lesser-known waterfalls without causing harm to the area?",
    bodyHtml:
      "<p>We want to explore hidden waterfalls, but we're concerned about safety and sustainability. Any guidelines or general tips?</p>",
    tags: ["waterfalls", "safety", "sustainability"],
    votes: 4,
    answers: [
      {
        authorEmail: "seed@theceylonx.com",
        bodyHtml:
          "<p>Follow <strong>Leave No Trace</strong>: go with a local guide, avoid posting exact GPS pins publicly, pack out all waste, and don't build rock stacks. Check recent rainfall—flash floods can occur. Wear proper footwear; algae on rocks is slippery.</p>",
        votes: 5,
        accepted: true,
      },
    ],
  },

  // CULTURE & RITUALS
  {
    topicSlug: "culture-rituals",
    title: "Temple etiquette for first-timers in Sri Lanka?",
    bodyHtml:
      "<p>We want to attend a village temple ceremony respectfully. What should we wear and avoid?</p>",
    tags: ["etiquette", "temple", "culture"],
    votes: 8,
    answers: [
      {
        authorEmail: "seed@theceylonx.com",
        bodyHtml:
          "<p>Wear modest clothing (shoulders and knees covered). Remove shoes and hats before entering. Keep voices low, ask before photographing people, and never turn your back to the main shrine while posing. Offerings are welcome—flowers or fruit are common.</p>",
        votes: 10,
        accepted: true,
      },
      {
        authorEmail: "traveler2@theceylonx.com",
        bodyHtml:
          "<p>Also avoid touching sacred objects or statues. If unsure, follow what locals do, or ask a caretaker politely.</p>",
        votes: 2,
      },
    ],
  },
  {
    topicSlug: "culture-rituals",
    title: "Are small village festivals open to outsiders?",
    bodyHtml:
      "<p>We've heard of lesser-known processions and village shows. Can travelers attend? How do we contribute responsibly?</p>",
    tags: ["festivals", "village", "responsible"],
    answers: [
      {
        authorEmail: "seed@theceylonx.com",
        bodyHtml:
          "<p>Many are community-led and welcoming. Go with a local contact or guide, make a small donation when appropriate, and keep space for performers. Avoid blocking pathways and be careful with flash photography.</p>",
        accepted: true,
      },
    ],
  },

  // FOOD & LOCAL KITCHENS
  {
    topicSlug: "food-kitchens",
    title: "What's a respectful way to join a village cooking experience?",
    bodyHtml:
      "<p>We want to learn a home-style Sri Lankan curry. How to find hosts and participate respectfully?</p>",
    tags: ["cooking", "local", "food"],
    votes: 5,
    answers: [
      {
        authorEmail: "seed@theceylonx.com",
        bodyHtml:
          "<p>Look for small, vetted hosts via community collectives or eco-stays. Bring a small gift (spices/tea). Ask about dietary preferences beforehand. Help with prep/cleanup and request permission before filming. Always credit your host if you share online.</p>",
        votes: 6,
        accepted: true,
      },
    ],
  },
  {
    topicSlug: "food-kitchens",
    title: "Must-try regional dishes off the tourist trail?",
    bodyHtml:
      "<p>Beyond kottu and hoppers, what regional dishes should we try on lesser-known routes?</p>",
    tags: ["regional", "dishes", "offbeat"],
    answers: [
      {
        authorEmail: "seed@theceylonx.com",
        bodyHtml:
          "<p>Try <strong>Jaffna crab curry</strong>, <em>odiyal kool</em> (a seafood root broth), eastern <em>pittu</em> with coconut sambol, and hill-country <em>gotu kola</em> salads. Ask locals for small eateries over highway restaurants.</p>",
        accepted: true,
      },
    ],
  },

  // COAST, SURF & SEA
  {
    topicSlug: "coast-surf-sea",
    title: "Where can beginners surf without crowds?",
    bodyHtml:
      "<p>Looking for mellow breaks suitable for first-timers and longboards, ideally away from heavy crowds.</p>",
    tags: ["surf", "beginner", "coast"],
    votes: 7,
    answers: [
      {
        authorEmail: "seed@theceylonx.com",
        bodyHtml:
          "<p>Ask locally about sand-bottom breaks near quieter bays and go early morning. Choose licensed instructors, warm up properly, and avoid reef days until you're confident. Respect lineups—safety first.</p>",
        votes: 8,
        accepted: true,
      },
    ],
  },
  {
    topicSlug: "coast-surf-sea",
    title: "Best practices for ethical turtle watching?",
    bodyHtml:
      "<p>We want to see turtles but avoid disturbing them. Any guidelines?</p>",
    tags: ["wildlife", "turtles", "ethics"],
    answers: [
      {
        authorEmail: "seed@theceylonx.com",
        bodyHtml:
          "<p>Use reputable guides, keep distance, no touching, and avoid bright lights/flash at night. Don't stand between turtles and the water. Follow site rules and keep groups small.</p>",
        accepted: true,
      },
    ],
  },

  // WELLNESS & AYURVEDA
  {
    topicSlug: "wellness-ayurveda",
    title: "How to choose a genuine Ayurveda experience?",
    bodyHtml:
      "<p>We'd like a short wellness stay that's authentic. What should we look for?</p>",
    tags: ["ayurveda", "wellness", "authentic"],
    votes: 9,
    answers: [
      {
        authorEmail: "seed@theceylonx.com",
        bodyHtml:
          "<p>Check for qualified practitioners, an intake consultation, and treatments matched to your condition rather than one-size-fits-all packages. Ask about ingredients, rest time, and diet plans. Avoid aggressive upselling.</p>",
        votes: 9,
        accepted: true,
      },
    ],
  },
  {
    topicSlug: "wellness-ayurveda",
    title: "Is meditation in forest temples okay for visitors?",
    bodyHtml:
      "<p>We're keen to try meditation in a forest monastery. Any etiquette or access tips?</p>",
    tags: ["meditation", "forest", "etiquette"],
    answers: [
      {
        authorEmail: "seed@theceylonx.com",
        bodyHtml:
          "<p>Some monasteries welcome visitors during specific hours. Wear modest clothes, keep devices silent, and follow posted rules. Donations are appreciated but not required. Stay quiet and leave no trace.</p>",
        accepted: true,
      },
    ],
  },

  // EXTRA (LOGISTICS / SAFETY within topics flavor)
  {
    topicSlug: "hidden-trails",
    title: "Self-drive vs. local guide for remote hikes?",
    bodyHtml:
      "<p>We're experienced travelers but new to Sri Lanka. Should we self-navigate or hire a guide for remote trails?</p>",
    tags: ["selfdrive", "guide", "safety"],
    votes: 3,
    answers: [
      {
        authorEmail: "seed@theceylonx.com",
        bodyHtml:
          "<p>For remote or unmarked trails, go with a local guide—safer, faster route-finding, and better cultural context. Self-drive is fine for well-known lookouts—just check road conditions and weather.</p>",
        votes: 4,
        accepted: true,
      },
    ],
  },
  {
    topicSlug: "culture-rituals",
    title: "Can we film traditional dance rehearsals?",
    bodyHtml:
      "<p>We found a community dance practice and want to document respectfully. What's appropriate?</p>",
    tags: ["dance", "filming", "permission"],
    answers: [
      {
        authorEmail: "seed@theceylonx.com",
        bodyHtml:
          "<p>Always ask permission first and be ready to stop if requested. Share copies with the troupe if they'd like. Avoid obstructing performers and don't use bright lights. Credit the group when posting.</p>",
        accepted: true,
      },
    ],
  },
];

async function seedQA() {
  const allTopics = await db.select().from(topics);
  const topicsBySlug = new Map(allTopics.map(t => [t.slug, t]));
  
  const seedUser = await db.select().from(users).where(eq(users.email, "seed@theceylonx.com"));
  if (seedUser.length === 0) {
    console.error("Seed user not found");
    return;
  }
  const seedUserId = seedUser[0].id;

  let qCount = 0;
  let aCount = 0;

  for (const item of QA) {
    const topic = topicsBySlug.get(item.topicSlug);
    if (!topic) continue;

    const slug = slugify(item.title);
    const existing = await db.select().from(questions).where(eq(questions.slug, slug));
    
    let questionId;
    if (existing.length === 0) {
      const [question] = await db.insert(questions).values({
        id: nanoid(),
        title: item.title,
        body: item.bodyHtml,
        tags: item.tags,
        slug,
        topicId: topic.id,
        userId: seedUserId,
        isAnonymous: false,
        votesCount: item.votes ?? 0,
        answersCount: 0
      }).returning();
      questionId = question.id;
      qCount++;
    } else {
      questionId = existing[0].id;
    }

    // Add answers
    let acceptedAnswerId = null;
    for (const ans of item.answers) {
      const user = await db.select().from(users).where(eq(users.email, ans.authorEmail));
      const userId = user.length > 0 ? user[0].id : seedUserId;
      
      const [answer] = await db.insert(answers).values({
        id: nanoid(),
        body: ans.bodyHtml,
        questionId,
        userId,
        votesCount: ans.votes ?? 0,
        isAccepted: !!ans.accepted
      }).returning();
      
      if (ans.accepted) acceptedAnswerId = answer.id;
      aCount++;
    }

    // Update question with accepted answer and answer count
    const answerCount = await db.select().from(answers).where(eq(answers.questionId, questionId));
    await db.update(questions)
      .set({ 
        acceptedAnswerId,
        answersCount: answerCount.length
      })
      .where(eq(questions.id, questionId));
  }

  console.log(`Seeded Questions: ${qCount}, Answers: ${aCount} ✅`);
}

async function main() {
  console.log("Starting community seed...");
  await seedTopics();
  console.log("Topics seeded ✅");
  
  await seedUsers();
  console.log("Users seeded ✅");
  
  await seedQA();
  console.log("Q&A seeded ✅");
  
  console.log("Community seed completed!");
}

main().catch(console.error);