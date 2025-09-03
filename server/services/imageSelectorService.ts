/**
 * Image Selection Service for Category-Based Trip Images
 * Handles smart default selection and validation for Sri Lanka trip images
 */

import { CATEGORY_CHOICES, TripCategory, ImageChoice } from './categoryImageMap';
import { createHash } from 'crypto';

/**
 * Image selection result with full metadata
 */
export interface ImageSelectionResult {
  imageUrl: string;
  imageProvider: 'curated';
  imageAttribution: ImageChoice['attribution'] | null;
  imageFetchedAt: Date;
}

/**
 * Get all curated image choices for a specific category
 * Falls back to 'unknown' category if the provided category doesn't exist
 */
export function getCuratedChoices(category: TripCategory): ImageChoice[] {
  return CATEGORY_CHOICES[category] ?? CATEGORY_CHOICES.unknown;
}

/**
 * Intelligently pick a default image from category choices using deterministic hashing
 * Uses trip title + organizer ID as seed for consistent selection
 * 
 * @param category - Trip category for image selection
 * @param seed - Unique string (title + organizerId) for deterministic selection
 * @returns Complete image metadata for assignment
 */
export function pickDefaultFromChoices(category: TripCategory, seed: string): ImageSelectionResult {
  const choices = getCuratedChoices(category);
  
  // Use MD5 hash of seed to deterministically select from available choices
  const hash = createHash('md5').update(seed).digest('hex');
  const hashNum = parseInt(hash.slice(0, 8), 16); // Use first 8 hex chars as number
  const selectedIndex = hashNum % choices.length;
  
  const chosen = choices[selectedIndex];
  
  return {
    imageUrl: chosen.url,
    imageProvider: 'curated',
    imageAttribution: chosen.attribution ?? null,
    imageFetchedAt: new Date()
  };
}

/**
 * Validate that an image URL is allowed for the given category
 * Used during trip editing to ensure users only select approved category images
 * 
 * @param category - Trip category to validate against
 * @param url - Image URL to validate
 * @returns true if the URL is an approved choice for this category
 */
export function isAllowedCategoryImage(category: TripCategory, url: string): boolean {
  const choices = getCuratedChoices(category);
  return choices.some(choice => choice.url === url);
}

/**
 * Get the attribution data for a specific image URL within a category
 * Used for displaying proper attribution on the frontend
 * 
 * @param category - Trip category
 * @param url - Image URL to get attribution for
 * @returns Attribution data or null if not found
 */
export function getImageAttribution(category: TripCategory, url: string): ImageChoice['attribution'] | null {
  const choices = getCuratedChoices(category);
  const choice = choices.find(c => c.url === url);
  return choice?.attribution ?? null;
}

/**
 * Validate category is a valid TripCategory enum value
 * 
 * @param category - String to validate
 * @returns true if it's a valid category
 */
export function isValidCategory(category: string): category is TripCategory {
  return Object.keys(CATEGORY_CHOICES).includes(category);
}

/**
 * Get a safe category, defaulting to 'unknown' for invalid values
 * 
 * @param category - Category string that might be invalid
 * @returns Valid TripCategory, defaulting to 'unknown'
 */
export function getSafeCategory(category: string | null | undefined): TripCategory {
  if (!category || !isValidCategory(category)) {
    return 'unknown';
  }
  return category;
}