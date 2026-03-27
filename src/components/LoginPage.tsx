import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAppTheme } from '../hooks/useAppTheme';
import { LogIn, Sun, Moon, Eye, EyeOff, ArrowLeft, Sparkles, Building2 } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { signIn, signUp } = useAuth();
  const { appMode, setAppMode } = useApp();
  const { toggleTheme } = useTheme();
  const { isDark, isEmpresa, pageBg, cardBgAlt, inputBg, inputRing, primaryBtn, primaryBtnRing, primary, secondary, labels } = useAppTheme();

  const AppIcon = isEmpresa ? Building2 : Sparkles;

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
        setError(error.message || 'Erro ao criar conta.');
        setLoading(false);
      } else {
        setSignupSuccess(true);
        setLoading(false);
      }
    } else {
      const { error } = await signIn(username, password);
      if (error) {
        setError(error.message.includes('aguardando aprovação')
          ? error.message
          : 'Usuário ou senha incorretos.');
      }
      setLoading(false);
    }
  };

  const gradientText = isEmpresa
    ? 'bg-gradient-to-r from-[#f59e0b] to-[#0ea5e9] bg-clip-text text-transparent'
    : 'bg-gradient-to-r from-[#a700ff] to-[#ea0cac] bg-clip-text text-transparent';

  const iconBg = isEmpresa
    ? 'bg-gradient-to-br from-[#d97706] to-[#0284c7]'
    : 'bg-gradient-to-br from-[#a700ff] to-[#ea0cac]';

  const topAccent = isEmpresa
    ? 'from-transparent via-[#f59e0b]/60 to-transparent'
    : 'from-transparent via-[#a700ff]/60 to-transparent';

  if (signupSuccess) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 relative transition-colors duration-300 ${pageBg}`}>
        <button onClick={toggleTheme} className="absolute top-4 right-4 p-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all">
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <div className="w-full max-w-md">
          <div className={`rounded-2xl shadow-2xl p-8 border transition-colors duration-300 ${cardBgAlt} relative overflow-hidden`}>
            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${topAccent}`} />
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className={`text-2xl font-bold mb-3 ${isDark || isEmpresa ? 'text-white' : 'text-gray-900'}`}>Cadastro Realizado!</h2>
              <p className={`text-sm mb-6 ${isDark || isEmpresa ? 'text-gray-400' : 'text-gray-600'}`}>
                Sua conta foi criada. Aguarde a aprovação de um administrador.
              </p>
              <div className={`p-4 rounded-lg mb-6 ${isDark || isEmpresa ? 'bg-blue-900/30 border border-blue-700/50' : 'bg-blue-50 border border-blue-200'}`}>
                <p className={`text-sm font-semibold ${isDark || isEmpresa ? 'text-blue-400' : 'text-blue-700'}`}>
                  Usuário: <span className={isDark || isEmpresa ? 'text-blue-300' : 'text-blue-600'}>{username}</span>
                </p>
              </div>
              <button
                onClick={() => { setSignupSuccess(false); setIsSignUp(false); setUsername(''); setPassword(''); setError(''); }}
                className={`w-full ${primaryBtn} ${primaryBtnRing} text-white py-3 px-4 rounded-lg focus:outline-none focus:ring-2 transition-all font-semibold`}
              >
                Voltar ao Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative transition-colors duration-300 ${pageBg}`}>

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[500px] h-[500px] rounded-full blur-[100px] opacity-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ background: `radial-gradient(circle, ${primary}, transparent)` }}
        />
      </div>

      {/* Top controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button onClick={toggleTheme} className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all" aria-label="Alternar tema">
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Back to selector */}
      <button
        onClick={() => setAppMode(null)}
        className="absolute top-4 left-4 flex items-center gap-2 text-white/40 hover:text-white/80 text-sm font-medium transition-colors px-3 py-2 rounded-lg hover:bg-white/10"
      >
        <ArrowLeft size={16} />
        <span className="hidden sm:inline">Trocar sistema</span>
      </button>

      <div className="w-full max-w-md relative z-10">
        <div className={`rounded-2xl shadow-2xl p-8 border transition-colors duration-300 ${cardBgAlt} relative overflow-hidden`}>

          {/* Top accent line */}
          <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${topAccent}`} />

          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-16 h-16 ${iconBg} rounded-2xl mb-4 shadow-lg`}
              style={{ boxShadow: `0 8px 24px ${primary}40` }}>
              <AppIcon size={28} className="text-white" />
            </div>
            <h1 className={`text-3xl font-black mb-1 ${isDark || isEmpresa ? 'text-white' : 'text-gray-900'}`}>
              Cinex <span className={gradientText}>{isEmpresa ? 'Empresa' : 'Cortesias'}</span>
            </h1>
            <p className={`text-sm ${isDark || isEmpresa ? 'text-gray-400' : 'text-gray-500'}`}>
              {isSignUp ? 'Crie sua conta para começar' : 'Entre com suas credenciais'}
            </p>
          </div>

          {error && (
            <div className={`mb-6 p-4 border-l-4 border-red-500 rounded ${isDark || isEmpresa ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'}`}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className={`block text-sm font-semibold mb-2 ${isDark || isEmpresa ? 'text-gray-300' : 'text-gray-700'}`}>Usuário</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${inputRing} focus:border-transparent transition-all ${inputBg}`}
                required
                autoComplete="username"
                placeholder="Digite seu usuário"
              />
            </div>
            <div className="mb-6">
              <label className={`block text-sm font-semibold mb-2 ${isDark || isEmpresa ? 'text-gray-300' : 'text-gray-700'}`}>Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 ${inputRing} focus:border-transparent transition-all ${inputBg}`}
                  required
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  placeholder="Digite sua senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors"
                  style={{ color: secondary }}
                  tabIndex={-1}
                >
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full ${primaryBtn} ${primaryBtnRing} text-white py-3 px-4 rounded-lg focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold`}
            >
              {loading ? (isSignUp ? 'Criando conta...' : 'Entrando...') : isSignUp ? 'Criar Conta' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className={`text-sm ${isDark || isEmpresa ? 'text-gray-400' : 'text-gray-500'}`}>
              {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}{' '}
              <button
                onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                className="font-semibold transition-colors hover:opacity-80"
                style={{ color: secondary }}
              >
                {isSignUp ? 'Entrar' : 'Cadastre-se'}
              </button>
            </p>
          </div>

          <div className={`mt-8 text-center text-xs ${isDark || isEmpresa ? 'text-gray-600' : 'text-gray-400'}`}>
            v3.0.0 — 2025 | {labels.systemName}
          </div>
        </div>
      </div>
    </div>
  );
}
