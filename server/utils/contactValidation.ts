/**
 * Contact validation and normalization utilities
 * Part of the comprehensive contact privacy system
 */

/**
 * Normalize phone numbers to E.164 format for consistency
 */
export function normalizePhoneNumber(phoneNumber: string): string | null {
  if (!phoneNumber) return null;
  
  // Remove all non-numeric characters except +
  let cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // Sri Lankan phone number patterns
  if (cleaned.startsWith('0')) {
    // Convert local format (07X) to international (+947X)
    cleaned = '+94' + cleaned.substring(1);
  } else if (cleaned.startsWith('94')) {
    // Add + to country code
    cleaned = '+' + cleaned;
  } else if (!cleaned.startsWith('+')) {
    // Assume Sri Lankan number if no country code
    cleaned = '+94' + cleaned;
  }
  
  // Validate length and format
  if (cleaned.match(/^\+94[0-9]{9}$/)) {
    return cleaned;
  }
  
  // Allow other international formats (basic validation)
  if (cleaned.match(/^\+[1-9][0-9]{1,14}$/)) {
    return cleaned;
  }
  
  return null;
}

/**
 * Validate and normalize email addresses
 */
export function validateAndNormalizeEmail(email: string): string | null {
  if (!email) return null;
  
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // Normalize: trim and convert to lowercase
  const normalized = email.trim().toLowerCase();
  
  if (emailRegex.test(normalized)) {
    return normalized;
  }
  
  return null;
}

/**
 * Sanitize contact data for safe storage and display
 */
export function sanitizeContactData(contact: { phoneNumber?: string; email?: string }) {
  return {
    phoneNumber: contact.phoneNumber ? normalizePhoneNumber(contact.phoneNumber) : null,
    email: contact.email ? validateAndNormalizeEmail(contact.email) : null
  };
}

/**
 * Check if contact data is valid
 */
export function isValidContactData(contact: { phoneNumber?: string | null; email?: string | null }): boolean {
  return !!(contact.phoneNumber || contact.email);
}