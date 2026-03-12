/*
  # Fix code_sequences table and reserve_ticket_codes function

  1. Modified Tables
    - `code_sequences`
      - Added `pad_length` column with default value 4 for formatting codes

  2. Modified Functions
    - Updated `reserve_ticket_codes` function to work correctly with pad_length
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'code_sequences' AND column_name = 'pad_length'
  ) THEN
    ALTER TABLE code_sequences ADD COLUMN pad_length INTEGER DEFAULT 4;
  END IF;
END $$;

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
