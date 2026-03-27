import { createContext, useContext, useState, ReactNode } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { supabaseEmpresa } from '../lib/supabaseEmpresa';

export type AppMode = 'cortesias' | 'empresa';

export interface AppTables {
  tickets: string;
  importedCodes: string;
  sessionKey: string;
}

const APP_TABLES: Record<AppMode, AppTables> = {
  cortesias: {
    tickets: 'cortesias',
    importedCodes: 'imported_codes',
    sessionKey: 'auth_session_cortesias',
  },
  empresa: {
    tickets: 'empresa_tickets',
    importedCodes: 'empresa_imported_codes',
    sessionKey: 'auth_session_empresa',
  },
};

const APP_CLIENTS: Record<AppMode, SupabaseClient> = {
  cortesias: supabase,
  empresa: supabaseEmpresa,
};

interface AppContextType {
  appMode: AppMode | null;
  setAppMode: (mode: AppMode | null) => void;
  db: SupabaseClient;
  tables: AppTables;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [appMode, setAppModeState] = useState<AppMode | null>(() => {
    const stored = localStorage.getItem('app_mode');
    return (stored === 'cortesias' || stored === 'empresa') ? stored : null;
  });

  const setAppMode = (mode: AppMode | null) => {
    if (mode) {
      localStorage.setItem('app_mode', mode);
    } else {
      localStorage.removeItem('app_mode');
    }
    setAppModeState(mode);
  };

  const activeMode = appMode ?? 'cortesias';

  return (
    <AppContext.Provider value={{
      appMode,
      setAppMode,
      db: APP_CLIENTS[activeMode],
      tables: APP_TABLES[activeMode],
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
