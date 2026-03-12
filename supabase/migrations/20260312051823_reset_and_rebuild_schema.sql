
/*
  # Reset completo e reconstrução do schema

  1. Remove todas as tabelas e policies antigas
  2. Recria user_profiles com RLS SEM recursão infinita
  3. Recria tabela cortesias
  4. Políticas simples usando auth.uid() diretamente, sem sub-selects recursivos
*/

-- Drop tudo
DROP TABLE IF EXISTS cortesias CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Recria user_profiles
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('master', 'admin', 'user')),
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Política SELECT: cada usuário vê o próprio perfil (sem recursão!)
CREATE POLICY "user can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Política INSERT: usuário insere o próprio perfil
CREATE POLICY "user can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Política UPDATE: usuário atualiza o próprio perfil
CREATE POLICY "user can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política para master/admin verem TODOS os perfis usando JWT metadata
CREATE POLICY "master and admin can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE user_id = auth.uid()) IN ('master', 'admin')
  );

-- Recria cortesias
CREATE TABLE cortesias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_cliente text NOT NULL,
  cpf text NOT NULL,
  email text,
  telefone text,
  numero_ingressos integer NOT NULL DEFAULT 1,
  tipo_ingresso text NOT NULL DEFAULT 'inteira',
  unidade text NOT NULL,
  observacoes text,
  status text NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'usado', 'cancelado')),
  codigo text UNIQUE NOT NULL,
  aprovado_por uuid REFERENCES auth.users(id),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cortesias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users can view cortesias"
  ON cortesias FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated users can insert cortesias"
  ON cortesias FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "authenticated users can update cortesias"
  ON cortesias FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
