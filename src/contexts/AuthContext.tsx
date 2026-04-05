import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { useApp } from './AppContext';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isMaster: boolean;
  isApproved: boolean;
  userRole: 'master_admin' | 'master' | 'admin' | 'user' | null;
  needsPasswordReset: boolean;
  signIn: (username: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (username: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  completePendingReset: (newPassword: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { db, tables } = useApp();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMaster, setIsMaster] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [userRole, setUserRole] = useState<'master_admin' | 'master' | 'admin' | 'user' | null>(null);
  const [needsPasswordReset, setNeedsPasswordReset] = useState(false);

  // Quando o app muda (cortesias <-> empresa), reinicia o estado de auth
  useEffect(() => {
    setUser(null);
    setIsAdmin(false);
    setIsMaster(false);
    setIsApproved(false);
    setUserRole(null);
    setNeedsPasswordReset(false);
    setLoading(true);

    const savedSession = localStorage.getItem(tables.sessionKey);
    if (savedSession) {
      (async () => {
        try {
          const session = JSON.parse(savedSession);

          const { data: freshData } = await db
            .from(tables.users)
            .select('approved, role, reset_status')
            .eq('id', session.user.id)
            .maybeSingle();

          if (!freshData) {
            localStorage.removeItem(tables.sessionKey);
            setLoading(false);
            return;
          }

          const role = (freshData.role as 'master_admin' | 'master' | 'admin' | 'user') || 'user';
          const approved = freshData.approved ?? false;
          const resetStatus = (freshData.reset_status as string | null) ?? null;

          session.user.approved = approved;
          session.user.role = role;
          localStorage.setItem(tables.sessionKey, JSON.stringify(session));

          const mockUser: User = {
            id: session.user.id,
            email: `${session.user.username}@cinex.com`,
            user_metadata: {},
            app_metadata: { role },
            aud: 'authenticated',
            created_at: new Date().toISOString(),
          } as User;

          setUser(mockUser);
          setUserRole(role);
          setIsMaster(role === 'master_admin' || role === 'master');
          setIsAdmin(role === 'admin' || role === 'master_admin' || role === 'master');
          setIsApproved(approved);
          setNeedsPasswordReset(resetStatus === 'approved');
          setLoading(false);
        } catch {
          localStorage.removeItem(tables.sessionKey);
          setLoading(false);
        }
      })();
    } else {
      setLoading(false);
    }
  }, [tables.sessionKey]);

  const signIn = async (username: string, password: string) => {
    try {
      const { data: accountData, error: dbError } = await db
        .from(tables.users)
        .select('id, username, role, password, approved, reset_status')
        .eq('username', username)
        .maybeSingle();

      if (dbError) return { error: new Error('Erro ao verificar usuário') };
      if (!accountData) return { error: new Error('Usuário ou senha incorretos') };

      const resetStatus = (accountData.reset_status as string | null) ?? null;

      // Recuperação pendente: bloqueia login mesmo com senha correta
      if (resetStatus === 'pending') {
        return { error: new Error('Sua solicitação de recuperação de senha está aguardando aprovação.') };
      }

      // Se reset aprovado: bypass de senha, entra mas força troca
      if (resetStatus !== 'approved') {
        if (accountData.password !== password) {
          return { error: new Error('Usuário ou senha incorretos') };
        }
      }

      const role = (accountData.role as 'master_admin' | 'master' | 'admin' | 'user') || 'user';
      const approved = accountData.approved ?? false;

      const session = {
        user: {
          id: accountData.id,
          username: accountData.username,
          role: accountData.role,
          approved: accountData.approved,
        },
      };

      localStorage.setItem(tables.sessionKey, JSON.stringify(session));

      setUserRole(role);
      setIsMaster(role === 'master_admin' || role === 'master');
      setIsAdmin(role === 'admin' || role === 'master_admin' || role === 'master');
      setIsApproved(approved);
      setNeedsPasswordReset(resetStatus === 'approved');

      const mockUser: User = {
        id: accountData.id,
        email: `${accountData.username}@cinex.com`,
        user_metadata: {},
        app_metadata: { role: accountData.role },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as User;

      setUser(mockUser);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (username: string, password: string) => {
    try {
      if (username.length < 3) return { error: new Error('Usuario deve ter pelo menos 3 caracteres') };
      if (password.length < 6) return { error: new Error('Senha deve ter pelo menos 6 caracteres') };

      const { data: existingUser } = await db
        .from(tables.users)
        .select('id')
        .eq('username', username)
        .maybeSingle();

      if (existingUser) return { error: new Error('Usuario ja existe') };

      const { error: insertError } = await db
        .from(tables.users)
        .insert({ username, password, role: 'user', approved: false });

      if (insertError) return { error: new Error(insertError.message || 'Erro ao criar conta') };

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    localStorage.removeItem(tables.sessionKey);
    setUser(null);
    setIsAdmin(false);
    setIsMaster(false);
    setIsApproved(false);
    setUserRole(null);
    setNeedsPasswordReset(false);
  };

  const completePendingReset = async (newPassword: string) => {
    if (!user) return { error: new Error('Não autenticado') };
    const { error } = await db
      .from(tables.users)
      .update({ password: newPassword, reset_status: null })
      .eq('id', user.id);
    if (!error) setNeedsPasswordReset(false);
    return { error: error ? new Error(error.message) : null };
  };

  return (
    <AuthContext.Provider value={{
      user, loading, isAdmin, isMaster, isApproved, userRole,
      needsPasswordReset, signIn, signUp, signOut, completePendingReset,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
