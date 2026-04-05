import { useState, useEffect } from 'react';
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
import ChangePasswordModal from './ChangePasswordModal';
import {
  LogOut, Plus, List, BarChart3, Users, Upload,
  Menu, X, Sun, Moon, Package, Sparkles, Building2, ArrowLeftRight, KeyRound
} from 'lucide-react';

type View = 'list' | 'form' | 'admin' | 'users' | 'vouchers';

export default function Dashboard() {
  const { signOut, user, isAdmin, isMaster, userRole } = useAuth();
  const { setAppMode } = useApp();
  const { toggleTheme } = useTheme();
  const { isDark, isEmpresa, pageBg, navBg, navText, activeNavBtn, inactiveNavBtn, mobileMenuBg, cardBg, labels } = useAppTheme();

  const [view, setView] = useState<View>('list');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isNavHidden, setIsNavHidden] = useState(false);
  const [floatingMenuOpen, setFloatingMenuOpen] = useState(false);

  const navigate = (v: View) => {
    setView(v);
    setMobileMenuOpen(false);
    setFloatingMenuOpen(false);
  };

  const handleSwitchApp = () => {
    setShowSwitchConfirm(false);
    signOut();
    setAppMode(null);
  };

  useEffect(() => {
    const handleScroll = () => {
      const hidden = window.scrollY > 72;
      setIsNavHidden(hidden);
      if (!hidden) setFloatingMenuOpen(false);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const floatingBtnBase = `w-10 h-10 rounded-xl flex items-center justify-center shadow-lg border transition-all ${
    isDark
      ? isEmpresa
        ? 'bg-[#0f1f33] border-[#f59e0b]/30 text-gray-300 hover:text-white hover:border-[#f59e0b]/50'
        : 'bg-[#311b3c] border-[#a700ff]/30 text-gray-300 hover:text-white hover:border-[#a700ff]/50'
      : 'bg-white border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300'
  }`;

  return (
    <div className={`min-h-screen ${pageBg}`}>
      <nav className={`${navBg} shadow-sm border-b`}>
        {isEmpresa && <div className="h-0.5 bg-gradient-to-r from-transparent via-[#f59e0b]/50 to-transparent" />}
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">

            {/* Logo + nav links + import */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center gap-2.5 flex-shrink-0">
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

              <div className="hidden md:flex items-center gap-0.5">
                {visibleItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.id)}
                    title={item.label}
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                      view === item.id ? activeNavBtn : inactiveNavBtn
                    }`}
                  >
                    <item.icon size={15} />
                    <span className="hidden xl:inline whitespace-nowrap">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-1.5 flex-shrink-0">

              {/* Import — junto aos controles direitos */}
              {isAdmin && (
                <>
                  <button
                    onClick={() => setImportModalOpen(true)}
                    title="Importar Códigos"
                    className={`hidden md:flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${importBtnStyle}`}
                  >
                    <Upload size={15} />
                    <span className="hidden 2xl:inline">Importar Códigos</span>
                  </button>
                  <div className={`hidden md:block w-px h-5 ${isDark || isEmpresa ? 'bg-white/10' : 'bg-gray-200'}`} />
                </>
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

              {/* System switcher — pill toggle (igual ao tema claro/escuro) */}
              <div className={`hidden md:flex items-center rounded-full p-0.5 gap-0.5 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-100 border border-gray-200'}`}>
                <button
                  onClick={() => isEmpresa && setShowSwitchConfirm(true)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                    !isEmpresa
                      ? 'bg-gradient-to-r from-[#a700ff] to-[#ea0cac] text-white shadow-sm cursor-default'
                      : isDark ? 'text-gray-500 hover:text-gray-300 cursor-pointer' : 'text-gray-400 hover:text-gray-600 cursor-pointer'
                  }`}
                  title={!isEmpresa ? 'Sistema atual' : 'Trocar para Cortesias'}
                >
                  <Sparkles size={11} />
                  <span className="hidden 2xl:inline">Cortesias</span>
                </button>
                <button
                  onClick={() => !isEmpresa && setShowSwitchConfirm(true)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                    isEmpresa
                      ? 'bg-gradient-to-r from-[#f59e0b] to-[#0ea5e9] text-white shadow-sm cursor-default'
                      : isDark ? 'text-gray-500 hover:text-gray-300 cursor-pointer' : 'text-gray-400 hover:text-gray-600 cursor-pointer'
                  }`}
                  title={isEmpresa ? 'Sistema atual' : 'Trocar para Empresa'}
                >
                  <Building2 size={11} />
                  <span className="hidden 2xl:inline">Empresa</span>
                </button>
              </div>

              {/* Logout */}
              <button
                onClick={() => signOut()}
                className={`hidden md:flex items-center gap-1.5 px-2.5 py-2 rounded-lg transition-colors text-sm font-semibold ${
                  isDark || isEmpresa
                    ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/30'
                    : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                }`}
              >
                <LogOut size={16} />
                <span className="hidden 2xl:inline">Sair</span>
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
              onClick={() => { setShowChangePassword(true); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                isDark || isEmpresa ? 'text-gray-400 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <KeyRound size={16} />
              Trocar Senha
            </button>
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

      {/* Floating sidebar — aparece quando navbar sai de vista ao scrollar */}
      {isNavHidden && (
        <div className="fixed right-4 top-20 z-40 flex flex-col items-center gap-2">
          {/* Botão de menu flutuante */}
          <div className="relative">
            <button
              onClick={() => setFloatingMenuOpen(prev => !prev)}
              className={`${floatingBtnBase} ${floatingMenuOpen ? (isEmpresa ? 'ring-2 ring-[#f59e0b]/50 ring-offset-1' : 'ring-2 ring-[#a700ff]/50 ring-offset-1') : ''}`}
              title="Menu de navegação"
            >
              {floatingMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            {floatingMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-[-1]"
                  onClick={() => setFloatingMenuOpen(false)}
                />
                <div className={`absolute right-12 top-0 w-52 rounded-xl shadow-xl border overflow-hidden ${cardBg}`}>
                  <div className="p-1.5 space-y-0.5">
                    {visibleItems.map(item => (
                      <button
                        key={item.id}
                        onClick={() => navigate(item.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                          view === item.id ? activeNavBtn : inactiveNavBtn
                        }`}
                      >
                        <item.icon size={15} />
                        {item.label}
                      </button>
                    ))}
                    {isAdmin && (
                      <button
                        onClick={() => { setImportModalOpen(true); setFloatingMenuOpen(false); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${importBtnStyle}`}
                      >
                        <Upload size={15} />
                        Importar Códigos
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Botão de trocar senha */}
          <button
            onClick={() => { setFloatingMenuOpen(false); setShowChangePassword(true); }}
            className={floatingBtnBase}
            title="Trocar senha"
          >
            <KeyRound size={18} />
          </button>

          {/* Botão de trocar sistema */}
          <button
            onClick={() => { setFloatingMenuOpen(false); setShowSwitchConfirm(true); }}
            className={`${floatingBtnBase} ${
              isEmpresa
                ? '!bg-[#f59e0b]/20 !border-[#f59e0b]/40 !text-[#f59e0b] hover:!bg-[#f59e0b]/30'
                : '!bg-[#a700ff]/20 !border-[#a700ff]/40 !text-[#a700ff] hover:!bg-[#a700ff]/30'
            }`}
            title={`${labels.systemName} — Trocar sistema`}
          >
            <ArrowLeftRight size={18} />
          </button>
        </div>
      )}

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

      {/* Modal de confirmação de troca de sistema */}
      {showSwitchConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-2xl p-6 border shadow-2xl ${cardBg}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-xl ${isEmpresa ? 'bg-[#f59e0b]/20' : 'bg-[#a700ff]/20'}`}>
                <ArrowLeftRight size={20} className={isEmpresa ? 'text-[#f59e0b]' : 'text-[#a700ff]'} />
              </div>
              <h3 className={`font-bold text-lg ${isDark || isEmpresa ? 'text-white' : 'text-gray-900'}`}>Trocar sistema?</h3>
            </div>
            <p className={`text-sm mb-1 ${isDark || isEmpresa ? 'text-gray-300' : 'text-gray-700'}`}>
              Você sairá de <strong>{labels.systemName}</strong> e voltará à tela de seleção.
            </p>
            <p className={`text-xs mb-6 ${isDark || isEmpresa ? 'text-gray-500' : 'text-gray-400'}`}>
              Os dois sistemas são independentes — contas e vouchers não são compartilhados.
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
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-opacity bg-gradient-to-r ${
                  isEmpresa ? 'from-[#a700ff] to-[#ea0cac]' : 'from-[#d97706] to-[#0ea5e9]'
                }`}
              >
                Sim, trocar
              </button>
            </div>
          </div>
        </div>
      )}

      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}

      {/* User info — canto inferior esquerdo, fixo */}
      <button
        onClick={() => setShowChangePassword(true)}
        title="Trocar senha"
        className={`fixed bottom-4 left-4 z-30 flex items-center gap-2.5 px-3 py-2 rounded-xl border shadow-lg backdrop-blur-sm transition-all ${
          isDark
            ? isEmpresa
              ? 'bg-[#0f1f33]/90 border-[#f59e0b]/20 hover:border-[#f59e0b]/40'
              : 'bg-[#311b3c]/90 border-[#a700ff]/20 hover:border-[#a700ff]/40'
            : 'bg-white/90 border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isEmpresa ? 'bg-[#f59e0b]/20' : 'bg-[#a700ff]/20'
        }`}>
          <span className={`text-xs font-black uppercase ${isEmpresa ? 'text-[#f59e0b]' : 'text-[#a700ff]'}`}>
            {user?.email?.split('@')[0]?.charAt(0) ?? '?'}
          </span>
        </div>
        <div className="flex flex-col items-start leading-none">
          <span className={`text-xs font-semibold whitespace-nowrap ${isDark || isEmpresa ? 'text-gray-200' : 'text-gray-800'}`}>
            {user?.email?.split('@')[0]}
          </span>
          <span className={`mt-0.5 text-[10px] font-bold ${
            isMaster
              ? isEmpresa ? 'text-[#f59e0b]' : 'text-[#ea0cac]'
              : isAdmin
                ? isEmpresa ? 'text-[#0ea5e9]' : 'text-[#a700ff]'
                : isDark || isEmpresa ? 'text-gray-500' : 'text-gray-400'
          }`}>
            {isMaster ? 'MASTER' : isAdmin ? 'ADMIN' : 'USER'}
          </span>
        </div>
        <KeyRound size={13} className={`flex-shrink-0 ${isDark || isEmpresa ? 'text-gray-600' : 'text-gray-300'}`} />
      </button>

      <footer className={`text-center py-6 text-xs border-t mt-8 ${isDark || isEmpresa ? 'text-gray-600 border-white/5' : 'text-gray-300 border-gray-100'}`}>
        v3.0.0 &mdash; 2025 {labels.systemName}
      </footer>
    </div>
  );
}
