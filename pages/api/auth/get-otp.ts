import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';

/**
 * Development endpoint to retrieve OTP code
 * This should be disabled or secured in production
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Only allow in development or with proper authentication
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_OTP_RETRIEVAL) {
    return res.status(403).json({ error: 'Not available in production' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const normalizedEmail = email.toLowerCase();
    const otp = await db.otps.getByEmail(normalizedEmail);
    
    if (!otp) {
      return res.status(404).json({ error: 'No OTP found for this email' });
    }

    // Check if expired
    if (new Date(otp.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'OTP has expired' });
    }

    return res.status(200).json({ 
      code: otp.code,
      expiresAt: otp.expiresAt,
      message: 'OTP retrieved successfully (development mode only)'
    });
  } catch (error: any) {
    console.error('Error retrieving OTP:', error);
    return res.status(500).json({ error: 'Failed to retrieve OTP' });
  }
}


