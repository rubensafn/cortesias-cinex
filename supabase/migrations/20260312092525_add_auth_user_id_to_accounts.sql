/*
  # Add auth_user_id to user_accounts table
  
  1. Changes
    - Add auth_user_id column to user_accounts
    - This links custom user accounts to Supabase Auth users
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_accounts' AND column_name = 'auth_user_id'
  ) THEN
    ALTER TABLE user_accounts ADD COLUMN auth_user_id uuid UNIQUE;
  END IF;
END $$;
