/*
  # Clean Auth Setup - Only Master and Admin

  Delete all users and create only master (Master@2024) and admin (Admin@2024)
*/

DELETE FROM auth.users;

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
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'master@cinex.local',
  crypt('Master@2024', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"role": "master"}',
  '{}',
  false
);

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
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@cinex.local',
  crypt('Admin@2024', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"role": "admin"}',
  '{}',
  false
);
