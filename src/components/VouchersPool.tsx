import { useEffect, useState, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useAppTheme } from '../hooks/useAppTheme';
import { useDataRefresh } from '../contexts/DataRefreshContext';
import {
  Package,
  CheckCircle2,
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Loader2,
  ArrowUpDown,
  Trash2,
  RotateCcw,
} from 'lucide-react';

interface ImportedCode {
  id: string;
  code: string;
  expiry_date: string;
  used: boolean;
  used_at: string | null;
  created_at: string;
  cancelled: boolean;
}

type Tab = 'disponiveis' | 'usados' | 'cancelados';
type SortField = 'code' | 'expiry_date' | 'created_at' | 'used_at';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 25;

export default function VouchersPool() {
  const { db, tables } = useApp();
  const { isAdmin } = useAuth();
  const { isDark, isEmpresa, activeNavBtn } = useAppTheme();
  const { refreshKey, refresh } = useDataRefresh();

  const primary = isEmpresa ? '#f59e0b' : '#a700ff';
  const secondary = isEmpresa ? '#0ea5e9' : '#ea0cac';
  const cardAccent = isEmpresa ? 'border-[#f59e0b]/20' : 'border-[#a700ff]/20';
  const cardBase = isEmpresa
    ? (isDark ? 'bg-[#0a1628]' : 'bg-white')
    : (isDark ? 'bg-[#311b3c]' : 'bg-white');
  const searchRing = isEmpresa ? 'focus:ring-[#f59e0b]' : 'focus:ring-[#a700ff]';
  const searchBg = isEmpresa
    ? (isDark ? 'bg-[#0f2035] border-[#f59e0b]/30 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400')
    : (isDark ? 'bg-[#330054] border-[#a700ff]/30 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400');
  const rowHover = isDark
    ? (isEmpresa ? 'hover:bg-[#0f2035]/80' : 'hover:bg-[#330054]/50')
    : 'hover:bg-gray-50';
  const rowBorder = isDark
    ? (isEmpresa ? 'border-[#f59e0b]/10' : 'border-[#a700ff]/10')
    : 'border-gray-50';
  const tableHeaderBorder = isDark
    ? (isEmpresa ? 'border-[#f59e0b]/10' : 'border-[#a700ff]/10')
    : 'border-gray-100';
  const paginationBorder = tableHeaderBorder;
  const modalBg = isDark
    ? (isEmpresa ? 'bg-[#0f1f33] border-[#f59e0b]/20' : 'bg-[#311b3c] border-[#a700ff]/20')
    : 'bg-white border-gray-200';

  const [tab, setTab] = useState<Tab>('disponiveis');
  const [vouchers, setVouchers] = useState<ImportedCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [sortField, setSortField] = useState<SortField>('expiry_date');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [counts, setCounts] = useState({ disponiveis: 0, usados: 0, vencidos: 0, cancelados: 0 });
  const [reactivating, setReactivating] = useState<string | null>(null);

  // Selection & deletion state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<'selected' | 'all' | null>(null);
  const [showReactivateAllConfirm, setShowReactivateAllConfirm] = useState(false);
  const [reactivatingAll, setReactivatingAll] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchCounts = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];

    const [availRes, usedRes, expiredRes, cancelledRes] = await Promise.all([
      db.from(tables.importedCodes).select('id', { count: 'exact', head: true }).eq('used', false).eq('cancelled', false).gte('expiry_date', today),
      db.from(tables.importedCodes).select('id', { count: 'exact', head: true }).eq('used', true).eq('cancelled', false),
      db.from(tables.importedCodes).select('id', { count: 'exact', head: true }).eq('used', false).eq('cancelled', false).lt('expiry_date', today),
      db.from(tables.importedCodes).select('id', { count: 'exact', head: true }).eq('cancelled', true),
    ]);

    setCounts({
      disponiveis: availRes.count ?? 0,
      usados: usedRes.count ?? 0,
      vencidos: expiredRes.count ?? 0,
      cancelados: cancelledRes.count ?? 0,
    });
  }, [db, tables.importedCodes]);

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];

    let query = db
      .from(tables.importedCodes)
      .select('id, code, expiry_date, used, used_at, created_at, cancelled', { count: 'exact' });

    if (tab === 'cancelados') {
      query = query.eq('cancelled', true);
    } else if (tab === 'disponiveis') {
      query = query.eq('used', false).eq('cancelled', false).gte('expiry_date', today);
    } else {
      query = query.eq('used', true).eq('cancelled', false);
    }

    if (search.trim()) {
      query = query.ilike('code', `%${search.trim()}%`);
    }

    const ascending = sortDir === 'asc';
    query = query.order(sortField, { ascending });

    const from = page * PAGE_SIZE;
    query = query.range(from, from + PAGE_SIZE - 1);

    const { data, count, error } = await query;
    setVouchers(error ? [] : (data || []));
    setTotalCount(error ? 0 : (count ?? 0));
    setLoading(false);
  }, [db, tables.importedCodes, tab, search, page, sortField, sortDir]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts, refreshKey]);

  useEffect(() => {
    setPage(0);
    setSelectedIds(new Set());
  }, [tab, search, sortField, sortDir]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [page]);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers, refreshKey]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const formatDateBR = (d: string) => {
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  const formatDateTimeBR = (d: string) => {
    return new Date(d).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isExpiringSoon = (dateStr: string) => {
    const expiry = new Date(dateStr + 'T23:59:59');
    const now = new Date();
    const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 30 && diffDays >= 0;
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'code' ? 'asc' : 'desc');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === vouchers.length && vouchers.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(vouchers.map(v => v.id)));
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    setDeleting(true);
    const { error } = await db
      .from(tables.importedCodes)
      .delete()
      .in('id', Array.from(selectedIds));
    if (!error) {
      setSelectedIds(new Set());
      await fetchVouchers();
      await fetchCounts();
      refresh();
    }
    setDeleting(false);
    setShowDeleteConfirm(null);
  };

  const reactivateCode = async (id: string, code: string) => {
    setReactivating(id);
    // Reativa o código como disponível
    await db.from(tables.importedCodes).update({ cancelled: false, used: false }).eq('id', id);
    // Deleta lotes cancelados que contenham este código (e todos os outros códigos do lote voltam disponíveis)
    const { data: matchingBatches } = await db
      .from(tables.tickets)
      .select('id, codigos')
      .eq('status', 'cancelado')
      .contains('codigos', [code]);
    if (matchingBatches?.length) {
      // Reativa todos os outros códigos do lote também
      const otherCodes = matchingBatches.flatMap((b: { codigos: string[] }) => b.codigos).filter((c: string) => c !== code);
      if (otherCodes.length > 0) {
        await db.from(tables.importedCodes).update({ cancelled: false, used: false }).in('code', otherCodes);
      }
      await db.from(tables.tickets).delete().in('id', matchingBatches.map((b: { id: string }) => b.id));
    }
    setReactivating(null);
    await fetchVouchers();
    await fetchCounts();
    refresh();
  };

  const reactivateSelected = async () => {
    if (selectedIds.size === 0) return;
    setReactivatingAll(true);
    const ids = Array.from(selectedIds);
    const selectedVouchers = vouchers.filter(v => ids.includes(v.id));
    const codes = selectedVouchers.map(v => v.code);
    // Reativa os códigos selecionados
    await db.from(tables.importedCodes).update({ cancelled: false, used: false }).in('id', ids);
    // Deleta lotes cancelados que contenham algum dos códigos selecionados
    if (codes.length > 0) {
      for (const code of codes) {
        const { data: batches } = await db
          .from(tables.tickets)
          .select('id, codigos')
          .eq('status', 'cancelado')
          .contains('codigos', [code]);
        if (batches?.length) {
          const otherCodes = batches.flatMap((b: { codigos: string[] }) => b.codigos).filter((c: string) => !codes.includes(c));
          if (otherCodes.length > 0) {
            await db.from(tables.importedCodes).update({ cancelled: false, used: false }).in('code', otherCodes);
          }
          await db.from(tables.tickets).delete().in('id', batches.map((b: { id: string }) => b.id));
        }
      }
    }
    setSelectedIds(new Set());
    setReactivatingAll(false);
    await fetchVouchers();
    await fetchCounts();
    refresh();
  };

  const reactivateAll = async () => {
    setReactivatingAll(true);
    // Reativa todos os códigos cancelados
    await db.from(tables.importedCodes).update({ cancelled: false, used: false }).eq('cancelled', true);
    // Deleta todos os lotes cancelados
    await db.from(tables.tickets).delete().eq('status', 'cancelado');
    setReactivatingAll(false);
    setShowReactivateAllConfirm(false);
    await fetchVouchers();
    await fetchCounts();
    refresh();
  };

  const deleteAll = async () => {
    setDeleting(true);
    const today = new Date().toISOString().split('T')[0];
    if (tab === 'cancelados') {
      // Deleta também os lotes cancelados associados
      await db.from(tables.tickets).delete().eq('status', 'cancelado');
      await db.from(tables.importedCodes).delete().eq('cancelled', true);
    } else if (tab === 'disponiveis') {
      await db.from(tables.importedCodes).delete().eq('used', false).eq('cancelled', false).gte('expiry_date', today);
    } else {
      await db.from(tables.importedCodes).delete().eq('used', true).eq('cancelled', false);
    }
    setSelectedIds(new Set());
    await fetchVouchers();
    await fetchCounts();
    refresh();
    setDeleting(false);
    setShowDeleteConfirm(null);
  };

  const allOnPageSelected = vouchers.length > 0 && vouchers.every(v => selectedIds.has(v.id));
  const someSelected = selectedIds.size > 0;
  const deleteAllCount = tab === 'cancelados' ? counts.cancelados : tab === 'disponiveis' ? counts.disponiveis : counts.usados;

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => toggleSort(field)}
      className={`flex items-center gap-1 text-xs font-bold uppercase tracking-wider transition-colors`}
      style={{ color: sortField === field ? (isDark ? secondary : primary) : undefined }}
    >
      <span className={sortField === field ? '' : isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}>
        {label}
      </span>
      <ArrowUpDown size={12} className={sortField === field ? 'opacity-100' : 'opacity-40'} />
    </button>
  );

  const checkboxStyle = `w-4 h-4 rounded border-2 cursor-pointer transition-all ${
    isDark
      ? 'border-gray-600 bg-transparent checked:border-transparent'
      : 'border-gray-300 bg-white checked:border-transparent'
  }`;

  return (
    <div className="space-y-5">
      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className={`rounded-xl p-4 border ${cardBase} ${cardAccent}`}>
          <div className={`inline-flex p-2 rounded-lg mb-2 ${isDark ? 'bg-green-900/40' : 'bg-green-50'}`}>
            <Package className={isDark ? 'text-green-400' : 'text-green-600'} size={18} />
          </div>
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{counts.disponiveis.toLocaleString()}</p>
          <p className={`text-xs font-semibold mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Disponiveis</p>
        </div>
        <div className={`rounded-xl p-4 border ${cardBase} ${cardAccent}`}>
          <div className={`inline-flex p-2 rounded-lg mb-2 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <CheckCircle2 className={isDark ? 'text-gray-400' : 'text-gray-500'} size={18} />
          </div>
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{counts.usados.toLocaleString()}</p>
          <p className={`text-xs font-semibold mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Usados</p>
        </div>
        <div className={`rounded-xl p-4 border ${cardBase} ${cardAccent}`}>
          <div className={`inline-flex p-2 rounded-lg mb-2 ${isDark ? 'bg-orange-900/40' : 'bg-orange-50'}`}>
            <AlertTriangle className={isDark ? 'text-orange-400' : 'text-orange-500'} size={18} />
          </div>
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{counts.vencidos.toLocaleString()}</p>
          <p className={`text-xs font-semibold mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Vencidos</p>
        </div>
        <div className={`rounded-xl p-4 border ${cardBase} ${cardAccent}`}>
          <div className={`inline-flex p-2 rounded-lg mb-2 ${isDark ? 'bg-red-900/40' : 'bg-red-50'}`}>
            <Trash2 className={isDark ? 'text-red-400' : 'text-red-500'} size={18} />
          </div>
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{counts.cancelados.toLocaleString()}</p>
          <p className={`text-xs font-semibold mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Cancelados</p>
        </div>
      </div>

      {/* Tabs + search + delete all */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          {([
            { id: 'disponiveis' as Tab, label: 'Disponiveis', count: counts.disponiveis },
            { id: 'usados' as Tab, label: 'Usados', count: counts.usados },
            { id: 'cancelados' as Tab, label: 'Cancelados', count: counts.cancelados },
          ]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tab === t.id ? activeNavBtn : isDark
                  ? `${cardBase} text-gray-400 border ${cardAccent} hover:opacity-80`
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {t.label}
              <span className="ml-1.5 text-xs opacity-60">({t.count.toLocaleString()})</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Buscar codigo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 ${searchRing} transition-all ${searchBg}`}
            />
          </div>

          {isAdmin && tab === 'cancelados' && counts.cancelados > 0 && (
            <button
              onClick={() => setShowReactivateAllConfirm(true)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                isDark
                  ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50 border border-green-500/20'
                  : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
              }`}
            >
              <RotateCcw size={15} />
              <span className="hidden sm:inline">Reativar todos</span>
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setShowDeleteConfirm('all')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                isDark
                  ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-500/20'
                  : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
              }`}
            >
              <Trash2 size={15} />
              <span className="hidden sm:inline">Excluir todos</span>
            </button>
          )}
        </div>
      </div>

      {/* Selection action bar */}
      {isAdmin && someSelected && (
        <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
          isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
        }`}>
          <span className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {selectedIds.size} voucher{selectedIds.size !== 1 ? 's' : ''} selecionado{selectedIds.size !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            {tab === 'cancelados' && (
              <button
                onClick={reactivateSelected}
                disabled={reactivatingAll}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${
                  isDark
                    ? 'bg-green-900/50 text-green-300 hover:bg-green-900/70 border border-green-500/30'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {reactivatingAll ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                Reativar selecionados
              </button>
            )}
            <button
              onClick={() => setShowDeleteConfirm('selected')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                isDark
                  ? 'bg-red-900/50 text-red-300 hover:bg-red-900/70 border border-red-500/30'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              <Trash2 size={14} />
              Excluir selecionados
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className={`rounded-xl border overflow-hidden ${cardBase} ${cardAccent}`}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin" size={24} style={{ color: primary }} />
          </div>
        ) : vouchers.length === 0 ? (
          <div className="text-center py-16">
            <p className={isDark ? 'text-gray-500' : 'text-gray-400'}>
              {search ? 'Nenhum voucher encontrado para essa busca.' : tab === 'cancelados' ? 'Nenhum voucher cancelado.' : `Nenhum voucher ${tab === 'disponiveis' ? 'disponivel' : 'usado'}.`}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${tableHeaderBorder}`}>
                    {isAdmin && (
                      <th className="px-4 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={allOnPageSelected}
                          onChange={toggleSelectAll}
                          className={checkboxStyle}
                          style={{
                            accentColor: primary,
                          }}
                          title="Selecionar todos desta página"
                        />
                      </th>
                    )}
                    <th className="text-left px-5 py-3">
                      <SortHeader field="code" label="Codigo" />
                    </th>
                    <th className="text-left px-5 py-3">
                      <SortHeader field="expiry_date" label="Validade" />
                    </th>
                    {tab === 'usados' ? (
                      <th className="text-left px-5 py-3">
                        <SortHeader field="used_at" label="Usado em" />
                      </th>
                    ) : (
                      <th className="text-left px-5 py-3">
                        <SortHeader field="created_at" label="Importado em" />
                      </th>
                    )}
                    <th className="text-left px-5 py-3">
                      <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        Status
                      </span>
                    </th>
                    {tab === 'cancelados' && <th className="px-5 py-3 w-32" />}
                  </tr>
                </thead>
                <tbody>
                  {vouchers.map(v => {
                    const expiring = !v.used && isExpiringSoon(v.expiry_date);
                    const isSelected = selectedIds.has(v.id);
                    return (
                      <tr
                        key={v.id}
                        className={`border-b last:border-b-0 transition-colors ${rowBorder} ${rowHover} ${
                          isSelected ? (isDark ? 'bg-red-900/10' : 'bg-red-50/60') : ''
                        }`}
                      >
                        {isAdmin && (
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(v.id)}
                              className={checkboxStyle}
                              style={{ accentColor: '#ef4444' }}
                            />
                          </td>
                        )}
                        <td className="px-5 py-3">
                          <span className="font-mono text-sm font-bold" style={{ color: isDark ? secondary : primary }}>
                            {v.code}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`flex items-center gap-1.5 text-sm ${
                            expiring
                              ? isDark ? 'text-orange-400' : 'text-orange-600'
                              : isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            <Calendar size={13} />
                            {formatDateBR(v.expiry_date)}
                            {expiring && (
                              <AlertTriangle size={13} className={isDark ? 'text-orange-400' : 'text-orange-500'} />
                            )}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {tab === 'usados' && v.used_at
                              ? formatDateTimeBR(v.used_at)
                              : formatDateTimeBR(v.created_at)}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {v.cancelled ? (
                            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                              isDark ? 'bg-red-900/40 text-red-400' : 'bg-red-50 text-red-600'
                            }`}>
                              <Trash2 size={11} />
                              Cancelado
                            </span>
                          ) : v.used ? (
                            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                              isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                            }`}>
                              <CheckCircle2 size={11} />
                              Usado
                            </span>
                          ) : expiring ? (
                            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                              isDark ? 'bg-orange-900/40 text-orange-400' : 'bg-orange-50 text-orange-600'
                            }`}>
                              <AlertTriangle size={11} />
                              Vencendo
                            </span>
                          ) : (
                            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                              isDark ? 'bg-green-900/40 text-green-400' : 'bg-green-50 text-green-700'
                            }`}>
                              <Package size={11} />
                              Disponivel
                            </span>
                          )}
                        </td>
                        {tab === 'cancelados' && (
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => reactivateCode(v.id, v.code)}
                                disabled={reactivating === v.id}
                                className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors disabled:opacity-50 ${isDark ? 'bg-green-900/50 hover:bg-green-900/70 text-green-400' : 'bg-green-100 hover:bg-green-200 text-green-700'}`}
                              >
                                {reactivating === v.id ? '...' : 'Reativar'}
                              </button>
                              <button
                                onClick={() => { setSelectedIds(new Set([v.id])); setShowDeleteConfirm('selected'); }}
                                className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors ${isDark ? 'bg-red-900/30 hover:bg-red-900/50 text-red-400' : 'bg-red-50 hover:bg-red-100 text-red-600'}`}
                              >
                                Excluir
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className={`flex items-center justify-between px-5 py-3 border-t ${paginationBorder}`}>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {totalCount.toLocaleString()} voucher{totalCount !== 1 ? 's' : ''} no total
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${
                    isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  <ChevronLeft size={16} />
                </button>
                <span className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${
                    isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Reativar todos modal */}
      {showReactivateAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-2xl p-6 border shadow-2xl ${modalBg}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-green-500/20">
                <RotateCcw size={20} className="text-green-400" />
              </div>
              <h3 className={`font-bold text-lg ${isDark || isEmpresa ? 'text-white' : 'text-gray-900'}`}>Reativar todos?</h3>
            </div>
            <p className={`text-sm mb-6 ${isDark || isEmpresa ? 'text-gray-400' : 'text-gray-600'}`}>
              Todos os <strong className={isDark ? 'text-green-400' : 'text-green-600'}>{counts.cancelados.toLocaleString()} códigos cancelados</strong> voltarão para disponíveis e os lotes cancelados serão removidos.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowReactivateAllConfirm(false)}
                disabled={reactivatingAll}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 ${isDark || isEmpresa ? 'bg-white/10 hover:bg-white/20 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
              >
                Cancelar
              </button>
              <button
                onClick={reactivateAll}
                disabled={reactivatingAll}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {reactivatingAll ? <><Loader2 size={15} className="animate-spin" /> Reativando...</> : <><RotateCcw size={15} /> Reativar todos</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-2xl p-6 border shadow-2xl ${modalBg}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-red-500/20">
                <Trash2 size={20} className="text-red-400" />
              </div>
              <h3 className={`font-bold text-lg ${isDark || isEmpresa ? 'text-white' : 'text-gray-900'}`}>
                {showDeleteConfirm === 'selected' ? 'Excluir selecionados?' : 'Excluir todos?'}
              </h3>
            </div>
            <p className={`text-sm mb-6 ${isDark || isEmpresa ? 'text-gray-400' : 'text-gray-600'}`}>
              {showDeleteConfirm === 'selected'
                ? <>Serão excluídos <strong className="text-red-400">{selectedIds.size} voucher{selectedIds.size !== 1 ? 's' : ''}</strong> selecionados. Esta ação não pode ser desfeita.</>
                : <>Serão excluídos <strong className="text-red-400">todos os {deleteAllCount.toLocaleString()} vouchers {tab === 'disponiveis' ? 'disponíveis' : 'usados'}</strong>. Esta ação não pode ser desfeita.</>
              }
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                disabled={deleting}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${
                  isDark || isEmpresa ? 'bg-white/10 hover:bg-white/20 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={showDeleteConfirm === 'selected' ? deleteSelected : deleteAll}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <><Loader2 size={15} className="animate-spin" /> Excluindo...</>
                ) : (
                  <><Trash2 size={15} /> Excluir</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
