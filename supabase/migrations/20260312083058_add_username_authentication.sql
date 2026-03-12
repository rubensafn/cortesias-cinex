/*
  # Add Username-Based Authentication System

  1. New Tables
    - `users_by_username`
      - `id` (uuid, primary key)
      - `auth_user_id` (uuid, foreign key to auth.users)
      - `username` (text, unique, not null)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `users_by_username` table
    - Add policy for public read (to allow login lookups)
    - Add policy for authenticated users to manage their own username mapping

  3. Notes
    - This table maps usernames to Supabase auth user IDs
    - Allows authentication using username instead of email
    - Public read access is safe because usernames are not sensitive
*/

CREATE TABLE IF NOT EXISTS users_by_username (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users_by_username ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view usernames"
  ON users_by_username FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own username mapping"
  ON users_by_username FOR INSERT
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own username mapping"
  ON users_by_username FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

CREATE INDEX IF NOT EXISTS idx_users_by_username_username ON users_by_username(username);
CREATE INDEX IF NOT EXISTS idx_users_by_username_auth_user_id ON users_by_username(auth_user_id);
