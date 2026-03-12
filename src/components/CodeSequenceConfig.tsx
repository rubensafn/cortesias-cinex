import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Hash, Save, RotateCcw } from 'lucide-react';

interface Sequence {
  id: string;
  prefix: string;
  current_number: number;
}

const UNIT_NAMES: Record<string, string> = {
  CINEXGYN: 'Goiania',
  CINEXPWM: 'Palmas',
  CINEXGUR: 'Gurupi',
  CINEXSLZ: 'Sao Luis',
  CINEXAUX: 'Araguaina',
};

export default function CodeSequenceConfig() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const isDark = theme === 'dark';

  useEffect(() => {
    fetchSequences();
  }, []);

  const fetchSequences = async () => {
    try {
      const { data, error } = await supabase
        .from('code_sequences')
        .select('id, prefix, current_number, pad_length')
        .order('prefix');

      if (error) {
        console.error('Erro ao carregar sequências:', error);
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        setSequences(data);
        const vals: Record<string, string> = {};
        data.forEach(s => {
          vals[s.id] = s.current_number.toString();
        });
        setEditValues(vals);
        setSelectedId(data[0].id);
      }
    } catch (err) {
      console.error('Erro inesperado:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (seq: Sequence) => {
    setSaving(seq.id);
    const newNum = parseInt(editValues[seq.id]) || 0;

    const { error } = await supabase
      .from('code_sequences')
      .update({
        current_number: newNum,
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', seq.id);

    if (!error) {
      setSequences(prev => prev.map(s => s.id === seq.id ? { ...s, current_number: newNum } : s));
    }
    setSaving(null);
  };

  const resetToZero = async (seq: Sequence) => {
    if (!confirm(`Resetar ${seq.prefix} para 0? O proximo codigo sera ${seq.prefix}0001`)) return;
    setEditValues(prev => ({ ...prev, [seq.id]: '0' }));
    setSaving(seq.id);

    const { error } = await supabase
      .from('code_sequences')
      .update({
        current_number: 0,
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', seq.id);

    if (!error) {
      setSequences(prev => prev.map(s => s.id === seq.id ? { ...s, current_number: 0 } : s));
    }
    setSaving(null);
  };

  if (loading) {
    return <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className={`rounded-xl shadow-md p-6 border ${isDark ? 'bg-[#311b3c] border-[#a700ff]/20' : 'bg-white border-gray-100'}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-[#a700ff]/20">
            <Hash className="text-[#a700ff]" size={22} />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Sequencia de Codigos</h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Configure o numero inicial para cada unidade</p>
          </div>
        </div>

        {sequences.length > 0 && (
          <div className="mb-8 pb-6 border-b border-[#a700ff]/20">
            <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Selecione a Unidade
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {sequences.map(seq => (
                <button
                  key={seq.id}
                  onClick={() => setSelectedId(seq.id)}
                  className={`p-3 rounded-lg border-2 text-center transition-all font-semibold ${
                    selectedId === seq.id
                      ? isDark
                        ? 'border-[#a700ff] bg-[#a700ff]/20 text-[#a700ff]'
                        : 'border-[#a700ff] bg-[#a700ff]/10 text-[#a700ff]'
                      : isDark
                        ? 'border-[#a700ff]/30 bg-[#330054]/30 text-gray-400 hover:border-[#a700ff]/60'
                        : 'border-gray-300 bg-gray-50 text-gray-600 hover:border-[#a700ff]'
                  }`}
                >
                  <div className="text-xs opacity-75">{UNIT_NAMES[seq.prefix] || seq.prefix}</div>
                  <div className="text-sm font-mono">{seq.prefix}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedId && sequences.map(seq => {
          if (seq.id !== selectedId) return null;
          const nextCode = `${seq.prefix}${String((parseInt(editValues[seq.id]) || 0) + 1).padStart(4, '0')}`;
          const hasChanges = parseInt(editValues[seq.id]) !== seq.current_number;

          return (
            <div
              key={seq.id}
              className={`flex flex-col gap-6 p-6 rounded-xl border ${
                isDark
                  ? 'bg-[#a700ff]/10 border-[#a700ff]/40'
                  : 'bg-[#a700ff]/5 border-[#a700ff]/30'
              }`}
            >
              <div>
                <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {UNIT_NAMES[seq.prefix] || seq.prefix}
                </h4>
                <p className={`text-sm font-mono ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{seq.prefix}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className={`text-sm block mb-3 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Número Atual
                    {hasChanges && <span className="text-[#a700ff] ml-1">*</span>}
                  </label>
                  <input
                    type="number"
                    value={editValues[seq.id] || '0'}
                    onChange={e => setEditValues(prev => ({ ...prev, [seq.id]: e.target.value }))}
                    min="0"
                    className={`w-full px-4 py-3 border-2 rounded-lg text-center font-mono text-lg focus:outline-none focus:ring-2 focus:ring-[#a700ff] transition-colors ${
                      hasChanges
                        ? isDark
                          ? 'border-[#a700ff] bg-[#a700ff]/20 text-white'
                          : 'border-[#a700ff] bg-[#a700ff]/10 text-gray-900'
                        : isDark
                          ? 'border-[#a700ff]/30 bg-[#311b3c] text-white'
                          : 'border-gray-300 bg-gray-50 text-gray-900'
                    }`}
                    placeholder="0"
                  />
                  <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                    Ultimo código gerado para esta unidade
                  </p>
                </div>

                <div>
                  <label className={`text-sm block mb-3 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Próximo Código
                  </label>
                  <div className="px-4 py-3 rounded-lg font-mono font-bold text-lg bg-gradient-to-r from-[#a700ff] to-[#ea0cac] text-white text-center shadow-md">
                    {nextCode}
                  </div>
                  <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                    Será o próximo código a ser gerado
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleSave(seq)}
                  disabled={!hasChanges || saving === seq.id}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    hasChanges
                      ? 'bg-gradient-to-r from-[#a700ff] to-[#ea0cac] text-white hover:from-[#8a00d4] hover:to-[#c00a8f] shadow-md'
                      : isDark
                        ? 'bg-[#330054] text-gray-500 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Save size={16} />
                  {saving === seq.id ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  onClick={() => resetToZero(seq)}
                  disabled={saving === seq.id}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors ${isDark ? 'bg-[#330054] text-gray-300 hover:bg-[#a700ff]/30' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                  title="Resetar para 0"
                >
                  <RotateCcw size={16} />
                  Reset para 0
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className={`border rounded-xl p-4 text-sm ${isDark ? 'bg-[#ea0cac]/10 border-[#ea0cac]/30 text-[#ea0cac]' : 'bg-[#ea0cac]/5 border-[#ea0cac]/20 text-[#330054]'}`}>
        <p className="font-semibold mb-1">Como funciona:</p>
        <ul className={`list-disc list-inside space-y-1 ${isDark ? 'text-[#ea0cac]/80' : 'text-[#330054]/80'}`}>
          <li>O "numero atual" indica o ultimo codigo gerado para cada unidade</li>
          <li>Ao gerar cortesias, o sistema incrementa automaticamente a partir desse numero</li>
          <li>Para iniciar uma nova sequencia (ex: novo mes), basta ajustar o numero</li>
        </ul>
      </div>
    </div>
  );
}
