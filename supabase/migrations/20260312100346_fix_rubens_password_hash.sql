/*
  # Fix rubens password hash
  
  Correct the password hash for rubens@conexstudio.com.br
  - Password: rubens123
  - SHA-256 hash: 4d967a2a964769644d72a1db5b1a43e3f4ecdfcc5804fbc3e63d409c08c0b88e
*/

UPDATE public.user_accounts 
SET password_hash = '4d967a2a964769644d72a1db5b1a43e3f4ecdfcc5804fbc3e63d409c08c0b88e'
WHERE username = 'rubens@conexstudio.com.br';
