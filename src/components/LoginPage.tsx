import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAppTheme } from '../hooks/useAppTheme';
import { Sun, Moon, Eye, EyeOff, Sparkles, Building2, Loader2, ArrowLeft, KeyRound, CheckCircle } from 'lucide-react';

type Screen = 'login' | 'recovery_form' | 'recovery_confirm' | 'recovery_pending' | 'recovery_master_set';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Recovery states
  const [screen, setScreen] = useState<Screen>('login');
  const [recoveryUsername, setRecoveryUsername] = useState('');
  const [recoveryNewPassword, setRecoveryNewPassword] = useState('');
  const [recoveryConfirmPassword, setRecoveryConfirmPassword] = useState('');
  const [showRecoveryPassword, setShowRecoveryPassword] = useState(false);
  const [recoveryMasterAdminId, setRecoveryMasterAdminId] = useState<string | null>(null);
  const [recoveryFoundId, setRecoveryFoundId] = useState<string>('');
  const [recoveryFoundRole, setRecoveryFoundRole] = useState<string>('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');

  const { signIn, signUp } = useAuth();
  const { db, tables, setAppMode } = useApp();
  const { toggleTheme } = useTheme();
  const { isDark, isEmpresa, pageBg, cardBgAlt, inputBg, inputRing, primaryBtn, primaryBtnRing, primary, secondary, labels } = useAppTheme();

  const AppIcon = isEmpresa ? Building2 : Sparkles;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim()) {
      setError('Por favor, informe o usuário.');
      return;
    }

    if (!isSignUp && !password) {
      // Senha vazia: só deixa passar se o usuário tem reset pendente/aprovado
      const { data: acc } = await db
        .from(tables.users)
        .select('reset_status')
        .eq('username', username.trim())
        .maybeSingle();
      const rs = acc?.reset_status ?? null;
      if (rs !== 'pending' && rs !== 'approved') {
        setError('A senha é obrigatória.');
        return;
      }
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
        // Se está aguardando aprovação de recuperação, mostra link para cancelar
      }
      setLoading(false);
    }
  };

  // Verifica o usuário e vai para confirmação (sem gravar ainda)
  const handleRecoveryRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');
    if (!recoveryUsername.trim()) return;
    setRecoveryLoading(true);

    const { data: account } = await db
      .from(tables.users)
      .select('id, role, reset_status')
      .eq('username', recoveryUsername.trim())
      .maybeSingle();

    setRecoveryLoading(false);

    if (!account) {
      setRecoveryError('Usuário não encontrado.');
      return;
    }

    const role = account.role as string;

    // master_admin: troca direto sem aprovação
    if (role === 'master_admin') {
      setRecoveryMasterAdminId(account.id);
      setScreen('recovery_master_set');
      return;
    }

    // Outros: vai para tela de confirmação (sem gravar ainda)
    setRecoveryFoundId(account.id);
    setRecoveryFoundRole(role);
    setScreen('recovery_confirm');
  };

  // Confirma e grava no DB apenas quando o usuário clica em Confirmar
  const handleRecoveryConfirm = async () => {
    setRecoveryLoading(true);
    const { error } = await db
      .from(tables.users)
      .update({ reset_status: 'pending' })
      .eq('id', recoveryFoundId);
    setRecoveryLoading(false);
    if (error) {
      setRecoveryError('Erro ao enviar solicitação. Tente novamente.');
      setScreen('recovery_form');
      return;
    }
    setScreen('recovery_pending');
  };

  // master_admin define nova senha diretamente
  const handleMasterAdminReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');
    if (recoveryNewPassword.length < 6) {
      setRecoveryError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (recoveryNewPassword !== recoveryConfirmPassword) {
      setRecoveryError('As senhas não coincidem.');
      return;
    }
    setRecoveryLoading(true);
    const { error } = await db
      .from(tables.users)
      .update({ password: recoveryNewPassword, reset_status: null })
      .eq('id', recoveryMasterAdminId);
    setRecoveryLoading(false);
    if (error) {
      setRecoveryError('Erro ao atualizar senha.');
      return;
    }
    // Faz login automático com a nova senha
    await signIn(recoveryUsername.trim(), recoveryNewPassword);
  };

  const resetRecovery = () => {
    setScreen('login');
    setRecoveryUsername('');
    setRecoveryNewPassword('');
    setRecoveryConfirmPassword('');
    setRecoveryError('');
    setRecoveryMasterAdminId(null);
    setRecoveryFoundId('');
    setRecoveryFoundRole('');
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

  const textMain = isDark || isEmpresa ? 'text-white' : 'text-gray-900';
  const textMuted = isDark || isEmpresa ? 'text-gray-400' : 'text-gray-500';
  const labelText = isDark || isEmpresa ? 'text-gray-300' : 'text-gray-700';

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
              <h2 className={`text-2xl font-bold mb-3 ${textMain}`}>Cadastro Realizado!</h2>
              <p className={`text-sm mb-6 ${textMuted}`}>
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

  // ── TELA: Confirmação antes de gravar ────────────────────────────────────
  if (screen === 'recovery_confirm') {
    const roleLabel = recoveryFoundRole === 'master' ? 'Master' : recoveryFoundRole === 'admin' ? 'Admin' : 'Usuário';
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 relative transition-colors duration-300 ${pageBg}`}>
        <div className="w-full max-w-md">
          <div className={`rounded-2xl shadow-2xl p-8 border ${cardBgAlt} relative overflow-hidden`}>
            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${topAccent}`} />
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setScreen('recovery_form')} className={`p-1.5 rounded-lg transition-colors ${textMuted} hover:opacity-80`}>
                <ArrowLeft size={18} />
              </button>
              <div>
                <h2 className={`text-xl font-bold ${textMain}`}>Confirmar Solicitação</h2>
                <p className={`text-xs ${textMuted}`}>Revise antes de enviar</p>
              </div>
            </div>

            {recoveryError && (
              <div className={`mb-4 p-3 border-l-4 border-red-500 rounded text-sm ${isDark || isEmpresa ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'}`}>
                {recoveryError}
              </div>
            )}

            <div className={`p-4 rounded-xl mb-6 ${isDark || isEmpresa ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${primary}20` }}>
                  <span className="text-sm font-black uppercase" style={{ color: primary }}>
                    {recoveryUsername.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className={`text-sm font-semibold ${textMain}`}>{recoveryUsername}</p>
                  <p className={`text-xs ${textMuted}`}>{roleLabel}</p>
                </div>
              </div>
            </div>

            <p className={`text-sm mb-6 ${textMuted}`}>
              Ao confirmar, você não poderá mais entrar no sistema com sua senha atual até que um administrador aprove a solicitação.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setScreen('recovery_form')}
                disabled={recoveryLoading}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${
                  isDark || isEmpresa ? 'bg-white/10 hover:bg-white/20 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={handleRecoveryConfirm}
                disabled={recoveryLoading}
                className={`flex-1 ${primaryBtn} ${primaryBtnRing} text-white py-2.5 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2`}
              >
                {recoveryLoading
                  ? <><Loader2 size={14} className="animate-spin" />Enviando...</>
                  : 'Confirmar'
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── TELA: Pedido enviado (aguardando aprovação) ───────────────────────────
  if (screen === 'recovery_pending') {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 relative transition-colors duration-300 ${pageBg}`}>
        <div className="w-full max-w-md">
          <div className={`rounded-2xl shadow-2xl p-8 border ${cardBgAlt} relative overflow-hidden`}>
            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${topAccent}`} />
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full mb-6">
                <CheckCircle size={40} className="text-white" />
              </div>
              <h2 className={`text-2xl font-bold mb-3 ${textMain}`}>Solicitação Enviada!</h2>
              <p className={`text-sm mb-4 ${textMuted}`}>
                Sua solicitação de recuperação de senha foi registrada para o usuário{' '}
                <span className="font-semibold" style={{ color: primary }}>{recoveryUsername}</span>.
              </p>
              <div className={`p-4 rounded-lg mb-6 text-left ${isDark || isEmpresa ? 'bg-amber-900/20 border border-amber-700/30' : 'bg-amber-50 border border-amber-200'}`}>
                <p className={`text-sm font-semibold mb-1 ${isDark || isEmpresa ? 'text-amber-400' : 'text-amber-700'}`}>O que acontece agora:</p>
                <ul className={`text-xs space-y-1 ${isDark || isEmpresa ? 'text-amber-300/70' : 'text-amber-600'}`}>
                  <li>• Um administrador irá revisar e aprovar sua solicitação</li>
                  <li>• Na próxima tentativa de login, você poderá definir uma nova senha</li>
                  <li>• Nenhuma senha é necessária nesse momento</li>
                </ul>
              </div>
              <button
                onClick={resetRecovery}
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

  // ── TELA: master_admin define nova senha direto ───────────────────────────
  if (screen === 'recovery_master_set') {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 relative transition-colors duration-300 ${pageBg}`}>
        <div className="w-full max-w-md">
          <div className={`rounded-2xl shadow-2xl p-8 border ${cardBgAlt} relative overflow-hidden`}>
            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${topAccent}`} />
            <div className="flex items-center gap-3 mb-6">
              <button onClick={resetRecovery} className={`p-1.5 rounded-lg transition-colors ${textMuted} hover:opacity-80`}>
                <ArrowLeft size={18} />
              </button>
              <div>
                <h2 className={`text-xl font-bold ${textMain}`}>Criar Nova Senha</h2>
                <p className={`text-xs ${textMuted}`}>{recoveryUsername} · Master Admin</p>
              </div>
            </div>

            {recoveryError && (
              <div className={`mb-4 p-3 border-l-4 border-red-500 rounded text-sm ${isDark || isEmpresa ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'}`}>
                {recoveryError}
              </div>
            )}

            <form onSubmit={handleMasterAdminReset} className="space-y-4">
              <div>
                <label className={`block text-sm font-semibold mb-1.5 ${labelText}`}>Nova senha</label>
                <div className="relative">
                  <input
                    type={showRecoveryPassword ? 'text' : 'password'}
                    value={recoveryNewPassword}
                    onChange={e => setRecoveryNewPassword(e.target.value)}
                    className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 ${inputRing} focus:border-transparent transition-all ${inputBg}`}
                    required autoFocus autoComplete="new-password" placeholder="mín. 6 caracteres"
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowRecoveryPassword(v => !v)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 ${textMuted}`}>
                    {showRecoveryPassword ? <Eye size={17} /> : <EyeOff size={17} />}
                  </button>
                </div>
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-1.5 ${labelText}`}>Confirmar nova senha</label>
                <input
                  type="password"
                  value={recoveryConfirmPassword}
                  onChange={e => setRecoveryConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${inputRing} focus:border-transparent transition-all ${inputBg}`}
                  required autoComplete="new-password" placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={recoveryLoading}
                className={`w-full ${primaryBtn} ${primaryBtnRing} text-white py-3 px-4 rounded-lg focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold flex items-center justify-center gap-2`}
              >
                {recoveryLoading
                  ? <><Loader2 size={16} className="animate-spin" />Salvando...</>
                  : <><KeyRound size={16} />Definir senha e entrar</>
                }
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── TELA: Formulário de recuperação ─────────────────────────────────────
  if (screen === 'recovery_form') {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 relative transition-colors duration-300 ${pageBg}`}>
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <div className="flex items-center rounded-full p-1 gap-0.5 bg-white/10 border border-white/15 backdrop-blur-sm">
            <button
              onClick={() => !isEmpresa ? undefined : setAppMode('cortesias')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                !isEmpresa
                  ? 'bg-gradient-to-r from-[#a700ff] to-[#ea0cac] text-white shadow-md cursor-default'
                  : 'text-white/40 hover:text-white/70 cursor-pointer'
              }`}
            >
              <Sparkles size={14} />Cortesias
            </button>
            <button
              onClick={() => isEmpresa ? undefined : setAppMode('empresa')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                isEmpresa
                  ? 'bg-gradient-to-r from-[#f59e0b] to-[#0ea5e9] text-white shadow-md cursor-default'
                  : 'text-white/40 hover:text-white/70 cursor-pointer'
              }`}
            >
              <Building2 size={14} />Empresa
            </button>
          </div>
          <button onClick={toggleTheme} className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className={`rounded-2xl shadow-2xl p-8 border ${cardBgAlt} relative overflow-hidden`}>
            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${topAccent}`} />

            <div className="flex items-center gap-3 mb-6">
              <button onClick={resetRecovery} className={`p-1.5 rounded-lg transition-colors ${textMuted} hover:opacity-80`}>
                <ArrowLeft size={18} />
              </button>
              <div>
                <h2 className={`text-xl font-bold ${textMain}`}>Recuperar Senha</h2>
                <p className={`text-xs ${textMuted}`}>Digite seu nome de usuário</p>
              </div>
            </div>

            {recoveryError && (
              <div className={`mb-4 p-3 border-l-4 border-red-500 rounded text-sm ${isDark || isEmpresa ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'}`}>
                {recoveryError}
              </div>
            )}

            <form onSubmit={handleRecoveryRequest}>
              <div className="mb-6">
                <label className={`block text-sm font-semibold mb-2 ${labelText}`}>Usuário</label>
                <input
                  type="text"
                  value={recoveryUsername}
                  onChange={e => setRecoveryUsername(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${inputRing} focus:border-transparent transition-all ${inputBg}`}
                  required autoFocus placeholder="Digite seu usuário"
                />
              </div>
              <button
                type="submit"
                disabled={recoveryLoading}
                className={`w-full ${primaryBtn} ${primaryBtnRing} text-white py-3 px-4 rounded-lg focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold flex items-center justify-center gap-2`}
              >
                {recoveryLoading
                  ? <><Loader2 size={16} className="animate-spin" />Verificando...</>
                  : 'Solicitar Recuperação'
                }
              </button>
            </form>

            <div className={`mt-6 text-center text-xs ${textMuted}`}>
              Lembrou a senha?{' '}
              <button onClick={resetRecovery} className="font-semibold hover:opacity-80 transition-opacity" style={{ color: secondary }}>
                Voltar ao login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── TELA: Login normal ───────────────────────────────────────────────────
  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative transition-colors duration-300 ${pageBg}`}>

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[500px] h-[500px] rounded-full blur-[100px] opacity-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ background: `radial-gradient(circle, ${primary}, transparent)` }}
        />
      </div>

      {/* Top bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        <div className="flex items-center rounded-full p-1 gap-0.5 bg-white/10 border border-white/15 backdrop-blur-sm">
          <button
            onClick={() => !isEmpresa ? undefined : setAppMode('cortesias')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
              !isEmpresa
                ? 'bg-gradient-to-r from-[#a700ff] to-[#ea0cac] text-white shadow-md cursor-default'
                : 'text-white/40 hover:text-white/70 cursor-pointer'
            }`}
            title={!isEmpresa ? 'Sistema atual' : 'Trocar para Cortesias'}
          >
            <Sparkles size={14} />
            Cortesias
          </button>
          <button
            onClick={() => isEmpresa ? undefined : setAppMode('empresa')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
              isEmpresa
                ? 'bg-gradient-to-r from-[#f59e0b] to-[#0ea5e9] text-white shadow-md cursor-default'
                : 'text-white/40 hover:text-white/70 cursor-pointer'
            }`}
            title={isEmpresa ? 'Sistema atual' : 'Trocar para Empresa'}
          >
            <Building2 size={14} />
            Empresa
          </button>
        </div>
        <button onClick={toggleTheme} className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all" aria-label="Alternar tema">
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className={`rounded-2xl shadow-2xl p-8 border transition-colors duration-300 ${cardBgAlt} relative overflow-hidden`}>

          <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${topAccent}`} />

          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-16 h-16 ${iconBg} rounded-2xl mb-4 shadow-lg`}
              style={{ boxShadow: `0 8px 24px ${primary}40` }}>
              <AppIcon size={28} className="text-white" />
            </div>
            <h1 className={`text-3xl font-black mb-1 ${textMain}`}>
              Cinex <span className={gradientText}>{isEmpresa ? 'Empresa' : 'Cortesias'}</span>
            </h1>
            <p className={`text-sm ${textMuted}`}>
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
              <label className={`block text-sm font-semibold mb-2 ${labelText}`}>Usuário</label>
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
              <label className={`block text-sm font-semibold mb-2 ${labelText}`}>Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 ${inputRing} focus:border-transparent transition-all ${inputBg}`}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  placeholder={isSignUp ? 'mín. 6 caracteres' : 'Digite sua senha'}
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

          <div className="mt-4 text-center">
            {!isSignUp && (
              <button
                onClick={() => { setScreen('recovery_form'); setError(''); }}
                className={`text-sm transition-colors hover:opacity-80`}
                style={{ color: secondary }}
              >
                Esqueceu a senha?
              </button>
            )}
          </div>

          <div className="mt-4 text-center">
            <p className={`text-sm ${textMuted}`}>
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
