/*
  # Revert and Fix Code Sequences RLS Properly

  1. Security Updates
    - Allow authenticated users to view all code sequences
    - Restrict updates to created_by user
    - Allow reading for all authenticated users
*/

DO $$
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Anyone can view code sequences" ON code_sequences;
  DROP POLICY IF EXISTS "Authenticated users can create code sequences" ON code_sequences;
  DROP POLICY IF EXISTS "Authenticated users can update code sequences" ON code_sequences;
  DROP POLICY IF EXISTS "Authenticated users can delete code sequences" ON code_sequences;
END $$;

-- Allow all authenticated users to view all code sequences
CREATE POLICY "View all code sequences"
  ON code_sequences
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow inserting code sequences
CREATE POLICY "Create code sequences"
  ON code_sequences
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Allow updating own code sequences
CREATE POLICY "Update own code sequences"
  ON code_sequences
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());
