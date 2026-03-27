import { useEffect, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAppTheme } from '../hooks/useAppTheme';
import { BarChart3, Users, Ticket, CheckCircle, XCircle, Clock, Package, AlertTriangle } from 'lucide-react';

interface Stats {
  total: number;
  ativos: number;
  usados: number;
  cancelados: number;
  totalUsuarios: number;
  vouchersDisponiveis: number;
  vouchersUsados: number;
  vouchersVencidos: number;
}

export default function AdminDashboard() {
  const { db, tables } = useApp();
  const { isDark, isEmpresa, cardBg, labels } = useAppTheme();
  const [stats, setStats] = useState<Stats>({ total: 0, ativos: 0, usados: 0, cancelados: 0, totalUsuarios: 0, vouchersDisponiveis: 0, vouchersUsados: 0, vouchersVencidos: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, [tables.tickets, tables.importedCodes]);

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [
        { data: cortesias },
        { data: usuarios },
        { count: vDisponiveis },
        { count: vUsados },
        { count: vVencidos },
      ] = await Promise.all([
        db.from(tables.tickets).select('status'),
        db.from('user_profiles').select('user_id'),
        db.from(tables.importedCodes).select('id', { count: 'exact', head: true }).eq('used', false).gte('expiry_date', today),
        db.from(tables.importedCodes).select('id', { count: 'exact', head: true }).eq('used', true),
        db.from(tables.importedCodes).select('id', { count: 'exact', head: true }).eq('used', false).lt('expiry_date', today),
      ]);

      const all = cortesias || [];
      setStats({
        total: all.length,
        ativos: all.filter(c => c.status === 'ativo').length,
        usados: all.filter(c => c.status === 'usado').length,
        cancelados: all.filter(c => c.status === 'cancelado').length,
        totalUsuarios: usuarios?.length || 0,
        vouchersDisponiveis: vDisponiveis ?? 0,
        vouchersUsados: vUsados ?? 0,
        vouchersVencidos: vVencidos ?? 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className={`text-center py-12 ${isDark || isEmpresa ? 'text-gray-500' : 'text-gray-500'}`}>Carregando dados...</div>;
  }

  const primaryColor = isEmpresa ? 'text-[#f59e0b]' : 'text-[#a700ff]';
  const primaryBg = isEmpresa ? 'bg-[#f59e0b]/20' : 'bg-[#a700ff]/20';
  const secondaryColor = isEmpresa ? 'text-[#0ea5e9]' : 'text-[#ea0cac]';
  const secondaryBg = isEmpresa ? 'bg-[#0ea5e9]/20' : 'bg-[#ea0cac]/20';

  const cortesiaCards = [
    { label: labels.totalLabel,       value: stats.total,            icon: Ticket,      darkColor: primaryColor,    darkBg: primaryBg,         lightColor: primaryColor,   lightBg: primaryBg },
    { label: 'Ativos',                value: stats.ativos,           icon: CheckCircle, darkColor: 'text-green-400', darkBg: 'bg-green-900/50', lightColor: 'text-green-600', lightBg: 'bg-green-50' },
    { label: 'Usados',                value: stats.usados,           icon: Clock,       darkColor: 'text-gray-400',  darkBg: 'bg-gray-700',     lightColor: 'text-gray-600', lightBg: 'bg-gray-50' },
    { label: 'Cancelados',            value: stats.cancelados,       icon: XCircle,     darkColor: 'text-red-400',   darkBg: 'bg-red-900/50',   lightColor: 'text-red-600',  lightBg: 'bg-red-50' },
    { label: 'Usuários Cadastrados',  value: stats.totalUsuarios,    icon: Users,       darkColor: secondaryColor,  darkBg: secondaryBg,       lightColor: secondaryColor, lightBg: secondaryBg },
    { label: 'Taxa de Uso',           value: `${stats.total > 0 ? Math.round((stats.usados / stats.total) * 100) : 0}%`, icon: BarChart3, darkColor: 'text-sky-400', darkBg: 'bg-sky-900/30', lightColor: 'text-sky-600', lightBg: 'bg-sky-50' },
  ];

  const voucherCards = [
    { label: 'Vouchers Disponíveis', value: stats.vouchersDisponiveis, icon: Package,       darkColor: 'text-green-400', darkBg: 'bg-green-900/50', lightColor: 'text-green-600', lightBg: 'bg-green-50' },
    { label: 'Vouchers Usados',      value: stats.vouchersUsados,      icon: CheckCircle,   darkColor: 'text-gray-400',  darkBg: 'bg-gray-700',     lightColor: 'text-gray-600', lightBg: 'bg-gray-50' },
    { label: 'Vouchers Vencidos',    value: stats.vouchersVencidos,    icon: AlertTriangle, darkColor: 'text-orange-400',darkBg: 'bg-orange-900/40',lightColor: 'text-orange-500',lightBg: 'bg-orange-50' },
  ];

  const totalVouchers = stats.vouchersDisponiveis + stats.vouchersUsados + stats.vouchersVencidos;
  const sectionLabel = isDark || isEmpresa ? 'text-gray-500' : 'text-gray-400';
  const progressBg = isDark || isEmpresa ? (isEmpresa ? 'bg-[#f59e0b]/10' : 'bg-[#330054]') : 'bg-gray-100';

  return (
    <div className="space-y-6">
      <div>
        <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 ${sectionLabel}`}>{labels.statsTitle}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {cortesiaCards.map(card => (
            <div key={card.label} className={`rounded-xl shadow-md p-5 border ${cardBg}`}>
              <div className={`inline-flex p-2 rounded-lg mb-3 ${isDark || isEmpresa ? card.darkBg : card.lightBg}`}>
                <card.icon className={isDark || isEmpresa ? card.darkColor : card.lightColor} size={22} />
              </div>
              <p className={`text-2xl font-bold ${isDark || isEmpresa ? 'text-white' : 'text-gray-900'}`}>{card.value}</p>
              <p className={`text-xs font-semibold mt-1 ${isDark || isEmpresa ? 'text-gray-400' : 'text-gray-500'}`}>{card.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 ${sectionLabel}`}>{labels.poolLabel}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {voucherCards.map(card => (
            <div key={card.label} className={`rounded-xl shadow-md p-5 border ${cardBg}`}>
              <div className={`inline-flex p-2 rounded-lg mb-3 ${isDark || isEmpresa ? card.darkBg : card.lightBg}`}>
                <card.icon className={isDark || isEmpresa ? card.darkColor : card.lightColor} size={22} />
              </div>
              <p className={`text-2xl font-bold ${isDark || isEmpresa ? 'text-white' : 'text-gray-900'}`}>{card.value.toLocaleString()}</p>
              <p className={`text-xs font-semibold mt-1 ${isDark || isEmpresa ? 'text-gray-400' : 'text-gray-500'}`}>{card.label}</p>
            </div>
          ))}
        </div>
        {totalVouchers > 0 && (
          <div className={`mt-4 rounded-xl shadow-md p-5 border ${cardBg}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-sm font-semibold ${isDark || isEmpresa ? 'text-gray-300' : 'text-gray-700'}`}>Utilização do Pool</span>
              <span className={`text-sm font-bold ${isDark || isEmpresa ? 'text-white' : 'text-gray-900'}`}>
                {Math.round((stats.vouchersUsados / totalVouchers) * 100)}%
              </span>
            </div>
            <div className={`w-full rounded-full h-3 ${progressBg}`}>
              <div className="flex h-3 rounded-full overflow-hidden">
                <div className="bg-green-500 transition-all" style={{ width: `${(stats.vouchersDisponiveis / totalVouchers) * 100}%` }} title={`Disponíveis: ${stats.vouchersDisponiveis}`} />
                <div className={`transition-all ${isDark || isEmpresa ? 'bg-gray-500' : 'bg-gray-400'}`} style={{ width: `${(stats.vouchersUsados / totalVouchers) * 100}%` }} title={`Usados: ${stats.vouchersUsados}`} />
                <div className="bg-orange-500 transition-all" style={{ width: `${(stats.vouchersVencidos / totalVouchers) * 100}%` }} title={`Vencidos: ${stats.vouchersVencidos}`} />
              </div>
            </div>
            <div className="flex items-center gap-4 mt-3">
              <span className={`flex items-center gap-1.5 text-xs ${isDark || isEmpresa ? 'text-gray-400' : 'text-gray-500'}`}><span className="w-2.5 h-2.5 rounded-full bg-green-500" />Disponíveis</span>
              <span className={`flex items-center gap-1.5 text-xs ${isDark || isEmpresa ? 'text-gray-400' : 'text-gray-500'}`}><span className={`w-2.5 h-2.5 rounded-full ${isDark || isEmpresa ? 'bg-gray-500' : 'bg-gray-400'}`} />Usados</span>
              <span className={`flex items-center gap-1.5 text-xs ${isDark || isEmpresa ? 'text-gray-400' : 'text-gray-500'}`}><span className="w-2.5 h-2.5 rounded-full bg-orange-500" />Vencidos</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
