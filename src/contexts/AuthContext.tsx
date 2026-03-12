import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isMaster: boolean;
  isApproved: boolean;
  userRole: 'master_admin' | 'master' | 'admin' | 'user' | null;
  signIn: (username: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (username: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMaster, setIsMaster] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [userRole, setUserRole] = useState<'master_admin' | 'master' | 'admin' | 'user' | null>(null);

  useEffect(() => {
    const savedSession = localStorage.getItem('auth_session');
    if (savedSession) {
      (async () => {
        try {
          const session = JSON.parse(savedSession);

          const { data: freshData } = await supabase
            .from('user_accounts')
            .select('approved, role')
            .eq('id', session.user.id)
            .maybeSingle();

          const role = ((freshData?.role ?? session.user.role) as 'master_admin' | 'master' | 'admin' | 'user') || 'user';
          const approved = freshData?.approved ?? session.user.approved ?? false;

          if (freshData) {
            session.user.approved = freshData.approved;
            session.user.role = freshData.role;
            localStorage.setItem('auth_session', JSON.stringify(session));
          }

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
        } catch (e) {
          localStorage.removeItem('auth_session');
        }
        setLoading(false);
      })();
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ username, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return { error: new Error(data.error || 'Usuário ou senha incorretos') };
      }

      if (data.session) {
        localStorage.setItem('auth_session', JSON.stringify(data.session));

        const role = (data.session.user?.role as 'master_admin' | 'master' | 'admin' | 'user') || 'user';
        const approved = data.session.user?.approved || false;

        setUserRole(role);
        setIsMaster(role === 'master_admin' || role === 'master');
        setIsAdmin(role === 'admin' || role === 'master_admin' || role === 'master');
        setIsApproved(approved);

        const mockUser: User = {
          id: data.session.user.id,
          email: `${data.session.user.username}@cinex.com`,
          user_metadata: {},
          app_metadata: { role: data.session.user.role },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        } as User;

        setUser(mockUser);
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (username: string, password: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ username, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return { error: new Error(data.error || 'Erro ao criar conta') };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('auth_session');
      setUser(null);
      setIsAdmin(false);
      setIsMaster(false);
      setIsApproved(false);
      setUserRole(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isMaster, isApproved, userRole, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
