import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { DataRefreshProvider } from './contexts/DataRefreshContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AppProvider>
        <AuthProvider>
          <DataRefreshProvider>
            <App />
          </DataRefreshProvider>
        </AuthProvider>
      </AppProvider>
    </ThemeProvider>
  </StrictMode>
);
