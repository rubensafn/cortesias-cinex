import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import GenerateTicketsForm from './GenerateTicketsForm';
import TicketsViewer from './TicketsViewer';
import AdminDashboard from './AdminDashboard';
import UserManagement from './UserManagement';
import CodeSequenceConfig from './CodeSequenceConfig';
import { LogOut, Plus, List, BarChart3, Users, Settings, Menu, X, Sun, Moon } from 'lucide-react';

type View = 'list' | 'form' | 'admin' | 'users' | 'config';

export default function Dashboard() {
  const { signOut, user, isAdmin, isMaster, userRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [view, setView] = useState<View>('list');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isDark = theme === 'dark';

  const navigate = (v: View) => {
    setView(v);
    setMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const navItems: { id: View; label: string; icon: React.ElementType; adminOnly?: boolean; masterOnly?: boolean }[] = [
    { id: 'list', label: 'Cortesias', icon: List },
    { id: 'form', label: 'Nova Cortesia', icon: Plus },
    { id: 'admin', label: 'Estatisticas', icon: BarChart3, adminOnly: true },
    { id: 'users', label: 'Usuarios', icon: Users, adminOnly: true },
    { id: 'config', label: 'Codigos', icon: Settings, adminOnly: true },
  ];

  const visibleItems = navItems.filter(item => {
    if (item.masterOnly) return isMaster;
    if (item.adminOnly) return isAdmin;
    return true;
  });

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#1a0a24]' : 'bg-gray-50'}`}>
      <nav className={`${isDark ? 'bg-[#311b3c] border-[#a700ff]/20' : 'bg-white border-gray-200'} shadow-sm border-b`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <div>
                <span className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>CINEX</span>
                <span className={`text-sm ml-2 hidden sm:inline ${isDark ? 'text-[#ea0cac]' : 'text-[#a700ff]'}`}>Cortesias</span>
              </div>
              <div className="hidden md:flex items-center gap-1">
                {visibleItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                      view === item.id
                        ? 'bg-gradient-to-r from-[#a700ff] to-[#ea0cac] text-white'
                        : isDark
                          ? 'text-gray-400 hover:bg-[#330054] hover:text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon size={15} />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors ${
                  isDark
                    ? 'text-gray-400 hover:bg-[#330054] hover:text-white'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
                aria-label="Alternar tema"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <div className={`hidden md:block text-right`}>
                <p className={`text-sm font-semibold leading-tight ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{user?.email}</p>
                <div className="flex justify-end gap-1 mt-0.5">
                  {isMaster && <span className="bg-[#ea0cac]/20 text-[#ea0cac] px-1.5 py-0.5 rounded text-xs font-bold">MASTER</span>}
                  {!isMaster && isAdmin && <span className="bg-[#312783]/30 text-[#a700ff] px-1.5 py-0.5 rounded text-xs font-bold">ADMIN</span>}
                  {userRole === 'user' && <span className={`${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'} px-1.5 py-0.5 rounded text-xs font-bold`}>USER</span>}
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className={`hidden md:flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-semibold ${
                  isDark
                    ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/30'
                    : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                }`}
              >
                <LogOut size={16} />
                Sair
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`md:hidden p-2 rounded-lg ${isDark ? 'hover:bg-[#330054] text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className={`md:hidden border-t p-4 space-y-1 ${isDark ? 'border-[#a700ff]/20 bg-[#311b3c]' : 'border-gray-100 bg-white'}`}>
            <div className="px-3 py-2 mb-3">
              <p className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{user?.email}</p>
              {isMaster && <span className="bg-[#ea0cac]/20 text-[#ea0cac] px-1.5 py-0.5 rounded text-xs font-bold">MASTER</span>}
              {!isMaster && isAdmin && <span className="bg-[#312783]/30 text-[#a700ff] px-1.5 py-0.5 rounded text-xs font-bold">ADMIN</span>}
            </div>
            {visibleItems.map(item => (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  view === item.id
                    ? 'bg-gradient-to-r from-[#a700ff] to-[#ea0cac] text-white'
                    : isDark
                      ? 'text-gray-400 hover:bg-[#330054]'
                      : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon size={16} />
                {item.label}
              </button>
            ))}
            <button
              onClick={handleSignOut}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors mt-2 ${
                isDark
                  ? 'text-red-400 hover:bg-red-900/30'
                  : 'text-red-600 hover:bg-red-50'
              }`}
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {view === 'list' && <TicketsViewer />}
        {view === 'form' && <GenerateTicketsForm onSuccess={() => navigate('list')} />}
        {view === 'admin' && isAdmin && <AdminDashboard />}
        {view === 'users' && isAdmin && <UserManagement />}
        {view === 'config' && isAdmin && <CodeSequenceConfig />}
      </main>

      <footer className={`text-center py-6 text-xs border-t mt-8 ${isDark ? 'text-gray-500 border-[#330054]' : 'text-gray-300 border-gray-100'}`}>
        v3.0.0 &mdash; 2025 Cinex Sistema de Cortesias
      </footer>
    </div>
  );
}
