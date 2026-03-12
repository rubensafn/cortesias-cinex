/*
  # Add verify_password RPC function
  
  Creates a PostgreSQL function to verify username/password combination
  using bcrypt password hashing
*/

CREATE OR REPLACE FUNCTION verify_password(p_username text, p_password text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_accounts
    WHERE username = p_username
    AND password_hash = crypt(p_password, password_hash)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
