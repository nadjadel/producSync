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
            
            // Pour QuoteDetails, route avec paramètre id
            if (name === 'QuoteDetails') {
              return (
                <Route
                  key={name}
                  path="/quotes/:id"
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
            
            // Pour OrderDetails, route avec paramètre id
            if (name === 'OrderDetails') {
              return (
                <Route
                  key={name}
                  path="/orders/:id"
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
            
            // Pour ProductDetails, route avec paramètre id
            if (name === 'ProductDetails') {
              return (
                <Route
                  key={name}
                  path="/products/:id"
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
            
            // Pour InvoiceDetails, route avec paramètre id
            if (name === 'InvoiceDetails') {
              return (
                <Route
                  key={name}
                  path="/invoices/:id"
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
            
            // Pour DeliveryNoteDetails, route avec paramètre id
            if (name === 'DeliveryNoteDetails') {
              return (
                <Route
                  key={name}
                  path="/delivery-notes/:id"
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
            
            // Pour CreditNoteDetails, route avec paramètre id
            if (name === 'CreditNoteDetails') {
              return (
                <Route
                  key={name}
                  path="/credit-notes/:id"
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
            
            // Pour ManufacturingOrderDetails, route avec paramètre id
            if (name === 'ManufacturingOrderDetails') {
              return (
                <Route
                  key={name}
                  path="/manufacturing-orders/:id"
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

            // Pour SupplierDetails, route avec paramètre id
            if (name === 'SupplierDetails') {
              return (
                <Route
                  key={name}
                  path="/suppliers/:id"
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
