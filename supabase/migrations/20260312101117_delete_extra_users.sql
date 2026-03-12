/*
  # Delete extra users
  
  Remove all test/extra users, keeping only admin and rubens
*/

DELETE FROM public.user_profiles 
WHERE user_id NOT IN (
  SELECT auth_user_id FROM public.user_accounts 
  WHERE username IN ('admin', 'rubens@conexstudio.com.br')
);

DELETE FROM public.user_accounts 
WHERE username NOT IN ('admin', 'rubens@conexstudio.com.br');
