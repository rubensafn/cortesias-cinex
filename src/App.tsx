import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import { PendingApproval } from './components/PendingApproval';

function App() {
  const { user, loading, isApproved, userRole } = useAuth();
  const { theme } = useTheme();

  const isDark = theme === 'dark';

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-[#311b3c] via-[#330054] to-black' : 'bg-gradient-to-br from-gray-50 via-gray-100 to-white'}`}>
        <p className={isDark ? 'text-gray-500' : 'text-gray-400'}>Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (userRole === 'master' || userRole === 'admin') {
    return <Dashboard />;
  }

  if (userRole === 'user' && !isApproved) {
    return <PendingApproval />;
  }

  if (userRole === 'user' && isApproved) {
    return <Dashboard />;
  }

  return (
    <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-[#311b3c] via-[#330054] to-black' : 'bg-gradient-to-br from-gray-50 via-gray-100 to-white'}`}>
      <p className={isDark ? 'text-gray-500' : 'text-gray-400'}>Carregando perfil...</p>
    </div>
  );
}

export default App;
