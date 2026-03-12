/*
  # Update all emails to @cinex.local

  1. Changes
    - Updates all auth.users emails to use @cinex.local domain
    - Updates all user_profiles emails to use @cinex.local domain
    - Preserves usernames, just changes domain
*/

DO $$
BEGIN
  -- Update user_profiles to @cinex.local
  UPDATE public.user_profiles 
  SET email = username || '@cinex.local'
  WHERE email IS NOT NULL;

  -- Update auth.users to @cinex.local
  UPDATE auth.users
  SET email = LOWER(COALESCE((
    SELECT username FROM public.user_profiles WHERE user_profiles.user_id = auth.users.id
  ), split_part(email, '@', 1))) || '@cinex.local'
  WHERE email IS NOT NULL;
END $$;