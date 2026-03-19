import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';
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
} from 'lucide-react';

interface ImportedCode {
  id: string;
  code: string;
  expiry_date: string;
  used: boolean;
  used_at: string | null;
  created_at: string;
}

type Tab = 'disponiveis' | 'usados';
type SortField = 'code' | 'expiry_date' | 'created_at' | 'used_at';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 25;

export default function VouchersPool() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [tab, setTab] = useState<Tab>('disponiveis');
  const [vouchers, setVouchers] = useState<ImportedCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [sortField, setSortField] = useState<SortField>('expiry_date');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [counts, setCounts] = useState({ disponiveis: 0, usados: 0, vencidos: 0 });

  const fetchCounts = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];

    const [availRes, usedRes, expiredRes] = await Promise.all([
      supabase.from('imported_codes').select('id', { count: 'exact', head: true }).eq('used', false).gte('expiry_date', today),
      supabase.from('imported_codes').select('id', { count: 'exact', head: true }).eq('used', true),
      supabase.from('imported_codes').select('id', { count: 'exact', head: true }).eq('used', false).lt('expiry_date', today),
    ]);

    setCounts({
      disponiveis: availRes.count ?? 0,
      usados: usedRes.count ?? 0,
      vencidos: expiredRes.count ?? 0,
    });
  }, []);

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];

    let query = supabase
      .from('imported_codes')
      .select('id, code, expiry_date, used, used_at, created_at', { count: 'exact' });

    if (tab === 'disponiveis') {
      query = query.eq('used', false).gte('expiry_date', today);
    } else {
      query = query.eq('used', true);
    }

    if (search.trim()) {
      query = query.ilike('code', `%${search.trim()}%`);
    }

    const ascending = sortDir === 'asc';
    query = query.order(sortField, { ascending });

    const from = page * PAGE_SIZE;
    query = query.range(from, from + PAGE_SIZE - 1);

    const { data, count, error } = await query;
    if (!error) {
      setVouchers(data || []);
      setTotalCount(count ?? 0);
    }
    setLoading(false);
  }, [tab, search, page, sortField, sortDir]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  useEffect(() => {
    setPage(0);
  }, [tab, search, sortField, sortDir]);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

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

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => toggleSort(field)}
      className={`flex items-center gap-1 text-xs font-bold uppercase tracking-wider transition-colors ${
        sortField === field
          ? isDark ? 'text-[#ea0cac]' : 'text-[#a700ff]'
          : isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      {label}
      <ArrowUpDown size={12} className={sortField === field ? 'opacity-100' : 'opacity-40'} />
    </button>
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <div className={`rounded-xl p-4 border ${isDark ? 'bg-[#311b3c] border-[#a700ff]/20' : 'bg-white border-gray-100'}`}>
          <div className={`inline-flex p-2 rounded-lg mb-2 ${isDark ? 'bg-green-900/40' : 'bg-green-50'}`}>
            <Package className={isDark ? 'text-green-400' : 'text-green-600'} size={18} />
          </div>
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{counts.disponiveis.toLocaleString()}</p>
          <p className={`text-xs font-semibold mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Disponiveis</p>
        </div>
        <div className={`rounded-xl p-4 border ${isDark ? 'bg-[#311b3c] border-[#a700ff]/20' : 'bg-white border-gray-100'}`}>
          <div className={`inline-flex p-2 rounded-lg mb-2 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <CheckCircle2 className={isDark ? 'text-gray-400' : 'text-gray-500'} size={18} />
          </div>
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{counts.usados.toLocaleString()}</p>
          <p className={`text-xs font-semibold mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Usados</p>
        </div>
        <div className={`rounded-xl p-4 border ${isDark ? 'bg-[#311b3c] border-[#a700ff]/20' : 'bg-white border-gray-100'}`}>
          <div className={`inline-flex p-2 rounded-lg mb-2 ${isDark ? 'bg-orange-900/40' : 'bg-orange-50'}`}>
            <AlertTriangle className={isDark ? 'text-orange-400' : 'text-orange-500'} size={18} />
          </div>
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{counts.vencidos.toLocaleString()}</p>
          <p className={`text-xs font-semibold mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Vencidos</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          {([
            { id: 'disponiveis' as Tab, label: 'Disponiveis', count: counts.disponiveis },
            { id: 'usados' as Tab, label: 'Usados', count: counts.usados },
          ]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tab === t.id
                  ? 'bg-gradient-to-r from-[#a700ff] to-[#ea0cac] text-white'
                  : isDark
                    ? 'bg-[#311b3c] text-gray-400 border border-[#a700ff]/20 hover:bg-[#330054]'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {t.label}
              <span className="ml-1.5 text-xs opacity-60">({t.count.toLocaleString()})</span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          <input
            type="text"
            placeholder="Buscar codigo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#a700ff] transition-all ${
              isDark
                ? 'bg-[#330054] border-[#a700ff]/30 text-white placeholder-gray-500'
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
            }`}
          />
        </div>
      </div>

      <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-[#311b3c] border-[#a700ff]/20' : 'bg-white border-gray-100'}`}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className={`animate-spin ${isDark ? 'text-[#a700ff]' : 'text-[#a700ff]'}`} size={24} />
          </div>
        ) : vouchers.length === 0 ? (
          <div className="text-center py-16">
            <p className={isDark ? 'text-gray-500' : 'text-gray-400'}>
              {search ? 'Nenhum voucher encontrado para essa busca.' : `Nenhum voucher ${tab === 'disponiveis' ? 'disponivel' : 'usado'}.`}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-[#a700ff]/10' : 'border-gray-100'}`}>
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
                  </tr>
                </thead>
                <tbody>
                  {vouchers.map(v => {
                    const expiring = !v.used && isExpiringSoon(v.expiry_date);
                    return (
                      <tr
                        key={v.id}
                        className={`border-b last:border-b-0 transition-colors ${
                          isDark
                            ? 'border-[#a700ff]/10 hover:bg-[#330054]/50'
                            : 'border-gray-50 hover:bg-gray-50'
                        }`}
                      >
                        <td className="px-5 py-3">
                          <span className={`font-mono text-sm font-bold ${isDark ? 'text-[#ea0cac]' : 'text-[#a700ff]'}`}>
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
                          {v.used ? (
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className={`flex items-center justify-between px-5 py-3 border-t ${isDark ? 'border-[#a700ff]/10' : 'border-gray-100'}`}>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {totalCount.toLocaleString()} voucher{totalCount !== 1 ? 's' : ''} no total
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${
                    isDark ? 'hover:bg-[#330054] text-gray-400' : 'hover:bg-gray-100 text-gray-500'
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
                    isDark ? 'hover:bg-[#330054] text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
