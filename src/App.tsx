import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import MainLayout from './components/MainLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProjectListPage from './pages/ProjectListPage';
import ProjectCreatePage from './pages/ProjectCreatePage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import TaskBoardPage from './pages/TaskBoardPage';
import RecruitmentPage from './pages/RecruitmentPage';
import InterviewPage from './pages/InterviewPage';
import AIAgentPage from './pages/AIAgentPage';
import SettingsPage from './pages/SettingsPage';
import MarketplacePage from './pages/MarketplacePage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { token, fetchUser } = useAuthStore();

  useEffect(() => {
    if (token) fetchUser();
  }, [token, fetchUser]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="projects" element={<ProjectListPage />} />
          <Route path="projects/new" element={<ProjectCreatePage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="tasks" element={<TaskBoardPage />} />
          <Route path="tasks/:id" element={<div className="text-slate-400">任务详情 - 开发中</div>} />
          <Route path="recruitment" element={<RecruitmentPage />} />
          <Route path="recruitment/:id" element={<div className="text-slate-400">岗位详情 - 开发中</div>} />
          <Route path="interviews" element={<InterviewPage />} />
          <Route path="marketplace" element={<MarketplacePage />} />
          <Route path="ai-agent" element={<AIAgentPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}