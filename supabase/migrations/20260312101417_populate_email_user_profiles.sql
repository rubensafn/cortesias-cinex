/*
  # Populate email in user_profiles
  
  Copy email/username from user_accounts to user_profiles
*/

UPDATE public.user_profiles up
SET email = (
  SELECT username FROM public.user_accounts ua 
  WHERE ua.auth_user_id = up.user_id
)
WHERE email IS NULL;
