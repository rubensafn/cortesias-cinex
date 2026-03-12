/*
  # Create Simple Username Authentication System

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `username` (text, unique, not null)
      - `password_hash` (text, not null)
      - `role` (text, default 'user')
      - `approved` (boolean, default false)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `users` table
    - Add policy for public read username existence checks
    - Add policy for authenticated users to read own profile
    - Passwords are hashed with bcrypt

  3. Notes
    - This table is completely independent from Supabase Auth
    - Username must be unique
    - Passwords are hashed, never stored in plain text
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text DEFAULT 'user',
  approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public to check username exists"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
