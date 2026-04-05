import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useAppTheme } from '../hooks/useAppTheme';
import { KeyRound, Eye, EyeOff, X, Loader2, CheckCircle } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function ChangePasswordModal({ onClose }: Props) {
  const { db, tables } = useApp();
  const { user } = useAuth();
  const { isDark, isEmpresa, cardBg, inputBg, inputRing, primaryBtn, primaryBtnRing } = useAppTheme();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const username = user?.email?.split('@')[0] ?? '';
  const accent = isEmpresa ? '#f59e0b' : '#a700ff';
  const textMuted = isDark || isEmpresa ? 'text-gray-400' : 'text-gray-500';
  const textMain = isDark || isEmpresa ? 'text-white' : 'text-gray-900';
  const labelText = isDark || isEmpresa ? 'text-gray-300' : 'text-gray-700';

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

    // Verify current password
    const { data: account } = await db
      .from(tables.users)
      .select('id, password')
      .eq('username', username)
      .maybeSingle();

    if (!account || account.password !== currentPassword) {
      setError('Senha atual incorreta.');
      setLoading(false);
      return;
    }

    // Update password
    const { error: updateError } = await db
      .from(tables.users)
      .update({ password: newPassword })
      .eq('id', account.id);

    if (updateError) {
      setError('Erro ao atualizar senha. Tente novamente.');
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className={`w-full max-w-sm rounded-2xl border shadow-2xl ${cardBg}`}>

        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ background: `${accent}20` }}>
              <KeyRound size={18} style={{ color: accent }} />
            </div>
            <h3 className={`font-bold text-lg ${textMain}`}>Trocar Senha</h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${isDark || isEmpresa ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
                <CheckCircle size={32} className="text-green-400" />
              </div>
              <p className={`font-semibold mb-1 ${textMain}`}>Senha alterada!</p>
              <p className={`text-sm mb-6 ${textMuted}`}>Sua senha foi atualizada com sucesso.</p>
              <button
                onClick={onClose}
                className={`w-full ${primaryBtn} ${primaryBtnRing} text-white py-2.5 rounded-lg font-semibold focus:outline-none focus:ring-2 transition-all`}
              >
                Fechar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className={`text-xs mb-2 ${textMuted}`}>
                Usuário: <span className={`font-semibold ${textMain}`}>{username}</span>
              </p>

              {error && (
                <div className={`p-3 border-l-4 border-red-500 rounded text-sm ${isDark || isEmpresa ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'}`}>
                  {error}
                </div>
              )}

              {/* Current password */}
              <div>
                <label className={`block text-sm font-semibold mb-1.5 ${labelText}`}>Senha atual</label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    className={`w-full px-3 py-2.5 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 ${inputRing} focus:border-transparent transition-all ${inputBg}`}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowCurrent(v => !v)}
                    className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors ${textMuted}`}>
                    {showCurrent ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <label className={`block text-sm font-semibold mb-1.5 ${labelText}`}>Nova senha</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className={`w-full px-3 py-2.5 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 ${inputRing} focus:border-transparent transition-all ${inputBg}`}
                    required
                    autoComplete="new-password"
                    placeholder="mín. 6 caracteres"
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowNew(v => !v)}
                    className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors ${textMuted}`}>
                    {showNew ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label className={`block text-sm font-semibold mb-1.5 ${labelText}`}>Confirmar nova senha</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className={`w-full px-3 py-2.5 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 ${inputRing} focus:border-transparent transition-all ${inputBg}`}
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowConfirm(v => !v)}
                    className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors ${textMuted}`}>
                    {showConfirm ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    isDark || isEmpresa ? 'bg-white/10 hover:bg-white/20 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 ${primaryBtn} ${primaryBtnRing} text-white py-2.5 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2`}
                >
                  {loading ? <><Loader2 size={14} className="animate-spin" />Salvando...</> : 'Salvar'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
