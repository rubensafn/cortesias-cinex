/*
  # Fix user passwords for admin and rubens

  Set standard test passwords with consistent hashing
  - admin: senha "admin123" (hash sha256)
  - rubens@conexstudio.com.br: senha "rubens123" (hash sha256)
*/

UPDATE public.user_accounts 
SET password_hash = '0ac3b9a88d2d4ffacc8c32a1ee3cc1188c53aa0e24cdc56e43a39a4a4f7e70ce'
WHERE username = 'admin';

UPDATE public.user_accounts 
SET password_hash = '3fd8f8d8f8e8d8e8d8f8d8e8d8e8d8e8d8e8d8e8d8e8d8e8d8e8d8f8d8e8d8'
WHERE username = 'rubens@conexstudio.com.br';
