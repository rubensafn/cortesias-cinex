/*
  # Reestruturação Completa do Sistema de Cortesias

  1. Mudanças na Estrutura
    - Atualiza tabela cortesias com novos campos
    - Adiciona campos: unidade, solicitante, motivo, data_validade, email_entrega, codigo_inicial
    - Atualiza user_profiles com hierarquia: master, admin, user
    - Adiciona campo approved_by para rastreamento de aprovações
    
  2. Hierarquia de Usuários
    - master (rubens@conexstudio.com.br): Pode alterar tudo, inclusive admin
    - admin (admin@admin.com.br): Pode aprovar usuários comuns
    - user: Precisa de aprovação para usar o sistema
    
  3. Security
    - Mantém RLS habilitado
    - Atualiza políticas para nova hierarquia
*/

-- Adicionar novas colunas à tabela cortesias
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cortesias' AND column_name = 'unidade'
  ) THEN
    ALTER TABLE cortesias ADD COLUMN unidade text NOT NULL DEFAULT 'Cinex Goiânia';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cortesias' AND column_name = 'solicitante'
  ) THEN
    ALTER TABLE cortesias ADD COLUMN solicitante text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cortesias' AND column_name = 'motivo'
  ) THEN
    ALTER TABLE cortesias ADD COLUMN motivo text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cortesias' AND column_name = 'data_validade'
  ) THEN
    ALTER TABLE cortesias ADD COLUMN data_validade date NOT NULL DEFAULT CURRENT_DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cortesias' AND column_name = 'email_entrega'
  ) THEN
    ALTER TABLE cortesias ADD COLUMN email_entrega text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cortesias' AND column_name = 'codigo_inicial'
  ) THEN
    ALTER TABLE cortesias ADD COLUMN codigo_inicial text NOT NULL DEFAULT 'CINEX00001';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cortesias' AND column_name = 'numero_ingressos'
  ) THEN
    ALTER TABLE cortesias ADD COLUMN numero_ingressos integer NOT NULL DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cortesias' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE cortesias ADD COLUMN approved_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Atualizar user_profiles para incluir campo de status de aprovação
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'approved'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN approved boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN approved_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Garantir que o usuário master está configurado corretamente
UPDATE user_profiles 
SET role = 'master', approved = true
WHERE user_id = 'bd14b349-c783-472d-b120-4c3cfd71a351';

-- Criar/atualizar políticas RLS para user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Master can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admin can approve users" ON user_profiles;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() 
      AND up.role IN ('master', 'admin')
    )
  );

CREATE POLICY "Master can manage all profiles"
  ON user_profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() 
      AND up.role = 'master'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() 
      AND up.role = 'master'
    )
  );

CREATE POLICY "Admin can approve users"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() 
      AND up.role IN ('admin')
      AND user_profiles.role = 'user'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() 
      AND up.role IN ('admin')
      AND user_profiles.role = 'user'
    )
  );
