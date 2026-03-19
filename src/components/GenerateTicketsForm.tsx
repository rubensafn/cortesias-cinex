import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Sparkles, CheckCircle, Send, Mail, AlertCircle, ShieldAlert } from 'lucide-react';
import { TicketArt } from './TicketArt';

interface FormData {
  quantidade: number;
  solicitante: string;
  motivo: string;
  data_validade: string;
  email_entrega: string;
}

interface GenerateTicketsFormProps {
  onSuccess: () => void;
}

async function claimCodes(quantity: number): Promise<{ codes: string[]; error: string | null }> {
  const today = new Date().toISOString().split('T')[0];

  const { data: available, error: countErr } = await supabase
    .from('imported_codes')
    .select('id', { count: 'exact', head: true })
    .eq('used', false)
    .gte('expiry_date', today);

  if (countErr) {
    return { codes: [], error: countErr.message };
  }

  const availableCount = available?.length ?? 0;

  if (availableCount === 0) {
    const { data: expiredCodes } = await supabase
      .from('imported_codes')
      .select('id', { count: 'exact', head: true })
      .eq('used', false)
      .lt('expiry_date', today);

    const hasExpired = (expiredCodes?.length ?? 0) > 0;

    if (hasExpired) {
      return {
        codes: [],
        error: 'Todos os vouchers disponiveis estao vencidos. Contate o administrador para repor os vouchers.',
      };
    }
    return {
      codes: [],
      error: 'Nenhum codigo disponivel no pool. Importe novos codigos primeiro.',
    };
  }

  const { data: toClaimRows, error: fetchErr } = await supabase
    .from('imported_codes')
    .select('id, code')
    .eq('used', false)
    .gte('expiry_date', today)
    .order('expiry_date', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(quantity);

  if (fetchErr || !toClaimRows || toClaimRows.length === 0) {
    return { codes: [], error: fetchErr?.message || 'Erro ao buscar codigos disponiveis.' };
  }

  if (toClaimRows.length < quantity) {
    return {
      codes: [],
      error: `Apenas ${toClaimRows.length} codigos disponiveis (nao vencidos). Solicitado: ${quantity}`,
    };
  }

  const ids = toClaimRows.map(r => r.id);
  const { error: updateErr } = await supabase
    .from('imported_codes')
    .update({ used: true, used_at: new Date().toISOString() })
    .in('id', ids);

  if (updateErr) {
    return { codes: [], error: `Erro ao marcar codigos como usados: ${updateErr.message}` };
  }

  return { codes: toClaimRows.map(r => r.code), error: null };
}

export default function GenerateTicketsForm({ onSuccess }: GenerateTicketsFormProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ count: number; codes: string[]; validade: string; emailSent: boolean; emailError?: string } | null>(null);
  const [formData, setFormData] = useState<FormData>({
    quantidade: 1,
    solicitante: '',
    motivo: '',
    data_validade: '',
    email_entrega: '',
  });

  const isDark = theme === 'dark';

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
      const { codes: generatedCodes, error: claimError } = await claimCodes(formData.quantidade);

      if (claimError) {
        throw new Error(claimError);
      }

      if (!generatedCodes || generatedCodes.length === 0) {
        throw new Error('Nenhum codigo disponivel no pool. Importe novos codigos primeiro.');
      }

      const insertData = {
        code: generatedCodes[0],
        created_by: user?.id,
        solicitante: formData.solicitante,
        motivo: formData.motivo,
        data_validade: formData.data_validade || null,
        email_entrega: formData.email_entrega,
        numero_ingressos: formData.quantidade,
        status: 'ativo',
        codigo_inicial: generatedCodes[0],
        codigos: generatedCodes,
      };

      const { error: insertError } = await supabase.from('cortesias').insert(insertData);
      if (insertError) {
        throw new Error(insertError.message);
      }

      let emailSent = false;
      let emailError: string | undefined;

      try {
        const { data: session } = await supabase.auth.getSession();
        const token = session?.session?.access_token;

        const emailRes = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-cortesia-email`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              to: formData.email_entrega,
              solicitante: formData.solicitante,
              motivo: formData.motivo,
              cortesias: generatedCodes.map(codigo => ({
                codigo,
                data_validade: formData.data_validade,
              })),
            }),
          }
        );

        const emailData = await emailRes.json();
        if (emailData.success) {
          emailSent = true;
        } else {
          emailError = emailData.error || 'Falha ao enviar email';
        }
      } catch (emailErr) {
        console.error('Email error:', emailErr);
        emailError = 'Erro ao conectar com servico de email';
      }

      setSuccess({
        count: formData.quantidade,
        codes: generatedCodes,
        validade: formData.data_validade,
        emailSent,
        emailError,
      });

      setFormData({
        quantidade: 1,
        solicitante: '',
        motivo: '',
        data_validade: '',
        email_entrega: '',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('Error generating:', err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const isExpiredVoucherError = error.includes('vencidos') || error.includes('Contate o administrador');

  if (success) {
    return (
      <div className={`rounded-xl shadow-xl p-8 border ${isDark ? 'bg-[#311b3c] border-[#a700ff]/20' : 'bg-white border-gray-100'}`}>
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${isDark ? 'bg-green-900/50' : 'bg-green-100'}`}>
            <CheckCircle className={isDark ? 'text-green-400' : 'text-green-600'} size={36} />
          </div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {success.count} cortesia{success.count > 1 ? 's' : ''} gerada{success.count > 1 ? 's' : ''}!
          </h2>
          <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Os codigos foram criados com sucesso</p>

          {success.emailSent && (
            <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-50 text-green-700'}`}>
              <Mail size={16} />
              Email enviado com sucesso!
            </div>
          )}

          {success.emailError && (
            <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${isDark ? 'bg-orange-900/50 text-orange-400' : 'bg-orange-50 text-orange-700'}`}>
              <AlertCircle size={16} />
              {success.emailError}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {success.codes.slice(0, 3).map(code => (
            <TicketArt key={code} codigo={code} data_validade={success.validade} />
          ))}
        </div>

        {success.codes.length > 3 && (
          <div className={`rounded-xl p-4 border mb-6 ${isDark ? 'bg-[#330054]/50 border-[#a700ff]/20' : 'bg-gray-50 border-gray-200'}`}>
            <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              +{success.codes.length - 3} codigos adicionais
            </p>
            <div className="flex flex-wrap gap-2">
              {success.codes.slice(3).map(code => (
                <span
                  key={code}
                  className={`border rounded-lg px-3 py-1.5 font-mono text-sm font-bold ${isDark ? 'bg-[#311b3c] border-[#a700ff]/30 text-[#ea0cac]' : 'bg-white border-gray-200 text-[#a700ff]'}`}
                >
                  {code}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={() => { setSuccess(null); onSuccess(); }}
            className={`flex-1 py-3 px-4 rounded-lg transition-colors font-semibold ${isDark ? 'bg-[#330054] hover:bg-[#a700ff]/30 text-white' : 'bg-gray-900 hover:bg-gray-800 text-white'}`}
          >
            Ver Cortesias
          </button>
          <button
            onClick={() => setSuccess(null)}
            className="px-6 bg-gradient-to-r from-[#a700ff] to-[#ea0cac] text-white py-3 rounded-lg hover:from-[#8a00d4] hover:to-[#c00a8f] transition-colors font-semibold"
          >
            Gerar Mais
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl shadow-xl p-8 border ${isDark ? 'bg-[#311b3c] border-[#a700ff]/20' : 'bg-white border-gray-100'}`}>
      <div className="flex items-center gap-3 mb-8">
        <div className={`p-2.5 rounded-xl ${isDark ? 'bg-[#a700ff]/20' : 'bg-[#a700ff]/10'}`}>
          <Sparkles className="text-[#a700ff]" size={24} />
        </div>
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Nova Cortesia</h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Preencha os dados para gerar as cortesias</p>
        </div>
      </div>

      {error && (
        <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 ${
          isExpiredVoucherError
            ? isDark ? 'bg-orange-900/30 border-orange-500/30' : 'bg-orange-50 border-orange-300'
            : isDark ? 'bg-red-900/30 border-red-500/30' : 'bg-red-50 border-red-300'
        }`}>
          {isExpiredVoucherError ? (
            <ShieldAlert size={20} className={isDark ? 'text-orange-400 mt-0.5 shrink-0' : 'text-orange-600 mt-0.5 shrink-0'} />
          ) : (
            <AlertCircle size={20} className={isDark ? 'text-red-400 mt-0.5 shrink-0' : 'text-red-600 mt-0.5 shrink-0'} />
          )}
          <div>
            <p className={`text-sm font-semibold ${
              isExpiredVoucherError
                ? isDark ? 'text-orange-400' : 'text-orange-700'
                : isDark ? 'text-red-400' : 'text-red-700'
            }`}>
              {isExpiredVoucherError ? 'Vouchers Vencidos' : 'Erro'}
            </p>
            <p className={`text-sm mt-1 ${
              isExpiredVoucherError
                ? isDark ? 'text-orange-300/80' : 'text-orange-600'
                : isDark ? 'text-red-300/80' : 'text-red-600'
            }`}>
              {error}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
              Quantidade de Cortesias <span className="text-[#ea0cac]">*</span>
            </label>
            <input
              type="number"
              name="quantidade"
              value={formData.quantidade}
              onChange={handleChange}
              min="1"
              max="200"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a700ff] focus:border-transparent transition-all ${isDark ? 'bg-[#330054] border-[#a700ff]/30 text-white placeholder-gray-500' : 'border-gray-300 text-gray-900'}`}
              required
            />
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Maximo 200 por vez</p>
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
              Solicitante <span className="text-[#ea0cac]">*</span>
            </label>
            <input
              type="text"
              name="solicitante"
              value={formData.solicitante}
              onChange={handleChange}
              placeholder="Nome de quem esta solicitando"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a700ff] focus:border-transparent transition-all ${isDark ? 'bg-[#330054] border-[#a700ff]/30 text-white placeholder-gray-500' : 'border-gray-300 text-gray-900'}`}
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
              Validade <span className="text-[#ea0cac]">*</span>
            </label>
            <input
              type="date"
              name="data_validade"
              value={formData.data_validade}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a700ff] focus:border-transparent transition-all ${isDark ? 'bg-[#330054] border-[#a700ff]/30 text-white' : 'border-gray-300 text-gray-900'}`}
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
              Motivo das Cortesias <span className="text-[#ea0cac]">*</span>
            </label>
            <textarea
              name="motivo"
              value={formData.motivo}
              onChange={handleChange}
              rows={3}
              placeholder="Descreva o motivo das cortesias..."
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a700ff] focus:border-transparent transition-all resize-none ${isDark ? 'bg-[#330054] border-[#a700ff]/30 text-white placeholder-gray-500' : 'border-gray-300 text-gray-900'}`}
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
              <div className="flex items-center gap-2">
                <Send size={16} className="text-[#ea0cac]" />
                Email para Envio <span className="text-[#ea0cac]">*</span>
              </div>
            </label>
            <input
              type="email"
              name="email_entrega"
              value={formData.email_entrega}
              onChange={handleChange}
              placeholder="email@exemplo.com"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a700ff] focus:border-transparent transition-all ${isDark ? 'bg-[#330054] border-[#a700ff]/30 text-white placeholder-gray-500' : 'border-gray-300 text-gray-900'}`}
              required
            />
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              As cortesias com os codigos serao enviadas para este email
            </p>
          </div>

        </div>

        <div className={`border-t pt-6 flex gap-4 ${isDark ? 'border-[#a700ff]/20' : 'border-gray-100'}`}>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-[#a700ff] to-[#ea0cac] text-white py-3.5 px-4 rounded-lg hover:from-[#8a00d4] hover:to-[#c00a8f] focus:outline-none focus:ring-2 focus:ring-[#a700ff] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold flex items-center justify-center gap-2"
          >
            <Sparkles size={18} />
            {loading ? 'Gerando...' : `Gerar ${formData.quantidade > 1 ? `${formData.quantidade} Cortesias` : 'Cortesia'}`}
          </button>
          <button
            type="button"
            onClick={() => {
              setFormData({
                quantidade: 1,
                solicitante: '',
                motivo: '',
                data_validade: '',
                email_entrega: '',
              });
              setError('');
            }}
            className={`px-6 py-3.5 rounded-lg transition-colors font-semibold ${isDark ? 'bg-[#330054] hover:bg-[#a700ff]/30 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
          >
            Limpar
          </button>
        </div>
      </form>
    </div>
  );
}
