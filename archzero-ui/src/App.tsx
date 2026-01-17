import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CardsPage } from './pages/Cards';
import { IntelligencePage } from './pages/Intelligence';
import { SearchPage } from './pages/SearchPage';
import { ProfilePage } from './pages/ProfilePage';
import { ReportsDashboard } from './pages/ReportsDashboard';
import { CardDetail } from './components/cards/CardDetail';
import { CardForm } from './components/cards/CardForm';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { TemplateLibrary } from './components/governance/arb/TemplateLibrary';
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
  ThemesPage,
  ObjectivesPage,
  TargetStatePage,
  BaselinePage,
  GapAnalysisPage,
  RoadmapPage,
  RiskAssessmentPage,
  RiskMitigationPage,
  ComplianceEvidencePage,
  ComplianceReportsPage,
} from './pages/governance';
// Import/Export Pages
import { BulkImportPage } from './pages/import/BulkImportPage';
import { ExportPage } from './pages/export/ExportPage';
// Relationship Pages
import { RelationshipExplorerPage } from './pages/RelationshipExplorerPage';
import { RelationshipMatrixPage } from './pages/RelationshipMatrixPage';
// Admin Pages
import {
  UsersPage,
  RolesPage,
  PermissionsPage,
} from './pages/admin';

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

        {/* Search Route */}
        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <Layout>
                <SearchPage />
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

        {/* ARB Routes - only accessible by admin, ARB members, and architects */}
        <Route
          path="/arb"
          element={
            <ProtectedRoute allowedRoles={['admin', 'arbchair', 'arbmember', 'architect']}>
              <Layout>
                <ARBPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/arb/requests"
          element={
            <ProtectedRoute allowedRoles={['admin', 'arbchair', 'arbmember', 'architect']}>
              <Layout>
                <ARBPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/arb/requests/new"
          element={
            <ProtectedRoute allowedRoles={['admin', 'arbchair', 'arbmember', 'architect']}>
              <Layout>
                <ARBPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/arb/meetings"
          element={
            <ProtectedRoute allowedRoles={['admin', 'arbchair', 'arbmember', 'architect']}>
              <Layout>
                <ARBPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/arb/meetings/:id"
          element={
            <ProtectedRoute allowedRoles={['admin', 'arbchair', 'arbmember', 'architect']}>
              <Layout>
                <ARBPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/arb/templates"
          element={
            <ProtectedRoute allowedRoles={['admin', 'arbchair', 'arbmember', 'architect']}>
              <Layout>
                <TemplateLibrary />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/arb/submissions/:id"
          element={
            <ProtectedRoute allowedRoles={['admin', 'arbchair', 'arbmember', 'architect']}>
              <Layout>
                <ARBPage />
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

        {/* Risk Advanced Pages */}
        <Route
          path="/governance/risks/:id/assessment"
          element={
            <ProtectedRoute>
              <Layout>
                <RiskAssessmentPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/governance/risks/:id/mitigation"
          element={
            <ProtectedRoute>
              <Layout>
                <RiskMitigationPage />
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

        {/* Compliance Advanced Pages */}
        <Route
          path="/governance/compliance/:id/evidence"
          element={
            <ProtectedRoute>
              <Layout>
                <ComplianceEvidencePage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/governance/compliance/reports"
          element={
            <ProtectedRoute>
              <Layout>
                <ComplianceReportsPage />
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

        {/* Governance - Strategic Themes */}
        <Route
          path="/governance/themes"
          element={
            <ProtectedRoute>
              <Layout>
                <ThemesPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Governance - Objectives & OKRs */}
        <Route
          path="/governance/objectives"
          element={
            <ProtectedRoute>
              <Layout>
                <ObjectivesPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Governance - Strategic Planning */}
        <Route
          path="/governance/target-state"
          element={
            <ProtectedRoute>
              <Layout>
                <TargetStatePage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/governance/baseline"
          element={
            <ProtectedRoute>
              <Layout>
                <BaselinePage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/governance/gap-analysis"
          element={
            <ProtectedRoute>
              <Layout>
                <GapAnalysisPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/governance/roadmap"
          element={
            <ProtectedRoute>
              <Layout>
                <RoadmapPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Import/Export Routes */}
        <Route
          path="/import"
          element={
            <ProtectedRoute>
              <Layout>
                <BulkImportPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/export"
          element={
            <ProtectedRoute>
              <Layout>
                <ExportPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Relationship Routes */}
        <Route
          path="/relationships"
          element={
            <ProtectedRoute>
              <Layout>
                <RelationshipExplorerPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/relationships/matrix"
          element={
            <ProtectedRoute>
              <Layout>
                <RelationshipMatrixPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Reports Route */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Layout>
                <ReportsDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Profile Route */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <ProfilePage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <Layout>
                <UsersPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/roles"
          element={
            <ProtectedRoute>
              <Layout>
                <RolesPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/permissions"
          element={
            <ProtectedRoute>
              <Layout>
                <PermissionsPage />
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
