import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CardsPage } from './pages/Cards';
import { IntelligencePage } from './pages/Intelligence';
import { CardDetail } from './components/cards/CardDetail';
import { CardForm } from './components/cards/CardForm';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
// Governance Pages
import {
  PrinciplesPage,
  StandardsPage,
  PoliciesPage,
  ExceptionsPage,
  InitiativesPage,
  RisksPage,
  CompliancePage,
  ARBPage,
} from './pages/governance';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Routes with Navigation Layout */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Card Routes */}
        <Route
          path="/cards"
          element={
            <ProtectedRoute>
              <Layout>
                <CardsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/cards/new"
          element={
            <ProtectedRoute>
              <Layout>
                <CardForm mode="create" />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/cards/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <CardDetail />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/cards/:id/edit"
          element={
            <ProtectedRoute>
              <Layout>
                <CardForm mode="edit" />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/cards/:id/intelligence"
          element={
            <ProtectedRoute>
              <Layout>
                <IntelligencePage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Governance Routes */}
        <Route
          path="/governance/principles"
          element={
            <ProtectedRoute>
              <Layout>
                <PrinciplesPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/governance/principles/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <PrinciplesPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/governance/standards"
          element={
            <ProtectedRoute>
              <Layout>
                <StandardsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/governance/policies"
          element={
            <ProtectedRoute>
              <Layout>
                <PoliciesPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/governance/policies/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <PoliciesPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/governance/exceptions"
          element={
            <ProtectedRoute>
              <Layout>
                <ExceptionsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/governance/initiatives"
          element={
            <ProtectedRoute>
              <Layout>
                <InitiativesPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/governance/initiatives/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <InitiativesPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/governance/risks"
          element={
            <ProtectedRoute>
              <Layout>
                <RisksPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/governance/compliance"
          element={
            <ProtectedRoute>
              <Layout>
                <CompliancePage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/governance/compliance/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <CompliancePage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/governance/arb"
          element={
            <ProtectedRoute>
              <Layout>
                <ARBPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/governance/arb/meetings/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <ARBPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/cards" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
