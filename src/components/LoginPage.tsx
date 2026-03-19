import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LogIn, Sun, Moon, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === 'dark';

  if (signupSuccess) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 relative transition-colors duration-300 ${isDark ? 'bg-gradient-to-br from-[#311b3c] via-[#330054] to-black' : 'bg-gradient-to-br from-gray-100 via-white to-gray-50'}`}>
        <button
          onClick={toggleTheme}
          className={`absolute top-4 right-4 p-2.5 rounded-lg transition-all ${isDark ? 'bg-[#330054]/50 hover:bg-[#a700ff]/30 text-gray-400 hover:text-white' : 'bg-white/80 hover:bg-[#a700ff]/10 text-gray-600 hover:text-[#a700ff] shadow-md'}`}
          aria-label="Alternar tema"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="w-full max-w-md">
          <div className={`rounded-2xl shadow-2xl p-8 border transition-colors duration-300 ${isDark ? 'bg-[#311b3c] border-[#a700ff]/20' : 'bg-white border-gray-200'}`}>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Cadastro Realizado!</h2>
              <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Sua conta foi criada com sucesso. Aguarde a aprovação de um administrador para acessar o sistema.
              </p>
              <div className={`p-4 rounded-lg mb-6 ${isDark ? 'bg-blue-900/30 border border-blue-700/50' : 'bg-blue-50 border border-blue-200'}`}>
                <p className={`text-sm font-semibold ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                  Usuário: <span className={isDark ? 'text-blue-300' : 'text-blue-600'}>{username}</span>
                </p>
              </div>
              <button
                onClick={() => {
                  setSignupSuccess(false);
                  setIsSignUp(false);
                  setUsername('');
                  setPassword('');
                  setError('');
                }}
                className="w-full bg-gradient-to-r from-[#a700ff] to-[#ea0cac] text-white py-3 px-4 rounded-lg hover:from-[#8a00d4] hover:to-[#c00a8f] focus:outline-none focus:ring-2 focus:ring-[#a700ff] transition-all font-semibold"
              >
                Voltar ao Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);

    if (isSignUp) {
      const { error } = await signUp(username, password);
      if (error) {
        setError(error.message || 'Erro ao criar conta. Tente outro usuario.');
        setLoading(false);
      } else {
        setSignupSuccess(true);
        setLoading(false);
      }
    } else {
      const { error } = await signIn(username, password);
      if (error) {
        if (error.message.includes('aguardando aprovação')) {
          setError(error.message);
        } else {
          setError('Usuario ou senha incorretos. Por favor, tente novamente.');
        }
      }
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative transition-colors duration-300 ${isDark ? 'bg-gradient-to-br from-[#311b3c] via-[#330054] to-black' : 'bg-gradient-to-br from-gray-100 via-white to-gray-50'}`}>
      <button
        onClick={toggleTheme}
        className={`absolute top-4 right-4 p-2.5 rounded-lg transition-all ${isDark ? 'bg-[#330054]/50 hover:bg-[#a700ff]/30 text-gray-400 hover:text-white' : 'bg-white/80 hover:bg-[#a700ff]/10 text-gray-600 hover:text-[#a700ff] shadow-md'}`}
        aria-label="Alternar tema"
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="w-full max-w-md">
        <div className={`rounded-2xl shadow-2xl p-8 border transition-colors duration-300 ${isDark ? 'bg-[#311b3c] border-[#a700ff]/20' : 'bg-white border-gray-200'}`}>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#a700ff] to-[#ea0cac] rounded-full mb-4">
              <LogIn size={32} className="text-white" />
            </div>
            <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Cinex Ingressos</h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {isSignUp ? 'Crie sua conta para comecar' : 'Entre com suas credenciais'}
            </p>
          </div>

          {error && (
            <div className={`mb-6 p-4 border-l-4 border-red-500 rounded ${isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'}`}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="username" className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Usuario
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a700ff] focus:border-transparent transition-all ${isDark ? 'bg-[#330054] border-[#a700ff]/30 text-white placeholder-[#9a7aaa]' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`}
                required
                autoComplete="username"
                placeholder="Digite seu usuario"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="password" className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a700ff] focus:border-transparent transition-all ${isDark ? 'bg-[#330054] border-[#a700ff]/30 text-white placeholder-[#9a7aaa]' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`}
                  required
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  placeholder="Digite sua senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors text-[#ea0cac] hover:text-[#a700ff]"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#a700ff] to-[#ea0cac] text-white py-3 px-4 rounded-lg hover:from-[#8a00d4] hover:to-[#c00a8f] focus:outline-none focus:ring-2 focus:ring-[#a700ff] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
            >
              {loading ? (isSignUp ? 'Criando conta...' : 'Entrando...') : isSignUp ? 'Criar Conta' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {isSignUp ? 'Ja tem uma conta?' : 'Nao tem uma conta?'}{' '}
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                className="text-[#ea0cac] hover:text-[#a700ff] font-semibold transition-colors"
              >
                {isSignUp ? 'Entrar' : 'Cadastre-se'}
              </button>
            </p>
          </div>

          <div className={`mt-8 text-center text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            v2.0.0 - 2025 | Cinex Cortesia
          </div>
        </div>
      </div>
    </div>
  );
}
