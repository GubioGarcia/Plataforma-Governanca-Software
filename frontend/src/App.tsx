import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import ProjectShell from './components/layout/ProjectShell';
import ProtectedRoute from './components/layout/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import OrganizationList from './features/organizations/OrganizationList';
import OrgDashboard from './features/organizations/OrgDashboard';
import ProjectList from './features/projects/ProjectList';
import ProjectDashboard from './features/projects/ProjectDashboard';
import WikiPage from './features/wiki/WikiPage';
import RequirementList from './features/requirements/RequirementList';
import EventTimeline from './features/events/EventTimeline';
import FileRepository from './features/files/FileRepository';
import StakeholderList from './features/stakeholders/StakeholderList';
import AuditLog from './features/audit/AuditLog';
import ProjectAnalytics from './features/analytics/ProjectAnalytics';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import UsersPage from './features/users/UsersPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/organizations" replace />} />
        <Route path="organizations" element={<OrganizationList />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="organizations/:orgId" element={<OrgDashboard />} />
        <Route path="organizations/:orgId/projects" element={<ProjectList />} />
        <Route path="organizations/:orgId/projects/:projectId" element={<ProjectShell />}>
          <Route index element={<ProjectDashboard />} />
          <Route path="wiki" element={<WikiPage />} />
          <Route path="requirements" element={<RequirementList />} />
          <Route path="events" element={<EventTimeline />} />
          <Route path="files" element={<FileRepository />} />
          <Route path="stakeholders" element={<StakeholderList />} />
          <Route path="audit" element={<AuditLog />} />
          <Route path="analytics" element={<ProjectAnalytics />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
