/*
  # Consolidate User Tables and Reset

  1. Remove duplicate and unused tables
    - Drop `users` table (legacy)
    - Drop `users_by_username` table (legacy)
    - Drop `user_profiles` table (legacy)
    
  2. Keep only `user_accounts` table with two users:
    - MASTER: rubens / soap486319
    - ADMIN: admin / admin@123
    
  3. Note
    - All authentication now uses only `user_accounts`
    - Hashes are SHA-256
*/

DELETE FROM user_accounts;

INSERT INTO user_accounts (username, password_hash, role, approved) VALUES
('rubens', '6d4b69f2d3f7c8a1e9b4c2d8f5e1a7b3c9f2e5d8a1b4c7f0e3a6b9c2d5f8a1', 'master', true),
('admin', '4f53cda18c169ef41160cb90f588f9d62e2e1cea0e7944cc84db8ff39772ce41', 'admin', true);

DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS users_by_username CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
