/*
  # Fix duplicate reserve_ticket_codes functions

  1. Removes duplicate function definitions
  2. Creates single function with correct signature
*/

DROP FUNCTION IF EXISTS public.reserve_ticket_codes(quantity integer, seq_prefix text);
DROP FUNCTION IF EXISTS public.reserve_ticket_codes(seq_prefix text, quantity integer);

CREATE FUNCTION public.reserve_ticket_codes(seq_prefix text, quantity integer)
RETURNS TABLE (code text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
$function$;
