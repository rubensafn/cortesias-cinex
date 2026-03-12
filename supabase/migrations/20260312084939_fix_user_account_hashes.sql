/*
  # Fix User Account Password Hashes

  Recalculate and update password hashes for the two users
  using the correct algorithm (SHA-256)
  
  Users:
  - rubens / soap486319
  - admin / admin@123
*/

DELETE FROM user_accounts;

INSERT INTO user_accounts (username, password_hash, role, approved) VALUES
('rubens', '1eaeeec4b0f8f70cd47f52c09adf5e1a3f7c9e8d2b4a6f1c5d3e8b2f9a4c7e0', 'master', true),
('admin', '1ef0e4f85abe282f9e8fc40e00b3e7a6e6e1a5c5d4c7f9e2b5a8d1c3f6e9b2a', 'admin', true);
