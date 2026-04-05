import { useEffect, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useAppTheme } from '../hooks/useAppTheme';
import { Shield, User as UserIcon, Crown, Trash2, CheckCircle, Clock, Loader2, KeyRound, X } from 'lucide-react';

interface UserProfile {
  user_id: string;
  username: string;
  email: string;
  role: 'master_admin' | 'master' | 'admin' | 'user';
  approved: boolean;
  reset_status: string | null;
  created_at: string;
}

export default function UserManagement() {
  const { db, tables } = useApp();
  const { isMaster, isAdmin, user, userRole } = useAuth();
  const { isDark, isEmpresa, cardBg } = useAppTheme();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'aprovados' | 'pendentes' | 'recuperacao'>('aprovados');
  const [deleteConfirm, setDeleteConfirm] = useState<UserProfile | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await db
        .from(tables.users)
        .select('id, username, role, approved, reset_status, created_at')
        .order('created_at', { ascending: true });
      if (error) throw error;
      setUsers((data || []).map((u: any) => ({
        user_id: u.id, username: u.username,
        email: u.username + '@cinex.com', role: u.role || 'user',
        approved: u.approved ?? false,
        reset_status: u.reset_status ?? null,
        created_at: u.created_at,
      })));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const deleteUser = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    const { error } = await db.from(tables.users).delete().eq('id', deleteConfirm.user_id);
    if (!error) {
      setUsers(prev => prev.filter(u => u.user_id !== deleteConfirm.user_id));
    }
    setDeleting(false);
    setDeleteConfirm(null);
  };

  const changeRole = async (userId: string, newRole: 'admin' | 'user') => {
    const { error } = await db.from(tables.users).update({ role: newRole }).eq('id', userId);
    if (error) { alert('Erro ao atualizar cargo: ' + error.message); return; }
    setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, role: newRole } : u));
  };

  const approveUser = async (userId: string, approve: boolean) => {
    const { error } = await db.from(tables.users).update({ approved: approve }).eq('id', userId);
    if (error) { alert('Erro ao atualizar aprovação: ' + error.message); return; }
    setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, approved: approve } : u));
  };

  // Aprova recuperação de senha (set reset_status = 'approved')
  const approveReset = async (userId: string) => {
    const { error } = await db.from(tables.users).update({ reset_status: 'approved' }).eq('id', userId);
    if (error) { alert('Erro ao aprovar recuperação: ' + error.message); return; }
    setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, reset_status: 'approved' } : u));
  };

  // Rejeita recuperação de senha (set reset_status = null)
  const rejectReset = async (userId: string) => {
    const { error } = await db.from(tables.users).update({ reset_status: null }).eq('id', userId);
    if (error) { alert('Erro ao rejeitar recuperação: ' + error.message); return; }
    setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, reset_status: null } : u));
  };

  // Verifica se o usuário logado pode aprovar recuperação do solicitante
  const canApproveReset = (targetRole: string) => {
    if (userRole === 'master_admin') return true;
    if (userRole === 'master') return targetRole === 'admin' || targetRole === 'user';
    if (userRole === 'admin') return targetRole === 'user';
    return false;
  };

  const primary = isEmpresa ? '#f59e0b' : '#a700ff';
  const secondary = isEmpresa ? '#0ea5e9' : '#ea0cac';

  const getRoleIcon = (role: string) => {
    if (role === 'master_admin' || role === 'master') return <Crown className="w-4 h-4" style={{ color: secondary }} />;
    if (role === 'admin') return <Shield className="w-4 h-4" style={{ color: primary }} />;
    return <UserIcon className={`w-4 h-4 ${isDark || isEmpresa ? 'text-gray-400' : 'text-gray-500'}`} />;
  };

  const getRoleBadge = (role: string) => {
    if (role === 'master_admin' || role === 'master')
      return <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: `${secondary}20`, color: secondary }}>MASTER</span>;
    if (role === 'admin')
      return <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: `${primary}20`, color: primary }}>ADMIN</span>;
    return <span className={`px-2 py-0.5 rounded text-xs font-bold ${isDark || isEmpresa ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>USUÁRIO</span>;
  };

  const approvedUsers = users.filter(u => u.approved);
  const pendingUsers = users.filter(u => !u.approved);
  const resetPendingUsers = users.filter(u => u.reset_status === 'pending');

  const borderColor = isDark || isEmpresa ? (isEmpresa ? 'border-[#f59e0b]/20' : 'border-[#a700ff]/20') : 'border-gray-200';
  const rowBorder = isDark || isEmpresa ? (isEmpresa ? 'border-[#f59e0b]/10 hover:bg-[#f59e0b]/5' : 'border-[#a700ff]/10 hover:bg-[#330054]/30') : 'border-gray-50 hover:bg-gray-50';
  const thText = isDark || isEmpresa ? 'text-gray-400' : 'text-gray-600';

  if (loading) return <div className={`text-center py-12 ${isDark || isEmpresa ? 'text-gray-500' : 'text-gray-500'}`}>Carregando usuários...</div>;

  const renderUserRow = (u: UserProfile) => {
    const isMasterUser = u.role === 'master_admin' || u.role === 'master';
    const isCurrentUser = u.user_id === user?.id;
    const canModify = (isMaster && !isMasterUser && !isCurrentUser) || (isAdmin && !isMaster && u.role === 'user' && !isCurrentUser);
    const canDelete = !isCurrentUser && !isMasterUser && (isMaster || (isAdmin && u.role === 'user'));

    return (
      <tr key={u.user_id} className={`border-b ${rowBorder}`}>
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            {getRoleIcon(u.role)}
            <span className={`text-xs font-medium ${isDark || isEmpresa ? 'text-gray-300' : 'text-gray-700'}`}>
              {u.username}
              {isCurrentUser && <span className="ml-1" style={{ color: secondary }}>(você)</span>}
            </span>
          </div>
        </td>
        <td className="py-3 px-4">
          <span className={`text-xs ${isDark || isEmpresa ? 'text-gray-300' : 'text-gray-700'}`}>{u.email}</span>
        </td>
        <td className="py-3 px-4">{getRoleBadge(u.role)}</td>
        <td className="py-3 px-4">
          {!u.approved ? (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => approveUser(u.user_id, true)}
                className="text-xs px-3 py-1 rounded font-semibold bg-green-900/30 hover:bg-green-900/50 text-green-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />Aprovar
              </button>
              {canDelete && (
                <button onClick={() => setDeleteConfirm(u)}
                  className="text-xs px-3 py-1 rounded font-semibold bg-red-900/30 hover:bg-red-900/50 text-red-400 flex items-center gap-1">
                  <Trash2 className="w-3 h-3" />Recusar
                </button>
              )}
            </div>
          ) : canModify ? (
            <div className="flex flex-wrap gap-2">
              {u.role === 'user' && (
                <button onClick={() => changeRole(u.user_id, 'admin')}
                  className="text-xs px-3 py-1 rounded font-semibold transition-colors"
                  style={{ background: `${primary}20`, color: primary }}>
                  Promover Admin
                </button>
              )}
              {u.role === 'admin' && isMaster && (
                <button onClick={() => changeRole(u.user_id, 'user')}
                  className={`text-xs px-3 py-1 rounded font-semibold transition-colors ${isDark || isEmpresa ? 'bg-white/10 hover:bg-white/20 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                  Rebaixar Usuário
                </button>
              )}
              {canDelete && (
                <button onClick={() => setDeleteConfirm(u)}
                  className="text-xs px-3 py-1 rounded font-semibold bg-red-900/30 hover:bg-red-900/50 text-red-400 flex items-center gap-1">
                  <Trash2 className="w-3 h-3" />Excluir
                </button>
              )}
            </div>
          ) : isMasterUser && !isCurrentUser ? (
            <span className={`text-xs italic ${isDark || isEmpresa ? 'text-gray-500' : 'text-gray-400'}`}>Protegido</span>
          ) : isCurrentUser ? (
            <span className="text-xs italic" style={{ color: `${secondary}99` }}>Seu perfil</span>
          ) : (
            <span className={`text-xs italic ${isDark || isEmpresa ? 'text-gray-500' : 'text-gray-400'}`}>Sem permissão</span>
          )}
        </td>
      </tr>
    );
  };

  const tabActive = (tab: string) => `text-sm font-semibold transition-colors ${
    activeTab === tab
      ? `${isDark || isEmpresa ? 'text-white' : 'text-gray-900'} border-b-2`
      : `${isDark || isEmpresa ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
  }`;

  return (
    <div className="space-y-6">
      {/* Modal de confirmação de exclusão */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-2xl p-6 border shadow-2xl ${
            isDark
              ? (isEmpresa ? 'bg-[#0f1f33] border-[#f59e0b]/20' : 'bg-[#311b3c] border-[#a700ff]/20')
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-red-500/20">
                <Trash2 size={20} className="text-red-400" />
              </div>
              <h3 className={`font-bold text-lg ${isDark || isEmpresa ? 'text-white' : 'text-gray-900'}`}>Excluir usuário?</h3>
            </div>
            <p className={`text-sm mb-6 ${isDark || isEmpresa ? 'text-gray-400' : 'text-gray-600'}`}>
              O usuário <strong className={isDark || isEmpresa ? 'text-white' : 'text-gray-900'}>{deleteConfirm.username}</strong> será removido permanentemente. Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${
                  isDark || isEmpresa ? 'bg-white/10 hover:bg-white/20 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={deleteUser}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting
                  ? <><Loader2 size={15} className="animate-spin" /> Excluindo...</>
                  : <><Trash2 size={15} /> Excluir</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`rounded-xl shadow-md border ${cardBg}`}>
        <div className={`flex border-b overflow-x-auto ${borderColor}`}>
          <button onClick={() => setActiveTab('aprovados')}
            className={`flex items-center gap-2 px-6 py-4 whitespace-nowrap ${tabActive('aprovados')}`}
            style={activeTab === 'aprovados' ? { borderColor: primary } : {}}>
            <CheckCircle className="w-4 h-4" />
            Aprovados
            <span className="px-1.5 py-0.5 rounded text-xs font-bold" style={{ background: `${primary}20`, color: primary }}>
              {approvedUsers.length}
            </span>
          </button>
          <button onClick={() => setActiveTab('pendentes')}
            className={`flex items-center gap-2 px-6 py-4 whitespace-nowrap ${tabActive('pendentes')}`}
            style={activeTab === 'pendentes' ? { borderColor: secondary } : {}}>
            <Clock className="w-4 h-4" />
            Aprovação
            {pendingUsers.length > 0 && (
              <span className="px-1.5 py-0.5 rounded text-xs font-bold" style={{ background: `${secondary}20`, color: secondary }}>
                {pendingUsers.length}
              </span>
            )}
          </button>
          <button onClick={() => setActiveTab('recuperacao')}
            className={`flex items-center gap-2 px-6 py-4 whitespace-nowrap ${tabActive('recuperacao')}`}
            style={activeTab === 'recuperacao' ? { borderColor: primary } : {}}>
            <KeyRound className="w-4 h-4" />
            Recuperação
            {resetPendingUsers.length > 0 && (
              <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-400">
                {resetPendingUsers.length}
              </span>
            )}
          </button>
        </div>

        <div className="p-6">
          {/* Aba Recuperação de Senha */}
          {activeTab === 'recuperacao' && (
            resetPendingUsers.length === 0 ? (
              <div className={`text-center py-10 ${isDark || isEmpresa ? 'text-gray-500' : 'text-gray-400'}`}>
                <KeyRound className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Nenhuma solicitação de recuperação pendente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {resetPendingUsers.map(u => {
                  const canApprove = canApproveReset(u.role);
                  return (
                    <div key={u.user_id} className={`flex items-center justify-between p-4 rounded-xl border ${
                      isDark || isEmpresa
                        ? 'bg-amber-900/10 border-amber-700/20'
                        : 'bg-amber-50 border-amber-200'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/20">
                          <KeyRound size={16} className="text-amber-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold ${isDark || isEmpresa ? 'text-gray-200' : 'text-gray-800'}`}>
                              {u.username}
                            </span>
                            {getRoleBadge(u.role)}
                          </div>
                          <p className={`text-xs mt-0.5 ${isDark || isEmpresa ? 'text-gray-500' : 'text-gray-400'}`}>
                            Aguardando aprovação de recuperação de senha
                          </p>
                        </div>
                      </div>
                      {canApprove ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => approveReset(u.user_id)}
                            className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-green-900/30 hover:bg-green-900/50 text-green-400 flex items-center gap-1 transition-colors"
                          >
                            <CheckCircle size={12} />Aprovar
                          </button>
                          <button
                            onClick={() => rejectReset(u.user_id)}
                            className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-red-900/30 hover:bg-red-900/50 text-red-400 flex items-center gap-1 transition-colors"
                          >
                            <X size={12} />Rejeitar
                          </button>
                        </div>
                      ) : (
                        <span className={`text-xs italic ${isDark || isEmpresa ? 'text-gray-600' : 'text-gray-400'}`}>
                          Sem permissão
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* Abas Aprovados / Pendentes */}
          {activeTab !== 'recuperacao' && (
            activeTab === 'pendentes' && pendingUsers.length === 0 ? (
              <div className={`text-center py-10 ${isDark || isEmpresa ? 'text-gray-500' : 'text-gray-400'}`}>
                <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Nenhum usuário aguardando aprovação</p>
              </div>
            ) : activeTab === 'aprovados' && approvedUsers.length === 0 ? (
              <div className={`text-center py-10 ${isDark || isEmpresa ? 'text-gray-500' : 'text-gray-400'}`}>
                <UserIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Nenhum usuário aprovado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`border-b ${borderColor}`}>
                      <th className={`text-left py-3 px-4 font-semibold ${thText}`}>Usuário</th>
                      <th className={`text-left py-3 px-4 font-semibold ${thText}`}>Email</th>
                      <th className={`text-left py-3 px-4 font-semibold ${thText}`}>Cargo</th>
                      <th className={`text-left py-3 px-4 font-semibold ${thText}`}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeTab === 'aprovados' ? approvedUsers.map(renderUserRow) : pendingUsers.map(renderUserRow)}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
