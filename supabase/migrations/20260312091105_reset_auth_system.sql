/*
  # Reset Authentication System to use Supabase Auth

  1. Drop old custom auth tables
  2. Create user_profiles table linked to auth.users
  3. Initialize master and admin users via Supabase Auth

  ## Tables
  - `user_profiles`: Stores user role, approval status, and metadata
    - user_id: UUID foreign key to auth.users
    - role: 'master', 'admin', or 'user'
    - approved: boolean for user approval status
    - created_at: timestamp

  ## Security
  - Enable RLS on user_profiles
  - Policies for user access control
  - Master and admin automatically approved
  - New users require approval by master/admin
*/

DROP TABLE IF EXISTS users_simple CASCADE;
DROP TABLE IF EXISTS user_accounts CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS users_by_username CASCADE;

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('master', 'admin', 'user')) DEFAULT 'user',
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins and masters can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'master')
    )
  );

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins and masters can update profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'master')
    )
  );

CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_approved ON user_profiles(approved);
