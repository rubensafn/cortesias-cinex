import { useAuth } from './contexts/AuthContext';
import { useApp } from './contexts/AppContext';
import { useTheme } from './contexts/ThemeContext';
import AppSelector from './components/AppSelector';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import { PendingApproval } from './components/PendingApproval';

const isDevEnv = import.meta.env.DEV;

function DevBanner() {
  if (!isDevEnv) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-amber-500 text-black text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border border-amber-400 select-none">
      <span className="w-2 h-2 rounded-full bg-black opacity-60 animate-pulse inline-block" />
      AMBIENTE DEV
    </div>
  );
}

function App() {
  const { appMode } = useApp();
  const { user, loading, isApproved, userRole } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Sem app selecionado → tela de seleção
  if (!appMode) {
    return <><AppSelector /><DevBanner /></>;
  }

  if (loading) {
    const bgClass = isDark
      ? (appMode === 'empresa' ? 'bg-[#080f1a]' : 'bg-gradient-to-br from-[#311b3c] via-[#330054] to-black')
      : 'bg-gradient-to-br from-gray-50 via-gray-100 to-white';
    return (
      <div className={`min-h-screen flex items-center justify-center ${bgClass}`}>
        <p className={isDark ? 'text-gray-500' : 'text-gray-400'}>Carregando...</p>
        <DevBanner />
      </div>
    );
  }

  if (!user) {
    return <><LoginPage /><DevBanner /></>;
  }

  if (userRole === 'master_admin' || userRole === 'master' || userRole === 'admin') {
    return <><Dashboard /><DevBanner /></>;
  }

  if (userRole === 'user' && !isApproved) {
    return <><PendingApproval /><DevBanner /></>;
  }

  if (userRole === 'user' && isApproved) {
    return <><Dashboard /><DevBanner /></>;
  }

  const bgClass = isDark
    ? (appMode === 'empresa' ? 'bg-[#080f1a]' : 'bg-gradient-to-br from-[#311b3c] via-[#330054] to-black')
    : 'bg-gradient-to-br from-gray-50 via-gray-100 to-white';

  return (
    <div className={`min-h-screen flex items-center justify-center ${bgClass}`}>
      <p className={isDark ? 'text-gray-500' : 'text-gray-400'}>Carregando perfil...</p>
      <DevBanner />
    </div>
  );
}

export default App;
