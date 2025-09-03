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

// Get avatar options for selection
export function getAvatarOptions(userId: string): Array<{ style: AvatarStyle; url: string; name: string }> {
  return AVATAR_STYLES.map(style => ({
    style,
    url: generateProfilePicture(userId, style),
    name: style.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }));
}

// Generate display name based on user data
export function getDisplayName(user: {
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  id: string;
} | null | undefined): string {
  if (!user || !user.id) {
    return 'Unknown User';
  }
  
  if (user.username) {
    return user.username;
  }
  
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  
  if (user.firstName) {
    return user.firstName;
  }
  
  // Fallback to user ID
  return `User ${user.id.slice(0, 8)}`;
}

// Get initials for avatar fallback
export function getInitials(user: {
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
} | null | undefined): string {
  if (!user) {
    return 'U';
  }
  
  if (user.username) {
    return user.username.slice(0, 2).toUpperCase();
  }
  
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }
  
  if (user.firstName) {
    return user.firstName.slice(0, 2).toUpperCase();
  }
  
  return 'U';
}