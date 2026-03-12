/*
  # Reset User System Completely

  Drop everything user-related and criar do zero com os dois usuários
*/

DROP TABLE IF EXISTS user_accounts CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS users_by_username CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

CREATE TABLE user_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text DEFAULT 'user' CHECK (role IN ('master', 'admin', 'user')),
  approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read user_accounts"
  ON user_accounts FOR SELECT
  USING (true);

CREATE INDEX idx_user_accounts_username ON user_accounts(username);

INSERT INTO user_accounts (username, password_hash, role, approved) VALUES
('rubens', 'b2eb2bfb7f65d83ef598fb409f31473c484ab5e85c864ae65acfe5e2a278c044', 'master', true),
('admin', '7676aaafb027c825bd9abab78b234070e702752f625b752e55e55b48e607e358', 'admin', true);
