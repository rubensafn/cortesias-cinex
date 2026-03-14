-- Bootstrap: cria a funcao helper para migracao automatica
-- Execute este SQL UMA VEZ em cada banco (dev e prod) via Supabase Dashboard > SQL Editor

CREATE OR REPLACE FUNCTION public.exec_migration_sql(sql_text text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE sql_text;
  RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

REVOKE ALL ON FUNCTION public.exec_migration_sql(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.exec_migration_sql(text) FROM anon;
REVOKE ALL ON FUNCTION public.exec_migration_sql(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.exec_migration_sql(text) TO service_role;
