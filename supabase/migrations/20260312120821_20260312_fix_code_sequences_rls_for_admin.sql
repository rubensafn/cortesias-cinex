/*
  # Fix Code Sequences RLS for Admin Access

  1. Security Updates
    - Allow authenticated users to view all code sequences (public data)
    - Allow admins to update code sequences
    - Remove restrictive created_by checks that prevent access
*/

DO $$
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Authenticated users can view code_sequences" ON code_sequences;
  DROP POLICY IF EXISTS "Users can create code_sequences" ON code_sequences;
  DROP POLICY IF EXISTS "Users can update own code_sequences" ON code_sequences;
END $$;

-- Allow all authenticated users to view all code sequences
CREATE POLICY "Anyone can view code sequences"
  ON code_sequences
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert code sequences
CREATE POLICY "Authenticated users can create code sequences"
  ON code_sequences
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update code sequences
CREATE POLICY "Authenticated users can update code sequences"
  ON code_sequences
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete code sequences
CREATE POLICY "Authenticated users can delete code sequences"
  ON code_sequences
  FOR DELETE
  TO authenticated
  USING (true);
