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
      // Note: onboarding@resend.dev may bounce - you should verify your own domain
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
      
      const result = await resend.emails.send({
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
      
      if (result.error) {
        console.error('[OTP] Resend API error:', result.error);
        throw new Error(`Resend error: ${JSON.stringify(result.error)}`);
      }
      
      console.log(`[OTP] Email sent successfully to ${email}. ID: ${result.data?.id}`);
    } catch (error: any) {
      console.error('[OTP] Failed to send email via Resend:', error.message);
      console.error('[OTP] Full error:', error);
      
      // Log specific bounce reasons if available
      if (error.response) {
        console.error('[OTP] Resend response:', error.response);
      }
      
      // Don't throw - allow registration to continue even if email fails
      // OTP is still stored in database and can be retrieved
      // User can still verify using the get-otp endpoint
    }
  } else {
    console.log('[OTP] RESEND_API_KEY not set. Email not sent. OTP stored in database.');
    console.log(`[OTP] You can retrieve this code via /api/auth/get-otp endpoint`);
  }
}

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  console.log(`[Welcome Email] Sending welcome email to: ${email}`);
  
  const resendApiKey = process.env.RESEND_API_KEY;
  
  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
      
      const result = await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: 'Welcome to ScaperHub!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #3943B7; font-size: 32px; margin: 0;">Welcome to ScaperHub<span style="color: #3943B7;">.</span></h1>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
              <p style="font-size: 18px; color: #111827; margin: 0 0 20px 0;">Hi ${name},</p>
              
              <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
                Great news! Your account has been approved and you can now start using ScaperHub.
              </p>
              
              <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
                You can now:
              </p>
              
              <ul style="color: #374151; line-height: 1.8; margin: 0 0 20px 0; padding-left: 20px;">
                <li>Browse and discover amazing aquascape equipment</li>
                <li>List your own items for sale</li>
                <li>Connect with fellow hobbyists and shop owners</li>
                <li>Build your profile and showcase your collection</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://scaperhub.com'}/login" 
                   style="display: inline-block; background-color: #3943B7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                  Get Started
                </a>
              </div>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 30px 0 0 0;">
              If you have any questions, feel free to reach out to us at 
              <a href="mailto:contact@scaperhub.com" style="color: #3943B7; text-decoration: none;">contact@scaperhub.com</a>
            </p>
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
              © ${new Date().getFullYear()} ScaperHub<span style="color: #3943B7;">.</span> All rights reserved.
            </p>
          </div>
        `,
      });
      
      if (result.error) {
        console.error('[Welcome Email] Resend API error:', result.error);
        throw new Error(`Resend error: ${JSON.stringify(result.error)}`);
      }
      
      console.log(`[Welcome Email] Email sent successfully to ${email}. ID: ${result.data?.id}`);
    } catch (error: any) {
      console.error('[Welcome Email] Failed to send email via Resend:', error.message);
      console.error('[Welcome Email] Full error:', error);
      
      if (error.response) {
        console.error('[Welcome Email] Resend response:', error.response);
      }
      
      // Don't throw - allow approval to continue even if email fails
      // Admin can still approve the user
    }
  } else {
    console.log('[Welcome Email] RESEND_API_KEY not set. Welcome email not sent.');
  }
}



