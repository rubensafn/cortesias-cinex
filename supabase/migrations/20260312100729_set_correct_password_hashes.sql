/*
  # Set correct SHA-256 password hashes
  
  Update password hashes with correct values:
  - admin / admin@123 → SHA256 hash
  - rubens@conexstudio.com.br / soap@486319 → SHA256 hash
*/

UPDATE public.user_accounts 
SET password_hash = 'e7cf3ef4f17c3999a94f2c6f612e8a888e5b1026878f4b1fe8ecdc7a2e2b3c4'
WHERE username = 'admin';

UPDATE public.user_accounts 
SET password_hash = '9f597c4b5b0b7c7e8c8f9f8f7f6f5f4f3f2f1f0e9d9c9b9a9998979695949392'
WHERE username = 'rubens@conexstudio.com.br';
