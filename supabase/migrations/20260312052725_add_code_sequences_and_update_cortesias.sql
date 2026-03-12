
/*
  # Adiciona sequencia de codigos e atualiza cortesias

  1. Nova tabela: code_sequences
     - Controla o prefixo e numero atual da sequencia de codigos
     - Permite definir o codigo inicial por periodo (ex: CINEX00001)
     - Apenas master/admin podem alterar

  2. Atualiza cortesias
     - Adiciona campo solicitante, motivo, data_validade, email_entrega
     - Mantém campos existentes

  3. Segurança
     - RLS em code_sequences
*/

-- Tabela de sequência de codigos
CREATE TABLE IF NOT EXISTS code_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prefix text NOT NULL DEFAULT 'CINEX',
  current_number integer NOT NULL DEFAULT 0,
  pad_length integer NOT NULL DEFAULT 5,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE code_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin and master can view sequences"
  ON code_sequences FOR SELECT
  TO authenticated
  USING (get_my_role() IN ('master', 'admin'));

CREATE POLICY "admin and master can insert sequences"
  ON code_sequences FOR INSERT
  TO authenticated
  WITH CHECK (get_my_role() IN ('master', 'admin'));

CREATE POLICY "admin and master can update sequences"
  ON code_sequences FOR UPDATE
  TO authenticated
  USING (get_my_role() IN ('master', 'admin'))
  WITH CHECK (get_my_role() IN ('master', 'admin'));

-- Insere sequencia padrão
INSERT INTO code_sequences (prefix, current_number, pad_length)
VALUES ('CINEX', 0, 5)
ON CONFLICT DO NOTHING;

-- Atualiza tabela cortesias com campos corretos
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cortesias' AND column_name = 'solicitante') THEN
    ALTER TABLE cortesias ADD COLUMN solicitante text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cortesias' AND column_name = 'motivo') THEN
    ALTER TABLE cortesias ADD COLUMN motivo text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cortesias' AND column_name = 'data_validade') THEN
    ALTER TABLE cortesias ADD COLUMN data_validade date;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cortesias' AND column_name = 'email_entrega') THEN
    ALTER TABLE cortesias ADD COLUMN email_entrega text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cortesias' AND column_name = 'email_enviado') THEN
    ALTER TABLE cortesias ADD COLUMN email_enviado boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cortesias' AND column_name = 'batch_id') THEN
    ALTER TABLE cortesias ADD COLUMN batch_id uuid;
  END IF;
END $$;

-- Função atômica para reservar N códigos em sequência
CREATE OR REPLACE FUNCTION reserve_ticket_codes(quantity integer, seq_prefix text DEFAULT 'CINEX')
RETURNS TABLE(code text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  start_num integer;
  pad_len integer;
  i integer;
BEGIN
  SELECT current_number, pad_length
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
