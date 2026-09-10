import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import { db } from '../db';
import { users, emailTokens } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { JWTUser } from './jwt';

// Email Configuration
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.SMTP_PORT || process.env.EMAIL_SERVER_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_SERVER_USER,
    pass: process.env.SMTP_PASS || process.env.EMAIL_SERVER_PASSWORD,
  },
};

const EMAIL_FROM = process.env.EMAIL_FROM || 'HiBowan <no-reply@hibowan.com>';
// Determine APP_URL based on environment
const APP_URL = process.env.APP_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://www.hibowan.com'  // Production fallback
    : 'http://localhost:5000');  // Development fallback

// Create transporter
const transporter = nodemailer.createTransport(SMTP_CONFIG);

// Generate 6-digit verification code
export function generateVerificationCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function sendVerificationCode(email: string): Promise<string> {
  // Generate 6-digit verification code
  const code = generateVerificationCode();
  const tokenHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Clean up old tokens for this email
  await db.delete(emailTokens).where(eq(emailTokens.email, email));

  // Store new token
  await db.insert(emailTokens).values({
    email,
    tokenHash,
    expiresAt,
  });

  // Check if we're in development mode or missing SMTP credentials
  const isDevelopment = process.env.NODE_ENV === 'development';
  const hasSmtpCredentials = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

  if (isDevelopment && !hasSmtpCredentials) {
    // Development mode: Just log the code instead of sending email
    console.log('🔍 DEVELOPMENT MODE - Email Verification Code:');
    console.log('📧 Email:', email);
    console.log('🔐 Verification Code:', code);
    console.log('⏰ Expires in 10 minutes');
    console.log('💡 In production, this would be sent via email');
    return code;
  }

  // Email template for verification code
  const emailContent = {
    from: EMAIL_FROM,
    to: email,
    subject: 'Verify your email - HiBowan',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #DB354E; margin: 0;">HiBowan</h1>
          <p style="color: #666; margin: 5px 0;">Your travel companion in Sri Lanka</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 8px; text-align: center;">
          <h2 style="color: #1f2937; margin: 0 0 20px 0;">Email Verification</h2>
          <p style="color: #4b5563; margin: 0 0 30px 0; line-height: 1.5;">
            Please use the verification code below to verify your email address. This code will expire in 10 minutes.
          </p>
          
          <div style="background: white; border: 2px solid #DB354E; border-radius: 8px; padding: 20px; margin: 20px 0; display: inline-block;">
            <div style="color: #DB354E; font-size: 32px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">
              ${code}
            </div>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0;">
            If you didn't request this verification, you can safely ignore this email.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            HiBowan - Your travel companion in Sri Lanka
          </p>
        </div>
      </div>
    `,
  };

  // Send email in production
  try {
    await transporter.sendMail(emailContent);
    return code; // Return for testing purposes (remove in production)
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw new Error('Failed to send verification email');
  }
}

export async function verifyEmailCode(email: string, code: string): Promise<boolean> {
  try {
    // Find the most recent token for this email
    const [token] = await db
      .select()
      .from(emailTokens)
      .where(and(
        eq(emailTokens.email, email),
        eq(emailTokens.used, false)
      ))
      .orderBy(sql`${emailTokens.createdAt} DESC`)
      .limit(1);

    if (!token) {
      return false;
    }

    // Check if token is expired
    if (new Date() > token.expiresAt) {
      return false;
    }

    // Verify the code
    const isValid = await bcrypt.compare(code, token.tokenHash);
    
    if (isValid) {
      // Mark token as used
      await db
        .update(emailTokens)
        .set({ used: true })
        .where(eq(emailTokens.id, token.id));

      // Update user's email verification status
      await db
        .update(users)
        .set({ 
          emailVerified: true,
          verificationBadges: sql`array_append(COALESCE(verification_badges, '{}'), 'email')`,
          verificationDate: new Date()
        })
        .where(eq(users.email, email));

      return true;
    }

    return false;
  } catch (error) {
    console.error('Error verifying email code:', error);
    return false;
  }
}

export async function sendMagicLink(email: string): Promise<void> {
  // Generate magic link token
  const token = nanoid(32);
  const tokenHash = await bcrypt.hash(token, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Clean up old tokens for this email
  await db.delete(emailTokens).where(eq(emailTokens.email, email));

  // Store new token
  await db.insert(emailTokens).values({
    email,
    tokenHash,
    expiresAt,
  });

  // Create magic link
  const magicLink = `${APP_URL}/auth/magic?token=${token}&email=${encodeURIComponent(email)}`;

  // Email template
  const emailContent = {
    from: EMAIL_FROM,
    to: email,
    subject: 'Sign in to HiBowan',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #DB354E; margin: 0;">HiBowan</h1>
          <p style="color: #666; margin: 5px 0;">Your travel companion in Sri Lanka</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 8px; text-align: center;">
          <h2 style="color: #1f2937; margin: 0 0 20px 0;">Sign in to your account</h2>
          <p style="color: #4b5563; margin: 0 0 30px 0; line-height: 1.5;">
            Click the button below to securely sign in to HiBowan. This link will expire in 10 minutes.
          </p>
          
          <a href="${magicLink}" 
             style="background: #DB354E; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Sign In to HiBowan
          </a>
          
          <p style="color: #9ca3af; font-size: 14px; margin: 30px 0 0 0;">
            If you didn't request this email, you can safely ignore it.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 14px;">
          <p>This link will expire in 10 minutes for your security.</p>
        </div>
      </div>
    `,
    text: `
Sign in to HiBowan

Click this link to sign in: ${magicLink}

This link will expire in 10 minutes for your security.

If you didn't request this email, you can safely ignore it.

HiBowan - Your travel companion in Sri Lanka
    `,
  };

  // Send email
  try {
    await transporter.sendMail(emailContent);
  } catch (error) {
    console.error('Failed to send magic link email:', error);
    throw new Error('Failed to send email');
  }
}

export async function verifyMagicLink(token: string, email: string): Promise<JWTUser | null> {
  try {
    // Find token record
    const [tokenRecord] = await db.select()
      .from(emailTokens)
      .where(eq(emailTokens.email, email));

    if (!tokenRecord || tokenRecord.used || tokenRecord.expiresAt < new Date()) {
      return null;
    }

    // Verify token
    const isValidToken = await bcrypt.compare(token, tokenRecord.tokenHash);
    if (!isValidToken) {
      return null;
    }

    // Mark token as used
    await db.update(emailTokens)
      .set({ used: true })
      .where(eq(emailTokens.id, tokenRecord.id));

    // Find or create user
    let [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
      // Create new user
      const insertedUsers = await db.insert(users).values({
        email,
        provider: 'email',
        emailVerified: true,
      }).returning();
      if (Array.isArray(insertedUsers)) {
        user = insertedUsers[0];
      }
    } else {
      // Update email verified status
      await db.update(users)
        .set({ emailVerified: true })
        .where(eq(users.id, user.id));
    }

    return {
      id: user.id,
      email: user.email || undefined,
      name: user.name || undefined,
      provider: 'email',
    };
  } catch (error) {
    console.error('Error verifying magic link:', error);
    return null;
  }
}

// Check if email service is configured
export function isEmailConfigured(): boolean {
  return !!(
    (process.env.SMTP_HOST || process.env.EMAIL_SERVER_HOST) &&
    (process.env.SMTP_USER || process.env.EMAIL_SERVER_USER) &&
    (process.env.SMTP_PASS || process.env.EMAIL_SERVER_PASSWORD)
  );
}