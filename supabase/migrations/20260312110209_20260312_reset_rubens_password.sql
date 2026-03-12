/*
  # Reset Rubens Password

  1. Delete duplicate Rubens user with old email
  2. Reset Rubens password to Master@2024
*/

-- Delete the old Rubens user with conexstudio email
DELETE FROM auth.users WHERE email = 'rubens@conexstudio.com.br';

-- Update Rubens password
UPDATE auth.users 
SET encrypted_password = crypt('Master@2024', gen_salt('bf'))
WHERE email = 'rubens@cinex.local';
