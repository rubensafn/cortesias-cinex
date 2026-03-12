
/*
  # Corrige sequencias de codigo e adiciona prefixos por unidade

  1. Atualiza code_sequences para ter uma sequencia por unidade
  2. Recria funcao reserve_ticket_codes
*/

-- Limpa sequencias existentes e cria uma para cada unidade
DELETE FROM code_sequences;

INSERT INTO code_sequences (prefix, current_number, pad_length) VALUES
  ('CINEXGYN', 0, 4),
  ('CINEXPMW', 0, 4),
  ('CINEXGRP', 0, 4),
  ('CINEXSLZ', 0, 4),
  ('CINEXAUX', 0, 4);

-- Drop e recria a funcao
DROP FUNCTION IF EXISTS reserve_ticket_codes(integer, text);

CREATE FUNCTION reserve_ticket_codes(quantity integer, seq_prefix text)
RETURNS TABLE(code text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    INSERT INTO code_sequences (prefix, current_number, pad_length)
    VALUES (seq_prefix, 0, 4)
    RETURNING current_number, pad_length INTO start_num, pad_len;
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

GRANT EXECUTE ON FUNCTION reserve_ticket_codes(integer, text) TO authenticated;
