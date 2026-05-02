/**
 * SMS Utility — Mock implementation (Twilio-ready)
 *
 * In development / when TWILIO_* env vars are NOT set, OTP codes are
 * logged to the server console instead of being sent via SMS.
 *
 * To enable real SMS:
 *  1. Ensure twilio is in package.json (already done)
 *  2. Set env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE
 *  3. The code below automatically switches to real SMS once vars are present.
 */

import { randomInt } from 'node:crypto';

/**
 * Send an SMS message.
 * Falls back to console.log if Twilio is not configured.
 * @param {string} to   - E.164 phone number e.g. "+998901234567"
 * @param {string} body - Message text
 */
export async function sendSMS(to, body) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE } = process.env;

  // Real SMS via Twilio — only when all three env vars are set
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE) {
    try {
      const { default: twilio } = await import('twilio');
      const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      await client.messages.create({ from: TWILIO_PHONE, to, body });
      console.log(`📱 SMS sent to ${to}`);
      return;
    } catch (err) {
      console.error('Twilio send error:', err.message);
      // Fall through to mock on Twilio failure
    }
  }

  // Mock: log to console (development / no Twilio configured)
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📱 [MOCK SMS]  To: ${to}`);
  console.log(`   Message  :  ${body}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
}

/**
 * Generate a cryptographically secure 6-digit OTP code.
 * Uses Node's built-in crypto.randomInt — synchronous, no await needed.
 */
export function generateOTP() {
  return String(randomInt(100000, 999999));
}
