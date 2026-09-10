/**
 * Travel Preferences Taxonomy
 * 
 * Centralized source of truth for all valid preference values.
 * Server rejects any values not defined here.
 */

export const PREFERENCES_TAXONOMY = {
  vibe: [
    'relaxed',
    'adventure', 
    'culture',
    'beach',
    'nature',
    'nightlife',
    'wellness'
  ] as const,

  companions: [
    'solo',
    'couple', 
    'friends',
    'family',
    'senior_friendly'
  ] as const,

  interests: [
    'hiking',
    'wildlife',
    'history',
    'photography',
    'food',
    'diving',
    'surfing',
    'temples',
    'festivals',
    'wellness',
    'ayurveda',
    'train_journeys'
  ] as const,

  months: [
    'jan',
    'feb',
    'mar',
    'apr',
    'may',
    'jun',
    'jul',
    'aug',
    'sep',
    'oct',
    'nov',
    'dec'
  ] as const,

  regions: [
    'north',
    'east', 
    'south',
    'west',
    'hill_country',
    'cultural_triangle',
    'colombo'
  ] as const
} as const;

// Type exports for use throughout the application
export type Vibe = typeof PREFERENCES_TAXONOMY.vibe[number];
export type Companion = typeof PREFERENCES_TAXONOMY.companions[number];
export type Interest = typeof PREFERENCES_TAXONOMY.interests[number];
export type Month = typeof PREFERENCES_TAXONOMY.months[number];
export type Region = typeof PREFERENCES_TAXONOMY.regions[number];

// Helper functions for validation
export function isValidVibe(value: string): value is Vibe {
  return PREFERENCES_TAXONOMY.vibe.includes(value as Vibe);
}

export function isValidCompanion(value: string): value is Companion {
  return PREFERENCES_TAXONOMY.companions.includes(value as Companion);
}

export function isValidInterest(value: string): value is Interest {
  return PREFERENCES_TAXONOMY.interests.includes(value as Interest);
}

export function isValidMonth(value: string): value is Month {
  return PREFERENCES_TAXONOMY.months.includes(value as Month);
}

export function isValidRegion(value: string): value is Region {
  return PREFERENCES_TAXONOMY.regions.includes(value as Region);
}

/**
 * Canonicalize an array by:
 * - Converting to lowercase
 * - Removing duplicates
 * - Sorting alphabetically
 * - Filtering to only allowed values
 */
export function canonicalizeArray<T extends string>(
  input: string[] | undefined,
  allowedValues: readonly T[],
  validator: (value: string) => value is T
): T[] {
  if (!input || !Array.isArray(input)) {
    return [];
  }

  const lowercased = input.map(val => String(val).toLowerCase());
  const unique = Array.from(new Set(lowercased));
  const valid = unique.filter(validator);
  
  return valid.sort() as T[];
}

/**
 * Get all rejected values from an input array
 */
export function getRejectedValues<T extends string>(
  input: string[] | undefined,
  validator: (value: string) => value is T
): string[] {
  if (!input || !Array.isArray(input)) {
    return [];
  }

  const lowercased = input.map(val => String(val).toLowerCase());
  const unique = Array.from(new Set(lowercased));
  
  return unique.filter(val => !validator(val));
}