/*
  # Complete Auth System Rebuild
  
  - Drop all user-related tables and policies
  - Drop all helper functions
  - Rebuild clean user system from scratch
*/

-- Drop all existing tables and cascades
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS cortesias CASCADE;
DROP TABLE IF EXISTS code_sequences CASCADE;
DROP TABLE IF EXISTS code_counters CASCADE;
DROP TABLE IF EXISTS ticket_codes CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS get_my_role() CASCADE;
DROP FUNCTION IF EXISTS allocate_codes(uuid, integer) CASCADE;

-- Create clean user_profiles table
CREATE TABLE user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin', 'master')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Admins can read all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = (select auth.uid()) AND up.role IN ('admin', 'master')
    )
  );

-- Create code_sequences table
CREATE TABLE code_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  pattern text NOT NULL,
  current_number integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE code_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read sequences"
  ON code_sequences FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage sequences"
  ON code_sequences FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = (select auth.uid()) AND role IN ('admin', 'master')
    )
  );

CREATE POLICY "Admins can update sequences"
  ON code_sequences FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = (select auth.uid()) AND role IN ('admin', 'master')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = (select auth.uid()) AND role IN ('admin', 'master')
    )
  );

-- Create cortesias table
CREATE TABLE cortesias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  status text DEFAULT 'available' CHECK (status IN ('available', 'redeemed', 'expired')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  redeemed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  redeemed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cortesias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view available cortesias"
  ON cortesias FOR SELECT
  TO authenticated
  USING (
    status = 'available'
    OR redeemed_by = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = (select auth.uid()) AND role IN ('admin', 'master')
    )
  );

CREATE POLICY "Admins can create cortesias"
  ON cortesias FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = (select auth.uid()) AND role IN ('admin', 'master')
    )
  );

CREATE POLICY "Admins can update cortesias"
  ON cortesias FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = (select auth.uid()) AND role IN ('admin', 'master')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = (select auth.uid()) AND role IN ('admin', 'master')
    )
  );

-- Create indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_cortesias_created_by ON cortesias(created_by);
CREATE INDEX IF NOT EXISTS idx_cortesias_redeemed_by ON cortesias(redeemed_by);
CREATE INDEX IF NOT EXISTS idx_code_sequences_created_by ON code_sequences(created_by);
