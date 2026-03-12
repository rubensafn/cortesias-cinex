/*
  # Complete Auth Reset - Fresh Start
  
  1. New Tables
    - `user_profiles` - Perfis de usuário sincronizados com auth.users
    - `cortesias` - Vouchers/tickets do sistema
    - `code_sequences` - Sequências de códigos
  
  2. Security
    - RLS habilitado em todas as tabelas
    - Políticas restrictivas por user_id
  
  3. Users
    - Master admin: rubens@conexstudio.com.br / soap@123
    - Admin: admin@conexstudio.com.br / admin@123
*/

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Master admin can read all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'master'
    )
  );

CREATE TABLE IF NOT EXISTS cortesias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  campaign_name text NOT NULL,
  value decimal(10, 2) NOT NULL,
  status text DEFAULT 'available',
  redeemed_by uuid REFERENCES auth.users(id),
  redeemed_at timestamptz,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cortesias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view available cortesias"
  ON cortesias FOR SELECT
  TO authenticated
  USING (status = 'available' OR redeemed_by = auth.uid());

CREATE POLICY "Admin can view all cortesias"
  ON cortesias FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'master')
    )
  );

CREATE POLICY "Admin can create cortesias"
  ON cortesias FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'master')
    )
  );

CREATE POLICY "Admin can update cortesias"
  ON cortesias FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'master')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'master')
    )
  );

CREATE TABLE IF NOT EXISTS code_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  prefix text NOT NULL,
  current_number integer DEFAULT 0,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE code_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read sequences"
  ON code_sequences FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage sequences"
  ON code_sequences FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'master')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'master')
    )
  );
