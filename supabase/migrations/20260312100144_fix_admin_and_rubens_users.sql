/*
  # Fix admin and rubens@conexstudio users

  1. Create user account for rubens@conexstudio.com.br
  2. Fix admin user to be fully set up with proper auth
*/

DO $$
DECLARE
  rubens_auth_id uuid;
  admin_auth_id uuid;
BEGIN
  -- Get rubens auth ID
  SELECT id INTO rubens_auth_id FROM auth.users WHERE email = 'rubens@conexstudio.com.br';

  -- Create rubens user account if not exists
  INSERT INTO public.user_accounts (username, password_hash, auth_user_id)
  VALUES ('rubens@conexstudio.com.br', '7f4ee8db597c3153b7963808858e310b49fa5c1e1669f03c1097cedddcc76002', rubens_auth_id)
  ON CONFLICT (username) DO NOTHING;

  -- Fix admin - get the auth ID we just created
  SELECT id INTO admin_auth_id FROM auth.users WHERE email = 'admin@cinex.local';

  -- Update admin user account with correct hash and auth_user_id
  UPDATE public.user_accounts 
  SET password_hash = '7676aaafb027c825bd9abab78b234070e702752f625b752e55e55b48e607e358',
      auth_user_id = admin_auth_id
  WHERE username = 'admin';

  -- Ensure admin has proper profile
  INSERT INTO public.user_profiles (user_id, role, approved)
  VALUES (admin_auth_id, 'master', true)
  ON CONFLICT (user_id) DO UPDATE
  SET role = 'master', approved = true;

  -- Ensure rubens has proper profile
  INSERT INTO public.user_profiles (user_id, role, approved)
  VALUES (rubens_auth_id, 'user', true)
  ON CONFLICT (user_id) DO UPDATE
  SET role = 'user', approved = true;

END $$;
