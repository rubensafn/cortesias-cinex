/*
  # Corrigir Políticas RLS da Tabela Cortesias

  Remove políticas duplicadas e cria políticas limpas e corretas.

  1. Changes
    - Remove todas as políticas antigas da tabela cortesias
    - Cria novas políticas simplificadas e corretas
    - Garante que usuários autenticados possam criar, ler, atualizar e deletar seus próprios registros
    - Admins podem ver e gerenciar todos os registros

  2. Security
    - Mantém RLS ativado
    - Políticas específicas por operação (SELECT, INSERT, UPDATE, DELETE)
*/

-- Remover todas as políticas antigas
DROP POLICY IF EXISTS "Users can create cortesias" ON cortesias;
DROP POLICY IF EXISTS "Users can create tickets" ON cortesias;
DROP POLICY IF EXISTS "Users can delete own tickets" ON cortesias;
DROP POLICY IF EXISTS "Users can update own cortesias" ON cortesias;
DROP POLICY IF EXISTS "Users can update own tickets" ON cortesias;
DROP POLICY IF EXISTS "Users can view own cortesias" ON cortesias;
DROP POLICY IF EXISTS "Users can view own tickets" ON cortesias;

-- Criar políticas novas e limpas
CREATE POLICY "Authenticated users can insert own cortesias"
  ON cortesias FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select own cortesias or admins can select all"
  ON cortesias FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update own cortesias or admins can update all"
  ON cortesias FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can delete own cortesias or admins can delete all"
  ON cortesias FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
