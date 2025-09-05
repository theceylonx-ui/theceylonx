import { z } from 'zod';
import { 
  PREFERENCES_TAXONOMY,
  canonicalizeArray,
  getRejectedValues,
  isValidVibe,
  isValidCompanion,
  isValidInterest,
  isValidMonth,
  isValidRegion,
  type Vibe,
  type Companion,
  type Interest,
  type Month,
  type Region
} from '../../config/preferences_taxonomy';

/**
 * Server-side validation and canonicalization for user preferences
 * Ensures all data is clean, validated, and follows taxonomy rules
 */

// Individual array validation schemas
const vibeArraySchema = z.array(z.string()).transform((input) => 
  canonicalizeArray(input, PREFERENCES_TAXONOMY.vibe, isValidVibe)
);

const companionArraySchema = z.array(z.string()).transform((input) => 
  canonicalizeArray(input, PREFERENCES_TAXONOMY.companions, isValidCompanion)
);

const interestArraySchema = z.array(z.string()).transform((input) => 
  canonicalizeArray(input, PREFERENCES_TAXONOMY.interests, isValidInterest)
);

const monthArraySchema = z.array(z.string()).transform((input) => 
  canonicalizeArray(input, PREFERENCES_TAXONOMY.months, isValidMonth)
);

const regionArraySchema = z.array(z.string()).transform((input) => 
  canonicalizeArray(input, PREFERENCES_TAXONOMY.regions, isValidRegion)
);

// Budget validation with constraints
const budgetSchema = z.object({
  budgetMin: z.number().int().min(0).nullable().optional(),
  budgetMax: z.number().int().min(0).nullable().optional(),
}).refine((data) => {
  if (data.budgetMin && data.budgetMax) {
    return data.budgetMin <= data.budgetMax;
  }
  return true;
}, {
  message: "Budget minimum must be less than or equal to budget maximum",
  path: ["budgetMax"]
});

// Main preferences validation schema
export const userPreferencesValidationSchema = z.object({
  vibe: vibeArraySchema.optional().default([]),
  companions: companionArraySchema.optional().default([]),
  interests: interestArraySchema.optional().default([]),
  months: monthArraySchema.optional().default([]),
  regions: regionArraySchema.optional().default([]),
  budgetMin: z.number().int().min(0).nullable().optional(),
  budgetMax: z.number().int().min(0).nullable().optional(),
}).refine((data) => {
  if (data.budgetMin && data.budgetMax) {
    return data.budgetMin <= data.budgetMax;
  }
  return true;
}, {
  message: "Budget minimum must be less than or equal to budget maximum",
  path: ["budgetMax"]
});

// Validation result type with details about rejected values
export interface ValidationResult {
  isValid: boolean;
  data?: z.infer<typeof userPreferencesValidationSchema>;
  rejectedValues?: {
    vibe?: string[];
    companions?: string[];
    interests?: string[];
    months?: string[];
    regions?: string[];
  };
  errors?: z.ZodIssue[];
}

/**
 * Validate and canonicalize user preferences input
 * Returns detailed information about validation success/failure and rejected values
 */
export function validateUserPreferences(input: any): ValidationResult {
  try {
    // First check for rejected values before transformation
    const rejectedValues: ValidationResult['rejectedValues'] = {};
    let hasRejected = false;

    if (input.vibe && Array.isArray(input.vibe)) {
      const rejected = getRejectedValues(input.vibe, isValidVibe);
      if (rejected.length > 0) {
        rejectedValues.vibe = rejected;
        hasRejected = true;
      }
    }

    if (input.companions && Array.isArray(input.companions)) {
      const rejected = getRejectedValues(input.companions, isValidCompanion);
      if (rejected.length > 0) {
        rejectedValues.companions = rejected;
        hasRejected = true;
      }
    }

    if (input.interests && Array.isArray(input.interests)) {
      const rejected = getRejectedValues(input.interests, isValidInterest);
      if (rejected.length > 0) {
        rejectedValues.interests = rejected;
        hasRejected = true;
      }
    }

    if (input.months && Array.isArray(input.months)) {
      const rejected = getRejectedValues(input.months, isValidMonth);
      if (rejected.length > 0) {
        rejectedValues.months = rejected;
        hasRejected = true;
      }
    }

    if (input.regions && Array.isArray(input.regions)) {
      const rejected = getRejectedValues(input.regions, isValidRegion);
      if (rejected.length > 0) {
        rejectedValues.regions = rejected;
        hasRejected = true;
      }
    }

    // If there are rejected values, return error immediately
    if (hasRejected) {
      return {
        isValid: false,
        rejectedValues,
        errors: [{
          code: 'custom',
          message: 'Some preference values are not allowed',
          path: ['preferences']
        }]
      };
    }

    // Validate and transform the input
    const validatedData = userPreferencesValidationSchema.parse(input);

    return {
      isValid: true,
      data: validatedData
    };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.issues
      };
    }

    // Unexpected error
    return {
      isValid: false,
      errors: [{
        code: 'custom',
        message: 'Unexpected validation error',
        path: ['preferences']
      }]
    };
  }
}

// Export types for use in API
export type ValidatedUserPreferences = z.infer<typeof userPreferencesValidationSchema>;

// Default empty preferences
export const DEFAULT_PREFERENCES: ValidatedUserPreferences = {
  vibe: [],
  companions: [],
  interests: [],
  months: [],
  regions: [],
  budgetMin: null,
  budgetMax: null
};