/*
  # Create user_accounts table for username-based authentication
  
  1. New Tables
    - `user_accounts`
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `password_hash` (text)
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on `user_accounts` table
    - Add restrictive policies for authentication
*/

CREATE TABLE IF NOT EXISTS user_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct access to user_accounts"
  ON user_accounts FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);
