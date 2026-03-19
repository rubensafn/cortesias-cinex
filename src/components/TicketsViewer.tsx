import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Trash2, ChevronDown, ChevronUp, Calendar, Mail, FileDown, AlertCircle } from 'lucide-react';
import { TicketArt, generateBatchPDF } from './TicketArt';

interface CortesiaRecord {
  id: string;
  solicitante: string;
  motivo: string;
  numero_ingressos: number;
  data_validade: string | null;
  email_entrega: string;
  codigo_inicial: string;
  codigos: string[];
  status: string;
  created_by: string;
  created_at: string;
  email_enviado: boolean;
  batch_id: string | null;
}

const STATUS_LABELS: Record<string, { label: string; darkCls: string; lightCls: string }> = {
  ativo: { label: 'Ativo', darkCls: 'bg-green-900/50 text-green-400', lightCls: 'bg-green-100 text-green-700' },
  usado: { label: 'Usado', darkCls: 'bg-gray-700 text-gray-400', lightCls: 'bg-gray-100 text-gray-500' },
  cancelado: { label: 'Cancelado', darkCls: 'bg-red-900/50 text-red-400', lightCls: 'bg-red-100 text-red-600' },
};

export default function TicketsViewer() {
  const { user, isAdmin } = useAuth();
  const { theme } = useTheme();
  const [cortesias, setCortesias] = useState<CortesiaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'todos' | 'ativo' | 'usado' | 'cancelado'>('todos');
  const [downloadingBatch, setDownloadingBatch] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const isDark = theme === 'dark';

  useEffect(() => {
    fetchData();
  }, [user, isAdmin]);

  const fetchData = async () => {
    try {
      let query = supabase.from('cortesias').select('*').order('created_at', { ascending: false });
      if (!isAdmin) query = query.eq('created_by', user?.id);
      const { data, error } = await query;
      if (error) throw error;
      setCortesias(data || []);
    } catch (err) {
      console.error('Error fetching:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    setUpdateError(null);
    try {
      const { error } = await supabase.from('cortesias').update({ status }).eq('id', id);
      if (error) {
        setUpdateError('Erro ao atualizar status. Tente novamente.');
        console.error('Update error:', error);
      } else {
        setCortesias(prev => prev.map(c => c.id === id ? { ...c, status } : c));
      }
    } catch (err) {
      setUpdateError('Erro ao atualizar status. Tente novamente.');
      console.error('Update error:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteCortesia = async (id: string) => {
    if (!confirm('Excluir este lote de cortesias?')) return;
    const { error } = await supabase.from('cortesias').delete().eq('id', id);
    if (!error) setCortesias(prev => prev.filter(c => c.id !== id));
  };

  const handleDownloadAll = async (record: CortesiaRecord) => {
    setDownloadingBatch(record.id);
    try {
      await generateBatchPDF(record.codigos, record.data_validade, record.solicitante);
    } finally {
      setDownloadingBatch(null);
    }
  };

  const filtered = filter === 'todos'
    ? cortesias
    : cortesias.filter(c => c.status === filter);

  const totalCodigos = (list: CortesiaRecord[]) => list.reduce((acc, c) => acc + (c.codigos?.length || 0), 0);

  const counts = {
    todos: totalCodigos(cortesias),
    ativo: totalCodigos(cortesias.filter(c => c.status === 'ativo')),
    usado: totalCodigos(cortesias.filter(c => c.status === 'usado')),
    cancelado: totalCodigos(cortesias.filter(c => c.status === 'cancelado')),
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <p className={isDark ? 'text-gray-500' : 'text-gray-400'}>Carregando cortesias...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(['todos', 'ativo', 'usado', 'cancelado'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              filter === f
                ? 'bg-gradient-to-r from-[#a700ff] to-[#ea0cac] text-white'
                : isDark
                  ? 'bg-[#311b3c] text-gray-400 border border-[#a700ff]/20 hover:bg-[#330054]'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f === 'todos' ? 'Todos' : STATUS_LABELS[f].label}
            <span className="ml-1.5 text-xs opacity-60">({counts[f]})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className={`rounded-xl p-16 text-center border ${isDark ? 'bg-[#311b3c] border-[#a700ff]/20' : 'bg-white border-gray-100'}`}>
          <p className={isDark ? 'text-gray-500' : 'text-gray-400'}>Nenhuma cortesia encontrada.</p>
        </div>
      ) : (
        filtered.map(record => {
          const isExpanded = expandedId === record.id;
          const codes = record.codigos || [];
          const statusStyle = STATUS_LABELS[record.status];

          return (
            <div key={record.id} className={`rounded-xl border shadow-sm overflow-hidden ${isDark ? 'bg-[#311b3c] border-[#a700ff]/20' : 'bg-white border-gray-100'}`}>
              <button
                className={`w-full p-5 flex items-center justify-between transition-colors text-left ${isDark ? 'hover:bg-[#330054]/50' : 'hover:bg-gray-50'}`}
                onClick={() => setExpandedId(isExpanded ? null : record.id)}
              >
                <div className="flex items-start gap-4">
                  <div className="rounded-xl px-3 py-2 text-center min-w-[52px] bg-gradient-to-br from-[#a700ff] to-[#ea0cac] text-white">
                    <p className="text-xl font-black leading-none">{codes.length}</p>
                    <p className="text-xs text-white/70">cort.</p>
                  </div>
                  <div>
                    <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{record.solicitante}</p>
                    <p className={`text-sm line-clamp-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{record.motivo}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5">
                      {record.data_validade && (
                        <span className={`flex items-center gap-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          <Calendar size={11} /> {new Date(record.data_validade + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </span>
                      )}
                      {record.email_entrega && (
                        <span className={`flex items-center gap-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          <Mail size={11} /> {record.email_entrega}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${statusStyle ? (isDark ? statusStyle.darkCls : statusStyle.lightCls) : (isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500')}`}>
                    {statusStyle?.label || record.status}
                  </span>
                  {isExpanded ? <ChevronUp size={18} className={isDark ? 'text-gray-500' : 'text-gray-400'} /> : <ChevronDown size={18} className={isDark ? 'text-gray-500' : 'text-gray-400'} />}
                </div>
              </button>

              {isExpanded && (
                <div className={`border-t p-5 ${isDark ? 'border-[#a700ff]/20' : 'border-gray-100'}`}>
                  {updateError && (
                    <div className={`mb-4 p-3 border-l-4 border-red-500 rounded flex items-center gap-2 ${isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'}`}>
                      <AlertCircle size={16} />
                      <p className="text-sm">{updateError}</p>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                    <div className="flex flex-wrap gap-2">
                      {record.status === 'ativo' && (
                        <button
                          onClick={() => updateStatus(record.id, 'usado')}
                          disabled={updatingId === record.id}
                          className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'bg-[#330054] hover:bg-[#a700ff]/30 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                        >
                          {updatingId === record.id ? 'Atualizando...' : 'Marcar como Usado'}
                        </button>
                      )}
                      {record.status === 'usado' && (
                        <button
                          onClick={() => updateStatus(record.id, 'ativo')}
                          className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${isDark ? 'bg-green-900/50 hover:bg-green-900/70 text-green-400' : 'bg-green-100 hover:bg-green-200 text-green-700'}`}
                        >
                          Reativar
                        </button>
                      )}
                      {record.status !== 'cancelado' && (
                        <button
                          onClick={() => updateStatus(record.id, 'cancelado')}
                          className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${isDark ? 'bg-orange-900/30 hover:bg-orange-900/50 text-orange-400' : 'bg-orange-50 hover:bg-orange-100 text-orange-600'}`}
                        >
                          Cancelar Lote
                        </button>
                      )}
                      {(isAdmin || user?.id === record.created_by) && (
                        <button
                          onClick={() => deleteCortesia(record.id)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1 ${isDark ? 'bg-red-900/30 hover:bg-red-900/50 text-red-400' : 'bg-red-50 hover:bg-red-100 text-red-600'}`}
                        >
                          <Trash2 size={12} /> Excluir
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => handleDownloadAll(record)}
                      disabled={downloadingBatch === record.id}
                      className="text-sm px-4 py-2 bg-gradient-to-r from-[#a700ff] to-[#ea0cac] hover:from-[#8a00d4] hover:to-[#c00a8f] text-white rounded-lg font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <FileDown size={16} />
                      {downloadingBatch === record.id ? 'Gerando...' : `Baixar Todas (${codes.length} PDF)`}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {codes.map((code) => (
                      <TicketArt
                        key={code}
                        codigo={code}
                        data_validade={record.data_validade}
                        showDownload={true}
                      />
                    ))}
                  </div>

                  <p className={`text-xs mt-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Gerado em {new Date(record.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {record.email_enviado && <span className={`ml-2 ${isDark ? 'text-green-400' : 'text-green-600'}`}>| Email enviado</span>}
                  </p>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
