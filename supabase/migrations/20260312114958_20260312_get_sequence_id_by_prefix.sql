/*
  # Create function to get sequence ID by prefix

  1. New Functions
    - `get_sequence_id_by_prefix(prefix text)` - Returns the sequence ID for a given prefix
      - Used by the ticket generation system to link cortesias to code sequences
*/

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