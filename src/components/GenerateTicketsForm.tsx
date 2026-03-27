import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useAppTheme } from '../hooks/useAppTheme';
import { SupabaseClient } from '@supabase/supabase-js';
import { Sparkles, CheckCircle, AlertCircle, ShieldAlert, Building2 } from 'lucide-react';
import { TicketArt } from './TicketArt';

interface FormData {
  quantidade: number;
  solicitante: string;
  motivo: string;
  data_validade: string;
}

interface GenerateTicketsFormProps {
  onSuccess: () => void;
}

async function claimCodes(
  db: SupabaseClient,
  codesTable: string,
  quantity: number
): Promise<{ codes: string[]; error: string | null }> {
  const today = new Date().toISOString().split('T')[0];

  const { count: availableCount, error: countErr } = await db
    .from(codesTable)
    .select('id', { count: 'exact', head: true })
    .eq('used', false)
    .gte('expiry_date', today);

  if (countErr) return { codes: [], error: countErr.message };

  if (!availableCount || availableCount === 0) {
    const { count: expiredCount } = await db
      .from(codesTable)
      .select('id', { count: 'exact', head: true })
      .eq('used', false)
      .lt('expiry_date', today);

    if (expiredCount && expiredCount > 0) {
      return { codes: [], error: 'Todos os vouchers disponíveis estão vencidos. Contate o administrador para repor os vouchers.' };
    }
    return { codes: [], error: 'Nenhum código disponível no pool. Importe novos códigos primeiro.' };
  }

  const { data: toClaimRows, error: fetchErr } = await db
    .from(codesTable)
    .select('id, code')
    .eq('used', false)
    .gte('expiry_date', today)
    .order('expiry_date', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(quantity);

  if (fetchErr || !toClaimRows || toClaimRows.length === 0) {
    return { codes: [], error: fetchErr?.message || 'Erro ao buscar códigos disponíveis.' };
  }

  if (toClaimRows.length < quantity) {
    return { codes: [], error: `Apenas ${toClaimRows.length} códigos disponíveis (não vencidos). Solicitado: ${quantity}` };
  }

  const ids = toClaimRows.map(r => r.id);
  const { error: updateErr } = await db
    .from(codesTable)
    .update({ used: true, used_at: new Date().toISOString() })
    .in('id', ids);

  if (updateErr) {
    return { codes: [], error: `Erro ao marcar códigos como usados: ${updateErr.message}` };
  }

  return { codes: toClaimRows.map(r => r.code), error: null };
}

export default function GenerateTicketsForm({ onSuccess }: GenerateTicketsFormProps) {
  const { user } = useAuth();
  const { db, tables } = useApp();
  const { isDark, isEmpresa, cardBg, primaryBtn, primaryBtnRing, inputBg, inputRing, accentText, labels } = useAppTheme();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ count: number; codes: string[]; validade: string } | null>(null);
  const [formData, setFormData] = useState<FormData>({
    quantidade: 1,
    solicitante: '',
    motivo: '',
    data_validade: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantidade' ? Math.max(1, Math.min(200, parseInt(value) || 1)) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(null);
    setLoading(true);

    try {
      const { codes: generatedCodes, error: claimError } = await claimCodes(db, tables.importedCodes, formData.quantidade);
      if (claimError) throw new Error(claimError);
      if (!generatedCodes || generatedCodes.length === 0) throw new Error('Nenhum código disponível no pool. Importe novos códigos primeiro.');

      const insertData = {
        code: generatedCodes[0],
        created_by: user?.id,
        solicitante: formData.solicitante,
        motivo: formData.motivo,
        data_validade: formData.data_validade || null,
        numero_ingressos: formData.quantidade,
        status: 'ativo',
        codigo_inicial: generatedCodes[0],
        codigos: generatedCodes,
      };

      const { error: insertError } = await db.from(tables.tickets).insert(insertData);
      if (insertError) throw new Error(insertError.message);

      setSuccess({ count: formData.quantidade, codes: generatedCodes, validade: formData.data_validade });
      setFormData({ quantidade: 1, solicitante: '', motivo: '', data_validade: '' });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const isExpiredVoucherError = error.includes('vencidos') || error.includes('Contate o administrador');
  const FormIcon = isEmpresa ? Building2 : Sparkles;

  if (success) {
    return (
      <div className={`rounded-xl shadow-xl p-8 border ${cardBg}`}>
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${isDark || isEmpresa ? 'bg-green-900/50' : 'bg-green-100'}`}>
            <CheckCircle className={isDark || isEmpresa ? 'text-green-400' : 'text-green-600'} size={36} />
          </div>
          <h2 className={`text-2xl font-bold ${isDark || isEmpresa ? 'text-white' : 'text-gray-900'}`}>
            {success.count} {labels.successMsg}
          </h2>
          <p className={`mt-2 text-sm ${isDark || isEmpresa ? 'text-gray-400' : 'text-gray-500'}`}>Os códigos foram criados com sucesso</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {success.codes.slice(0, 3).map(code => (
            <TicketArt key={code} codigo={code} data_validade={success.validade} />
          ))}
        </div>

        {success.codes.length > 3 && (
          <div className={`rounded-xl p-4 border mb-6 ${isDark || isEmpresa ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
            <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark || isEmpresa ? 'text-gray-500' : 'text-gray-500'}`}>
              +{success.codes.length - 3} códigos adicionais
            </p>
            <div className="flex flex-wrap gap-2">
              {success.codes.slice(3).map(code => (
                <span key={code} className={`border rounded-lg px-3 py-1.5 font-mono text-sm font-bold ${
                  isDark || isEmpresa ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-800'
                }`}>{code}</span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={() => { setSuccess(null); onSuccess(); }}
            className={`flex-1 py-3 px-4 rounded-lg transition-colors font-semibold ${isDark || isEmpresa ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-900 hover:bg-gray-800 text-white'}`}
          >
            Ver {labels.tickets}
          </button>
          <button
            onClick={() => setSuccess(null)}
            className={`px-6 ${primaryBtn} text-white py-3 rounded-lg transition-colors font-semibold`}
          >
            Gerar Mais
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl shadow-xl p-8 border ${cardBg}`}>
      <div className="flex items-center gap-3 mb-8">
        <div className={`p-2.5 rounded-xl ${isEmpresa ? 'bg-[#f59e0b]/20' : (isDark ? 'bg-[#a700ff]/20' : 'bg-[#a700ff]/10')}`}>
          <FormIcon className={isEmpresa ? 'text-[#f59e0b]' : 'text-[#a700ff]'} size={24} />
        </div>
        <div>
          <h2 className={`text-2xl font-bold ${isDark || isEmpresa ? 'text-white' : 'text-gray-900'}`}>{labels.newTicket}</h2>
          <p className={`text-sm ${isDark || isEmpresa ? 'text-gray-400' : 'text-gray-500'}`}>Preencha os dados para gerar os {labels.tickets.toLowerCase()}</p>
        </div>
      </div>

      {error && (
        <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 ${
          isExpiredVoucherError
            ? isDark || isEmpresa ? 'bg-orange-900/30 border-orange-500/30' : 'bg-orange-50 border-orange-300'
            : isDark || isEmpresa ? 'bg-red-900/30 border-red-500/30' : 'bg-red-50 border-red-300'
        }`}>
          {isExpiredVoucherError
            ? <ShieldAlert size={20} className={isDark || isEmpresa ? 'text-orange-400 mt-0.5 shrink-0' : 'text-orange-600 mt-0.5 shrink-0'} />
            : <AlertCircle size={20} className={isDark || isEmpresa ? 'text-red-400 mt-0.5 shrink-0' : 'text-red-600 mt-0.5 shrink-0'} />
          }
          <div>
            <p className={`text-sm font-semibold ${
              isExpiredVoucherError
                ? isDark || isEmpresa ? 'text-orange-400' : 'text-orange-700'
                : isDark || isEmpresa ? 'text-red-400' : 'text-red-700'
            }`}>{isExpiredVoucherError ? 'Vouchers Vencidos' : 'Erro'}</p>
            <p className={`text-sm mt-1 ${
              isExpiredVoucherError
                ? isDark || isEmpresa ? 'text-orange-300/80' : 'text-orange-600'
                : isDark || isEmpresa ? 'text-red-300/80' : 'text-red-600'
            }`}>{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDark || isEmpresa ? 'text-gray-300' : 'text-gray-800'}`}>
              Quantidade <span className={accentText}>*</span>
            </label>
            <input
              type="number" name="quantidade" value={formData.quantidade}
              onChange={handleChange} min="1" max="200"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${inputRing} focus:border-transparent transition-all ${inputBg}`}
              required
            />
            <p className={`text-xs mt-1 ${isDark || isEmpresa ? 'text-gray-500' : 'text-gray-400'}`}>Máximo 200 por vez</p>
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDark || isEmpresa ? 'text-gray-300' : 'text-gray-800'}`}>
              Solicitante <span className={accentText}>*</span>
            </label>
            <input
              type="text" name="solicitante" value={formData.solicitante}
              onChange={handleChange} placeholder="Nome de quem está solicitando"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${inputRing} focus:border-transparent transition-all ${inputBg}`}
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDark || isEmpresa ? 'text-gray-300' : 'text-gray-800'}`}>
              Validade <span className={accentText}>*</span>
            </label>
            <input
              type="date" name="data_validade" value={formData.data_validade}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${inputRing} focus:border-transparent transition-all ${inputBg}`}
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className={`block text-sm font-semibold mb-2 ${isDark || isEmpresa ? 'text-gray-300' : 'text-gray-800'}`}>
              Motivo <span className={accentText}>*</span>
            </label>
            <textarea
              name="motivo" value={formData.motivo} onChange={handleChange} rows={3}
              placeholder={`Descreva o motivo dos ${labels.tickets.toLowerCase()}...`}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${inputRing} focus:border-transparent transition-all resize-none ${inputBg}`}
              required
            />
          </div>

        </div>

        <div className={`border-t pt-6 flex gap-4 ${isDark || isEmpresa ? 'border-white/10' : 'border-gray-100'}`}>
          <button
            type="submit" disabled={loading}
            className={`flex-1 ${primaryBtn} ${primaryBtnRing} text-white py-3.5 px-4 rounded-lg focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold flex items-center justify-center gap-2`}
          >
            <FormIcon size={18} />
            {loading ? 'Gerando...' : `${labels.generateBtn.replace('Gerar', `Gerar ${formData.quantidade > 1 ? formData.quantidade + ' ' : ''}`).trim()}`}
          </button>
          <button
            type="button"
            onClick={() => { setFormData({ quantidade: 1, solicitante: '', motivo: '', data_validade: '' }); setError(''); }}
            className={`px-6 py-3.5 rounded-lg transition-colors font-semibold ${isDark || isEmpresa ? 'bg-white/10 hover:bg-white/20 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
          >
            Limpar
          </button>
        </div>
      </form>
    </div>
  );
}
