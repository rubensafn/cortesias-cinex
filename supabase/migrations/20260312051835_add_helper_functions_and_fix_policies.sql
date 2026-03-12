
/*
  # Adiciona funções helper sem recursão para RLS

  Cria funções SECURITY DEFINER que retornam o role do usuário atual
  sem causar recursão infinita nas políticas RLS.
*/

-- Função que retorna o role do usuário atual de forma segura
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM user_profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Remove a policy recursiva e substitui por uma usando a função
DROP POLICY IF EXISTS "master and admin can view all profiles" ON user_profiles;

CREATE POLICY "master and admin can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (get_my_role() IN ('master', 'admin'));

-- Atualiza UPDATE policy para master/admin poderem atualizar qualquer perfil
DROP POLICY IF EXISTS "user can update own profile" ON user_profiles;

CREATE POLICY "user can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR get_my_role() IN ('master', 'admin'))
  WITH CHECK (auth.uid() = user_id OR get_my_role() IN ('master', 'admin'));

-- Policy para admin/master deletar
CREATE POLICY "master can delete profiles"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (get_my_role() = 'master');
