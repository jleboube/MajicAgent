import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthContext } from './context/AuthContext.jsx';
import AppLayout from './components/AppLayout.jsx';
import Dashboard from './components/Dashboard.jsx';
import Login from './components/Login.jsx';
import PhotoModulePage from './pages/PhotoModulePage.jsx';
import ListingModulePage from './pages/ListingModulePage.jsx';
import MessengerModulePage from './pages/MessengerModulePage.jsx';
import InsightsModulePage from './pages/InsightsModulePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

function App() {
  const { isAuthenticated, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="app-shell">
        <div className="card">
          <p>Loading your workspace…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/modules/photo" element={<PhotoModulePage />} />
        <Route path="/modules/listings" element={<ListingModulePage />} />
        <Route path="/modules/messenger" element={<MessengerModulePage />} />
        <Route path="/modules/insights" element={<InsightsModulePage />} />
        <Route path="/modules" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
