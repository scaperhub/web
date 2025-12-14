import type { NextApiRequest, NextApiResponse } from 'next';
import { hashPassword } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateId } from '@/lib/utils';
import { User, OTP } from '@/lib/types';
import { createOTP, sendOTP } from '@/lib/otp';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, name, username, userType, country, city } = req.body;

  if (!email || !password || !name || !username || !userType || !country || !city) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (userType !== 'hobbyist' && userType !== 'shop') {
    return res.status(400).json({ error: 'Invalid user type. Must be hobbyist or shop' });
  }

  // Validate username format (alphanumeric, lowercase, 3-20 characters)
  const usernameRegex = /^[a-z0-9_]{3,20}$/;
  if (!usernameRegex.test(username)) {
    return res.status(400).json({ 
      error: 'Username must be 3-20 characters, lowercase letters, numbers, and underscores only' 
    });
  }

  // Check if email exists
  const normalizedEmail = email.toLowerCase();
  const existingUserByEmail = await db.users.getByEmail(normalizedEmail);
  if (existingUserByEmail) {
    return res.status(400).json({ error: 'Email already exists' });
  }

  // Check if username exists
  const existingUserByUsername = await db.users.getByUsername(username);
  if (existingUserByUsername) {
    return res.status(400).json({ error: 'Username already taken' });
  }

  // Generate and send OTP
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

  // Create user with pending status
  const hashedPassword = await hashPassword(password);
  const user: User = {
    id: generateId(),
    username: username.toLowerCase(),
    email: normalizedEmail,
    password: hashedPassword,
    name,
    role: 'user',
    status: 'pending',
    userType: userType,
    emailVerified: false,
    verified: false,
    following: [],
    createdAt: new Date().toISOString(),
    country,
    city,
  };

  await db.users.create(user);

  res.status(201).json({ 
    message: 'Registration successful. Please verify your email with the OTP sent to your email.',
    email,
    requiresVerification: true,
  });
}

