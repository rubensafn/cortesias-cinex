/*
  # Initialize code sequences for all units

  1. Creates UNIQUE constraint on prefix column
  2. Inserts initial code sequences for each unit (CINEXGYN, CINEXAUX, CINEXPMW, CINEXGRP, CINEXSLZ)

  Code format examples: CINEXGYN0001, CINEXGYN0002, etc.
  All sequences start at 0, so the first generated code will be 0001
*/

DO $$
DECLARE
  v_admin_id uuid;
BEGIN
  -- Get admin user ID
  SELECT id INTO v_admin_id FROM user_accounts WHERE username = 'admin' LIMIT 1;

  -- Add UNIQUE constraint to prefix if it doesn't exist
  BEGIN
    ALTER TABLE code_sequences ADD CONSTRAINT code_sequences_prefix_unique UNIQUE (prefix);
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  -- Insert sequences for each unit
  INSERT INTO code_sequences (id, created_by, name, prefix, current_number, pad_length, created_at)
  VALUES
    (gen_random_uuid(), v_admin_id, 'Cinex Goiania', 'CINEXGYN', 0, 4, now()),
    (gen_random_uuid(), v_admin_id, 'Cinex Araguaina', 'CINEXAUX', 0, 4, now()),
    (gen_random_uuid(), v_admin_id, 'Cinex Palmas', 'CINEXPMW', 0, 4, now()),
    (gen_random_uuid(), v_admin_id, 'Cinex Gurupi', 'CINEXGRP', 0, 4, now()),
    (gen_random_uuid(), v_admin_id, 'Cinex Sao Luis', 'CINEXSLZ', 0, 4, now())
  ON CONFLICT (prefix) DO NOTHING;
END $$;
