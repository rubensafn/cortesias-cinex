import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import { PendingApproval } from './components/PendingApproval';

const DEV_SUPABASE_URL = 'gdtfwmqbvsqtxtccrydv';
const isDevEnv = import.meta.env.VITE_SUPABASE_URL?.includes(DEV_SUPABASE_URL);

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
  const { user, loading, isApproved, userRole } = useAuth();
  const { theme } = useTheme();

  const isDark = theme === 'dark';

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-[#311b3c] via-[#330054] to-black' : 'bg-gradient-to-br from-gray-50 via-gray-100 to-white'}`}>
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

  return (
    <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-[#311b3c] via-[#330054] to-black' : 'bg-gradient-to-br from-gray-50 via-gray-100 to-white'}`}>
      <p className={isDark ? 'text-gray-500' : 'text-gray-400'}>Carregando perfil...</p>
      <DevBanner />
    </div>
  );
}

export default App;
