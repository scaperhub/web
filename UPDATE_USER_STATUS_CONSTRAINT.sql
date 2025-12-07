-- Update the users table to allow 'suspended' status
-- Run this SQL in your Supabase SQL Editor

-- Drop the existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;

-- Add the new constraint with 'suspended' included
ALTER TABLE users ADD CONSTRAINT users_status_check 
  CHECK (status IN ('pending', 'approved', 'rejected', 'suspended'));

