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
  // In production, integrate with email service like SendGrid, AWS SES, etc.
  // For development, we'll log it to console
  console.log(`[OTP] Email: ${email}, Code: ${code}`);
  
  // You can also store it in a file for testing
  // In production, remove this console.log and use a real email service
}



