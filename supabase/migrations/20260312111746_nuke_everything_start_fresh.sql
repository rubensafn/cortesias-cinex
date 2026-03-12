/*
  # Complete reset - drop all tables and start fresh
  
  This migration completely resets the database, dropping all existing tables
  and then rebuilding the schema from scratch with proper structure.
*/

-- Drop all existing tables if they exist
DROP TABLE IF EXISTS cortesias CASCADE;
DROP TABLE IF EXISTS code_sequences CASCADE;
DROP TABLE IF EXISTS user_accounts CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS verify_password(text, text);
DROP FUNCTION IF EXISTS create_user_account(text, text);

-- Create user_accounts table with bcrypt support
CREATE TABLE user_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('master_admin', 'admin', 'user')),
  approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;

-- Create user_profiles table
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  display_name text,
  email text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create code_sequences table
CREATE TABLE code_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  prefix text,
  start_number integer DEFAULT 1,
  current_number integer DEFAULT 1,
  total_codes integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE code_sequences ENABLE ROW LEVEL SECURITY;

-- Create cortesias table
CREATE TABLE cortesias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid NOT NULL REFERENCES code_sequences(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  created_by uuid NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  status text DEFAULT 'active' CHECK (status IN ('active', 'used', 'canceled'))
);

ALTER TABLE cortesias ENABLE ROW LEVEL SECURITY;

-- Create verify_password function
CREATE OR REPLACE FUNCTION verify_password(p_username text, p_password text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_accounts
    WHERE username = p_username
    AND password_hash = crypt(p_password, password_hash)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert master admin and admin users with proper passwords
INSERT INTO user_accounts (username, password_hash, role, approved) VALUES
  ('admin', crypt('password123', gen_salt('bf')), 'master_admin', true),
  ('rubens', crypt('senha123', gen_salt('bf')), 'admin', true);

-- Create user profiles for the accounts
INSERT INTO user_profiles (user_id, display_name, email)
SELECT id, INITCAP(username), username || '@cinex.com.br'
FROM user_accounts
WHERE username IN ('admin', 'rubens');

-- Set up RLS policies for user_accounts
CREATE POLICY "Admins can see all users"
  ON user_accounts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_accounts
      WHERE id = auth.uid()
      AND role IN ('master_admin', 'admin')
    )
  );

CREATE POLICY "Users can see themselves"
  ON user_accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Set up RLS policies for user_profiles
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can see all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_accounts
      WHERE id = auth.uid()
      AND role IN ('master_admin', 'admin')
    )
  );

-- Set up RLS policies for code_sequences
CREATE POLICY "Users can see own sequences"
  ON code_sequences FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create sequences"
  ON code_sequences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own sequences"
  ON code_sequences FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Set up RLS policies for cortesias
CREATE POLICY "Users can see own cortesias"
  ON cortesias FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create cortesias"
  ON cortesias FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own cortesias"
  ON cortesias FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);