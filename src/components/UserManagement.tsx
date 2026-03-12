import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Check, Shield, User as UserIcon, Crown, Trash2 } from 'lucide-react';

interface UserProfile {
  user_id: string;
  username: string;
  email: string;
  role: 'master' | 'admin' | 'user';
  created_at: string;
}

export default function UserManagement() {
  const { isMaster, isAdmin, user } = useAuth();
  const { theme } = useTheme();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const isDark = theme === 'dark';
  const canManageUsers = isMaster || isAdmin;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_accounts')
        .select(`
          id,
          username,
          role,
          created_at,
          user_profiles!inner(email)
        `)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const mappedUsers = (data || []).map((u: any) => ({
        user_id: u.id,
        username: u.username,
        email: u.user_profiles?.[0]?.email || u.username + '@cinex.com',
        role: u.role || 'user',
        created_at: u.created_at,
      }));

      setUsers(mappedUsers);
    } catch (err) {
      console.error('Erro ao buscar usuarios:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string, email: string) => {
    if (!isMaster) return;
    if (!confirm(`Tem certeza que deseja deletar ${email}? Esta ação é irreversível.`)) return;

    try {
      const { error } = await supabase
        .from('user_accounts')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.filter(u => u.user_id !== userId));
    } catch (err) {
      alert('Erro ao deletar usuario: ' + (err instanceof Error ? err.message : 'Desconhecido'));
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
      alert('Erro ao atualizar role: ' + (err instanceof Error ? err.message : 'Desconhecido'));
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
    return <span className={`px-2 py-0.5 rounded text-xs font-bold ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>USER</span>;
  };

  if (loading) {
    return <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Carregando usuarios...</div>;
  }

  return (
    <div className="space-y-6">
      <div className={`rounded-xl shadow-md p-6 border ${isDark ? 'bg-[#311b3c] border-[#a700ff]/20' : 'bg-white border-gray-100'}`}>
        <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Usuarios</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b ${isDark ? 'border-[#a700ff]/20' : 'border-gray-200'}`}>
                <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Usuario</th>
                <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Email</th>
                <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Role</th>
                <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
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
                          {isCurrentUser && <span className={`ml-1 ${isDark ? 'text-[#ea0cac]' : 'text-[#ea0cac]'}`}>(você)</span>}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{u.email}</span>
                    </td>
                    <td className="py-3 px-4">{getRoleBadge(u.role)}</td>
                    <td className="py-3 px-4">
                      {canModify ? (
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
                              Rebaixar User
                            </button>
                          )}
                          {isMaster && (
                            <button
                              onClick={() => deleteUser(u.user_id, u.email)}
                              className="text-xs px-3 py-1 rounded transition-colors font-semibold bg-red-900/30 hover:bg-red-900/50 text-red-400 flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              Deletar
                            </button>
                          )}
                        </div>
                      ) : isMasterUser && !isCurrentUser ? (
                        <span className={`text-xs italic ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Protegido</span>
                      ) : isCurrentUser ? (
                        <span className={`text-xs italic ${isDark ? 'text-[#ea0cac]/60' : 'text-[#ea0cac]/60'}`}>Seu perfil</span>
                      ) : (
                        <span className={`text-xs italic ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Sem permissao</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
