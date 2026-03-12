/*
  # Create Admin User Account

  1. Create the default admin user account
    - Username: admin
    - Password hash: admin@123 (SHA-256)
  2. Note: The auth.users entry will be created through the auth system
*/

DO $$
BEGIN
  -- Check if admin user already exists
  IF NOT EXISTS (
    SELECT 1 FROM public.user_accounts WHERE username = 'admin'
  ) THEN
    -- Insert admin user account
    -- SHA-256 of 'admin@123' = '156f0263b0f5a0fdfb83e9b58218868e768e5cff95dd48f23f3ccb030e3e36f3'
    INSERT INTO public.user_accounts (username, password_hash)
    VALUES ('admin', '156f0263b0f5a0fdfb83e9b58218868e768e5cff95dd48f23f3ccb030e3e36f3');
  END IF;
END $$;