/*
  # Reset Everything - Simple User System
  
  Remove all old tables and create a fresh, simple user system:
  - users_simple: just username, password_hash, role, approved
  - That's it. No email, no UUID, keep it dead simple.
*/

DROP TABLE IF EXISTS user_accounts CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS users_by_username CASCADE;
DROP TABLE IF EXISTS users_simple CASCADE;

CREATE TABLE users_simple (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('master', 'admin', 'user')),
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users_simple ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_users" ON users_simple
  FOR SELECT USING (true);

CREATE INDEX idx_users_simple_username ON users_simple(username);

INSERT INTO users_simple (username, password_hash, role, approved) VALUES
('rubens', 'b2eb2bfb7f65d83ef598fb409f31473c484ab5e85c864ae65acfe5e2a278c044', 'master', true),
('admin', '7676aaafb027c825bd9abab78b234070e702752f625b752e55e55b48e607e358', 'admin', true);
