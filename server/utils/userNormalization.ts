import type { User } from "@shared/schema";

export interface NormalizedUser {
  id: string;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
  initials: string;
  email?: string;
  provider?: string;
}

/**
 * Normalizes user data for UI consumption with safe fallbacks
 * Implements the displayName fallback strategy:
 * 1. Use 'displayName' field if available (user's preferred display name)
 * 2. Use 'name' if available
 * 3. Use firstName + lastName if available
 * 4. Use email prefix if email exists
 * 5. Use "Traveler" + short ID as last resort
 */
export function normalizeUserForUI(user: User | null): NormalizedUser | null {
  if (!user) return null;

  // Generate display name with fallback strategy (prioritize displayName field)
  let displayName = '';
  
  if (user.displayName?.trim()) {
    displayName = user.displayName.trim();
  } else if (user.name?.trim()) {
    displayName = user.name.trim();
  } else if (user.firstName?.trim() || user.lastName?.trim()) {
    displayName = [user.firstName?.trim(), user.lastName?.trim()]
      .filter(Boolean)
      .join(' ');
  } else if (user.email?.includes('@')) {
    displayName = user.email.split('@')[0];
  } else {
    // Last resort: Traveler + short ID
    const shortId = user.id.slice(-4);
    displayName = `Traveler${shortId}`;
  }

  // Generate username fallback if not available
  let username = user.username?.trim() || null;
  if (!username && user.email?.includes('@')) {
    // Generate username from email prefix if no username set
    username = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  // Generate initials from display name
  const initials = generateInitials(displayName);

  // Validate and normalize avatar URL
  const avatarUrl = validateAvatarUrl(user.profileImageUrl || user.image);

  return {
    id: user.id,
    username,
    displayName,
    avatarUrl,
    initials,
    email: user.email || undefined,
    provider: user.provider || undefined,
  };
}

/**
 * Generate initials from a display name
 * Falls back to "TR" (TRaveler) if unable to generate meaningful initials
 */
function generateInitials(displayName: string): string {
  if (!displayName?.trim()) return 'TR';
  
  const words = displayName.trim().split(/\s+/);
  
  if (words.length === 1) {
    // Single word: take first 2 characters
    const word = words[0];
    return word.length >= 2 ? word.slice(0, 2).toUpperCase() : (word + 'R').toUpperCase();
  }
  
  // Multiple words: take first letter of first two words
  return words
    .slice(0, 2)
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase() || 'TR';
}

/**
 * Validate avatar URL and return null if invalid
 */
function validateAvatarUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  
  try {
    const parsed = new URL(url);
    // Only allow HTTP(S) protocols
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return url;
    }
  } catch {
    // Invalid URL
  }
  
  return null;
}

/**
 * Batch normalize multiple users efficiently
 */
export function normalizeUsersForUI(users: User[]): NormalizedUser[] {
  return users.map(normalizeUserForUI).filter((user): user is NormalizedUser => user !== null);
}

/**
 * Extract display name only (lightweight version)
 */
export function getDisplayName(user: User | null): string {
  const normalized = normalizeUserForUI(user);
  return normalized?.displayName || 'Unknown User';
}

/**
 * Telemetry: Track when fallbacks are used
 */
export function trackUserNormalizationFallback(user: User, fallbackType: 'email_prefix' | 'traveler_id' | 'no_avatar'): void {
  // Low-overhead logging for telemetry
  console.log(`user_display_fallback_used:${fallbackType}:${user.id}`);
}