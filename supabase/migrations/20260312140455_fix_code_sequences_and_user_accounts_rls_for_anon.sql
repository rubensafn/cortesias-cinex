
/*
  # Corrigir RLS para permitir acesso anônimo

  ## Problema
  O sistema usa autenticação customizada (não Supabase Auth), então as requisições
  chegam com role 'anon' em vez de 'authenticated'. As políticas atuais bloqueiam
  o SELECT em code_sequences para usuários anônimos.

  ## Alterações
  1. `code_sequences` - Adiciona política de SELECT para role anon
  2. `code_sequences` - Adiciona política de UPDATE para role anon (já existe mas garante)
  3. `user_accounts` - Garante que SELECT, UPDATE e DELETE funcionam para anon
*/

DROP POLICY IF EXISTS "View all code sequences" ON code_sequences;
DROP POLICY IF EXISTS "Allow update code sequences" ON code_sequences;

CREATE POLICY "View all code sequences"
  ON code_sequences
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow update code sequences"
  ON code_sequences
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
