/*
  # Reset Complete - Clean Start for Auth System

  1. Drop all existing tables and functions
  2. Create clean schema with:
     - user_accounts: stores username, password hash, and role
     - user_profiles: stores user metadata
  3. Enable RLS with strict policies
  4. Create master and admin users
*/

-- Drop existing objects
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS user_accounts CASCADE;
DROP FUNCTION IF EXISTS hash_password() CASCADE;

-- Create user_accounts table
CREATE TABLE user_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'user', -- 'master', 'admin', 'user'
  created_at timestamptz DEFAULT now()
);

-- Create user_profiles table
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_accounts(id) ON DELETE CASCADE,
  email text,
  approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_accounts (only service role can read)
CREATE POLICY "Service role only" 
  ON user_accounts FOR ALL TO service_role 
  USING (true) WITH CHECK (true);

-- RLS Policies for user_profiles
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role can manage profiles"
  ON user_profiles FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Create master user: rubens@conexstudio.com.br / soap486319
INSERT INTO user_accounts (username, password_hash, role)
VALUES (
  'rubens@conexstudio.com.br',
  crypt('soap486319', gen_salt('bf')),
  'master'
);

INSERT INTO user_profiles (user_id, email, approved)
SELECT id, 'rubens@conexstudio.com.br', true
FROM user_accounts WHERE username = 'rubens@conexstudio.com.br';

-- Create admin user: admin / admin@123
INSERT INTO user_accounts (username, password_hash, role)
VALUES (
  'admin',
  crypt('admin@123', gen_salt('bf')),
  'admin'
);

INSERT INTO user_profiles (user_id, email, approved)
SELECT id, 'admin@cinex.com.br', true
FROM user_accounts WHERE username = 'admin';
