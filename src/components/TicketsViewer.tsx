import { useEffect, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useAppTheme } from '../hooks/useAppTheme';
import { useDataRefresh } from '../contexts/DataRefreshContext';
import { Trash2, ChevronDown, ChevronUp, Calendar, FileDown, AlertCircle, Loader2 } from 'lucide-react';
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
  ativo:    { label: 'Ativo',     darkCls: 'bg-green-900/50 text-green-400',  lightCls: 'bg-green-100 text-green-700' },
  usado:    { label: 'Usado',     darkCls: 'bg-gray-700 text-gray-400',        lightCls: 'bg-gray-100 text-gray-500' },
  cancelado:{ label: 'Cancelado', darkCls: 'bg-red-900/50 text-red-400',       lightCls: 'bg-red-100 text-red-600' },
};

export default function TicketsViewer() {
  const { user, isAdmin } = useAuth();
  const { db, tables } = useApp();
  const { isDark, isEmpresa, cardBg, activeNavBtn, labels } = useAppTheme();
  const { refreshKey, refresh } = useDataRefresh();

  const [records, setRecords] = useState<CortesiaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'todos' | 'ativo' | 'cancelado'>('todos');
  const [downloadingBatch, setDownloadingBatch] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [deleteOneConfirm, setDeleteOneConfirm] = useState<CortesiaRecord | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<CortesiaRecord | null>(null);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchData(); }, [user, isAdmin, tables.tickets, refreshKey]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = db.from(tables.tickets).select('*').order('created_at', { ascending: false });
      if (!isAdmin) query = query.eq('created_by', user?.id);
      const { data, error } = await query;
      if (error) throw error;
      setRecords(data || []);
    } catch (err) {
      console.error('Error fetching:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cancela lote: muda status para "cancelado", códigos vão para pool cancelados
  const cancelBatch = async (record: CortesiaRecord) => {
    setUpdatingId(record.id);
    setUpdateError(null);
    try {
      if (record.codigos?.length) {
        await db
          .from(tables.importedCodes)
          .update({ cancelled: true, used: false, used_by: null, used_at: null })
          .in('code', record.codigos);
      }
      const { error } = await db.from(tables.tickets).update({ status: 'cancelado' }).eq('id', record.id);
      if (error) { setUpdateError('Erro ao cancelar lote.'); return; }
      setRecords(prev => prev.map(c => c.id === record.id ? { ...c, status: 'cancelado' } : c));
      refresh();
    } catch { setUpdateError('Erro ao cancelar lote.'); }
    finally { setUpdatingId(null); }
  };

  // Reativa lote cancelado: volta a "ativo", códigos voltam para usados
  const reactivateBatch = async (record: CortesiaRecord) => {
    setUpdatingId(record.id);
    setUpdateError(null);
    try {
      if (record.codigos?.length) {
        await db
          .from(tables.importedCodes)
          .update({ cancelled: false, used: true })
          .in('code', record.codigos);
      }
      const { error } = await db.from(tables.tickets).update({ status: 'ativo' }).eq('id', record.id);
      if (error) { setUpdateError('Erro ao reativar lote.'); return; }
      setRecords(prev => prev.map(c => c.id === record.id ? { ...c, status: 'ativo' } : c));
      refresh();
    } catch { setUpdateError('Erro ao reativar lote.'); }
    finally { setUpdatingId(null); }
  };

  // Exclui lote: se ativo → códigos voltam disponíveis; se cancelado → codes já estão no pool cancelados
  const deleteRecord = async () => {
    if (!deleteOneConfirm) return;
    setDeleting(true);
    if (deleteOneConfirm.status !== 'cancelado' && deleteOneConfirm.codigos?.length) {
      await db
        .from(tables.importedCodes)
        .update({ used: false, used_by: null, used_at: null, cancelled: false })
        .in('code', deleteOneConfirm.codigos);
    }
    const { error } = await db.from(tables.tickets).delete().eq('id', deleteOneConfirm.id);
    if (!error) {
      setRecords(prev => prev.filter(c => c.id !== deleteOneConfirm.id));
      refresh();
    }
    setDeleting(false);
    setDeleteOneConfirm(null);
  };

  const deleteAll = async () => {
    setDeleting(true);
    const ids = filtered.map(r => r.id);
    if (ids.length > 0) {
      // Apenas lotes ativos devolvem os códigos como disponíveis
      const activeCodes = filtered.filter(r => r.status !== 'cancelado').flatMap(r => r.codigos || []);
      if (activeCodes.length > 0) {
        await db
          .from(tables.importedCodes)
          .update({ used: false, used_by: null, used_at: null, cancelled: false })
          .in('code', activeCodes);
      }
      await db.from(tables.tickets).delete().in('id', ids);
      setRecords(prev => prev.filter(r => !ids.includes(r.id)));
      refresh();
    }
    setDeleting(false);
    setDeleteAllConfirm(false);
    setExpandedId(null);
  };

  const handleDownloadAll = async (record: CortesiaRecord) => {
    setDownloadingBatch(record.id);
    try { await generateBatchPDF(record.codigos, record.data_validade, record.solicitante, isEmpresa); }
    finally { setDownloadingBatch(null); }
  };

  const filtered = filter === 'todos' ? records : records.filter(c => c.status === filter);
  const totalCodigos = (list: CortesiaRecord[]) => list.reduce((acc, c) => acc + (c.codigos?.length || 0), 0);
  const counts = {
    todos: totalCodigos(records),
    ativo: totalCodigos(records.filter(c => c.status === 'ativo')),
    cancelado: totalCodigos(records.filter(c => c.status === 'cancelado')),
  };

  const inactiveFilter = isDark || isEmpresa
    ? `bg-white/5 text-gray-400 border ${isEmpresa ? 'border-[#f59e0b]/20 hover:bg-[#f59e0b]/10' : 'border-[#a700ff]/20 hover:bg-white/10'}`
    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50';

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <p className={isDark || isEmpresa ? 'text-gray-500' : 'text-gray-400'}>Carregando {labels.tickets.toLowerCase()}...</p>
      </div>
    );
  }

  const modalBg = isDark
    ? (isEmpresa ? 'bg-[#0f1f33] border-[#f59e0b]/20' : 'bg-[#311b3c] border-[#a700ff]/20')
    : 'bg-white border-gray-200';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {(['todos', 'ativo', 'cancelado'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${filter === f ? activeNavBtn : inactiveFilter}`}
            >
              {f === 'todos' ? 'Todos' : STATUS_LABELS[f].label}
              <span className="ml-1.5 text-xs opacity-60">({counts[f]})</span>
            </button>
          ))}
        </div>
        {isAdmin && filtered.length > 0 && (
          <button
            onClick={() => setDeleteAllConfirm(true)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
              isDark
                ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-500/20'
                : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
            }`}
          >
            <Trash2 size={14} />
            Excluir {filter === 'todos' ? 'todos' : `todos os ${STATUS_LABELS[filter].label.toLowerCase()}s`}
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className={`rounded-xl p-16 text-center border ${cardBg}`}>
          <p className={isDark || isEmpresa ? 'text-gray-500' : 'text-gray-400'}>{labels.emptyMsg}</p>
        </div>
      ) : (
        filtered.map(record => {
          const isExpanded = expandedId === record.id;
          const codes = record.codigos || [];
          const statusStyle = STATUS_LABELS[record.status];
          const countBg = isEmpresa
            ? 'bg-gradient-to-br from-[#d97706] to-[#0284c7]'
            : 'bg-gradient-to-br from-[#a700ff] to-[#ea0cac]';
          const hoverBg = isDark || isEmpresa ? 'hover:bg-white/5' : 'hover:bg-gray-50';
          const borderColor = isDark || isEmpresa
            ? (isEmpresa ? 'border-[#f59e0b]/20' : 'border-[#a700ff]/20')
            : 'border-gray-100';

          return (
            <div key={record.id} className={`rounded-xl border shadow-sm overflow-hidden ${cardBg}`}>
              <button
                className={`w-full p-5 flex items-center justify-between transition-colors text-left ${hoverBg}`}
                onClick={() => setExpandedId(isExpanded ? null : record.id)}
              >
                <div className="flex items-start gap-4">
                  <div className={`rounded-xl px-3 py-2 text-center min-w-[52px] ${countBg} text-white`}>
                    <p className="text-xl font-black leading-none">{codes.length}</p>
                    <p className="text-xs text-white/70">{isEmpresa ? 'ing.' : 'cort.'}</p>
                  </div>
                  <div>
                    <p className={`font-bold ${isDark || isEmpresa ? 'text-white' : 'text-gray-900'}`}>{record.solicitante}</p>
                    <p className={`text-sm line-clamp-1 ${isDark || isEmpresa ? 'text-gray-400' : 'text-gray-500'}`}>{record.motivo}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5">
                      {record.data_validade && (
                        <span className={`flex items-center gap-1 text-xs ${isDark || isEmpresa ? 'text-gray-500' : 'text-gray-400'}`}>
                          <Calendar size={11} /> {new Date(record.data_validade + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${statusStyle ? (isDark || isEmpresa ? statusStyle.darkCls : statusStyle.lightCls) : (isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500')}`}>
                    {statusStyle?.label || record.status}
                  </span>
                  {isExpanded ? <ChevronUp size={18} className={isDark || isEmpresa ? 'text-gray-500' : 'text-gray-400'} /> : <ChevronDown size={18} className={isDark || isEmpresa ? 'text-gray-500' : 'text-gray-400'} />}
                </div>
              </button>

              {isExpanded && (
                <div className={`border-t p-5 ${borderColor}`}>
                  {updateError && (
                    <div className={`mb-4 p-3 border-l-4 border-red-500 rounded flex items-center gap-2 ${isDark || isEmpresa ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'}`}>
                      <AlertCircle size={16} />
                      <p className="text-sm">{updateError}</p>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                    <div className="flex flex-wrap gap-2">
                      {record.status === 'ativo' && (
                        <button onClick={() => setCancelConfirm(record)} disabled={updatingId === record.id}
                          className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors disabled:opacity-50 ${isDark || isEmpresa ? 'bg-orange-900/30 hover:bg-orange-900/50 text-orange-400' : 'bg-orange-50 hover:bg-orange-100 text-orange-600'}`}>
                          {updatingId === record.id ? 'Cancelando...' : 'Cancelar Lote'}
                        </button>
                      )}
                      {record.status === 'cancelado' && (
                        <button onClick={() => reactivateBatch(record)} disabled={updatingId === record.id}
                          className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors disabled:opacity-50 ${isDark || isEmpresa ? 'bg-green-900/50 hover:bg-green-900/70 text-green-400' : 'bg-green-100 hover:bg-green-200 text-green-700'}`}>
                          {updatingId === record.id ? 'Reativando...' : 'Reativar Lote'}
                        </button>
                      )}
                      {(isAdmin || user?.id === record.created_by) && (
                        <button onClick={() => setDeleteOneConfirm(record)} disabled={updatingId === record.id}
                          className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1 disabled:opacity-50 ${isDark || isEmpresa ? 'bg-red-900/30 hover:bg-red-900/50 text-red-400' : 'bg-red-50 hover:bg-red-100 text-red-600'}`}>
                          <Trash2 size={12} /> Excluir
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => handleDownloadAll(record)}
                      disabled={downloadingBatch === record.id}
                      className={`text-sm px-4 py-2 ${countBg} hover:opacity-90 text-white rounded-lg font-semibold transition-opacity flex items-center gap-2 disabled:opacity-50`}
                    >
                      <FileDown size={16} />
                      {downloadingBatch === record.id ? 'Gerando...' : `Baixar Todos (${codes.length} PDF)`}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {codes.map(code => (
                      <TicketArt key={code} codigo={code} data_validade={record.data_validade} showDownload={true} />
                    ))}
                  </div>
                  <p className={`text-xs mt-5 ${isDark || isEmpresa ? 'text-gray-500' : 'text-gray-400'}`}>
                    Gerado em {new Date(record.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )}
            </div>
          );
        })
      )}
      {/* Modal — excluir um lote */}
      {deleteOneConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-2xl p-6 border shadow-2xl ${modalBg}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-red-500/20">
                <Trash2 size={20} className="text-red-400" />
              </div>
              <h3 className={`font-bold text-lg ${isDark || isEmpresa ? 'text-white' : 'text-gray-900'}`}>Excluir lote?</h3>
            </div>
            <p className={`text-sm mb-1 ${isDark || isEmpresa ? 'text-gray-300' : 'text-gray-700'}`}>
              <strong>{deleteOneConfirm.solicitante}</strong> — {deleteOneConfirm.codigos?.length || 0} {labels.tickets.toLowerCase()}
            </p>
            <p className={`text-xs mb-6 ${isDark || isEmpresa ? 'text-gray-500' : 'text-gray-400'}`}>
              {deleteOneConfirm.status === 'cancelado'
                ? 'O lote será removido. Os códigos permanecem na aba de cancelados dos vouchers.'
                : `Os ${deleteOneConfirm.codigos?.length || 0} códigos voltarão para disponíveis no pool de vouchers.`}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteOneConfirm(null)} disabled={deleting}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 ${isDark || isEmpresa ? 'bg-white/10 hover:bg-white/20 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                Cancelar
              </button>
              <button onClick={deleteRecord} disabled={deleting}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2 disabled:opacity-50">
                {deleting ? <><Loader2 size={15} className="animate-spin" /> Excluindo...</> : <><Trash2 size={15} /> Excluir</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — cancelar lote (devolve códigos ao pool e remove registro) */}
      {cancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-2xl p-6 border shadow-2xl ${modalBg}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-orange-500/20">
                <AlertCircle size={20} className="text-orange-400" />
              </div>
              <h3 className={`font-bold text-lg ${isDark || isEmpresa ? 'text-white' : 'text-gray-900'}`}>Cancelar lote?</h3>
            </div>
            <p className={`text-sm mb-1 ${isDark || isEmpresa ? 'text-gray-300' : 'text-gray-700'}`}>
              <strong>{cancelConfirm.solicitante}</strong> — {cancelConfirm.codigos?.length || 0} {labels.tickets.toLowerCase()}
            </p>
            <p className={`text-xs mb-6 ${isDark || isEmpresa ? 'text-gray-500' : 'text-gray-400'}`}>
              O lote vai para a aba "Cancelados". Os {cancelConfirm.codigos?.length || 0} código{(cancelConfirm.codigos?.length || 0) !== 1 ? 's' : ''} ficam disponíveis para reativação ou exclusão nos vouchers.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setCancelConfirm(null)} disabled={updatingId === cancelConfirm.id}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 ${isDark || isEmpresa ? 'bg-white/10 hover:bg-white/20 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                Voltar
              </button>
              <button onClick={() => { const r = cancelConfirm; setCancelConfirm(null); cancelBatch(r); }} disabled={updatingId === cancelConfirm.id}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center gap-2 disabled:opacity-50">
                {updatingId === cancelConfirm.id ? <><Loader2 size={15} className="animate-spin" /> Cancelando...</> : 'Confirmar cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — excluir todos da view atual */}
      {deleteAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-2xl p-6 border shadow-2xl ${modalBg}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-red-500/20">
                <Trash2 size={20} className="text-red-400" />
              </div>
              <h3 className={`font-bold text-lg ${isDark || isEmpresa ? 'text-white' : 'text-gray-900'}`}>Excluir todos?</h3>
            </div>
            <p className={`text-sm mb-1 ${isDark || isEmpresa ? 'text-gray-300' : 'text-gray-700'}`}>
              Serão excluídos <strong className="text-red-400">{filtered.length} lote{filtered.length !== 1 ? 's' : ''}</strong> com <strong className="text-red-400">{totalCodigos(filtered)} {labels.tickets.toLowerCase()}</strong> no total.
            </p>
            <p className={`text-xs mb-6 ${isDark || isEmpresa ? 'text-gray-500' : 'text-gray-400'}`}>Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteAllConfirm(false)} disabled={deleting}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 ${isDark || isEmpresa ? 'bg-white/10 hover:bg-white/20 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                Cancelar
              </button>
              <button onClick={deleteAll} disabled={deleting}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2 disabled:opacity-50">
                {deleting ? <><Loader2 size={15} className="animate-spin" /> Excluindo...</> : <><Trash2 size={15} /> Excluir tudo</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
