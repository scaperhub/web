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

import { Resend } from 'resend';

export async function sendOTP(email: string, code: string): Promise<void> {
  // Log OTP for development/testing
  console.log(`[OTP] Email: ${email}, Code: ${code}`);
  
  // Send email via Resend if API key is configured
  const resendApiKey = process.env.RESEND_API_KEY;
  
  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      
      // Get the from email from env or use default
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
      
      await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: 'Your ScaperHub Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3943B7;">Verify Your Email</h2>
            <p>Your verification code is:</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <h1 style="color: #3943B7; margin: 0; font-size: 32px; letter-spacing: 4px;">${code}</h1>
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">If you didn't request this code, please ignore this email.</p>
          </div>
        `,
      });
      
      console.log(`[OTP] Email sent successfully to ${email}`);
    } catch (error: any) {
      console.error('[OTP] Failed to send email via Resend:', error.message);
      // Don't throw - allow registration to continue even if email fails
      // OTP is still stored in database and can be retrieved
    }
  } else {
    console.log('[OTP] RESEND_API_KEY not set. Email not sent. OTP stored in database.');
    console.log(`[OTP] You can retrieve this code via /api/auth/get-otp endpoint`);
  }
}



