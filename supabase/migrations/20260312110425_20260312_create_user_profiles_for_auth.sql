/*
  # Create user profiles for master and admin

  Create user_profiles table entries for the two auth users
*/

-- First, ensure user_profiles table exists
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  email text,
  role text DEFAULT 'user',
  approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Delete any existing profiles
DELETE FROM user_profiles;

-- Insert master user profile
INSERT INTO user_profiles (user_id, username, email, role, approved)
SELECT id, 'master', email, 'master', true
FROM auth.users
WHERE email = 'master@cinex.local';

-- Insert admin user profile
INSERT INTO user_profiles (user_id, username, email, role, approved)
SELECT id, 'admin', email, 'admin', true
FROM auth.users
WHERE email = 'admin@cinex.local';
