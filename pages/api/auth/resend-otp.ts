import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { generateId } from '@/lib/utils';
import { OTP } from '@/lib/types';
import { createOTP, sendOTP } from '@/lib/otp';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Check if user exists
  const user = await db.users.getByEmail(email);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (user.emailVerified) {
    return res.status(400).json({ error: 'Email is already verified' });
  }

  // Generate and send new OTP
  const { code, expiresAt } = createOTP(email);
  const otp: OTP = {
    id: generateId(),
    email,
    code,
    expiresAt,
    createdAt: new Date().toISOString(),
  };

  await db.otps.create(otp);
  await sendOTP(email, code);

  res.status(200).json({ 
    message: 'OTP has been resent to your email.',
  });
}



