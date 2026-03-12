/*
  # Fix infinite recursion in user_profiles policies

  Removes the "Admins can read all profiles" policy that causes infinite recursion.
  Keeps only the safe policies:
  - Users can read own profile
  - Users can update own profile
  - Admins get access through app_metadata or role verification logic
*/

DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;

CREATE POLICY "Admins can read all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) = user_id
    OR (select auth.jwt()->>'role') = 'admin'
    OR (select auth.jwt()->>'role') = 'master'
  );
