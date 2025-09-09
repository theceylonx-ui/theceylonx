import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// 🔒 PHASE 4: Input validation and sanitization middleware

// Sanitize HTML content
export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br'],
    ALLOWED_ATTR: ['href'],
  });
}

// SQL injection prevention patterns
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
  /(--|;|\||\&)/,
  /(union|select|from|where|order by|group by|having)/i,
];

// XSS prevention patterns
const XSS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /javascript:/i,
  /on\w+\s*=/i,
];

// Path traversal patterns
const PATH_TRAVERSAL_PATTERNS = [
  /\.\./,
  /\.\\\\/,
  /\.\.\//,
  /%2e%2e/i,
  /%2f/i,
  /%5c/i,
];

// Validate and sanitize request input
export function validateInput(req: Request, res: Response, next: NextFunction) {
  try {
    // Check for SQL injection attempts
    const checkForSqlInjection = (value: any) => {
      if (typeof value === 'string') {
        for (const pattern of SQL_INJECTION_PATTERNS) {
          if (pattern.test(value)) {
            throw new Error('Potential SQL injection detected');
          }
        }
      }
    };

    // Check for XSS attempts
    const checkForXss = (value: any) => {
      if (typeof value === 'string') {
        for (const pattern of XSS_PATTERNS) {
          if (pattern.test(value)) {
            throw new Error('Potential XSS attack detected');
          }
        }
      }
    };

    // Check for path traversal attempts
    const checkForPathTraversal = (value: any) => {
      if (typeof value === 'string') {
        for (const pattern of PATH_TRAVERSAL_PATTERNS) {
          if (pattern.test(value)) {
            throw new Error('Path traversal attempt detected');
          }
        }
      }
    };

    // Recursively validate object properties
    const validateObject = (obj: any) => {
      if (obj && typeof obj === 'object') {
        for (const key in obj) {
          if (typeof obj[key] === 'string') {
            checkForSqlInjection(obj[key]);
            checkForXss(obj[key]);
            checkForPathTraversal(obj[key]);
          } else if (typeof obj[key] === 'object') {
            validateObject(obj[key]);
          }
        }
      }
    };

    // Validate request body
    if (req.body) {
      validateObject(req.body);
    }

    // Validate query parameters
    if (req.query) {
      validateObject(req.query);
    }

    // Validate URL parameters
    if (req.params) {
      validateObject(req.params);
    }

    next();
  } catch (error) {
    console.warn('🚨 Security validation failed:', error);
    res.status(400).json({
      error: 'Invalid input',
      message: 'Request contains potentially malicious content',
    });
  }
}

// Sanitize text content middleware
export function sanitizeTextContent(req: Request, res: Response, next: NextFunction) {
  const sanitizeValue = (value: any): any => {
    if (typeof value === 'string') {
      return sanitizeHtml(value.trim());
    }
    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }
    if (value && typeof value === 'object') {
      const sanitized: any = {};
      for (const key in value) {
        sanitized[key] = sanitizeValue(value[key]);
      }
      return sanitized;
    }
    return value;
  };

  // Sanitize body content
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }

  next();
}

// File upload validation
export const fileUploadValidation = {
  // Image file validation
  imageFile: (req: Request, res: Response, next: NextFunction) => {
    const file = req.file;
    if (!file) {
      return next();
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        error: 'Invalid file type',
        message: 'Only JPEG, PNG, WebP, and GIF images are allowed',
      });
    }

    // Check file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return res.status(400).json({
        error: 'File too large',
        message: 'Maximum file size is 5MB',
      });
    }

    next();
  },

  // Document file validation
  documentFile: (req: Request, res: Response, next: NextFunction) => {
    const file = req.file;
    if (!file) {
      return next();
    }

    // Check file type
    const allowedTypes = ['application/pdf', 'text/plain', 'application/msword'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        error: 'Invalid file type',
        message: 'Only PDF, TXT, and DOC files are allowed',
      });
    }

    // Check file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return res.status(400).json({
        error: 'File too large',
        message: 'Maximum file size is 10MB',
      });
    }

    next();
  },
};

// Schema validation middleware factory
export function validateSchema<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse(req.body);
      req.body = result;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
}