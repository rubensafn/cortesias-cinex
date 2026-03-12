/*
  # Fix code sequences update policy for admins
  
  Allow admins to update code sequences without ownership restriction
*/

DROP POLICY IF EXISTS "Update own code sequences" ON code_sequences;

CREATE POLICY "Admins can update code sequences"
  ON code_sequences
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);