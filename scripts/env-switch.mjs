import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const ENVS = {
  prod: {
    label: 'PRODUCAO',
    url: 'https://eofwwzeqdwsmthiszuwa.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvZnd3emVxZHdzbXRoaXN6dXdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjk1OTksImV4cCI6MjA4ODgwNTU5OX0.kTbZNI2LB8E8TMy1GSICG0D1gKeDiR9XBt2vDcqy_5c',
  },
  dev: {
    label: 'DESENVOLVIMENTO',
    url: 'https://gdtfwmqbvsqtxtccrydv.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkdGZ3bXFidnNxdHh0Y2NyeWR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MDQyMzEsImV4cCI6MjA4ODk4MDIzMX0._tNQNsL332F0qfByCTmcBFNoLq6Cd8YIJcercKMtc0g',
  },
};

function getStatus() {
  try {
    const content = readFileSync(resolve(ROOT, '.env'), 'utf8');
    const match = content.match(/VITE_SUPABASE_URL=(.+)/);
    const url = match?.[1]?.trim() ?? '';
    if (url.includes('eofww')) return { env: 'prod', ...ENVS.prod };
    if (url.includes('gdtfw')) return { env: 'dev', ...ENVS.dev };
    return { env: 'unknown', label: `desconhecido (${url})` };
  } catch {
    return { env: 'unknown', label: 'nao encontrado' };
  }
}

const cmd = process.argv[2];

if (cmd === 'status') {
  const status = getStatus();
  console.log(`Ambiente ativo: ${status.label}`);
} else if (cmd === 'prod' || cmd === 'dev') {
  const target = ENVS[cmd];
  const content = `VITE_SUPABASE_URL=${target.url}\nVITE_SUPABASE_ANON_KEY=${target.key}\n`;
  writeFileSync(resolve(ROOT, '.env'), content, 'utf8');
  console.log(`Trocado para ${target.label}`);
  console.log(`URL: ${target.url}`);
} else {
  console.log('Uso: npm run env [prod|dev|status]');
  console.log('');
  console.log('  prod    - Aponta .env para producao (eofww...)');
  console.log('  dev     - Aponta .env para desenvolvimento (gdtfw...)');
  console.log('  status  - Mostra qual ambiente esta ativo');
  console.log('');
  const status = getStatus();
  console.log(`Ambiente ativo: ${status.label}`);
}
