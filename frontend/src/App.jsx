import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { queryClientInstance } from '@/lib/query-client';
import { pagesConfig } from './pages.config';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : () => <></>;

const LayoutWrapper = ({ children, currentPageName }) =>
  Layout ? <Layout currentPageName={currentPageName}>{children}</Layout> : <>{children}</>;

// Liste des pages publiques (pas besoin d'authentification)
const publicPages = ['Login'];

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <Routes>
          {/* Route racine - protégée */}
          <Route path="/" element={
            <ProtectedRoute>
              <LayoutWrapper currentPageName={mainPageKey}>
                <MainPage />
              </LayoutWrapper>
            </ProtectedRoute>
          } />
          
          {/* Routes pour toutes les pages */}
          {Object.entries(Pages).map(([name, Page]) => {
            // Si c'est une page publique (comme Login), ne pas protéger
            if (publicPages.includes(name)) {
              return (
                <Route
                  key={name}
                  path={`/${name.toLowerCase()}`}
                  element={<Page />}
                />
              );
            }
            
            // Pour CustomerDetails, route avec paramètre id
            if (name === 'CustomerDetails') {
              return (
                <Route
                  key={name}
                  path="/customers/:id"
                  element={
                    <ProtectedRoute>
                      <LayoutWrapper currentPageName={name}>
                        <Page />
                      </LayoutWrapper>
                    </ProtectedRoute>
                  }
                />
              );
            }
            
            // Pour les autres pages, protéger avec authentification
            return (
              <Route
                key={name}
                path={`/${name.toLowerCase()}`}
                element={
                  <ProtectedRoute>
                    <LayoutWrapper currentPageName={name}>
                      <Page />
                    </LayoutWrapper>
                  </ProtectedRoute>
                }
              />
            );
          })}
          
          {/* Redirection pour les routes inconnues */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster richColors position="top-right" />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
