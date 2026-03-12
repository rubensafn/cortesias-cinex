/*
  # Fix cortesias RLS policies

  1. Remove restrictive INSERT policy
  2. Add permissive policy allowing authenticated users to create cortesias
*/

DROP POLICY IF EXISTS "Users can create cortesias" ON cortesias;

CREATE POLICY "Authenticated users can create cortesias"
  ON cortesias
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
