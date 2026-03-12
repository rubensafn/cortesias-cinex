/*
  # Corrige fluxo de registro de novos usuarios

  1. Funcionalidade
    - Cria trigger que automaticamente insere um perfil quando um novo usuario e criado no auth.users
    - Remove a necessidade do frontend inserir manualmente na tabela user_profiles
    - Novos usuarios sao criados com role='user' e approved=false

  2. Seguranca
    - Funcao usa SECURITY DEFINER para executar com privilegios elevados
    - Somente o sistema pode criar perfis via trigger
*/

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_profiles (user_id, role, approved)
  VALUES (NEW.id, 'user', false)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
