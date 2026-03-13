/*
  # Schema Completo - Banco de Desenvolvimento Cinex

  Rodar este script no SQL Editor do projeto de desenvolvimento no Supabase.
  URL: https://supabase.com/dashboard/project/gdtfwmqbvsqtxtccrydv/sql/new
*/

-- ============================================================
-- TABELA: user_accounts
-- ============================================================
CREATE TABLE IF NOT EXISTS user_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon select user_accounts" ON user_accounts;
DROP POLICY IF EXISTS "Allow anon update user_accounts" ON user_accounts;
DROP POLICY IF EXISTS "Allow anon insert user_accounts" ON user_accounts;
DROP POLICY IF EXISTS "Allow anon delete user_accounts" ON user_accounts;

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
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  display_name text,
  email text,
  approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon select user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow anon update user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow anon insert user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow anon delete user_profiles" ON user_profiles;

CREATE POLICY "Allow anon select user_profiles"
  ON user_profiles FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow anon update user_profiles"
  ON user_profiles FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon insert user_profiles"
  ON user_profiles FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow anon delete user_profiles"
  ON user_profiles FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- TABELA: code_sequences
-- ============================================================
CREATE TABLE IF NOT EXISTS code_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  prefix text,
  current_number integer DEFAULT 1,
  pad_length integer DEFAULT 4,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE code_sequences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View all code sequences" ON code_sequences;
DROP POLICY IF EXISTS "Allow update code sequences" ON code_sequences;
DROP POLICY IF EXISTS "Allow insert code sequences" ON code_sequences;
DROP POLICY IF EXISTS "Allow delete code sequences" ON code_sequences;

CREATE POLICY "View all code sequences"
  ON code_sequences FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow update code sequences"
  ON code_sequences FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow insert code sequences"
  ON code_sequences FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow delete code sequences"
  ON code_sequences FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- TABELA: cortesias
-- ============================================================
CREATE TABLE IF NOT EXISTS cortesias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid REFERENCES code_sequences(id) ON DELETE SET NULL,
  code text,
  created_by uuid NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  solicitante text,
  motivo text,
  data_validade date,
  email_entrega text,
  unidade text,
  numero_ingressos integer,
  status text DEFAULT 'ativo',
  codigo_inicial text,
  codigos text[],
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cortesias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon select cortesias" ON cortesias;
DROP POLICY IF EXISTS "Allow anon insert cortesias" ON cortesias;
DROP POLICY IF EXISTS "Allow anon update cortesias" ON cortesias;
DROP POLICY IF EXISTS "Allow anon delete cortesias" ON cortesias;

CREATE POLICY "Allow anon select cortesias"
  ON cortesias FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow anon insert cortesias"
  ON cortesias FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow anon update cortesias"
  ON cortesias FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon delete cortesias"
  ON cortesias FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- FUNCOES
-- ============================================================

DROP FUNCTION IF EXISTS public.reserve_ticket_codes(text, integer);

CREATE FUNCTION public.reserve_ticket_codes(seq_prefix text, quantity integer)
RETURNS TABLE (code text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  start_num integer;
  pad_len integer;
  i integer;
BEGIN
  SELECT current_number, COALESCE(pad_length, 4)
  INTO start_num, pad_len
  FROM code_sequences
  WHERE prefix = seq_prefix
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sequência % não encontrada', seq_prefix;
  END IF;

  UPDATE code_sequences
  SET current_number = current_number + quantity,
      updated_at = now()
  WHERE prefix = seq_prefix;

  FOR i IN 1..quantity LOOP
    code := seq_prefix || lpad((start_num + i)::text, pad_len, '0');
    RETURN NEXT;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION get_sequence_id_by_prefix(seq_prefix text)
RETURNS uuid AS $$
DECLARE
  seq_id uuid;
BEGIN
  SELECT id INTO seq_id FROM code_sequences WHERE prefix = seq_prefix LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sequência % não encontrada', seq_prefix;
  END IF;
  RETURN seq_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- DADOS INICIAIS
-- ============================================================

INSERT INTO user_accounts (username, password, role, approved) VALUES
  ('admin', 'password123', 'master_admin', true),
  ('rubens', 'senha123', 'admin', true)
ON CONFLICT (username) DO NOTHING;

INSERT INTO user_profiles (user_id, display_name, email, approved)
SELECT id, INITCAP(username), username || '@cinex.com.br', true
FROM user_accounts
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles up WHERE up.user_id = user_accounts.id
);

DO $$
DECLARE
  v_admin_id uuid;
BEGIN
  SELECT id INTO v_admin_id FROM user_accounts WHERE username = 'admin' LIMIT 1;

  BEGIN
    ALTER TABLE code_sequences ADD CONSTRAINT code_sequences_prefix_unique UNIQUE (prefix);
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  INSERT INTO code_sequences (created_by, name, prefix, current_number, pad_length)
  VALUES
    (v_admin_id, 'Cinex Goiania', 'CINEXGYN', 0, 4),
    (v_admin_id, 'Cinex Araguaina', 'CINEXAUX', 0, 4),
    (v_admin_id, 'Cinex Palmas', 'CINEXPMW', 0, 4),
    (v_admin_id, 'Cinex Gurupi', 'CINEXGRP', 0, 4),
    (v_admin_id, 'Cinex Sao Luis', 'CINEXSLZ', 0, 4)
  ON CONFLICT (prefix) DO NOTHING;
END $$;
