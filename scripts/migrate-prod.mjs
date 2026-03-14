import { readFileSync, readdirSync, existsSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const CONFIG = {
  dev: {
    label: 'DESENVOLVIMENTO',
    url: 'https://gdtfwmqbvsqtxtccrydv.supabase.co',
    serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkdGZ3bXFidnNxdHh0Y2NyeWR2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQwNDIzMSwiZXhwIjoyMDg4OTgwMjMxfQ.VdONnEj44_VMyum_6hOPyfZVvOSUed_VkwV77GmMWII',
    dashboardUrl: 'https://supabase.com/dashboard/project/gdtfwmqbvsqtxtccrydv',
  },
  prod: {
    label: 'PRODUCAO',
    url: 'https://eofwwzeqdwsmthiszuwa.supabase.co',
    serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvZnd3emVxZHdzbXRoaXN6dXdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzIyOTU5OSwiZXhwIjoyMDg4ODA1NTk5fQ.QQJvdKgjfOsCQ3bZln58ycO6LfmE0BvrIvYKolhiyIc',
    dashboardUrl: 'https://supabase.com/dashboard/project/eofwwzeqdwsmthiszuwa',
  },
};

const BOOTSTRAP_SQL = `CREATE OR REPLACE FUNCTION public.exec_migration_sql(sql_text text)
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
GRANT EXECUTE ON FUNCTION public.exec_migration_sql(text) TO service_role;`;

const MIGRATIONS_DIR = resolve(ROOT, 'supabase/migrations');
const TRACKING_FILE = resolve(ROOT, '.migration-tracking.json');

function loadTracking() {
  if (!existsSync(TRACKING_FILE)) return { prod: [], dev: [] };
  try {
    return JSON.parse(readFileSync(TRACKING_FILE, 'utf8'));
  } catch {
    return { prod: [], dev: [] };
  }
}

function saveTracking(data) {
  writeFileSync(TRACKING_FILE, JSON.stringify(data, null, 2), 'utf8');
}

async function checkBootstrap(env) {
  const cfg = CONFIG[env];
  const res = await fetch(`${cfg.url}/rest/v1/rpc/exec_migration_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': cfg.serviceKey,
      'Authorization': `Bearer ${cfg.serviceKey}`,
    },
    body: JSON.stringify({ sql_text: 'SELECT 1' }),
  });
  const text = await res.text();
  try {
    const parsed = JSON.parse(text);
    if (parsed.code === 'PGRST202') return false;
  } catch {}
  return true;
}

async function execSQL(env, sql) {
  const cfg = CONFIG[env];
  const res = await fetch(`${cfg.url}/rest/v1/rpc/exec_migration_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': cfg.serviceKey,
      'Authorization': `Bearer ${cfg.serviceKey}`,
    },
    body: JSON.stringify({ sql_text: sql }),
  });

  const text = await res.text();

  if (!res.ok) {
    let detail = text;
    try {
      const parsed = JSON.parse(text);
      detail = parsed.message || parsed.error || text;
    } catch {}
    throw new Error(`HTTP ${res.status}: ${detail}`);
  }

  let result;
  try {
    result = JSON.parse(text);
  } catch {
    return { success: true };
  }

  if (result && result.success === false) {
    throw new Error(`SQL erro: ${result.error} (${result.detail})`);
  }

  return result;
}

function waitForEnter() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question('', () => { rl.close(); resolve(); });
  });
}

async function runBootstrap(env) {
  const cfg = CONFIG[env];

  console.log('');
  console.log(`=== CINEX - Bootstrap de Migracao: ${cfg.label} ===`);
  console.log('');

  const already = await checkBootstrap(env);
  if (already) {
    console.log(`Funcao exec_migration_sql ja existe em ${cfg.label}.`);
    console.log('Bootstrap nao necessario.');
    return;
  }

  console.log(`Para ativar migracoes automaticas em ${cfg.label}, execute o SQL abaixo:`);
  console.log('');
  console.log(`Dashboard: ${cfg.dashboardUrl}/sql/new`);
  console.log('');
  console.log('--- COPIE O SQL ABAIXO ---');
  console.log('');
  console.log(BOOTSTRAP_SQL);
  console.log('');
  console.log('--- FIM DO SQL ---');
  console.log('');
  console.log('1. Abra o link acima no navegador');
  console.log('2. Cole o SQL no editor');
  console.log('3. Clique em "Run"');
  console.log('4. Pressione ENTER aqui quando terminar...');

  await waitForEnter();

  const ok = await checkBootstrap(env);
  if (ok) {
    console.log(`Sucesso! ${cfg.label} esta pronto para migracoes automaticas.`);
  } else {
    console.log('Funcao ainda nao encontrada. Verifique se o SQL foi executado corretamente.');
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');
  const stopOnError = args.includes('--stop-on-error');
  const isBootstrap = args.includes('bootstrap');
  const targetEnv = args.find(a => a === 'dev' || a === 'prod') || 'prod';

  if (isBootstrap) {
    await runBootstrap(targetEnv);
    return;
  }

  console.log('');
  console.log('=== CINEX - Migration Automatica ===');
  console.log(`Destino: ${CONFIG[targetEnv].label}`);
  console.log(`URL: ${CONFIG[targetEnv].url}`);
  console.log('');

  const bootstrapped = await checkBootstrap(targetEnv);
  if (!bootstrapped) {
    console.error(`Erro: funcao exec_migration_sql nao encontrada em ${CONFIG[targetEnv].label}.`);
    console.error(`Execute o bootstrap primeiro: npm run migrate:bootstrap:${targetEnv}`);
    process.exit(1);
  }

  if (dryRun) {
    console.log('[MODO SIMULACAO - nenhuma alteracao sera feita]');
    console.log('');
  }

  if (!existsSync(MIGRATIONS_DIR)) {
    console.error('Pasta supabase/migrations nao encontrada.');
    process.exit(1);
  }

  const allFiles = readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  if (allFiles.length === 0) {
    console.log('Nenhum arquivo .sql encontrado em supabase/migrations/');
    process.exit(0);
  }

  const tracking = loadTracking();
  const applied = tracking[targetEnv] || [];
  const pending = force ? allFiles : allFiles.filter(f => !applied.includes(f));

  console.log(`Total de migrations: ${allFiles.length}`);
  console.log(`Ja aplicadas:        ${applied.length}`);
  console.log(`Pendentes:           ${pending.length}`);
  console.log('');

  if (pending.length === 0) {
    console.log('Tudo atualizado! Nenhuma migration pendente.');
    process.exit(0);
  }

  console.log('Migrations a aplicar:');
  pending.forEach(f => console.log(`  - ${f}`));
  console.log('');

  if (dryRun) {
    console.log('[SIMULACAO] Nenhuma alteracao feita.');
    process.exit(0);
  }

  let successCount = 0;
  let errorCount = 0;

  for (const filename of pending) {
    const filePath = resolve(MIGRATIONS_DIR, filename);
    const sql = readFileSync(filePath, 'utf8');

    process.stdout.write(`Aplicando ${filename}... `);

    try {
      await execSQL(targetEnv, sql);
      console.log('OK');

      if (!tracking[targetEnv]) tracking[targetEnv] = [];
      if (!tracking[targetEnv].includes(filename)) {
        tracking[targetEnv].push(filename);
      }
      saveTracking(tracking);
      successCount++;
    } catch (err) {
      console.log('ERRO');
      console.error(`  -> ${err.message}`);
      errorCount++;

      if (stopOnError) {
        console.log('Parando por causa do erro.');
        break;
      }
    }
  }

  console.log('');
  console.log('=== Resultado ===');
  console.log(`Sucesso: ${successCount}`);
  console.log(`Erros:   ${errorCount}`);
  console.log('');

  if (errorCount > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Erro fatal:', err.message);
  process.exit(1);
});
