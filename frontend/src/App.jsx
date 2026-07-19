import { Routes, Route } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import FocusWorkspace from './pages/FocusWorkspace';
import Analytics from './pages/Analytics';
import Roadmap from './pages/Roadmap';
import Repositories from './pages/Repositories';
import RepositoryDetails from './pages/RepositoryDetails';
import ProjectDetails from './pages/ProjectDetails';
import Settings from './pages/Settings';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Private Routes (Dashboard) */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<FocusWorkspace />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="roadmap" element={<Roadmap />} />
        <Route path="roadmaps/:projectId" element={<ProjectDetails />} />
        <Route path="repositories" element={<Repositories />} />
        <Route path="repositories/:id" element={<RepositoryDetails />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
