/**
 * Ceylon Expand - Validation Utilities
 * Comprehensive validation functions for forms, data, and user inputs
 */

/**
 * Validates email address format using RFC compliant regex
 * 
 * @param email - Email address to validate
 * @returns True if email format is valid
 * 
 * @example
 * ```typescript
 * validateEmail('user@example.com'); // true
 * validateEmail('invalid-email'); // false
 * ```
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates Sri Lankan phone number in various formats
 * 
 * Supports formats:
 * - Local: 771234567
 * - National: 0771234567  
 * - International: +94771234567
 * - Formatted: 077 123 4567, 077-123-4567
 * 
 * @param phoneNumber - Phone number to validate
 * @returns True if phone number is valid Sri Lankan format
 * 
 * @example
 * ```typescript
 * validateSriLankanPhone('0771234567'); // true
 * validateSriLankanPhone('+94771234567'); // true
 * validateSriLankanPhone('1234567890'); // false
 * ```
 */
export function validateSriLankanPhone(phoneNumber: string): boolean {
  if (!phoneNumber || typeof phoneNumber !== 'string') return false;
  
  // Remove all non-digit characters except +
  const cleaned = phoneNumber.replace(/[\s\-()]/g, '');
  
  // Sri Lankan mobile patterns
  const patterns = [
    /^0?7[01245678]\d{7}$/, // Mobile: 07X XXXXXXX
    /^0?11\d{7}$/, // Colombo landline: 011 XXXXXXX
    /^0?[23456789][1-9]\d{6}$/, // Other area landlines
    /^\+947[01245678]\d{7}$/, // International mobile
    /^\+9411\d{7}$/, // International Colombo landline
  ];
  
  return patterns.some(pattern => pattern.test(cleaned));
}

/**
 * Generic international phone number validation
 * 
 * @param phoneNumber - Phone number to validate
 * @returns True if phone number appears to be valid international format
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  if (!phoneNumber || typeof phoneNumber !== 'string') return false;
  
  const cleaned = phoneNumber.replace(/[\s\-()]/g, '');
  
  // Basic international format: + followed by 7-15 digits
  const internationalPattern = /^\+[1-9]\d{6,14}$/;
  
  return internationalPattern.test(cleaned);
}

/**
 * Validates trip date ensuring it's in the future
 * 
 * @param date - Date to validate
 * @param options - Validation options
 * @param options.allowSameDay - Allow bookings for same day
 * @param options.maxDaysAhead - Maximum days in advance allowed
 * @returns True if date is valid for trip booking
 * 
 * @example
 * ```typescript
 * const tomorrow = new Date(Date.now() + 86400000);
 * validateTripDate(tomorrow); // true
 * 
 * const yesterday = new Date(Date.now() - 86400000);
 * validateTripDate(yesterday); // false
 * ```
 */
export function validateTripDate(
  date: Date,
  options: {
    allowSameDay?: boolean;
    maxDaysAhead?: number;
  } = {}
): boolean {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return false;
  }
  
  const now = new Date();
  const { allowSameDay = false, maxDaysAhead = 365 } = options;
  
  // Check if date is in the past
  if (date < now && !allowSameDay) {
    return false;
  }
  
  // Check if date is today and same day is not allowed
  if (!allowSameDay) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    if (checkDate.getTime() === today.getTime()) {
      return false;
    }
  }
  
  // Check maximum advance booking limit
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + maxDaysAhead);
  
  if (date > maxDate) {
    return false;
  }
  
  return true;
}

/**
 * Formats currency amount with proper locale formatting
 * 
 * @param amount - Numeric amount to format
 * @param currency - Currency code (LKR, USD, etc.)
 * @param locale - Locale for formatting (defaults to en-US)
 * @returns Formatted currency string
 * 
 * @example
 * ```typescript
 * formatCurrency(5000, 'LKR'); // "LKR 5,000.00"
 * formatCurrency(100, 'USD'); // "$100.00"
 * ```
 */
export function formatCurrency(
  amount: number,
  currency: string = 'LKR',
  locale: string = 'en-US'
): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return `${currency} 0.00`;
  }
  
  // Handle negative amounts
  const isNegative = amount < 0;
  const absoluteAmount = Math.abs(amount);
  
  try {
    let formatted: string;
    
    if (currency === 'LKR') {
      // Custom formatting for Sri Lankan Rupees
      formatted = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(absoluteAmount);
      formatted = `LKR ${formatted}`;
    } else {
      // Use standard Intl.NumberFormat for other currencies
      formatted = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(absoluteAmount);
    }
    
    return isNegative ? `-${formatted}` : formatted;
  } catch (error) {
    // Fallback formatting if Intl.NumberFormat fails
    const formatted = absoluteAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const result = `${currency} ${formatted}`;
    return isNegative ? `-${result}` : result;
  }
}

/**
 * Sanitizes user input by removing dangerous content
 * 
 * @param input - Input string to sanitize
 * @param options - Sanitization options
 * @param options.trim - Whether to trim whitespace
 * @param options.maxLength - Maximum allowed length
 * @returns Sanitized string safe for display
 * 
 * @example
 * ```typescript
 * sanitizeInput('<script>alert("xss")</script>Hello'); // "Hello"
 * sanitizeInput('  test  ', { trim: true }); // "test"
 * ```
 */
export function sanitizeInput(
  input: string | null | undefined,
  options: {
    trim?: boolean;
    maxLength?: number;
  } = {}
): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  const { trim = true, maxLength } = options;
  let sanitized = input;
  
  // Remove HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  // Escape HTML entities
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
  
  // Trim whitespace if requested
  if (trim) {
    sanitized = sanitized.trim();
  }
  
  // Limit length if specified
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength).trim();
  }
  
  return sanitized;
}

/**
 * Validates URL format and security
 * 
 * @param url - URL to validate
 * @param options - Validation options
 * @param options.requireProtocol - Require http/https protocol
 * @param options.allowedDomains - List of allowed domains
 * @returns True if URL is valid and safe
 * 
 * @example
 * ```typescript
 * validateUrl('https://example.com'); // true
 * validateUrl('javascript:alert(1)'); // false
 * validateUrl('example.com', { requireProtocol: false }); // true
 * ```
 */
export function validateUrl(
  url: string,
  options: {
    requireProtocol?: boolean;
    allowedDomains?: string[];
  } = {}
): boolean {
  if (!url || typeof url !== 'string') return false;
  
  const { requireProtocol = true, allowedDomains } = options;
  
  try {
    let testUrl = url.trim();
    
    // Add protocol if missing and not required
    if (!requireProtocol && !testUrl.match(/^https?:\/\//)) {
      testUrl = `https://${testUrl}`;
    }
    
    const urlObject = new URL(testUrl);
    
    // Only allow HTTP and HTTPS protocols
    if (!['http:', 'https:'].includes(urlObject.protocol)) {
      return false;
    }
    
    // Check against allowed domains if specified
    if (allowedDomains && allowedDomains.length > 0) {
      const hostname = urlObject.hostname;
      const isAllowed = allowedDomains.some(domain => 
        hostname === domain || hostname.endsWith(`.${domain}`)
      );
      
      if (!isAllowed) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Validates password strength
 * 
 * @param password - Password to validate
 * @returns Object with validation results
 */
export function validatePassword(password: string): {
  isValid: boolean;
  score: number;
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
} {
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };
  
  const score = Object.values(requirements).filter(Boolean).length;
  const isValid = score >= 4; // Require at least 4 out of 5 requirements
  
  return {
    isValid,
    score,
    requirements,
  };
}

/**
 * Validates trip form data comprehensively
 * 
 * @param tripData - Trip form data to validate
 * @returns Validation result with errors
 */
export function validateTripForm(tripData: {
  title: string;
  fromLocation: string;
  toLocation: string;
  date: string | Date;
  seatsAvailable: number;
  price?: number;
  organizerPhone: string;
  organizerEmail?: string;
}): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  
  // Title validation
  if (!tripData.title || tripData.title.trim().length < 5) {
    errors.title = 'Title must be at least 5 characters long';
  } else if (tripData.title.length > 200) {
    errors.title = 'Title must be less than 200 characters';
  }
  
  // Location validation
  if (!tripData.fromLocation || tripData.fromLocation.trim().length < 2) {
    errors.fromLocation = 'From location is required (minimum 2 characters)';
  }
  
  if (!tripData.toLocation || tripData.toLocation.trim().length < 2) {
    errors.toLocation = 'To location is required (minimum 2 characters)';
  }
  
  // Date validation
  const tripDate = typeof tripData.date === 'string' ? new Date(tripData.date) : tripData.date;
  if (!validateTripDate(tripDate)) {
    errors.date = 'Trip date must be in the future';
  }
  
  // Seats validation
  if (!tripData.seatsAvailable || tripData.seatsAvailable < 1 || tripData.seatsAvailable > 50) {
    errors.seatsAvailable = 'Seats available must be between 1 and 50';
  }
  
  // Price validation (optional)
  if (tripData.price !== undefined && (tripData.price < 0 || tripData.price > 1000000)) {
    errors.price = 'Price must be between 0 and 1,000,000 LKR';
  }
  
  // Phone validation
  if (!validateSriLankanPhone(tripData.organizerPhone)) {
    errors.organizerPhone = 'Please enter a valid Sri Lankan phone number';
  }
  
  // Email validation (optional)
  if (tripData.organizerEmail && !validateEmail(tripData.organizerEmail)) {
    errors.organizerEmail = 'Please enter a valid email address';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}