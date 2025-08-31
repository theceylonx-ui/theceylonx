// Utility functions for user profile management

// Generate a random profile picture URL using DiceBear API
export function generateRandomProfilePicture(seed?: string): string {
  const usedSeed = seed || Math.random().toString(36).substring(7);
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${usedSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9&backgroundType=gradientLinear`;
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