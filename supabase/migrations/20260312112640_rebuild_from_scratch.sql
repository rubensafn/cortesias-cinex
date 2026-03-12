/*
  # Rebuild database from scratch
  
  1. New Tables
    - `user_accounts` - Simple user storage
    - `user_profiles` - User profile info
    - `code_sequences` - For generating codes
    - `cortesias` - Voucher codes
  
  2. Security
    - RLS enabled on all tables
    - Service role can do anything
    - Users can manage their own data
*/

-- Create user_accounts - plain password, no auth.users
CREATE TABLE user_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role all"
  ON user_accounts FOR ALL
  USING (auth.role() = 'service_role');

-- Create user_profiles
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  display_name text,
  email text,
  approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role all"
  ON user_profiles FOR ALL
  USING (auth.role() = 'service_role');

-- Create code_sequences
CREATE TABLE code_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  prefix text,
  current_number integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE code_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role all"
  ON code_sequences FOR ALL
  USING (auth.role() = 'service_role');

-- Create cortesias
CREATE TABLE cortesias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid NOT NULL REFERENCES code_sequences(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  created_by uuid NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cortesias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role all"
  ON cortesias FOR ALL
  USING (auth.role() = 'service_role');

-- Insert two users with simple passwords
INSERT INTO user_accounts (username, password, role) VALUES
  ('admin', 'password123', 'master_admin'),
  ('rubens', 'senha123', 'admin');

-- Create profiles
INSERT INTO user_profiles (user_id, display_name, email, approved) 
SELECT id, INITCAP(username), username || '@cinex.com.br', true
FROM user_accounts;