import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import { db } from '../db';
import { users, emailTokens } from '@shared/schema';
import { eq } from 'drizzle-orm';
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

const EMAIL_FROM = process.env.EMAIL_FROM || 'Ceylon Expand <no-reply@ceylonexpand.com>';
// Determine APP_URL based on environment
const APP_URL = process.env.APP_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://theceylonx.com'  // Production fallback
    : 'http://localhost:5000');  // Development fallback

// Create transporter
const transporter = nodemailer.createTransport(SMTP_CONFIG);

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
    subject: 'Sign in to Ceylon Expand',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #059669; margin: 0;">Ceylon Expand</h1>
          <p style="color: #666; margin: 5px 0;">Your travel companion in Sri Lanka</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 8px; text-align: center;">
          <h2 style="color: #1f2937; margin: 0 0 20px 0;">Sign in to your account</h2>
          <p style="color: #4b5563; margin: 0 0 30px 0; line-height: 1.5;">
            Click the button below to securely sign in to Ceylon Expand. This link will expire in 10 minutes.
          </p>
          
          <a href="${magicLink}" 
             style="background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Sign In to Ceylon Expand
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
Sign in to Ceylon Expand

Click this link to sign in: ${magicLink}

This link will expire in 10 minutes for your security.

If you didn't request this email, you can safely ignore it.

Ceylon Expand - Your travel companion in Sri Lanka
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
      [user] = await db.insert(users).values({
        email,
        provider: 'email',
        emailVerified: true,
      }).returning();
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