import twilio from 'twilio';
import bcrypt from 'bcrypt';
import { db } from '../db';
import { users, phoneOtps } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { JWTUser } from './jwt';

// Twilio Configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

// Normalize phone number to E.164 format
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If starts with 0, assume it's a local Sri Lankan number
  if (cleaned.startsWith('0')) {
    cleaned = '94' + cleaned.substring(1); // Sri Lanka country code
  }
  // If doesn't start with +, add +
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
}

export async function sendPhoneOtp(phone: string): Promise<void> {
  if (!client) {
    throw new Error('Twilio not configured');
  }

  // Normalize phone number
  const normalizedPhone = normalizePhoneNumber(phone);
  console.log(`Sending SMS to normalized number: ${normalizedPhone}`);

  // Generate 6-digit OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // Clean up old OTPs and create new one
  await db.delete(phoneOtps).where(eq(phoneOtps.phone, normalizedPhone));

  await db.insert(phoneOtps).values({
    phone: normalizedPhone,
    codeHash,
    expiresAt,
  });

  // Send SMS
  const message = `Your Ceylon Expand verification code is: ${code}\n\nThis code will expire in 5 minutes.`;

  try {
    if (messagingServiceSid) {
      await client.messages.create({
        body: message,
        messagingServiceSid,
        to: normalizedPhone,
      });
    } else {
      // Fallback if no messaging service configured
      await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: normalizedPhone,
      });
    }
    console.log(`SMS sent successfully to ${normalizedPhone}`);
  } catch (error) {
    console.error('Failed to send SMS:', error);
    throw new Error('Failed to send verification code');
  }
}

export async function verifyPhoneOtp(phone: string, code: string): Promise<JWTUser | null> {
  try {
    // Normalize phone number for lookup
    const normalizedPhone = normalizePhoneNumber(phone);
    
    // Find OTP record
    const [otpRecord] = await db.select()
      .from(phoneOtps)
      .where(eq(phoneOtps.phone, normalizedPhone));

    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      return null;
    }

    // Check attempt limit
    if (otpRecord.attempts >= 3) {
      return null;
    }

    // Verify code
    const isValidCode = await bcrypt.compare(code, otpRecord.codeHash);
    
    if (!isValidCode) {
      // Increment attempts
      await db.update(phoneOtps)
        .set({ attempts: otpRecord.attempts + 1 })
        .where(eq(phoneOtps.id, otpRecord.id));
      return null;
    }

    // Delete OTP record after successful verification
    await db.delete(phoneOtps).where(eq(phoneOtps.id, otpRecord.id));

    // Find or create user
    let [user] = await db.select().from(users).where(eq(users.phone, phone));

    if (!user) {
      // Create new user with synthetic email
      const syntheticEmail = `phone:${phone.replace('+', '')}@ceylonexpand.com`;
      [user] = await db.insert(users).values({
        phone,
        email: syntheticEmail,
        provider: 'phone',
        emailVerified: false,
      }).returning();
    }

    return {
      id: user.id,
      phone: user.phone || undefined,
      email: user.email || undefined,
      name: user.name || undefined,
      provider: 'phone',
    };
  } catch (error) {
    console.error('Error verifying phone OTP:', error);
    return null;
  }
}

// Check if phone service is configured
export function isPhoneConfigured(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    (process.env.TWILIO_MESSAGING_SERVICE_SID || process.env.TWILIO_PHONE_NUMBER)
  );
}