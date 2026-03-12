/*
  # Create Master and Admin Users

  Creates two users:
  - MASTER: rubens@conexstudio.com.br / soap@123
  - ADMIN: admin@conexstudio.com.br / admin@123
*/

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
  '10000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'rubens@conexstudio.com.br',
  crypt('soap@123', gen_salt('bf')),
  now(),
  now(),
  now()
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
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '10000000-0000-0000-0000-000000000002',
  'authenticated',
  'authenticated',
  'admin@conexstudio.com.br',
  crypt('admin@123', gen_salt('bf')),
  now(),
  now(),
  now()
);

UPDATE user_profiles 
SET role = 'master', approved = true, email = 'rubens@conexstudio.com.br'
WHERE user_id = '10000000-0000-0000-0000-000000000001';

UPDATE user_profiles 
SET role = 'admin', approved = true, email = 'admin@conexstudio.com.br'
WHERE user_id = '10000000-0000-0000-0000-000000000002';
