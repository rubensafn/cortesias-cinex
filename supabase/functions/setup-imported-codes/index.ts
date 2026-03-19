import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const dbUrl = Deno.env.get("SUPABASE_DB_URL");
    if (!dbUrl) {
      return new Response(
        JSON.stringify({ error: "SUPABASE_DB_URL not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { Client } = await import("https://deno.land/x/postgres@v0.19.3/mod.ts");
    const client = new Client(dbUrl);
    await client.connect();

    const sql = `
      CREATE TABLE IF NOT EXISTS imported_codes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        code text UNIQUE NOT NULL,
        expiry_date date NOT NULL,
        used boolean DEFAULT false,
        imported_by uuid REFERENCES user_accounts(id) ON DELETE SET NULL,
        used_by uuid REFERENCES user_accounts(id) ON DELETE SET NULL,
        used_at timestamptz,
        created_at timestamptz DEFAULT now()
      );

      ALTER TABLE imported_codes ENABLE ROW LEVEL SECURITY;

      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'imported_codes' AND policyname = 'Allow anon select imported_codes') THEN
          CREATE POLICY "Allow anon select imported_codes" ON imported_codes FOR SELECT TO anon, authenticated USING (true);
        END IF;
      END $$;

      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'imported_codes' AND policyname = 'Allow anon insert imported_codes') THEN
          CREATE POLICY "Allow anon insert imported_codes" ON imported_codes FOR INSERT TO anon, authenticated WITH CHECK (true);
        END IF;
      END $$;

      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'imported_codes' AND policyname = 'Allow anon update imported_codes') THEN
          CREATE POLICY "Allow anon update imported_codes" ON imported_codes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
        END IF;
      END $$;

      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'imported_codes' AND policyname = 'Allow anon delete imported_codes') THEN
          CREATE POLICY "Allow anon delete imported_codes" ON imported_codes FOR DELETE TO anon, authenticated USING (true);
        END IF;
      END $$;

      CREATE OR REPLACE FUNCTION public.exec_migration_sql(sql_text text)
      RETURNS json
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $fn$
      BEGIN
        EXECUTE sql_text;
        RETURN json_build_object('success', true);
      EXCEPTION WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM, 'detail', SQLSTATE);
      END;
      $fn$;

      REVOKE ALL ON FUNCTION public.exec_migration_sql(text) FROM PUBLIC;
      REVOKE ALL ON FUNCTION public.exec_migration_sql(text) FROM anon;
      REVOKE ALL ON FUNCTION public.exec_migration_sql(text) FROM authenticated;
      GRANT EXECUTE ON FUNCTION public.exec_migration_sql(text) TO service_role;
    `;

    await client.queryArray(sql);
    await client.end();

    return new Response(
      JSON.stringify({ success: true, message: "imported_codes table and exec_migration_sql function created" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
