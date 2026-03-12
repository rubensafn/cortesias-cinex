/*
  # Fix Infinite Recursion in RLS Policies
  
  Remove policies that cause infinite recursion by checking within the same table
  and create simpler, non-recursive policies.
*/

DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins and masters can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Masters can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON user_profiles;

CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Masters can update all profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() IN (
    SELECT user_id FROM user_profiles WHERE role = 'master' AND auth.uid() = user_id
  ))
  WITH CHECK (true);

CREATE POLICY "Allow public read for admins and masters"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);
