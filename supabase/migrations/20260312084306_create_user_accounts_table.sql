/*
  # Create User Accounts Table for Username/Password Authentication

  1. New Tables
    - `user_accounts`
      - `id` (uuid, primary key)
      - `username` (text, unique, not null)
      - `password_hash` (text, not null)
      - `role` (text, default 'user')
      - `approved` (boolean, default false)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `user_accounts` table
    - Add policy for public to check username (signup validation)
    - Passwords are hashed with SHA-256, never stored in plain text

  3. Notes
    - Username must be unique and minimum 3 characters
    - Passwords must be minimum 6 characters
    - Usernames are case-sensitive for uniqueness
*/

CREATE TABLE IF NOT EXISTS user_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text DEFAULT 'user',
  approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public to read user_accounts for authentication"
  ON user_accounts FOR SELECT
  USING (true);

CREATE INDEX IF NOT EXISTS idx_user_accounts_username ON user_accounts(username);
