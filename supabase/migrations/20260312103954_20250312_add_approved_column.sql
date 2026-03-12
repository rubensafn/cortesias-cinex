/*
  # Add approved column to user_profiles

  Adds the missing approved column that tracks whether a user account has been approved by an admin.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'approved'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN approved boolean DEFAULT false;
  END IF;
END $$;
