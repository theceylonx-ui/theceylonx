import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { 
  tripsListResponseSchema, 
  tripDetailResponseSchema, 
  questionsListResponseSchema,
  questionDetailResponseSchema,
  errorResponseSchema 
} from '@shared/types/api';

export interface ValidatedRequest<T = any> extends Request {
  validatedBody?: T;
  validatedQuery?: T;
  validatedResponse?: T;
}

/**
 * Middleware to validate request body against a Zod schema
 */
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: ValidatedRequest<T>, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: 'Invalid request body',
          errors: result.error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }
      req.validatedBody = result.data;
      next();
    } catch (error) {
      console.error('Body validation error:', error);
      res.status(500).json({ message: 'Internal validation error' });
    }
  };
}

/**
 * Middleware to validate query parameters against a Zod schema
 */
export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: ValidatedRequest<T>, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.query);
      if (!result.success) {
        return res.status(400).json({
          message: 'Invalid query parameters',
          errors: result.error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }
      req.validatedQuery = result.data;
      next();
    } catch (error) {
      console.error('Query validation error:', error);
      res.status(500).json({ message: 'Internal validation error' });
    }
  };
}

/**
 * Response validation middleware - validates API responses before sending
 */
export function validateResponse<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override json method to validate response
    res.json = function(data: any) {
      try {
        const result = schema.safeParse(data);
        if (!result.success) {
          console.error('Response validation failed:', result.error.issues);
          // In development, log the validation error but still send the response
          // In production, you might want to send a generic error
          if (process.env.NODE_ENV === 'development') {
            console.warn('Response validation failed, sending anyway in development mode');
            return originalJson(data);
          } else {
            return originalJson({
              message: 'Internal server error',
              code: 'RESPONSE_VALIDATION_FAILED'
            });
          }
        }
        return originalJson(result.data);
      } catch (error) {
        console.error('Response validation error:', error);
        return originalJson({
          message: 'Internal server error',
          code: 'RESPONSE_VALIDATION_ERROR'
        });
      }
    };
    
    next();
  };
}

/**
 * Common query schemas for reuse
 */
export const paginationQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1),
  limit: z.string().transform(val => Math.min(parseInt(val) || 10, 50)), // Cap at 50
});

export const tripFiltersQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  date: z.string().optional(),
  region: z.string().optional(),
  minPrice: z.string().transform(val => val ? parseFloat(val) : undefined).optional(),
  maxPrice: z.string().transform(val => val ? parseFloat(val) : undefined).optional(),
  search: z.string().optional(),
});

export const communityFiltersQuerySchema = z.object({
  topic: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['recent', 'popular', 'votes']).default('recent'),
});

/**
 * Error handler for validation failures
 */
export function handleValidationError(error: any, req: Request, res: Response, next: NextFunction) {
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: error.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }
  next(error);
}