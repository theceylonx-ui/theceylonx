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
 * Normalizes user data for UI consumption with STRICT naming policy
 * ONLY uses user-provided display name, username, or USER ID
 * 
 * STRICT POLICY:
 * 1. Use 'displayName' field if available (user's chosen display name)
 * 2. Use 'username' field if displayName is empty
 * 3. Use USER ID if both are empty
 * 4. NEVER use OAuth names, firstName+lastName, or email fallbacks
 */
export function normalizeUserForUI(user: {
  id: string;
  displayName?: string | null;
  username?: string | null;
  profileImageUrl?: string | null;
  image?: string | null;
  email?: string | null;
  provider?: string | null;
} | null): NormalizedUser | null {
  if (!user) return null;

  // STRICT naming policy - only use user-provided fields or USER ID
  let displayName = '';
  
  if (user.displayName?.trim()) {
    displayName = user.displayName.trim();
  } else if (user.username?.trim()) {
    displayName = user.username.trim();
  } else {
    // Use USER ID if no display name or username provided
    displayName = user.id;
  }

  // Username from profile field only - no fallbacks
  const username = user.username?.trim() || null;

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
 * Uses first 2 characters for user IDs, proper initials for names
 */
function generateInitials(displayName: string): string {
  if (!displayName?.trim()) return 'ID';
  
  const trimmed = displayName.trim();
  
  // If it looks like a user ID (contains hyphens or underscores), use first 2 chars
  if (trimmed.includes('-') || trimmed.includes('_') || trimmed.length > 20) {
    return trimmed.slice(0, 2).toUpperCase();
  }
  
  const words = trimmed.split(/\s+/);
  
  if (words.length === 1) {
    // Single word: take first 2 characters
    const word = words[0];
    return word.length >= 2 ? word.slice(0, 2).toUpperCase() : (word + 'X').toUpperCase();
  }
  
  // Multiple words: take first letter of first two words
  return words
    .slice(0, 2)
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase() || 'ID';
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
 * Follows strict naming policy
 */
export function getDisplayName(user: User | null): string {
  if (!user) return 'Unknown User';
  
  if (user.displayName?.trim()) {
    return user.displayName.trim();
  } else if (user.username?.trim()) {
    return user.username.trim();
  } else {
    return user.id;
  }
}

/**
 * Telemetry: Track when USER ID is used as display name
 */
export function trackUserNormalizationFallback(user: User, fallbackType: 'user_id' | 'no_avatar'): void {
  // Log when we fall back to USER ID for display name
  console.log(`user_display_fallback_used:${fallbackType}:${user.id}`);
}