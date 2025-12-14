import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyPassword, generateToken } from '@/lib/auth';
import { db } from '@/lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }

  const normalizedEmail = email.toLowerCase();
  const user = await db.users.getByEmail(normalizedEmail);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Check if email is verified
  if (!user.emailVerified) {
    return res.status(403).json({ 
      error: 'Email not verified. Please verify your email first.',
      requiresVerification: true,
    });
  }

  // Check if user is approved by admin
  if (user.status !== 'approved') {
    if (user.status === 'pending') {
      return res.status(403).json({
        error: 'Your account is pending admin approval. Please wait for approval.',
        status: 'pending',
      });
    }
    if (user.status === 'rejected') {
      return res.status(403).json({
        error: 'Your account has been rejected. Please contact support.',
        status: 'rejected',
      });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({
        error: 'Your account has been suspended. Please contact support.',
        status: 'suspended',
      });
    }
  }

  const token = generateToken(user);
  const { password: _, ...userWithoutPassword } = user;

  res.status(200).json({ user: userWithoutPassword, token });
}

