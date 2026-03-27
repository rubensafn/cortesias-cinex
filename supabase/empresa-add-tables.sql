/*
  # Adicionar tabelas do Cinex Empresa no projeto existente do Cortesias

  Rodar no SQL Editor do projeto atual:
  https://supabase.com/dashboard/project/gdtfwmqbvsqtxtccrydv/sql/new

  Não mexe em nenhuma tabela existente. Só cria as duas tabelas novas.
*/

-- ============================================================
-- TABELA: empresa_imported_codes  (pool de vouchers da Empresa)
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
-- TABELA: empresa_tickets  (ingressos gerados pela Empresa)
-- ============================================================
CREATE TABLE IF NOT EXISTS empresa_tickets (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code             text,
  created_by       uuid NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  solicitante      text,
  motivo           text,
  data_validade    date,
  numero_ingressos integer,
  status           text DEFAULT 'ativo',
  codigo_inicial   text,
  codigos          text[],
  email_enviado    boolean DEFAULT false,
  batch_id         uuid,
  created_at       timestamptz DEFAULT now()
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
