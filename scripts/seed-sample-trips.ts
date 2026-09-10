/**
 * Seed 10 realistic Sri Lanka trips.
 * Run: npx tsx scripts/seed-sample-trips.ts
 */
import { db } from '../server/db';
import { trips, users, tripMetadata } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

const SEED_USERS = [
  { email: 'seed@theceylonx.com', name: 'CeylonX Team' },
  { email: 'traveler1@theceylonx.com', name: 'Nimal Perera' },
  { email: 'traveler2@theceylonx.com', name: 'Sanduni Silva' },
  { email: 'traveler3@theceylonx.com', name: 'Kasun Fernando' },
  { email: 'guide@theceylonx.com', name: 'Ruwan Jayawardena' },
];

async function ensureUsers() {
  const ids: Record<string, string> = {};
  for (const u of SEED_USERS) {
    const existing = await db.select().from(users).where(eq(users.email, u.email));
    if (existing.length > 0) {
      ids[u.email] = existing[0].id;
    } else {
      const id = nanoid();
      await db.insert(users).values({ id, email: u.email, name: u.name });
      ids[u.email] = id;
    }
  }
  return ids;
}

function futureDate(daysFromNow: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d;
}

async function main() {
  console.log('Seeding sample trips...');

  const userIds = await ensureUsers();
  console.log('✅ Users ready');

  const SAMPLE_TRIPS = [
    {
      id: 'trip-seed-001',
      title: 'Colombo to Kandy — Temple of the Tooth & Botanical Gardens',
      fromLocation: 'Colombo Fort',
      toLocation: 'Kandy',
      date: futureDate(7),
      time: '06:30',
      seatsAvailable: 3,
      price: '3500.00',
      description: 'Heading to Kandy for the weekend. Plan to visit the Temple of the Tooth, Royal Botanical Gardens in Peradeniya, and the Kandy Lake walk. Have a car with AC. Looking for 2–3 travel buddies to split fuel. Will stop at a local rice and curry spot on the way.',
      region: 'central',
      category: 'culture',
      organizerEmail: 'traveler1@theceylonx.com',
    },
    {
      id: 'trip-seed-002',
      title: 'Ella Adventure Weekend — Nine Arch Bridge, Little Adam\'s Peak & Ella Rock',
      fromLocation: 'Colombo',
      toLocation: 'Ella',
      date: futureDate(10),
      time: '05:00',
      seatsAvailable: 2,
      price: '5000.00',
      description: 'Full adventure weekend in Ella. Driving up Friday night, hiking Saturday and Sunday. Nine Arch Bridge at sunrise, Little Adam\'s Peak mid-morning, and Ella Rock full day hike Sunday. Staying at a guesthouse with a mountain view — happy to share the room recommendation. Good for fit hikers, moderate trails.',
      region: 'uva',
      category: 'hiking',
      organizerEmail: 'traveler2@theceylonx.com',
    },
    {
      id: 'trip-seed-003',
      title: 'Mirissa Beach Long Weekend — Whale Watching + Beach Days',
      fromLocation: 'Colombo',
      toLocation: 'Mirissa',
      date: futureDate(14),
      time: '07:00',
      seatsAvailable: 4,
      price: '4000.00',
      description: 'Heading south for a 3-day beach escape. Have whale watching boat booked for Saturday morning (blue whales and sperm whales in season). Rest of the time is relaxed beach, food, and sunset drinks. Car has space for 4 more. Will split highway tolls and fuel equally.',
      region: 'southern',
      category: 'beach',
      organizerEmail: 'guide@theceylonx.com',
    },
    {
      id: 'trip-seed-004',
      title: 'Sigiriya & Dambulla Day Trip from Colombo',
      fromLocation: 'Colombo',
      toLocation: 'Sigiriya',
      date: futureDate(5),
      time: '04:30',
      seatsAvailable: 3,
      price: '2500.00',
      description: 'Early start to beat the crowds at Sigiriya Rock Fortress. Climbing starts at 6am before the heat and tourist rush. Then onto Dambulla Cave Temple in the afternoon. Back in Colombo by evening. I drive fast but safely — 3hr journey. Snacks and water provided. Bring comfortable climbing shoes.',
      region: 'north_central',
      category: 'culture',
      organizerEmail: 'traveler3@theceylonx.com',
    },
    {
      id: 'trip-seed-005',
      title: 'Yala National Park Safari — 2 Night Wildlife Trip',
      fromLocation: 'Galle',
      toLocation: 'Yala',
      date: futureDate(21),
      time: '14:00',
      seatsAvailable: 2,
      price: '12000.00',
      description: 'Joining a private jeep safari for 2 nights at Yala. Have a jeep and lodge booked. Looking for 1–2 people to share costs. Morning and evening safaris both days. Leopard, elephant, crocodile, and sloth bear country. Price per person covers jeep and accommodation share — food extra. Total trip cost dramatically reduced by sharing.',
      region: 'southern',
      category: 'wildlife',
      organizerEmail: 'traveler1@theceylonx.com',
    },
    {
      id: 'trip-seed-006',
      title: 'Nuwara Eliya Tea Country Drive — Horton Plains Included',
      fromLocation: 'Kandy',
      toLocation: 'Nuwara Eliya',
      date: futureDate(8),
      time: '06:00',
      seatsAvailable: 3,
      price: '3000.00',
      description: 'Scenic drive through the tea estates from Kandy to Nuwara Eliya. Stopping at a working tea factory for a tour and tasting. Then Horton Plains National Park and World\'s End viewpoint in the afternoon. Plan to stay overnight in a colonial-era guesthouse. British hill station vibes, cold weather — bring a layer.',
      region: 'central',
      category: 'hiking',
      organizerEmail: 'seed@theceylonx.com',
    },
    {
      id: 'trip-seed-007',
      title: 'Arugam Bay Surf Trip — East Coast Season',
      fromLocation: 'Colombo',
      toLocation: 'Arugam Bay',
      date: futureDate(30),
      time: '22:00',
      seatsAvailable: 3,
      price: '4500.00',
      description: 'Night drive to Arugam Bay for surf season. Leaving Saturday night, arriving Sunday morning. 4–5 days planned. Best surf season is June–September — this trip hits the peak. Staying at a surf camp near the main point. Beginners welcome, rental boards available on site. This is a chill trip, good vibes only.',
      region: 'eastern',
      category: 'beach',
      organizerEmail: 'traveler2@theceylonx.com',
    },
    {
      id: 'trip-seed-008',
      title: 'Jaffna Cultural Discovery — North Sri Lanka Weekend',
      fromLocation: 'Colombo',
      toLocation: 'Jaffna',
      date: futureDate(18),
      time: '05:30',
      seatsAvailable: 2,
      price: '6000.00',
      description: 'Weekend trip to Jaffna — one of the most underrated destinations in Sri Lanka. Nallur Kandaswamy Temple, the Jaffna Fort, Casuarina Beach, and the islands off the peninsula. Tamil cuisine is incredible here — crab curry you won\'t find in Colombo. Long drive but worth every km. Have a 4-seat car.',
      region: 'northern',
      category: 'culture',
      organizerEmail: 'guide@theceylonx.com',
    },
    {
      id: 'trip-seed-009',
      title: 'Knuckles Mountain Range Trekking — 2 Day Hike',
      fromLocation: 'Kandy',
      toLocation: 'Knuckles Range',
      date: futureDate(12),
      time: '07:00',
      seatsAvailable: 4,
      price: '2000.00',
      description: 'Guided 2-day trek through the Knuckles Conservation Forest. Day 1: Mini World\'s End and cloud forest trail. Day 2: Corbett\'s Gap to Pitawala Pathana grasslands. Camping overnight with sleeping bags and basic kit provided. Moderate difficulty — some steep sections. Spectacular biodiversity, chance of seeing purple-faced langurs and endemic birds.',
      region: 'central',
      category: 'hiking',
      organizerEmail: 'traveler3@theceylonx.com',
    },
    {
      id: 'trip-seed-010',
      title: 'Trincomalee Beach & Ancient Sites — East Coast Escape',
      fromLocation: 'Colombo',
      toLocation: 'Trincomalee',
      date: futureDate(25),
      time: '06:00',
      seatsAvailable: 3,
      price: '5500.00',
      description: 'Trinco has one of the best natural harbours in the world and the best beaches on the east coast in season. Marble Beach, Pigeon Island snorkelling (turtles and reef fish), Koneswaram Temple on the cliff, and Fort Frederick. 3-night trip. Best to go May–September when the east is calm and the west is monsooning.',
      region: 'eastern',
      category: 'beach',
      organizerEmail: 'seed@theceylonx.com',
    },
  ] as const;

  let count = 0;
  for (const trip of SAMPLE_TRIPS) {
    const existing = await db.select().from(trips).where(eq(trips.id, trip.id));
    if (existing.length > 0) {
      console.log(`  Exists, skipping: ${trip.title}`);
    } else {
      const organizerId = userIds[trip.organizerEmail];
      if (!organizerId) { console.warn(`  No user for ${trip.organizerEmail}`); continue; }

      await db.insert(trips).values({
        id: trip.id,
        title: trip.title,
        fromLocation: trip.fromLocation,
        toLocation: trip.toLocation,
        date: trip.date,
        time: trip.time,
        seatsAvailable: trip.seatsAvailable,
        price: trip.price,
        region: trip.region,
        category: trip.category,
        organizerId,
        status: 'active',
      });
      count++;
      console.log(`  ✅ ${trip.title}`);
    }
    await db.insert(tripMetadata).values({
      tripId: trip.id,
      notes: trip.description,
    }).onConflictDoUpdate({
      target: tripMetadata.tripId,
      set: { notes: trip.description },
    });
  }

  console.log(`\nDone. Inserted ${count} trips.`);
}

main().catch(console.error).finally(() => process.exit());
