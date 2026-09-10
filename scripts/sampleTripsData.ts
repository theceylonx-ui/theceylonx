/**
 * Pure data for the sample-trip seed script (scripts/seed-trips.ts).
 * No DB import here on purpose — this module is safe to import from tests
 * (see server/__tests__/sampleTripsData.test.ts) without a DATABASE_URL.
 */

import type { tripCategoryEnum } from '../shared/schema';

type TripCategory = (typeof tripCategoryEnum.enumValues)[number];

export interface SeedUser {
  email: string;
  name: string;
  displayName: string;
}

export const SEED_USERS: SeedUser[] = [
  { email: "seed@hibowan.com", name: "HiBowan Team", displayName: "HiBowan Team" },
  { email: "traveler1@hibowan.com", name: "Nimal Perera", displayName: "Nimal Perera" },
  { email: "traveler2@hibowan.com", name: "Sanduni Silva", displayName: "Sanduni Silva" },
  { email: "guide@hibowan.com", name: "Ruwan Jayawardena", displayName: "Ruwan Jayawardena" },
  { email: "explorer@hibowan.com", name: "Kasun Fernando", displayName: "Kasun Fernando" },
];

export function futureDate(daysFromNow: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d;
}

export interface SampleTrip {
  id: string;
  title: string;
  fromLocation: string;
  toLocation: string;
  date: Date;
  time: string;
  seatsAvailable: number;
  price: string;
  region: string;
  category: TripCategory;
  organizerEmail: string;
  organizerPhone: string;
  contactInfo: string;
  status: string;
  notes: string;
  tags: string[];
}

export const SAMPLE_TRIPS: SampleTrip[] = [
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
    category: "culture",
    organizerEmail: "seed@hibowan.com",
    organizerPhone: "771234567",
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
    category: "culture",
    organizerEmail: "traveler1@hibowan.com",
    organizerPhone: "772345678",
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
    category: "adventure_sport",
    organizerEmail: "traveler2@hibowan.com",
    organizerPhone: "771122334",
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
    category: "hiking",
    organizerEmail: "guide@hibowan.com",
    organizerPhone: "774455667",
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
    category: "wildlife",
    organizerEmail: "explorer@hibowan.com",
    organizerPhone: "777888999",
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
    category: "hiking",
    organizerEmail: "seed@hibowan.com",
    organizerPhone: "771234567",
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
    category: "culture",
    organizerEmail: "guide@hibowan.com",
    organizerPhone: "774455667",
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
    category: "wildlife",
    organizerEmail: "explorer@hibowan.com",
    organizerPhone: "777888999",
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
    category: "beach",
    organizerEmail: "traveler1@hibowan.com",
    organizerPhone: "772345678",
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
    category: "culture",
    organizerEmail: "traveler2@hibowan.com",
    organizerPhone: "771122334",
    contactInfo: "Contact via WhatsApp",
    status: "active",
    notes: "One of Sri Lanka's most underrated regions — Nallur Kandaswamy Temple, Jaffna Fort, Casuarina Beach, and Tamil cuisine.",
    tags: ["jaffna", "culture", "northcoast"],
  },
];
