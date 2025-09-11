/**
 * Ceylon Expand - Validation Utils Tests
 * Comprehensive validation testing for form inputs and data validation
 */

import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validatePhoneNumber,
  validateTripDate,
  validateSriLankanPhone,
  formatCurrency,
  sanitizeInput,
  validateUrl,
} from '../validation';

describe('Email Validation', () => {
  describe('validateEmail', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.user@domain.co.uk',
        'user+tag@domain.com',
        'user123@subdomain.example.org',
        'firstname.lastname@company.travel',
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        '',
        'invalid',
        '@domain.com',
        'user@',
        'user..double@domain.com',
        'user@domain',
        'user space@domain.com',
        'user@domain..com',
      ];

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });

    it('should handle edge cases', () => {
      expect(validateEmail('a@b.c')).toBe(true); // Minimal valid email
      expect(validateEmail('very.long.email.address@very.long.domain.name.com')).toBe(true);
      expect(validateEmail('user@localhost')).toBe(false); // No TLD
    });
  });
});

describe('Phone Number Validation', () => {
  describe('validateSriLankanPhone', () => {
    it('should accept valid Sri Lankan phone numbers', () => {
      const validNumbers = [
        '0771234567', // Mobile with leading 0
        '771234567',  // Mobile without leading 0
        '0112345678', // Landline Colombo
        '0812345678', // Landline other area
        '+94771234567', // International format
      ];

      validNumbers.forEach(number => {
        expect(validateSriLankanPhone(number)).toBe(true);
      });
    });

    it('should reject invalid phone numbers', () => {
      const invalidNumbers = [
        '',
        '123',
        '12345678901234', // Too long
        'abcdefghij',
        '0123456789', // Invalid area code
        '+1234567890', // Wrong country code
        '07712345', // Too short
      ];

      invalidNumbers.forEach(number => {
        expect(validateSriLankanPhone(number)).toBe(false);
      });
    });

    it('should normalize phone number formats', () => {
      expect(validateSriLankanPhone(' 077 123 4567 ')).toBe(true);
      expect(validateSriLankanPhone('077-123-4567')).toBe(true);
      expect(validateSriLankanPhone('+94 77 123 4567')).toBe(true);
    });
  });

  describe('validatePhoneNumber (generic)', () => {
    it('should accept various international formats', () => {
      const validNumbers = [
        '+94771234567',  // Sri Lanka
        '+1234567890',   // US format
        '+441234567890', // UK format
        '+33123456789',  // French format
      ];

      validNumbers.forEach(number => {
        expect(validatePhoneNumber(number)).toBe(true);
      });
    });
  });
});

describe('Date Validation', () => {
  describe('validateTripDate', () => {
    it('should accept future dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      expect(validateTripDate(tomorrow)).toBe(true);
      expect(validateTripDate(nextWeek)).toBe(true);
      expect(validateTripDate(nextMonth)).toBe(true);
    });

    it('should reject past dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

      expect(validateTripDate(yesterday)).toBe(false);
      expect(validateTripDate(lastWeek)).toBe(false);
    });

    it('should handle today based on configuration', () => {
      const today = new Date();
      today.setHours(12, 0, 0, 0); // Noon today
      
      // Should allow same day bookings
      expect(validateTripDate(today, { allowSameDay: true })).toBe(true);
      // Should reject same day by default
      expect(validateTripDate(today, { allowSameDay: false })).toBe(false);
    });

    it('should respect maximum advance booking limits', () => {
      const farFuture = new Date();
      farFuture.setFullYear(farFuture.getFullYear() + 2); // 2 years ahead
      
      expect(validateTripDate(farFuture, { maxDaysAhead: 365 })).toBe(false);
      expect(validateTripDate(farFuture, { maxDaysAhead: 800 })).toBe(true);
    });
  });
});

describe('Currency Formatting', () => {
  describe('formatCurrency', () => {
    it('should format Sri Lankan Rupees correctly', () => {
      expect(formatCurrency(1000, 'LKR')).toBe('LKR 1,000.00');
      expect(formatCurrency(5500.50, 'LKR')).toBe('LKR 5,500.50');
      expect(formatCurrency(100000, 'LKR')).toBe('LKR 100,000.00');
    });

    it('should format US Dollars correctly', () => {
      expect(formatCurrency(100, 'USD')).toBe('$100.00');
      expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56');
    });

    it('should handle zero and negative amounts', () => {
      expect(formatCurrency(0, 'LKR')).toBe('LKR 0.00');
      expect(formatCurrency(-100, 'LKR')).toBe('-LKR 100.00');
    });

    it('should handle decimal precision', () => {
      expect(formatCurrency(10.5, 'LKR')).toBe('LKR 10.50');
      expect(formatCurrency(10.123, 'LKR')).toBe('LKR 10.12'); // Rounded to 2 decimals
    });

    it('should handle large numbers', () => {
      expect(formatCurrency(1000000, 'LKR')).toBe('LKR 1,000,000.00');
      expect(formatCurrency(1234567.89, 'LKR')).toBe('LKR 1,234,567.89');
    });
  });
});

describe('Input Sanitization', () => {
  describe('sanitizeInput', () => {
    it('should remove dangerous HTML tags', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('');
      expect(sanitizeInput('<img src="x" onerror="alert(1)">')).toBe('');
      expect(sanitizeInput('<iframe src="javascript:alert(1)"></iframe>')).toBe('');
    });

    it('should preserve safe content', () => {
      expect(sanitizeInput('Hello World')).toBe('Hello World');
      expect(sanitizeInput('Travel to Kandy & Ella')).toBe('Travel to Kandy &amp; Ella');
      expect(sanitizeInput('Price: $100')).toBe('Price: $100');
    });

    it('should handle empty and null inputs', () => {
      expect(sanitizeInput('')).toBe('');
      expect(sanitizeInput(null as any)).toBe('');
      expect(sanitizeInput(undefined as any)).toBe('');
    });

    it('should trim whitespace when configured', () => {
      expect(sanitizeInput('  test  ', { trim: true })).toBe('test');
      expect(sanitizeInput('  test  ', { trim: false })).toBe('  test  ');
    });

    it('should handle special characters', () => {
      expect(sanitizeInput('café & résumé')).toBe('café &amp; résumé');
      expect(sanitizeInput('100% satisfaction')).toBe('100% satisfaction');
      expect(sanitizeInput('A < B > C')).toBe('A &lt; B &gt; C');
    });
  });
});

describe('URL Validation', () => {
  describe('validateUrl', () => {
    it('should accept valid URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://example.com',
        'https://www.example.com/path',
        'https://subdomain.example.com',
        'https://example.com/path?query=1',
        'https://example.com:8080',
      ];

      validUrls.forEach(url => {
        expect(validateUrl(url)).toBe(true);
      });
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        '',
        'not-a-url',
        'ftp://example.com', // Non-HTTP protocol
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'http://',
        'https://',
      ];

      invalidUrls.forEach(url => {
        expect(validateUrl(url)).toBe(false);
      });
    });

    it('should handle protocol requirements', () => {
      expect(validateUrl('example.com', { requireProtocol: false })).toBe(true);
      expect(validateUrl('example.com', { requireProtocol: true })).toBe(false);
      expect(validateUrl('https://example.com', { requireProtocol: true })).toBe(true);
    });

    it('should validate against allowed domains', () => {
      const allowedDomains = ['example.com', 'trusted.com'];
      
      expect(validateUrl('https://example.com', { allowedDomains })).toBe(true);
      expect(validateUrl('https://malicious.com', { allowedDomains })).toBe(false);
      expect(validateUrl('https://subdomain.example.com', { allowedDomains })).toBe(true);
    });
  });
});

describe('Integration Tests', () => {
  it('should validate complete trip form data', () => {
    const tripData = {
      title: 'Amazing Kandy Tour',
      organizerEmail: 'organizer@example.com',
      organizerPhone: '0771234567',
      date: new Date(Date.now() + 86400000), // Tomorrow
      price: 5000,
      description: 'Join us for an amazing tour to Kandy!',
    };

    expect(validateEmail(tripData.organizerEmail)).toBe(true);
    expect(validateSriLankanPhone(tripData.organizerPhone)).toBe(true);
    expect(validateTripDate(tripData.date)).toBe(true);
    expect(tripData.title.length).toBeGreaterThan(5);
    expect(tripData.price).toBeGreaterThan(0);
  });

  it('should handle complex validation scenarios', () => {
    // Test multiple validation rules together
    const userInput = {
      name: sanitizeInput('<script>alert("hack")</script>John Doe'),
      email: 'john.doe@example.com',
      phone: '+94 77 123 4567',
      website: 'https://johndoe.com',
      tripDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
    };

    expect(userInput.name).toBe('John Doe');
    expect(validateEmail(userInput.email)).toBe(true);
    expect(validatePhoneNumber(userInput.phone)).toBe(true);
    expect(validateUrl(userInput.website)).toBe(true);
    expect(validateTripDate(userInput.tripDate)).toBe(true);
  });
});

// Performance Tests
describe('Performance Tests', () => {
  it('should validate large datasets efficiently', () => {
    const startTime = performance.now();
    
    // Validate 1000 email addresses
    for (let i = 0; i < 1000; i++) {
      validateEmail(`user${i}@example.com`);
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(100); // Should complete in under 100ms
  });

  it('should handle concurrent validation requests', async () => {
    const validationPromises = Array.from({ length: 100 }, (_, i) =>
      Promise.resolve(validateEmail(`user${i}@example.com`))
    );

    const results = await Promise.all(validationPromises);
    
    expect(results.every(result => result === true)).toBe(true);
    expect(results).toHaveLength(100);
  });
});