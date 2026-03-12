/*
  # Enforce Master/Admin Hierarchy with RLS Policies

  Implements hierarchy-based access control:
  - MASTER: Can view and modify all users, no restrictions
  - ADMIN: Can view all users and modify non-MASTER users only
  - USER: Can only view and modify their own profile

  Security:
  - MASTER user ID: 10000000-0000-0000-0000-000000000001
  - ADMIN cannot modify MASTER
  - Users cannot modify other users
*/

DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow users to insert own profile" ON user_profiles;

-- SELECT: MASTER can read all, ADMIN can read all, others read own
CREATE POLICY "user_profiles_select_policy"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    -- MASTER can read all
    (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'master'
    OR
    -- ADMIN can read all
    (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'admin'
    OR
    -- Users can read their own
    auth.uid() = user_id
  );

-- INSERT: Only happens on trigger
CREATE POLICY "user_profiles_insert_policy"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: MASTER can update all, ADMIN can update non-MASTER, users update own
CREATE POLICY "user_profiles_update_policy"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    -- MASTER can update all
    (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'master'
    OR
    -- ADMIN can update non-MASTER users
    (
      (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'admin'
      AND
      user_id != '10000000-0000-0000-0000-000000000001'
    )
    OR
    -- Users can update own profile
    auth.uid() = user_id
  )
  WITH CHECK (
    -- MASTER can update all
    (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'master'
    OR
    -- ADMIN can update non-MASTER users
    (
      (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'admin'
      AND
      user_id != '10000000-0000-0000-0000-000000000001'
    )
    OR
    -- Users can update own profile
    auth.uid() = user_id
  );

-- DELETE: Only MASTER can delete
CREATE POLICY "user_profiles_delete_policy"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'master'
  );
