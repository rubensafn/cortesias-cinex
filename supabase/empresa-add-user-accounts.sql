/*
  # Criar tabela empresa_user_accounts

  Rodar no SQL Editor do projeto Supabase (mesmo projeto que já tem
  empresa_imported_codes e empresa_tickets):
  https://supabase.com/dashboard/project/gdtfwmqbvsqtxtccrydv/sql/new

  O que este script faz:
    1. Limpa dados antigos das tabelas Empresa (eram compartilhados com Cortesias — inválidos)
    2. Cria empresa_user_accounts (separada de user_accounts do Cortesias)
    3. Ajusta as FKs de empresa_imported_codes e empresa_tickets
       para apontarem para empresa_user_accounts
    4. Insere usuários iniciais para o sistema Empresa
*/

-- ============================================================
-- 1. LIMPAR DADOS ANTIGOS (referenciavam user_accounts do Cortesias)
-- ============================================================
TRUNCATE TABLE empresa_tickets;
TRUNCATE TABLE empresa_imported_codes;

-- ============================================================
-- 2. TABELA: empresa_user_accounts
-- ============================================================
CREATE TABLE IF NOT EXISTS empresa_user_accounts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username   text UNIQUE NOT NULL,
  password   text NOT NULL,
  role       text NOT NULL DEFAULT 'user',
  approved   boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE empresa_user_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon select empresa_user_accounts"  ON empresa_user_accounts;
DROP POLICY IF EXISTS "Allow anon update empresa_user_accounts"  ON empresa_user_accounts;
DROP POLICY IF EXISTS "Allow anon insert empresa_user_accounts"  ON empresa_user_accounts;
DROP POLICY IF EXISTS "Allow anon delete empresa_user_accounts"  ON empresa_user_accounts;

CREATE POLICY "Allow anon select empresa_user_accounts"
  ON empresa_user_accounts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow anon update empresa_user_accounts"
  ON empresa_user_accounts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon insert empresa_user_accounts"
  ON empresa_user_accounts FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow anon delete empresa_user_accounts"
  ON empresa_user_accounts FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 3. CORRIGIR FKs de empresa_imported_codes
-- ============================================================
ALTER TABLE empresa_imported_codes
  DROP CONSTRAINT IF EXISTS empresa_imported_codes_imported_by_fkey;
ALTER TABLE empresa_imported_codes
  DROP CONSTRAINT IF EXISTS empresa_imported_codes_used_by_fkey;

ALTER TABLE empresa_imported_codes
  ADD CONSTRAINT empresa_imported_codes_imported_by_fkey
    FOREIGN KEY (imported_by) REFERENCES empresa_user_accounts(id) ON DELETE SET NULL;
ALTER TABLE empresa_imported_codes
  ADD CONSTRAINT empresa_imported_codes_used_by_fkey
    FOREIGN KEY (used_by) REFERENCES empresa_user_accounts(id) ON DELETE SET NULL;

-- ============================================================
-- 4. CORRIGIR FK de empresa_tickets
-- ============================================================
ALTER TABLE empresa_tickets
  DROP CONSTRAINT IF EXISTS empresa_tickets_created_by_fkey;

ALTER TABLE empresa_tickets
  ADD CONSTRAINT empresa_tickets_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES empresa_user_accounts(id) ON DELETE CASCADE;

-- ============================================================
-- 5. USUÁRIOS INICIAIS do sistema Empresa
-- ============================================================
INSERT INTO empresa_user_accounts (username, password, role, approved) VALUES
  ('admin',  'password123', 'master_admin', true),
  ('rubens', 'senha123',    'master_admin', true)
ON CONFLICT (username) DO NOTHING;
