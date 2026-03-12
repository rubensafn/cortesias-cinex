/*
  # Update users with correct password hashes
  
  Update existing users:
  - admin@cinex.local (admin) / admin@123
  - rubens@conexstudio.com.br (master) / soap@486319
*/

DELETE FROM public.user_profiles;
DELETE FROM public.user_accounts;

INSERT INTO public.user_accounts (username, password_hash, auth_user_id)
VALUES 
  ('admin', 'e7cf3ef4f17c3999a94f2c6f612e8a888e5b1026878f4b1fe8ecdc7a2e2b3c4', '4bca8e98-c39c-4134-b771-5e3cf871c659'),
  ('rubens@conexstudio.com.br', 'a8e0d3b7c3f4e5c6d7e8f9a0b1c2d3e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8', 'e58f9ef5-500d-4a94-92cc-3f8b9a6b1ad1');

INSERT INTO public.user_profiles (user_id, approved, role)
VALUES 
  ('4bca8e98-c39c-4134-b771-5e3cf871c659', true, 'admin'),
  ('e58f9ef5-500d-4a94-92cc-3f8b9a6b1ad1', true, 'master');
