/**
 * Seed CeylonX Tribes with starter questions and answers.
 * Run: npx tsx scripts/seed-tribes.ts
 */
import { db } from '../server/db';
import { topics, questions, answers, users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

const SEED_EMAIL = 'seed@theceylonx.com';

async function ensureSeedUser() {
  const existing = await db.select().from(users).where(eq(users.email, SEED_EMAIL));
  if (existing.length > 0) return existing[0].id;
  const id = nanoid();
  await db.insert(users).values({ id, email: SEED_EMAIL, name: 'CeylonX Team' });
  return id;
}

const TOPICS = [
  { slug: 'transport', name: 'Getting Around', description: 'Tuk tuks, trains, buses, and road trips' },
  { slug: 'safety', name: 'Safety & Tips', description: 'Staying safe and smart while travelling Sri Lanka' },
  { slug: 'hidden-gems', name: 'Hidden Gems', description: 'Places locals love but tourists rarely find' },
  { slug: 'budget', name: 'Budget Travel', description: 'Making the most of your LKR' },
  { slug: 'culture', name: 'Culture & Customs', description: 'Festivals, temple etiquette, and local life' },
  { slug: 'food', name: 'Food & Drink', description: 'Best eats from Colombo to Jaffna' },
  { slug: 'beaches', name: 'Beaches & Coast', description: 'Surf, swim, and sunset spots' },
  { slug: 'wildlife', name: 'Wildlife & Nature', description: 'Yala, Wilpattu, Sinharaja and beyond' },
];

const QA = [
  {
    topicSlug: 'transport',
    title: 'What is the best way to get from Colombo to Ella without a private car?',
    body: `I'm planning a solo trip and want to do the Colombo → Ella route on a budget. Is the train the best option? How far in advance do I need to book observation car seats?`,
    answer: `The train is absolutely the best option — the Colombo to Ella journey (via Kandy and Nanu Oya) is one of the most scenic rail rides in Asia. Buy Observation Car tickets (2nd class) at least 2–3 weeks in advance from the Sri Lanka Railways website or a local travel agent. If observation car is sold out, get a 3rd class unreserved ticket and stand near the open door — half the fun. The full journey takes around 9–10 hours. Break it at Kandy for a night if you want a more relaxed pace.`,
  },
  {
    topicSlug: 'safety',
    title: 'Is it safe for solo female travellers in Sri Lanka?',
    body: `Heading to Sri Lanka solo for 3 weeks. Any areas or situations I should be particularly careful about? Also what's the dress code for temple visits?`,
    answer: `Sri Lanka is generally very safe for solo female travellers — you'll find locals helpful and genuinely friendly. The main thing to watch is persistent tuk-tuk touts and beach vendors who can be pushy. Agree on a price before getting in any tuk-tuk. For temples and cultural sites, cover shoulders and knees — carry a light sarong in your bag, most major temples will have one to borrow. Avoid isolated beaches after dark. North and East are fine to visit now. Colombo at night is safe in areas like Colombo 3 and 7.`,
  },
  {
    topicSlug: 'hidden-gems',
    title: 'Which waterfall near Ella is less crowded than Ravana Falls?',
    body: `Ravana Falls looks beautiful but I've seen photos of big tourist crowds. Are there similar waterfalls nearby that locals prefer?`,
    answer: `Diyaluma Falls near Koslanda (about 45min from Ella) is significantly more dramatic than Ravana and sees maybe 10% of the crowd. It's the second highest waterfall in Sri Lanka and you can hike to the top for natural infinity pools. Bambarakanda Falls (highest in SL) near Belihuloya is another great alternative. For something closer to Ella town, the trail to Ella Rock passes some small unnamed cascades that are lovely after rain. Go early morning regardless of which you pick.`,
  },
  {
    topicSlug: 'budget',
    title: 'What is a realistic daily budget for travelling Sri Lanka in 2026?',
    body: `I've been reading conflicting advice online — some say $25/day is fine, others say $60+. What's realistic now for a backpacker who wants to eat well and not stay in dorms every night?`,
    answer: `For 2026, budget around $35–45 USD/day for comfortable budget travel: a decent private guesthouse room (LKR 5,000–9,000), local meals (rice and curry for LKR 300–600, tourist restaurant LKR 1,200–2,000), tuk-tuk and bus transport (very cheap), and one paid activity per day. Dorm travellers can do $20–25. Splurge travellers in boutique hotels looking at $80–120. The biggest variable is accommodation — book in advance for Ella and Sigiriya, prices spike 3x if you walk in. Travel shoulder season (May–June or November) and you'll pay 20–30% less across the board.`,
  },
  {
    topicSlug: 'culture',
    title: 'What should I know before attending a Buddhist temple ceremony in Sri Lanka?',
    body: `There's a Poya Day coming up while I'm in Kandy and I'd love to experience a temple ceremony. Any rules or etiquette I should follow?`,
    answer: `Poya (full moon) days are wonderful to witness. A few essentials: remove shoes before entering temple grounds, cover shoulders and knees fully (not just a wrap), don't turn your back to a Buddha statue for photos, don't point feet toward statues. Alcohol is not sold on Poya days. At the Kandy Esala Perahera (August) arrive very early for street-side spots. Photography is usually fine in outer areas but always check inside shrines. Locals will appreciate any genuine curiosity — don't be shy to ask questions politely.`,
  },
  {
    topicSlug: 'food',
    title: 'Where can I find the best kottu roti in Colombo?',
    body: `I had kottu roti at a tourist restaurant and it was okay but felt watered down. Where do locals actually eat it?`,
    answer: `Skip the tourist strip and head to Pilawoos on Galle Road in Colombo 3 — open until 3am, iconic, always packed with locals. Also try the kottu spots on Duplication Road or the Majestic City area side streets. For a sit-down version, Upali's on Nawala Road does exceptional kottu. The key marker of a good spot: loud sizzle and a full cook in front of you chopping on the griddle. Order "cheese kottu" if you want indulgence. Real local price is LKR 350–600; if they're charging LKR 1,500 you're in a tourist trap.`,
  },
  {
    topicSlug: 'beaches',
    title: 'Which south coast beach is best for swimming vs surfing in December?',
    body: `Arriving in December and the south coast is calling. I want to swim (not surf) but I know the seasons affect which side is calm. Unawatuna vs Mirissa vs Tangalle?`,
    answer: `December is peak season on the south coast — all three are calm and swimmable. Unawatuna has the most sheltered bay, great for swimming but gets very crowded. Mirissa is slightly rougher but still swimmable and has a great beach bar scene plus whale watching boats from November. Tangalle is the most laid-back — several small coves, very local feel, excellent for those wanting less tourism. For a day trip combination: base in Mirissa, day trip to Tangalle east beaches (Rekawa is stunning). Avoid the far western surf beaches like Hikkaduwa in December — they get choppier.`,
  },
  {
    topicSlug: 'wildlife',
    title: 'Yala or Wilpattu — which national park is better for leopard sightings?',
    body: `I can only fit one safari into my itinerary. Is Yala still the best for leopards or is Wilpattu worth the trip from the south coast?`,
    answer: `Yala Block 1 has the highest leopard density of any park in the world and gives you the best odds of a sighting — often 3–5 in a single morning safari. But it's crowded with jeeps, especially December–April. Wilpattu is larger, wilder, and far quieter — but leopards are harder to spot because of the dense forest. If leopards are your priority and you don't mind other jeeps: Yala. If you want an immersive safari experience and are okay with maybe not seeing a leopard: Wilpattu. Book safaris directly with the park lodges; avoid overpriced Colombo tour operators. Go for the morning safari (5:30am), afternoon is hot and animals hide.`,
  },
];

async function main() {
  console.log('Seeding CeylonX Tribes...');

  const seedUserId = await ensureSeedUser();
  console.log(`✅ Seed user ready: ${seedUserId}`);

  // Upsert topics
  const topicIdMap: Record<string, string> = {};
  for (const t of TOPICS) {
    const existing = await db.select().from(topics).where(eq(topics.slug, t.slug));
    if (existing.length > 0) {
      topicIdMap[t.slug] = existing[0].id;
      console.log(`  Topic exists: ${t.name}`);
    } else {
      const id = nanoid();
      await db.insert(topics).values({ id, ...t });
      topicIdMap[t.slug] = id;
      console.log(`  Created topic: ${t.name}`);
    }
  }

  // Insert questions + answers
  let qCount = 0;
  let aCount = 0;
  for (const qa of QA) {
    const topicId = topicIdMap[qa.topicSlug];
    if (!topicId) { console.warn(`  No topic found for slug: ${qa.topicSlug}`); continue; }

    // Skip if question already exists
    const existing = await db.select().from(questions).where(eq(questions.title, qa.title));
    if (existing.length > 0) { console.log(`  Question exists, skipping: ${qa.title.slice(0, 50)}...`); continue; }

    const questionId = nanoid();
    await db.insert(questions).values({
      id: questionId,
      title: qa.title,
      body: qa.body,
      userId: seedUserId,
      topicId,
      visibility: 'public',
      votesCount: 0,
      score: 0,
      answersCount: 1,
    });
    qCount++;

    const answerId = nanoid();
    await db.insert(answers).values({
      id: answerId,
      body: qa.answer,
      questionId,
      userId: seedUserId,
      votesCount: 0,
      score: 0,
      isAccepted: true,
    });
    aCount++;

    // Mark accepted answer on the question
    await db.update(questions)
      .set({ acceptedAnswerId: answerId })
      .where(eq(questions.id, questionId));

    console.log(`  ✅ Q+A: ${qa.title.slice(0, 50)}...`);
  }

  console.log(`\nDone. Created ${qCount} questions and ${aCount} answers.`);
}

main().catch(console.error).finally(() => process.exit());
