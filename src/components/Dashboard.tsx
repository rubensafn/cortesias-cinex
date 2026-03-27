import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAppTheme } from '../hooks/useAppTheme';
import GenerateTicketsForm from './GenerateTicketsForm';
import TicketsViewer from './TicketsViewer';
import AdminDashboard from './AdminDashboard';
import UserManagement from './UserManagement';
import ImportCodesModal from './ImportCodesModal';
import VouchersPool from './VouchersPool';
import {
  LogOut, Plus, List, BarChart3, Users, Upload,
  Menu, X, Sun, Moon, Package, Sparkles, Building2, ArrowLeftRight
} from 'lucide-react';

type View = 'list' | 'form' | 'admin' | 'users' | 'vouchers';

export default function Dashboard() {
  const { signOut, user, isAdmin, isMaster, userRole } = useAuth();
  const { appMode, setAppMode } = useApp();
  const { toggleTheme } = useTheme();
  const { isDark, isEmpresa, pageBg, navBg, navText, activeNavBtn, inactiveNavBtn, mobileMenuBg, labels } = useAppTheme();

  const [view, setView] = useState<View>('list');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);

  const navigate = (v: View) => { setView(v); setMobileMenuOpen(false); };

  const handleSwitchApp = () => {
    setShowSwitchConfirm(false);
    signOut();
    setAppMode(null);
  };

  const navItems: { id: View; label: string; icon: React.ElementType; adminOnly?: boolean }[] = [
    { id: 'list', label: labels.listView, icon: List },
    { id: 'form', label: labels.formView, icon: Plus },
    { id: 'vouchers', label: 'Vouchers', icon: Package, adminOnly: true },
    { id: 'admin', label: 'Estatísticas', icon: BarChart3, adminOnly: true },
    { id: 'users', label: 'Usuários', icon: Users, adminOnly: true },
  ];

  const visibleItems = navItems.filter(item => {
    if (item.adminOnly) return isAdmin;
    return true;
  });

  const AppIcon = isEmpresa ? Building2 : Sparkles;
  const importBtnStyle = isEmpresa
    ? (isDark ? 'bg-[#f59e0b]/20 text-[#f59e0b] hover:bg-[#f59e0b]/30' : 'bg-[#f59e0b]/20 text-[#d97706] hover:bg-[#f59e0b]/30')
    : (isDark ? 'bg-[#ea0cac]/20 text-[#ea0cac] hover:bg-[#ea0cac]/30' : 'bg-[#ea0cac]/10 text-[#ea0cac] hover:bg-[#ea0cac]/20');

  const toggleStyle = isEmpresa
    ? (isDark ? 'bg-[#f59e0b]' : 'bg-[#0284c7]')
    : (isDark ? 'bg-[#ea0cac]' : 'bg-gray-300');

  const masterBadge = isEmpresa
    ? 'bg-[#f59e0b]/20 text-[#f59e0b]'
    : 'bg-[#ea0cac]/20 text-[#ea0cac]';

  const adminBadge = isEmpresa
    ? 'bg-[#0ea5e9]/20 text-[#0ea5e9]'
    : 'bg-[#312783]/30 text-[#a700ff]';

  const topAccentLine = isEmpresa
    ? 'from-transparent via-[#f59e0b]/40 to-transparent'
    : '';

  return (
    <div className={`min-h-screen ${pageBg}`}>
      <nav className={`${navBg} shadow-sm border-b`}>
        {isEmpresa && <div className={`h-0.5 bg-gradient-to-r from-transparent via-[#f59e0b]/50 to-transparent`} />}
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">

            {/* Logo + nav links */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg ${isEmpresa ? 'bg-[#f59e0b]/20' : 'bg-[#a700ff]/20'}`}>
                  <AppIcon size={16} className={isEmpresa ? 'text-[#f59e0b]' : 'text-[#a700ff]'} />
                </div>
                <div>
                  <span className={`text-lg font-black ${navText}`}>CINEX</span>
                  <span className={`text-xs ml-1.5 font-semibold hidden sm:inline ${isEmpresa ? 'text-[#f59e0b]' : (isDark ? 'text-[#ea0cac]' : 'text-[#a700ff]')}`}>
                    {isEmpresa ? 'Empresa' : 'Cortesias'}
                  </span>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-1">
                {visibleItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                      view === item.id ? activeNavBtn : inactiveNavBtn
                    }`}
                  >
                    <item.icon size={15} />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  onClick={() => setImportModalOpen(true)}
                  className={`hidden md:flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${importBtnStyle}`}
                >
                  <Upload size={15} />
                  Importar Códigos
                </button>
              )}

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                aria-label="Alternar tema"
                className={`relative inline-flex items-center w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none flex-shrink-0 ${toggleStyle}`}
              >
                <span className={`absolute flex items-center justify-center w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${isDark ? 'translate-x-6' : 'translate-x-0.5'}`}>
                  {isDark
                    ? <Moon size={11} className={isEmpresa ? 'text-[#f59e0b]' : 'text-[#ea0cac]'} />
                    : <Sun size={11} className="text-yellow-500" />
                  }
                </span>
              </button>

              {/* User info (desktop) */}
              <div className="hidden md:block text-right">
                <p className={`text-sm font-semibold leading-tight ${isDark || isEmpresa ? 'text-gray-200' : 'text-gray-800'}`}>
                  {user?.email?.split('@')[0]}
                </p>
                <div className="flex justify-end gap-1 mt-0.5">
                  {isMaster && <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${masterBadge}`}>MASTER</span>}
                  {!isMaster && isAdmin && <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${adminBadge}`}>ADMIN</span>}
                  {userRole === 'user' && <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${isDark || isEmpresa ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>USER</span>}
                </div>
              </div>

              {/* Switch app */}
              <button
                onClick={() => setShowSwitchConfirm(true)}
                className={`hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors text-xs font-semibold ${
                  isDark || isEmpresa
                    ? 'text-gray-400 hover:text-white hover:bg-white/10'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                }`}
                title="Trocar sistema"
              >
                <ArrowLeftRight size={14} />
                <span className="hidden lg:inline">Trocar</span>
              </button>

              {/* Logout */}
              <button
                onClick={() => signOut()}
                className={`hidden md:flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-semibold ${
                  isDark || isEmpresa
                    ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/30'
                    : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                }`}
              >
                <LogOut size={16} />
                Sair
              </button>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`md:hidden p-2 rounded-lg ${isDark || isEmpresa ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className={`md:hidden border-t p-4 space-y-1 ${mobileMenuBg}`}>
            <div className="px-3 py-2 mb-3">
              <p className={`text-sm font-semibold ${isDark || isEmpresa ? 'text-gray-200' : 'text-gray-800'}`}>{user?.email?.split('@')[0]}</p>
              {isMaster && <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${masterBadge}`}>MASTER</span>}
              {!isMaster && isAdmin && <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${adminBadge}`}>ADMIN</span>}
            </div>
            {visibleItems.map(item => (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  view === item.id ? activeNavBtn : inactiveNavBtn
                }`}
              >
                <item.icon size={16} />
                {item.label}
              </button>
            ))}
            {isAdmin && (
              <button
                onClick={() => { setImportModalOpen(true); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${importBtnStyle}`}
              >
                <Upload size={16} />
                Importar Códigos
              </button>
            )}
            <button
              onClick={() => { setShowSwitchConfirm(true); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                isDark || isEmpresa ? 'text-gray-400 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ArrowLeftRight size={16} />
              Trocar Sistema
            </button>
            <button
              onClick={() => signOut()}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors mt-2 ${
                isDark || isEmpresa ? 'text-red-400 hover:bg-red-900/30' : 'text-red-600 hover:bg-red-50'
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
        {view === 'vouchers' && isAdmin && <VouchersPool />}
        {view === 'admin' && isAdmin && <AdminDashboard />}
        {view === 'users' && isAdmin && <UserManagement />}
      </main>

      {importModalOpen && isAdmin && (
        <ImportCodesModal onClose={() => setImportModalOpen(false)} />
      )}

      {/* Modal de confirmação de troca */}
      {showSwitchConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-2xl p-6 border shadow-2xl ${isDark || isEmpresa ? 'bg-[#0f1f33] border-white/10' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-xl ${isEmpresa ? 'bg-[#f59e0b]/20' : 'bg-[#a700ff]/20'}`}>
                <ArrowLeftRight size={20} className={isEmpresa ? 'text-[#f59e0b]' : 'text-[#a700ff]'} />
              </div>
              <h3 className={`font-bold text-lg ${isDark || isEmpresa ? 'text-white' : 'text-gray-900'}`}>Trocar sistema?</h3>
            </div>
            <p className={`text-sm mb-6 ${isDark || isEmpresa ? 'text-gray-400' : 'text-gray-600'}`}>
              Você será desconectado de <strong>{labels.systemName}</strong> e redirecionado para a tela de seleção.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSwitchConfirm(false)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  isDark || isEmpresa ? 'bg-white/10 hover:bg-white/20 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={handleSwitchApp}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-[#d97706] to-[#0284c7] text-white hover:opacity-90 transition-opacity"
              >
                Sim, trocar
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className={`text-center py-6 text-xs border-t mt-8 ${isDark || isEmpresa ? 'text-gray-600 border-white/5' : 'text-gray-300 border-gray-100'}`}>
        v3.0.0 &mdash; 2025 {labels.systemName}
      </footer>
    </div>
  );
}
