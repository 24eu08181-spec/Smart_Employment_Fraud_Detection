import { Navigate, Route, Routes } from 'react-router-dom';
import { Outlet, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import { useAuth } from './context/AuthContext';
import AboutPage from './pages/AboutPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AnalyzeJobPage from './pages/AnalyzeJobPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import LiveDashboardPage from './pages/LiveDashboardPage';
import HistoryPage from './pages/HistoryPage';
import ModelInfoPage from './pages/ModelInfoPage';
import ResultPage from './pages/ResultPage';
import SettingsPage from './pages/SettingsPage';

function RequireAuth() {
  const { user } = useAuth();
  const location = useLocation();
  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
}

export default function App() {
  const { user, loading, error, refresh } = useAuth();

  if (loading) {
    return <main className="auth-loading">Checking your session…</main>;
  }

  if (error && !user) {
    return (
      <main className="auth-loading">
        <p role="alert">{error}</p>
        <button className="auth-submit mt-5 max-w-xs" onClick={refresh} type="button">Try again</button>
      </main>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/signup" element={<AuthPage mode="signup" />} />
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route path="/" element={<LiveDashboardPage />} />
          <Route path="/dataset-overview" element={<DashboardPage />} />
          <Route path="/analyze" element={<AnalyzeJobPage />} />
          <Route path="/result" element={<ResultPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/model-info" element={<ModelInfoPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
