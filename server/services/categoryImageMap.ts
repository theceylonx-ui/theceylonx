/**
 * Curated Image Catalog for Ceylon Expand
 * All images are Sri Lanka-specific and categorized for trip types
 */

export type TripCategory =
  | 'roadtrip' | 'hiking' | 'beach' | 'culture' | 'wellness' | 'festival'
  | 'workshop' | 'wildlife' | 'food' | 'adventure_sport' | 'unknown';

export interface ImageChoice {
  url: string;
  attribution?: {
    authorName?: string;
    authorUrl?: string;
    sourceUrl?: string;
    license?: string;
  };
}

/**
 * Curated catalog of Sri Lanka-specific images for each trip category
 * Images are stored in /public/assets/category/ and served directly
 */
export const CATEGORY_CHOICES: Record<TripCategory, Array<ImageChoice>> = {
  roadtrip: [
    { url: '/assets/category/roadtrip_01.jpg' },
    { url: '/assets/category/roadtrip_02.jpg' },
    { url: '/assets/category/roadtrip_03.jpg' },
    { url: '/assets/category/roadtrip_04.jpg' },
    { url: '/assets/category/roadtrip_05.jpg' }
  ],
  hiking: [
    { url: '/assets/category/hiking_01.jpg' },
    { url: '/assets/category/hiking_02.jpg' },
    { url: '/assets/category/hiking_03.jpg' },
    { url: '/assets/category/hiking_04.jpg' }
  ],
  beach: [
    { url: '/assets/category/beach_01.jpg' },
    { url: '/assets/category/beach_02.jpg' },
    { url: '/assets/category/beach_03.jpg' },
    { url: '/assets/category/beach_04.jpg' }
  ],
  culture: [
    { url: '/assets/category/culture_01.jpg' },
    { url: '/assets/category/culture_02.jpg' },
    { url: '/assets/category/culture_03.jpg' },
    { url: '/assets/category/culture_04.jpg' }
  ],
  wellness: [
    { url: '/assets/category/wellness_01.jpg' },
    { url: '/assets/category/wellness_02.jpg' },
    { url: '/assets/category/wellness_03.jpg' },
    { url: '/assets/category/wellness_04.jpg' }
  ],
  festival: [
    { url: '/assets/category/festival_01.jpg' },
    { url: '/assets/category/festival_02.jpg' },
    { url: '/assets/category/festival_03.jpg' },
    { url: '/assets/category/festival_04.jpg' }
  ],
  workshop: [
    { url: '/assets/category/workshop_01.jpg' },
    { url: '/assets/category/workshop_02.jpg' },
    { url: '/assets/category/workshop_03.jpg' },
    { url: '/assets/category/workshop_04.jpg' }
  ],
  wildlife: [
    { url: '/assets/category/wildlife_01.jpg' },
    { url: '/assets/category/wildlife_02.jpg' },
    { url: '/assets/category/wildlife_03.jpg' },
    { url: '/assets/category/wildlife_04.jpg' }
  ],
  food: [
    { url: '/assets/category/food_01.jpg' },
    { url: '/assets/category/food_02.jpg' },
    { url: '/assets/category/food_03.jpg' },
    { url: '/assets/category/food_04.jpg' }
  ],
  adventure_sport: [
    { url: '/assets/category/adventure_01.jpg' },
    { url: '/assets/category/adventure_02.jpg' },
    { url: '/assets/category/adventure_03.jpg' },
    { url: '/assets/category/adventure_04.jpg' }
  ],
  unknown: [
    { url: '/assets/category/generic_sl_01.jpg' }
  ]
};

/**
 * Get all available categories as an array
 */
export const TRIP_CATEGORIES = Object.keys(CATEGORY_CHOICES) as TripCategory[];

/**
 * Human-readable category labels for UI display
 */
export const CATEGORY_LABELS: Record<TripCategory, string> = {
  roadtrip: 'Road Trip',
  hiking: 'Hiking & Trekking',
  beach: 'Beach & Coastal',
  culture: 'Cultural Experience',
  wellness: 'Wellness & Spa',
  festival: 'Festival & Events',
  workshop: 'Workshop & Learning',
  wildlife: 'Wildlife Safari',
  food: 'Food & Culinary',
  adventure_sport: 'Adventure Sports',
  unknown: 'Other'
};