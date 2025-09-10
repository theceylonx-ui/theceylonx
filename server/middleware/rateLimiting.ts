import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { envConfig, isProduction } from '../config/environment';

// 🔒 PHASE 4: Comprehensive rate limiting for production security

// Standard API rate limiter
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction() ? 100 : 1000, // requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Please try again later. Maximum 100 requests per 15 minutes.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.path.startsWith('/health');
  },
});

// Strict rate limiter for authentication endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction() ? 5 : 100, // Very restrictive in production
  message: {
    error: 'Too many authentication attempts',
    message: 'Maximum 5 login attempts per 15 minutes. Please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful authentications
});

// File upload rate limiter
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: isProduction() ? 5 : 50, // 5 uploads per minute in production
  message: {
    error: 'Upload limit exceeded',
    message: 'Maximum 5 file uploads per minute. Please wait before uploading again.',
    retryAfter: '1 minute',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Search/browse rate limiter (more lenient)
export const searchRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: isProduction() ? 60 : 200, // 60 searches per minute
  message: {
    error: 'Search limit exceeded',
    message: 'Maximum 30 searches per minute. Please slow down.',
    retryAfter: '1 minute',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Chat/messaging rate limiter
export const chatRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: isProduction() ? 40 : 100, // 40 messages per minute
  message: {
    error: 'Messaging limit exceeded',
    message: 'Maximum 20 messages per minute. Please slow down.',
    retryAfter: '1 minute',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Trip creation rate limiter
export const tripCreationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isProduction() ? 10 : 20, // 10 trip posts per hour
  message: {
    error: 'Trip creation limit exceeded',
    message: 'Maximum 3 trip posts per hour. Quality over quantity!',
    retryAfter: '1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General web rate limiter (very lenient for browsing)
export const webRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: isProduction() ? 100 : 1000, // 100 page views per minute
  message: {
    error: 'Too many requests',
    message: 'Please slow down your browsing.',
    retryAfter: '1 minute',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Skip for static assets and health checks
    return req.path.startsWith('/health') || 
           req.path.includes('.') || // likely static file
           req.path.startsWith('/_');
  },
});