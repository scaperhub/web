import { generateId } from './utils';

export function generateOTP(): string {
  // Generate a 6-digit OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function createOTP(email: string): { code: string; expiresAt: string } {
  const code = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
  
  return {
    code,
    expiresAt: expiresAt.toISOString(),
  };
}

// In a real application, you would send this via email service
// For now, we'll just log it (in development) or store it
export async function sendOTP(email: string, code: string): Promise<void> {
  // Log OTP for development/testing
  console.log(`[OTP] Email: ${email}, Code: ${code}`);
  console.log(`[OTP] You can retrieve this code via /api/auth/get-otp endpoint (development only)`);
  
  // TODO: Integrate with email service in production
  // Options:
  // 1. Resend (https://resend.com) - Simple, good free tier
  // 2. SendGrid - Popular, good free tier
  // 3. AWS SES - Cost-effective for high volume
  // 4. Supabase Auth (if using Supabase Auth instead of custom)
  
  // Example with Resend (uncomment and configure):
  /*
  if (process.env.RESEND_API_KEY) {
    const resend = require('resend').Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'noreply@yourdomain.com',
      to: email,
      subject: 'Your OTP Code',
      html: `<p>Your OTP code is: <strong>${code}</strong></p><p>This code expires in 10 minutes.</p>`,
    });
  }
  */
}



