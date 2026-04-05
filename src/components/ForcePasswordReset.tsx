import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppTheme } from '../hooks/useAppTheme';
import { KeyRound, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';

export default function ForcePasswordReset() {
  const { user, signOut, completePendingReset } = useAuth();
  const { isDark, isEmpresa, pageBg, cardBgAlt, inputBg, inputRing, primaryBtn, primaryBtnRing } = useAppTheme();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const accent = isEmpresa ? '#f59e0b' : '#a700ff';
  const accentSecondary = isEmpresa ? '#0ea5e9' : '#ea0cac';
  const username = user?.email?.split('@')[0] ?? '';

  const topAccent = isEmpresa
    ? 'from-transparent via-[#f59e0b]/60 to-transparent'
    : 'from-transparent via-[#a700ff]/60 to-transparent';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    const { error: err } = await completePendingReset(newPassword);
    if (err) {
      setError('Erro ao definir senha. Tente novamente.');
      setLoading(false);
    }
    // Se ok, needsPasswordReset vira false e App.tsx mostra o Dashboard
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${pageBg}`}>
      <div className="w-full max-w-md">
        <div className={`rounded-2xl shadow-2xl border p-8 relative overflow-hidden ${cardBgAlt}`}>
          <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${topAccent}`} />

          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg"
              style={{ background: `linear-gradient(135deg, ${accent}, ${accentSecondary})`, boxShadow: `0 8px 24px ${accent}40` }}
            >
              <ShieldCheck size={28} className="text-white" />
            </div>
            <h1 className={`text-2xl font-black mb-1 ${isDark || isEmpresa ? 'text-white' : 'text-gray-900'}`}>
              Criar Nova Senha
            </h1>
            <p className={`text-sm ${isDark || isEmpresa ? 'text-gray-400' : 'text-gray-500'}`}>
              Olá, <span className="font-semibold" style={{ color: accent }}>{username}</span>!
              Sua recuperação foi aprovada. Defina uma nova senha para continuar.
            </p>
          </div>

          {error && (
            <div className={`mb-5 p-3 border-l-4 border-red-500 rounded text-sm ${isDark || isEmpresa ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'}`}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-sm font-semibold mb-1.5 ${isDark || isEmpresa ? 'text-gray-300' : 'text-gray-700'}`}>
                Nova senha
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 ${inputRing} focus:border-transparent transition-all ${inputBg}`}
                  required
                  autoComplete="new-password"
                  placeholder="mín. 6 caracteres"
                  autoFocus
                />
                <button type="button" tabIndex={-1} onClick={() => setShowNew(v => !v)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded ${isDark || isEmpresa ? 'text-gray-500' : 'text-gray-400'}`}>
                  {showNew ? <Eye size={17} /> : <EyeOff size={17} />}
                </button>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-1.5 ${isDark || isEmpresa ? 'text-gray-300' : 'text-gray-700'}`}>
                Confirmar nova senha
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 ${inputRing} focus:border-transparent transition-all ${inputBg}`}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                />
                <button type="button" tabIndex={-1} onClick={() => setShowConfirm(v => !v)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded ${isDark || isEmpresa ? 'text-gray-500' : 'text-gray-400'}`}>
                  {showConfirm ? <Eye size={17} /> : <EyeOff size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full ${primaryBtn} ${primaryBtnRing} text-white py-3 px-4 rounded-lg focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold mt-2 flex items-center justify-center gap-2`}
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" />Salvando...</>
                : <><KeyRound size={16} />Definir senha e entrar</>
              }
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => signOut()}
              className={`text-xs ${isDark || isEmpresa ? 'text-gray-600 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
            >
              Sair e voltar ao login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
