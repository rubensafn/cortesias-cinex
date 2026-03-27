import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

const empresaUrl = import.meta.env.VITE_SUPABASE_EMPRESA_URL;
const empresaKey = import.meta.env.VITE_SUPABASE_EMPRESA_ANON_KEY;

// Usa banco separado se as variáveis estiverem configuradas, senão cai no banco do Cortesias
export const supabaseEmpresa =
  empresaUrl && empresaKey
    ? createClient(empresaUrl, empresaKey)
    : supabase;
