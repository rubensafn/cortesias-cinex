/*
  # Nuclear reset - delete everything from auth and tables
  
  Complete wipe of all data
*/

-- Drop all tables
DROP TABLE IF EXISTS cortesias CASCADE;
DROP TABLE IF EXISTS code_sequences CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS user_accounts CASCADE;

-- Delete all auth users
DELETE FROM auth.users;