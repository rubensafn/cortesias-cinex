/*
  # Complete database reset - clean slate
  
  Drop everything and rebuild from scratch with simple password authentication
*/

DROP TABLE IF EXISTS cortesias CASCADE;
DROP TABLE IF EXISTS code_sequences CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS user_accounts CASCADE;
DROP FUNCTION IF EXISTS verify_password(text, text);

-- Create user_accounts table - simple, no encryption
CREATE TABLE user_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  role text DEFAULT 'user',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own account"
  ON user_accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Service role can do anything"
  ON user_accounts FOR ALL
  USING (auth.role() = 'service_role');

-- Create user_profiles table
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES user_accounts(id) ON DELETE CASCADE,
  display_name text,
  email text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can do anything"
  ON user_profiles FOR ALL
  USING (auth.role() = 'service_role');

-- Create code_sequences table
CREATE TABLE code_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  prefix text,
  current_number integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE code_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own sequences"
  ON code_sequences FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create sequences"
  ON code_sequences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Service role can do anything"
  ON code_sequences FOR ALL
  USING (auth.role() = 'service_role');

-- Create cortesias table
CREATE TABLE cortesias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid NOT NULL REFERENCES code_sequences(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  created_by uuid NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cortesias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own cortesias"
  ON cortesias FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create cortesias"
  ON cortesias FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Service role can do anything"
  ON cortesias FOR ALL
  USING (auth.role() = 'service_role');

-- Insert test users with simple passwords
INSERT INTO user_accounts (username, password, role) VALUES
  ('admin', 'password123', 'master_admin'),
  ('rubens', 'senha123', 'admin');

-- Create profiles for users
INSERT INTO user_profiles (user_id, display_name, email)
SELECT id, INITCAP(username), username || '@cinex.com.br'
FROM user_accounts;