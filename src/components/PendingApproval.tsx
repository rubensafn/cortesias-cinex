import { AlertCircle, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export function PendingApproval() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative ${isDark ? 'bg-gradient-to-br from-[#311b3c] via-[#330054] to-black' : 'bg-gradient-to-br from-gray-50 via-gray-100 to-white'}`}>
      <button
        onClick={toggleTheme}
        className={`absolute top-4 right-4 p-2.5 rounded-lg transition-all ${isDark ? 'bg-[#330054]/50 hover:bg-[#a700ff]/30 text-gray-400 hover:text-white' : 'bg-white/80 hover:bg-white text-gray-500 hover:text-gray-700 shadow-sm'}`}
        aria-label="Alternar tema"
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className={`max-w-md w-full rounded-xl shadow-xl p-8 border ${isDark ? 'bg-[#311b3c] border-[#a700ff]/20' : 'bg-white border-gray-200'}`}>
        <div className="flex flex-col items-center text-center">
          <div className="bg-[#ea0cac]/20 p-4 rounded-full mb-4">
            <AlertCircle className="w-12 h-12 text-[#ea0cac]" />
          </div>

          <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Aguardando Aprovacao
          </h1>

          <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Sua conta <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.email}</span> foi criada com sucesso, mas ainda precisa ser aprovada por um administrador.
          </p>

          <div className={`rounded-lg p-4 mb-6 w-full ${isDark ? 'bg-[#330054]/50' : 'bg-gray-50'}`}>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Voce recebera acesso ao sistema assim que um administrador aprovar sua conta. Isso geralmente leva ate 24 horas.
            </p>
          </div>

          <button
            onClick={signOut}
            className={`w-full font-semibold py-2.5 px-4 rounded-lg transition-colors ${isDark ? 'bg-[#330054] hover:bg-[#a700ff]/30 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}
