/*
  # Update cortesias table with additional fields

  1. Modified Tables
    - `cortesias`
      - Added `solicitante` (text) - person requesting the vouchers
      - Added `motivo` (text) - reason for the vouchers
      - Added `data_validade` (date) - expiration date
      - Added `email_entrega` (text) - delivery email
      - Added `unidade` (text) - unit/location
      - Added `numero_ingressos` (integer) - number of tickets
      - Added `status` (text) - status of the voucher set
      - Added `codigo_inicial` (text) - initial code
      - Added `codigos` (text array) - array of codes
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cortesias' AND column_name = 'solicitante'
  ) THEN
    ALTER TABLE cortesias ADD COLUMN solicitante TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cortesias' AND column_name = 'motivo'
  ) THEN
    ALTER TABLE cortesias ADD COLUMN motivo TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cortesias' AND column_name = 'data_validade'
  ) THEN
    ALTER TABLE cortesias ADD COLUMN data_validade DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cortesias' AND column_name = 'email_entrega'
  ) THEN
    ALTER TABLE cortesias ADD COLUMN email_entrega TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cortesias' AND column_name = 'unidade'
  ) THEN
    ALTER TABLE cortesias ADD COLUMN unidade TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cortesias' AND column_name = 'numero_ingressos'
  ) THEN
    ALTER TABLE cortesias ADD COLUMN numero_ingressos INTEGER;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cortesias' AND column_name = 'status'
  ) THEN
    ALTER TABLE cortesias ADD COLUMN status TEXT DEFAULT 'ativo';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cortesias' AND column_name = 'codigo_inicial'
  ) THEN
    ALTER TABLE cortesias ADD COLUMN codigo_inicial TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cortesias' AND column_name = 'codigos'
  ) THEN
    ALTER TABLE cortesias ADD COLUMN codigos TEXT[];
  END IF;
END $$;
