import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface DataRefreshContextType {
  refreshKey: number;
  refresh: () => void;
}

const DataRefreshContext = createContext<DataRefreshContextType>({ refreshKey: 0, refresh: () => {} });

export function DataRefreshProvider({ children }: { children: ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);
  return (
    <DataRefreshContext.Provider value={{ refreshKey, refresh }}>
      {children}
    </DataRefreshContext.Provider>
  );
}

export function useDataRefresh() {
  return useContext(DataRefreshContext);
}
