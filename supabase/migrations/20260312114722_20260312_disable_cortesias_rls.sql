/*
  # Disable RLS on cortesias table

  1. Since the application uses custom authentication (not Supabase Auth),
     auth.uid() is not available
  2. Removing RLS to allow the custom auth system to work properly
*/

ALTER TABLE cortesias DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can create cortesias" ON cortesias;
DROP POLICY IF EXISTS "Authenticated users can view cortesias" ON cortesias;
