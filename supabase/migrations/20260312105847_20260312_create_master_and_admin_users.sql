/*
  # Setup Master and Admin Users

  1. Creates two master users with proper roles
  2. Both users are pre-approved (approved = true)
  3. Removes any pending approval requirement
*/

DO $$
DECLARE
  master_user_id uuid;
  admin_user_id uuid;
BEGIN
  -- Create master user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'rubens@conexstudio.com.br',
    crypt('Master@2024', gen_salt('bf')),
    now(),
    now(),
    now()
  ) RETURNING id INTO master_user_id;

  -- Create master user profile
  INSERT INTO public.user_profiles (user_id, username, email, role, approved)
  VALUES (master_user_id, 'rubens', 'rubens@conexstudio.com.br', 'master', true);

  -- Create admin user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@conexstudio.com.br',
    crypt('Admin@2024', gen_salt('bf')),
    now(),
    now(),
    now()
  ) RETURNING id INTO admin_user_id;

  -- Create admin user profile
  INSERT INTO public.user_profiles (user_id, username, email, role, approved)
  VALUES (admin_user_id, 'admin', 'admin@conexstudio.com.br', 'admin', true);
END $$;
