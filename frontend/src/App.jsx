import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import FocusWorkspace from './pages/FocusWorkspace';
import Analytics from './pages/Analytics';
import Roadmap from './pages/Roadmap';
import Repositories from './pages/Repositories';
import RepositoryDetails from './pages/RepositoryDetails';
import ProjectDetails from './pages/ProjectDetails';
import ProjectWorkspace from './pages/ProjectWorkspace';
import SkillProfile from './pages/SkillProfile';
import Settings from './pages/Settings';
import BuildDays from './pages/BuildDays';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import ProtectedRoute from './components/ProtectedRoute';

const Landing = lazy(() => import('./pages/Landing'));
const LegalPage = lazy(() => import('./pages/LegalPage'));
const Product = lazy(() => import('./pages/Product'));
const HowItWorks = lazy(() => import('./pages/HowItWorks'));
const Security = lazy(() => import('./pages/Security'));
const About = lazy(() => import('./pages/About'));

function App() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-deep flex items-center justify-center text-muted-steel font-mono text-sm">Loading GitMentor…</div>}>
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/privacy" element={<LegalPage />} />
      <Route path="/terms" element={<LegalPage />} />
      <Route path="/product" element={<Product />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/security" element={<Security />} />
      <Route path="/about" element={<About />} />

      {/* Private Routes (Dashboard) */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="workspace" element={<FocusWorkspace />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="skills" element={<SkillProfile />} />
        <Route path="roadmap" element={<Roadmap />} />
        <Route path="build-days" element={<BuildDays />} />
        <Route path="roadmaps/:projectId" element={<ProjectDetails />} />
        <Route path="roadmaps/:projectId/workspace" element={<ProjectWorkspace />} />
        <Route path="repositories" element={<Repositories />} />
        <Route path="repositories/:id" element={<RepositoryDetails />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
    </Suspense>
  );
}

export default App;
