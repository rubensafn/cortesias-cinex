import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Shield, User as UserIcon, Crown, Trash2, CheckCircle, Clock } from 'lucide-react';

interface UserProfile {
  user_id: string;
  username: string;
  email: string;
  role: 'master' | 'admin' | 'user';
  approved: boolean;
  created_at: string;
}

export default function UserManagement() {
  const { isMaster, isAdmin, user } = useAuth();
  const { theme } = useTheme();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'aprovados' | 'pendentes'>('aprovados');

  const isDark = theme === 'dark';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_accounts')
        .select('id, username, role, approved, created_at')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const mappedUsers = (data || []).map((u: any) => ({
        user_id: u.id,
        username: u.username,
        email: u.username + '@cinex.com',
        role: u.role || 'user',
        approved: u.approved ?? false,
        created_at: u.created_at,
      }));

      setUsers(mappedUsers);
    } catch (err) {
      console.error('Erro ao buscar usuarios:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string, username: string) => {
    if (!isMaster) return;
    if (!confirm(`Tem certeza que deseja excluir o usuário "${username}"? Esta ação é irreversível.`)) return;

    try {
      const { error } = await supabase
        .from('user_accounts')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.filter(u => u.user_id !== userId));
    } catch (err) {
      alert('Erro ao excluir usuário: ' + (err instanceof Error ? err.message : 'Desconhecido'));
    }
  };

  const changeRole = async (userId: string, newRole: 'admin' | 'user') => {
    if (!isMaster && !isAdmin) return;

    try {
      const { error } = await supabase
        .from('user_accounts')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      alert('Erro ao atualizar cargo: ' + (err instanceof Error ? err.message : 'Desconhecido'));
    }
  };

  const approveUser = async (userId: string, approve: boolean) => {
    try {
      const { error } = await supabase
        .from('user_accounts')
        .update({ approved: approve })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, approved: approve } : u));
    } catch (err) {
      alert('Erro ao atualizar aprovação: ' + (err instanceof Error ? err.message : 'Desconhecido'));
    }
  };

  const getRoleIcon = (role: string) => {
    if (role === 'master') return <Crown className="w-4 h-4 text-[#ea0cac]" />;
    if (role === 'admin') return <Shield className="w-4 h-4 text-[#a700ff]" />;
    return <UserIcon className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />;
  };

  const getRoleBadge = (role: string) => {
    if (role === 'master') return <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#ea0cac]/20 text-[#ea0cac]">MASTER</span>;
    if (role === 'admin') return <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#312783]/30 text-[#a700ff]">ADMIN</span>;
    return <span className={`px-2 py-0.5 rounded text-xs font-bold ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>USUÁRIO</span>;
  };

  const approvedUsers = users.filter(u => u.approved);
  const pendingUsers = users.filter(u => !u.approved);

  if (loading) {
    return <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Carregando usuários...</div>;
  }

  const renderUserRow = (u: UserProfile) => {
    const isMasterUser = u.role === 'master';
    const isCurrentUser = u.user_id === user?.id;
    let canModify = false;

    if (isMaster && !isMasterUser && !isCurrentUser) {
      canModify = true;
    } else if (isAdmin && !isMaster && u.role === 'user' && !isCurrentUser) {
      canModify = true;
    }

    return (
      <tr key={u.user_id} className={`border-b ${isDark ? 'border-[#a700ff]/10 hover:bg-[#330054]/30' : 'border-gray-50 hover:bg-gray-50'}`}>
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            {getRoleIcon(u.role)}
            <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {u.username}
              {isCurrentUser && <span className="ml-1 text-[#ea0cac]">(você)</span>}
            </span>
          </div>
        </td>
        <td className="py-3 px-4">
          <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{u.email}</span>
        </td>
        <td className="py-3 px-4">{getRoleBadge(u.role)}</td>
        <td className="py-3 px-4">
          {!u.approved ? (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => approveUser(u.user_id, true)}
                className="text-xs px-3 py-1 rounded transition-colors font-semibold bg-green-900/30 hover:bg-green-900/50 text-green-400 flex items-center gap-1"
              >
                <CheckCircle className="w-3 h-3" />
                Aprovar
              </button>
              {isMaster && (
                <button
                  onClick={() => deleteUser(u.user_id, u.username)}
                  className="text-xs px-3 py-1 rounded transition-colors font-semibold bg-red-900/30 hover:bg-red-900/50 text-red-400 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Recusar
                </button>
              )}
            </div>
          ) : canModify ? (
            <div className="flex flex-wrap gap-2">
              {u.role === 'user' && (
                <button
                  onClick={() => changeRole(u.user_id, 'admin')}
                  className="text-xs px-3 py-1 rounded transition-colors font-semibold bg-[#312783]/30 hover:bg-[#312783]/50 text-[#a700ff]"
                >
                  Promover Admin
                </button>
              )}
              {u.role === 'admin' && isMaster && (
                <button
                  onClick={() => changeRole(u.user_id, 'user')}
                  className={`text-xs px-3 py-1 rounded transition-colors font-semibold ${isDark ? 'bg-[#330054] hover:bg-[#a700ff]/30 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                >
                  Rebaixar Usuário
                </button>
              )}
              {isMaster && (
                <button
                  onClick={() => deleteUser(u.user_id, u.username)}
                  className="text-xs px-3 py-1 rounded transition-colors font-semibold bg-red-900/30 hover:bg-red-900/50 text-red-400 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Excluir
                </button>
              )}
            </div>
          ) : isMasterUser && !isCurrentUser ? (
            <span className={`text-xs italic ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Protegido</span>
          ) : isCurrentUser ? (
            <span className="text-xs italic text-[#ea0cac]/60">Seu perfil</span>
          ) : (
            <span className={`text-xs italic ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Sem permissão</span>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-6">
      <div className={`rounded-xl shadow-md border ${isDark ? 'bg-[#311b3c] border-[#a700ff]/20' : 'bg-white border-gray-100'}`}>
        <div className={`flex border-b ${isDark ? 'border-[#a700ff]/20' : 'border-gray-200'}`}>
          <button
            onClick={() => setActiveTab('aprovados')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors ${
              activeTab === 'aprovados'
                ? isDark ? 'text-white border-b-2 border-[#a700ff]' : 'text-gray-900 border-b-2 border-[#a700ff]'
                : isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            Aprovados
            <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${isDark ? 'bg-[#a700ff]/20 text-[#a700ff]' : 'bg-[#a700ff]/10 text-[#a700ff]'}`}>
              {approvedUsers.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('pendentes')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors ${
              activeTab === 'pendentes'
                ? isDark ? 'text-white border-b-2 border-[#ea0cac]' : 'text-gray-900 border-b-2 border-[#ea0cac]'
                : isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            Aguardando Aprovação
            {pendingUsers.length > 0 && (
              <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-[#ea0cac]/20 text-[#ea0cac]">
                {pendingUsers.length}
              </span>
            )}
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'pendentes' && pendingUsers.length === 0 ? (
            <div className={`text-center py-10 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Nenhum usuário aguardando aprovação</p>
            </div>
          ) : activeTab === 'aprovados' && approvedUsers.length === 0 ? (
            <div className={`text-center py-10 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <UserIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Nenhum usuário aprovado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-[#a700ff]/20' : 'border-gray-200'}`}>
                    <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Usuário</th>
                    <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Email</th>
                    <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Cargo</th>
                    <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTab === 'aprovados'
                    ? approvedUsers.map(renderUserRow)
                    : pendingUsers.map(renderUserRow)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
