import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CardsPage } from './pages/Cards';
import { IntelligencePage } from './pages/Intelligence';
import { CardDetail } from './components/cards/CardDetail';
import { CardForm } from './components/cards/CardForm';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cards"
          element={
            <ProtectedRoute>
              <CardsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cards/new"
          element={
            <ProtectedRoute>
              <CardForm mode="create" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cards/:id"
          element={
            <ProtectedRoute>
              <CardDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cards/:id/edit"
          element={
            <ProtectedRoute>
              <CardForm mode="edit" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cards/:id/intelligence"
          element={
            <ProtectedRoute>
              <IntelligencePage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/cards" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
