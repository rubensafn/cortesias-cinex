/*
  # Add updated_at column to code_sequences table

  1. Adds updated_at column to track when sequences were last updated
  2. Fixes reserve_ticket_codes function to use the column
*/

DO $$
BEGIN
  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'code_sequences' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE code_sequences ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Recreate the function with proper handling
CREATE OR REPLACE FUNCTION reserve_ticket_codes(seq_prefix text, quantity integer)
RETURNS TABLE (code text) AS $$
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
$$ LANGUAGE plpgsql;
