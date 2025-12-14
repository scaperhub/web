import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, code, password } = req.body;
  if (!email || !code || !password) {
    return res.status(400).json({ error: 'Email, code, and new password are required' });
  }

  const normalizedEmail = email.toLowerCase();
  const otp = await db.otps.getByEmail(normalizedEmail);
  if (!otp) {
    return res.status(400).json({ error: 'Invalid or expired code' });
  }

  if (new Date(otp.expiresAt) < new Date()) {
    await db.otps.delete(email);
    return res.status(400).json({ error: 'Code expired. Please request a new one.' });
  }

  if (otp.code !== code) {
    return res.status(400).json({ error: 'Invalid code' });
  }

  const user = await db.users.getByEmail(normalizedEmail);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const hashed = await hashPassword(password);
  await db.users.update(user.id, { password: hashed });
  await db.otps.delete(email);

  return res.status(200).json({ message: 'Password reset successful. You can now log in.' });
}

