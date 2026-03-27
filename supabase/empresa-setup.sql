/*
  # Schema - Banco Cinex Empresa (Teste / Produção)

  Rodar este script no SQL Editor do projeto Empresa no Supabase.
  Dashboard: https://supabase.com/dashboard → seu projeto Empresa → SQL Editor → New Query

  Cria:
    - user_accounts   (autenticação)
    - user_profiles   (perfis)
    - empresa_imported_codes  (pool de vouchers importados)
    - empresa_tickets         (ingressos gerados)
  + Usuários iniciais: admin / password123  |  rubens / senha123
*/

-- ============================================================
-- TABELA: user_accounts
-- ============================================================
CREATE TABLE IF NOT EXISTS user_accounts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username   text UNIQUE NOT NULL,
  password   text NOT NULL,
  role       text NOT NULL DEFAULT 'user',
  approved   boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon select user_accounts"  ON user_accounts;
DROP POLICY IF EXISTS "Allow anon update user_accounts"  ON user_accounts;
DROP POLICY IF EXISTS "Allow anon insert user_accounts"  ON user_accounts;
DROP POLICY IF EXISTS "Allow anon delete user_accounts"  ON user_accounts;

CREATE POLICY "Allow anon select user_accounts"
  ON user_accounts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow anon update user_accounts"
  ON user_accounts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon insert user_accounts"
  ON user_accounts FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow anon delete user_accounts"
  ON user_accounts FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- TABELA: user_profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid UNIQUE NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  display_name text,
  email        text,
  approved     boolean DEFAULT false,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon select user_profiles"  ON user_profiles;
DROP POLICY IF EXISTS "Allow anon update user_profiles"  ON user_profiles;
DROP POLICY IF EXISTS "Allow anon insert user_profiles"  ON user_profiles;
DROP POLICY IF EXISTS "Allow anon delete user_profiles"  ON user_profiles;

CREATE POLICY "Allow anon select user_profiles"
  ON user_profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow anon update user_profiles"
  ON user_profiles FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon insert user_profiles"
  ON user_profiles FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow anon delete user_profiles"
  ON user_profiles FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- TABELA: empresa_imported_codes  (pool de vouchers)
-- ============================================================
CREATE TABLE IF NOT EXISTS empresa_imported_codes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text UNIQUE NOT NULL,
  expiry_date date NOT NULL,
  used        boolean DEFAULT false,
  imported_by uuid REFERENCES user_accounts(id) ON DELETE SET NULL,
  used_by     uuid REFERENCES user_accounts(id) ON DELETE SET NULL,
  used_at     timestamptz,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE empresa_imported_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon select empresa_imported_codes"  ON empresa_imported_codes;
DROP POLICY IF EXISTS "Allow anon insert empresa_imported_codes"  ON empresa_imported_codes;
DROP POLICY IF EXISTS "Allow anon update empresa_imported_codes"  ON empresa_imported_codes;
DROP POLICY IF EXISTS "Allow anon delete empresa_imported_codes"  ON empresa_imported_codes;

CREATE POLICY "Allow anon select empresa_imported_codes"
  ON empresa_imported_codes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow anon insert empresa_imported_codes"
  ON empresa_imported_codes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow anon update empresa_imported_codes"
  ON empresa_imported_codes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete empresa_imported_codes"
  ON empresa_imported_codes FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- TABELA: empresa_tickets  (ingressos gerados)
-- ============================================================
CREATE TABLE IF NOT EXISTS empresa_tickets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code            text,
  created_by      uuid NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  solicitante     text,
  motivo          text,
  data_validade   date,
  numero_ingressos integer,
  status          text DEFAULT 'ativo',
  codigo_inicial  text,
  codigos         text[],
  email_enviado   boolean DEFAULT false,
  batch_id        uuid,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE empresa_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon select empresa_tickets"  ON empresa_tickets;
DROP POLICY IF EXISTS "Allow anon insert empresa_tickets"  ON empresa_tickets;
DROP POLICY IF EXISTS "Allow anon update empresa_tickets"  ON empresa_tickets;
DROP POLICY IF EXISTS "Allow anon delete empresa_tickets"  ON empresa_tickets;

CREATE POLICY "Allow anon select empresa_tickets"
  ON empresa_tickets FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow anon insert empresa_tickets"
  ON empresa_tickets FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow anon update empresa_tickets"
  ON empresa_tickets FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete empresa_tickets"
  ON empresa_tickets FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- DADOS INICIAIS
-- ============================================================
INSERT INTO user_accounts (username, password, role, approved) VALUES
  ('admin',  'password123', 'master_admin', true),
  ('rubens', 'senha123',    'admin',        true)
ON CONFLICT (username) DO NOTHING;

INSERT INTO user_profiles (user_id, display_name, email, approved)
SELECT id, INITCAP(username), username || '@cinex.com.br', true
FROM user_accounts
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles up WHERE up.user_id = user_accounts.id
);
