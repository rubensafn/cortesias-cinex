/*
  # Simplify password verification
  
  Remove encryption and create a simple verify_password function
  that compares plain text passwords
*/

DROP FUNCTION IF EXISTS verify_password(text, text);

CREATE OR REPLACE FUNCTION verify_password(p_username text, p_password text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_accounts
    WHERE username = p_username
    AND password = p_password
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing passwords to plain text (remove crypt)
UPDATE user_accounts
SET password_hash = CASE 
  WHEN username = 'admin' THEN 'password123'
  WHEN username = 'rubens' THEN 'senha123'
  ELSE password_hash
END;