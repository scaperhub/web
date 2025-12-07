import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { generateToken } from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Missing email or OTP code' });
  }

  // Get the OTP
  const otp = await db.otps.getByEmail(email);
  if (!otp) {
    return res.status(400).json({ error: 'No OTP found for this email. Please request a new one.' });
  }

  // Check if OTP is expired
  if (new Date(otp.expiresAt) < new Date()) {
    await db.otps.delete(email);
    return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
  }

  // Verify OTP
  if (otp.code !== code) {
    return res.status(400).json({ error: 'Invalid OTP code' });
  }

  // Get user
  const user = await db.users.getByEmail(email);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Mark email as verified
  await db.users.update(user.id, { emailVerified: true });

  // Delete OTP after successful verification
  await db.otps.delete(email);

  // Note: User still needs admin approval to login
  const { password: _, ...userWithoutPassword } = user;
  res.status(200).json({ 
    message: 'Email verified successfully. Please wait for admin approval.',
    user: { ...userWithoutPassword, emailVerified: true },
  });
}



