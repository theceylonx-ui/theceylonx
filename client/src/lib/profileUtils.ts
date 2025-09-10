import type { User } from "@shared/schema";

// Utility functions for user profile management

// Avatar styles available for selection
export const AVATAR_STYLES = [
  'avataaars',
  'adventurer',
  'adventurer-neutral',
  'big-ears',
  'big-ears-neutral',
  'big-smile',
  'bottts',
  'croodles',
  'croodles-neutral',
  'fun-emoji',
  'icons',
  'identicon',
  'lorelei',
  'lorelei-neutral',
  'micah',
  'miniavs',
  'open-peeps',
  'personas',
  'pixel-art',
  'pixel-art-neutral'
] as const;

export type AvatarStyle = typeof AVATAR_STYLES[number];

// Generate a profile picture URL using DiceBear API with specified style
export function generateProfilePicture(seed?: string, style: AvatarStyle = 'avataaars'): string {
  const usedSeed = seed || Math.random().toString(36).substring(7);
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${usedSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9&backgroundType=gradientLinear`;
}

// Generate a random profile picture URL using DiceBear API (backward compatibility)
export function generateRandomProfilePicture(seed?: string, style?: AvatarStyle): string {
  const usedStyle = style || AVATAR_STYLES[Math.floor(Math.random() * AVATAR_STYLES.length)];
  return generateProfilePicture(seed, usedStyle);
}

// Get avatar options for selection with multiple variations per style
export function getAvatarOptions(userId: string): Array<{ style: AvatarStyle; url: string; name: string; variation: number }> {
  const options: Array<{ style: AvatarStyle; url: string; name: string; variation: number }> = [];
  
  AVATAR_STYLES.forEach((style) => {
    // Generate 4 different variations for each style
    for (let i = 0; i < 4; i++) {
      const seed = `${userId}-${style}-var${i}`;
      options.push({
        style,
        url: generateProfilePicture(seed, style),
        name: style.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        variation: i + 1
      });
    }
  });
  
  return options;
}

// Generate display name using STRICT naming policy
// ONLY uses displayName, username, or USER ID
export function getDisplayName(user: {
  displayName?: string | null;
  username?: string | null;
  id?: string;
} | null | undefined): string {
  if (!user) {
    return 'Anonymous';
  }
  
  // STRICT POLICY: displayName → username → USER ID
  if (user.displayName?.trim()) {
    return user.displayName.trim();
  }
  
  if (user.username?.trim()) {
    return user.username.trim();
  }
  
  // Use USER ID if no display name or username
  if (user.id) {
    return user.id;
  }
  
  return 'User';
}

// Get initials using STRICT naming policy
// ONLY uses displayName, username, or USER ID
export function getInitials(user: {
  displayName?: string | null;
  username?: string | null;
  id?: string;
} | null | undefined): string {
  if (!user) {
    return 'A';
  }
  
  // Get display name first using strict policy
  const displayName = getDisplayName(user);
  
  if (displayName === 'Anonymous' || displayName === 'User') {
    return 'U';
  }
  
  // If it looks like a user ID (contains hyphens or underscores), use first 2 chars
  if (displayName.includes('-') || displayName.includes('_') || displayName.length > 20) {
    return displayName.slice(0, 2).toUpperCase();
  }
  
  // For normal names, try to get proper initials
  const words = displayName.trim().split(/\s+/);
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  
  // Single word: take first 2 characters
  return displayName.slice(0, 2).toUpperCase();
}