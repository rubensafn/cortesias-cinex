/*
  # Fix user registration defaults

  1. Changes
    - Update user_accounts table default for approved column to FALSE
    - This ensures new registrations require admin approval
*/

ALTER TABLE user_accounts ALTER COLUMN approved SET DEFAULT false;