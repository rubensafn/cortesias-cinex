/*
  # Reset user passwords
  
  Resets the passwords for admin and rubens users with new credentials:
  - admin: password123
  - rubens: senha123
*/

DO $$
DECLARE
  v_admin_hash text;
  v_rubens_hash text;
BEGIN
  -- Generate bcrypt hashes for new passwords
  v_admin_hash := crypt('password123', gen_salt('bf'));
  v_rubens_hash := crypt('senha123', gen_salt('bf'));
  
  -- Update admin password
  UPDATE user_accounts 
  SET password_hash = v_admin_hash
  WHERE username = 'admin';
  
  -- Update rubens password
  UPDATE user_accounts 
  SET password_hash = v_rubens_hash
  WHERE username = 'rubens';
END $$;