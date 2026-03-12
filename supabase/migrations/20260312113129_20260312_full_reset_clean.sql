/*
  # Complete Database Reset

  Apaga todas as tabelas, funções e políticas, e reconstrói o schema do zero.
  
  1. Remove todas as tabelas
  2. Cria tabela user_accounts com password_hash (não password)
  3. Cria tabela user_profiles
  4. Cria tabela code_sequences
  5. Cria tabela cortesias
  6. Configura RLS em todas as tabelas
  7. Insere usuários iniciais (admin, rubens)
*/

-- Drop all existing tables in correct order
DROP TABLE IF EXISTS cortesias CASCADE;
DROP TABLE IF EXISTS code_sequences CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS user_accounts CASCADE;

-- Create user_accounts table with password_hash
CREATE TABLE user_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text DEFAULT 'user',
  created_at timestamptz DEFAULT now()
);

-- Create user_profiles table
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  display_name text,
  email text,
  approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create code_sequences table
CREATE TABLE code_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  prefix text,
  current_number integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Create cortesias table
CREATE TABLE cortesias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid NOT NULL REFERENCES code_sequences(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  created_by uuid NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE cortesias ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_accounts
CREATE POLICY "Anyone can view user_accounts"
  ON user_accounts FOR SELECT
  TO anon, authenticated
  USING (true);

-- RLS Policies for user_profiles
CREATE POLICY "Anyone can view user_profiles"
  ON user_profiles FOR SELECT
  TO anon, authenticated
  USING (true);

-- RLS Policies for code_sequences
CREATE POLICY "Authenticated users can view code_sequences"
  ON code_sequences FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create code_sequences"
  ON code_sequences FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own code_sequences"
  ON code_sequences FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- RLS Policies for cortesias
CREATE POLICY "Authenticated users can view cortesias"
  ON cortesias FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create cortesias"
  ON cortesias FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Insert admin user
INSERT INTO user_accounts (username, password_hash, role)
VALUES ('admin', 'admin', 'admin');

-- Insert rubens user
INSERT INTO user_accounts (username, password_hash, role)
VALUES ('rubens', 'rubens', 'user');

-- Insert profiles for both users
INSERT INTO user_profiles (user_id, display_name, email, approved)
SELECT id, 'Admin', 'admin@cinex.local', true FROM user_accounts WHERE username = 'admin';

INSERT INTO user_profiles (user_id, display_name, email, approved)
SELECT id, 'Rubens', 'rubens@cinex.local', true FROM user_accounts WHERE username = 'rubens';