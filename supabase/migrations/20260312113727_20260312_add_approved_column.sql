/*
  # Add approved column to user_accounts

  1. Modified Tables
    - `user_accounts`
      - Added `approved` (boolean) column with default value true for all roles except 'user'
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_accounts' AND column_name = 'approved'
  ) THEN
    ALTER TABLE user_accounts ADD COLUMN approved BOOLEAN DEFAULT true;
  END IF;
END $$;
