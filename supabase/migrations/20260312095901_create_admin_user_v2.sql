/*
  # Create admin user with correct credentials

  1. Create auth user for admin
  2. Create user account with hashed password  
  3. Create user profile with master role and approved status
*/

DO $$
DECLARE
  admin_auth_id uuid;
BEGIN
  -- Check if admin auth user exists
  SELECT id INTO admin_auth_id FROM auth.users WHERE email = 'admin@cinex.local';

  -- If not, create it
  IF admin_auth_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@cinex.local',
      crypt('admin@123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '',
      ''
    ) RETURNING id INTO admin_auth_id;
  END IF;

  -- Create or update user account
  INSERT INTO public.user_accounts (username, password_hash, auth_user_id)
  VALUES ('admin', '7676aaafb027c825bd9abab78b234070e702752f625b752e55e55b48e607e358', admin_auth_id)
  ON CONFLICT (username) DO UPDATE
  SET password_hash = '7676aaafb027c825bd9abab78b234070e702752f625b752e55e55b48e607e358',
      auth_user_id = admin_auth_id;

  -- Create or update user profile
  INSERT INTO public.user_profiles (user_id, role, approved)
  VALUES (admin_auth_id, 'master', true)
  ON CONFLICT (user_id) DO UPDATE
  SET role = 'master',
      approved = true;

  RAISE NOTICE 'Admin user created with ID: %', admin_auth_id;
END $$;
