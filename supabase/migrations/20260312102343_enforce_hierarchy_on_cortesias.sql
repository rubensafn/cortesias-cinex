/*
  # Enforce Hierarchy on Cortesias

  Implements hierarchy-based access control for cortesias table:
  - MASTER: Can create, read, update, delete all cortesias
  - ADMIN: Can create, read, update, delete all cortesias
  - USER (approved): Can create and read their own cortesias only
  - USER (not approved): Cannot access cortesias
*/

DROP POLICY IF EXISTS "Allow authenticated users to read cortesias" ON cortesias;
DROP POLICY IF EXISTS "Allow users to create cortesias" ON cortesias;
DROP POLICY IF EXISTS "Allow users to update own cortesias" ON cortesias;
DROP POLICY IF EXISTS "Allow users to delete own cortesias" ON cortesias;

-- SELECT: MASTER and ADMIN read all, users read own
CREATE POLICY "cortesias_select_policy"
  ON cortesias FOR SELECT
  TO authenticated
  USING (
    -- MASTER can read all
    (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'master'
    OR
    -- ADMIN can read all
    (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'admin'
    OR
    -- Users can read their own (only if approved)
    (
      auth.uid() = created_by
      AND
      (SELECT approved FROM user_profiles WHERE user_id = auth.uid()) = true
    )
  );

-- INSERT: MASTER and ADMIN can create for anyone, users create for self
CREATE POLICY "cortesias_insert_policy"
  ON cortesias FOR INSERT
  TO authenticated
  WITH CHECK (
    -- MASTER can create for anyone
    (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'master'
    OR
    -- ADMIN can create for anyone
    (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'admin'
    OR
    -- Approved users can create for themselves
    (
      auth.uid() = created_by
      AND
      (SELECT approved FROM user_profiles WHERE user_id = auth.uid()) = true
    )
  );

-- UPDATE: MASTER and ADMIN can update all, users update own only
CREATE POLICY "cortesias_update_policy"
  ON cortesias FOR UPDATE
  TO authenticated
  USING (
    -- MASTER can update all
    (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'master'
    OR
    -- ADMIN can update all
    (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'admin'
    OR
    -- Users can update their own (only if approved)
    (
      auth.uid() = created_by
      AND
      (SELECT approved FROM user_profiles WHERE user_id = auth.uid()) = true
    )
  )
  WITH CHECK (
    -- MASTER can update all
    (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'master'
    OR
    -- ADMIN can update all
    (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'admin'
    OR
    -- Users can update their own (only if approved)
    (
      auth.uid() = created_by
      AND
      (SELECT approved FROM user_profiles WHERE user_id = auth.uid()) = true
    )
  );

-- DELETE: MASTER and ADMIN can delete all, users delete own only
CREATE POLICY "cortesias_delete_policy"
  ON cortesias FOR DELETE
  TO authenticated
  USING (
    -- MASTER can delete all
    (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'master'
    OR
    -- ADMIN can delete all
    (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'admin'
    OR
    -- Users can delete their own (only if approved)
    (
      auth.uid() = created_by
      AND
      (SELECT approved FROM user_profiles WHERE user_id = auth.uid()) = true
    )
  );
