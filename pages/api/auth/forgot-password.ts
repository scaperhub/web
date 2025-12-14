import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { createOTP, sendOTP } from '@/lib/otp';
import { generateId } from '@/lib/utils';
import { OTP } from '@/lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const normalizedEmail = email.toLowerCase();
  const user = await db.users.getByEmail(normalizedEmail);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { code, expiresAt } = createOTP(normalizedEmail);
  const otp: OTP = {
    id: generateId(),
    email: normalizedEmail,
    code,
    expiresAt,
    createdAt: new Date().toISOString(),
  };

  await db.otps.create(otp);
  await sendOTP(normalizedEmail, code);

  return res.status(200).json({ message: 'Password reset code sent to your email.' });
}

