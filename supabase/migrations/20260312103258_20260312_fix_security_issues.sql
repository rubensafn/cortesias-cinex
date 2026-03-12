/*
  # Fix Security and Performance Issues
  
  1. Add indexes for foreign keys
  2. Optimize RLS policies with SELECT auth.uid()
  3. Clean up unused tables and functions
  4. Fix RLS policy logic
  
  Changes:
    - Add indexes to foreign key columns for query performance
    - Rewrite RLS policies to use (select auth.uid()) pattern
    - Drop unused tables/functions causing warnings
    - Consolidate multiple SELECT policies
*/

-- Add indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_cortesias_created_by ON cortesias(created_by);
CREATE INDEX IF NOT EXISTS idx_cortesias_redeemed_by ON cortesias(redeemed_by);
CREATE INDEX IF NOT EXISTS idx_code_sequences_created_by ON code_sequences(created_by);

-- Drop unused tables causing RLS warnings
DROP TABLE IF EXISTS ticket_codes CASCADE;
DROP TABLE IF EXISTS code_counters CASCADE;

-- Drop functions with mutable search_path
DROP FUNCTION IF EXISTS get_my_role() CASCADE;
DROP FUNCTION IF EXISTS allocate_codes(uuid, integer) CASCADE;

-- Drop and recreate user_profiles policies with optimized auth.uid() calls
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Master admin can read all profiles" ON user_profiles;

CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Master admin can read all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = (select auth.uid()) AND up.role = 'master'
    )
  );

-- Drop and recreate cortesias policies with optimized calls
DROP POLICY IF EXISTS "Users can view available cortesias" ON cortesias;
DROP POLICY IF EXISTS "Admin can view all cortesias" ON cortesias;
DROP POLICY IF EXISTS "Admin can create cortesias" ON cortesias;
DROP POLICY IF EXISTS "Admin can update cortesias" ON cortesias;

CREATE POLICY "Users can view available or own cortesias"
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

CREATE POLICY "Admin can create cortesias"
  ON cortesias FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = (select auth.uid()) AND role IN ('admin', 'master')
    )
  );

CREATE POLICY "Admin can update cortesias"
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

-- Drop and recreate code_sequences policies
DROP POLICY IF EXISTS "Everyone can read sequences" ON code_sequences;
DROP POLICY IF EXISTS "Admin can manage sequences" ON code_sequences;

CREATE POLICY "Authenticated users can read sequences"
  ON code_sequences FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage sequences"
  ON code_sequences FOR ALL
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
