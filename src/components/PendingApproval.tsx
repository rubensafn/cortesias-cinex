import { AlertCircle, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAppTheme } from '../hooks/useAppTheme';

export function PendingApproval() {
  const { user, signOut } = useAuth();
  const { toggleTheme } = useTheme();
  const { isDark, isEmpresa, pageBg } = useAppTheme();
  const { theme } = useTheme();

  const secondary   = isEmpresa ? '#0ea5e9' : '#ea0cac';
  const cardBg      = isDark ? (isEmpresa ? 'bg-[#0a1628] border-[#f59e0b]/20' : 'bg-[#311b3c] border-[#a700ff]/20') : 'bg-white border-gray-200';
  const infoBg      = isDark ? (isEmpresa ? 'bg-[#0f2035]/60' : 'bg-[#330054]/50') : 'bg-gray-50';
  const btnClass    = isDark ? (isEmpresa ? 'bg-[#0f2035] hover:bg-[#f59e0b]/20 text-gray-300' : 'bg-[#330054] hover:bg-[#a700ff]/30 text-gray-300') : 'bg-gray-100 hover:bg-gray-200 text-gray-700';
  const toggleClass = isDark ? (isEmpresa ? 'bg-[#0f2035]/50 hover:bg-[#f59e0b]/20 text-gray-400 hover:text-white' : 'bg-[#330054]/50 hover:bg-[#a700ff]/30 text-gray-400 hover:text-white') : 'bg-white/80 hover:bg-white text-gray-500 hover:text-gray-700 shadow-sm';

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative ${pageBg}`}>
      <button
        onClick={toggleTheme}
        className={`absolute top-4 right-4 p-2.5 rounded-lg transition-all ${toggleClass}`}
        aria-label="Alternar tema"
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className={`max-w-md w-full rounded-xl shadow-xl p-8 border ${cardBg}`}>
        <div className="flex flex-col items-center text-center">
          <div className="p-4 rounded-full mb-4" style={{ backgroundColor: `${secondary}20` }}>
            <AlertCircle className="w-12 h-12" style={{ color: secondary }} />
          </div>

          <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Aguardando Aprovacao
          </h1>

          <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Sua conta <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.email}</span> foi criada com sucesso, mas ainda precisa ser aprovada por um administrador.
          </p>

          <div className={`rounded-lg p-4 mb-6 w-full ${infoBg}`}>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Voce recebera acesso ao sistema assim que um administrador aprovar sua conta. Isso geralmente leva ate 24 horas.
            </p>
          </div>

          <button
            onClick={signOut}
            className={`w-full font-semibold py-2.5 px-4 rounded-lg transition-colors ${btnClass}`}
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}
