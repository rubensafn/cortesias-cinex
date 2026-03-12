import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';
import { BarChart3, Users, Ticket, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Stats {
  total: number;
  ativos: number;
  usados: number;
  cancelados: number;
  totalUsuarios: number;
}

interface CortesiaPorUnidade {
  unidade: string;
  count: number;
}

export default function AdminDashboard() {
  const { theme } = useTheme();
  const [stats, setStats] = useState<Stats>({ total: 0, ativos: 0, usados: 0, cancelados: 0, totalUsuarios: 0 });
  const [porUnidade, setPorUnidade] = useState<CortesiaPorUnidade[]>([]);
  const [loading, setLoading] = useState(true);

  const isDark = theme === 'dark';

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [{ data: cortesias }, { data: usuarios }] = await Promise.all([
        supabase.from('cortesias').select('status, unidade'),
        supabase.from('user_profiles').select('user_id'),
      ]);

      const all = cortesias || [];
      setStats({
        total: all.length,
        ativos: all.filter(c => c.status === 'ativo').length,
        usados: all.filter(c => c.status === 'usado').length,
        cancelados: all.filter(c => c.status === 'cancelado').length,
        totalUsuarios: usuarios?.length || 0,
      });

      const unidadeMap: Record<string, number> = {};
      all.forEach(c => {
        unidadeMap[c.unidade] = (unidadeMap[c.unidade] || 0) + 1;
      });
      setPorUnidade(
        Object.entries(unidadeMap)
          .map(([unidade, count]) => ({ unidade, count }))
          .sort((a, b) => b.count - a.count)
      );
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Carregando dados...</div>;
  }

  const cards = [
    { label: 'Total de Cortesias', value: stats.total, icon: Ticket, darkColor: 'text-[#a700ff]', darkBg: 'bg-[#a700ff]/20', lightColor: 'text-[#a700ff]', lightBg: 'bg-[#a700ff]/10' },
    { label: 'Ativas', value: stats.ativos, icon: CheckCircle, darkColor: 'text-green-400', darkBg: 'bg-green-900/50', lightColor: 'text-green-600', lightBg: 'bg-green-50' },
    { label: 'Usadas', value: stats.usados, icon: Clock, darkColor: 'text-gray-400', darkBg: 'bg-gray-700', lightColor: 'text-gray-600', lightBg: 'bg-gray-50' },
    { label: 'Canceladas', value: stats.cancelados, icon: XCircle, darkColor: 'text-red-400', darkBg: 'bg-red-900/50', lightColor: 'text-red-600', lightBg: 'bg-red-50' },
    { label: 'Usuarios Cadastrados', value: stats.totalUsuarios, icon: Users, darkColor: 'text-[#ea0cac]', darkBg: 'bg-[#ea0cac]/20', lightColor: 'text-[#ea0cac]', lightBg: 'bg-[#ea0cac]/10' },
    { label: 'Taxa de Uso', value: `${stats.total > 0 ? Math.round((stats.usados / stats.total) * 100) : 0}%`, icon: BarChart3, darkColor: 'text-[#312783]', darkBg: 'bg-[#312783]/30', lightColor: 'text-[#312783]', lightBg: 'bg-[#312783]/10' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map(card => (
          <div key={card.label} className={`rounded-xl shadow-md p-5 border ${isDark ? 'bg-[#311b3c] border-[#a700ff]/20' : 'bg-white border-gray-100'}`}>
            <div className={`inline-flex p-2 rounded-lg mb-3 ${isDark ? card.darkBg : card.lightBg}`}>
              <card.icon className={isDark ? card.darkColor : card.lightColor} size={22} />
            </div>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{card.value}</p>
            <p className={`text-xs font-semibold mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{card.label}</p>
          </div>
        ))}
      </div>

      {porUnidade.length > 0 && (
        <div className={`rounded-xl shadow-md p-6 border ${isDark ? 'bg-[#311b3c] border-[#a700ff]/20' : 'bg-white border-gray-100'}`}>
          <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Cortesias por Unidade</h3>
          <div className="space-y-3">
            {porUnidade.map(item => (
              <div key={item.unidade} className="flex items-center gap-4">
                <span className={`text-sm w-40 truncate font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{item.unidade}</span>
                <div className={`flex-1 rounded-full h-2.5 ${isDark ? 'bg-[#330054]' : 'bg-gray-100'}`}>
                  <div
                    className="bg-gradient-to-r from-[#a700ff] to-[#ea0cac] h-2.5 rounded-full transition-all"
                    style={{ width: `${stats.total > 0 ? (item.count / stats.total) * 100 : 0}%` }}
                  />
                </div>
                <span className={`text-sm font-bold w-8 text-right ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
