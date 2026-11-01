import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/layout/ProtectedRoute';
import RotaPublica from './components/layout/RotaPublica';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import PrivacidadePage from './pages/PrivacidadePage';
import NotFoundPage from './pages/NotFoundPage';
import CarregandoPagina from './components/common/CarregandoPagina';

// A aplicação autenticada é carregada sob demanda: a landing não baixa o bundle inteiro
const AppShell = lazy(() => import('./components/layout/AppShell'));
const ProjectShell = lazy(() => import('./components/layout/ProjectShell'));
const GuardaOrganizacao = lazy(() => import('./components/layout/GuardaOrganizacao'));
const OrganizationList = lazy(() => import('./features/organizations/OrganizationList'));
const ProjectList = lazy(() => import('./features/projects/ProjectList'));
const ProjectDashboard = lazy(() => import('./features/projects/ProjectDashboard'));
const WikiPage = lazy(() => import('./features/wiki/WikiPage'));
const WikiEditDescricao = lazy(() => import('./features/wiki/WikiEditDescricao'));
const WikiEditProblema = lazy(() => import('./features/wiki/WikiEditProblema'));
const WikiEditPublico = lazy(() => import('./features/wiki/WikiEditPublico'));
const WikiEditObjetivos = lazy(() => import('./features/wiki/WikiEditObjetivos'));
const WikiEditRestricoes = lazy(() => import('./features/wiki/WikiEditRestricoes'));
const RequirementList = lazy(() => import('./features/requirements/RequirementList'));
const RequirementDetail = lazy(() => import('./features/requirements/RequirementDetail'));
const TraceabilityMatrix = lazy(() => import('./features/traceability/TraceabilityMatrix'));
const DataModelPage = lazy(() => import('./features/datamodel/DataModelPage'));
const EventTimeline = lazy(() => import('./features/events/EventTimeline'));
const FileRepository = lazy(() => import('./features/files/FileRepository'));
const StakeholderList = lazy(() => import('./features/stakeholders/StakeholderList'));
const SolicitationList = lazy(() => import('./features/solicitations/SolicitationList'));
const AuditLog = lazy(() => import('./features/audit/AuditLog'));
const ProjectAnalytics = lazy(() => import('./features/analytics/ProjectAnalytics'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const UsersPage = lazy(() => import('./features/users/UsersPage'));

export default function App() {
  return (
    <Suspense fallback={<CarregandoPagina telaCheia />}>
      <Routes>
        {/* Públicas. Quem já tem sessão vai direto para a plataforma (o login trata ?next=) */}
        <Route path="/" element={<RotaPublica><LandingPage /></RotaPublica>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<LoginPage />} />
        <Route path="/privacidade" element={<PrivacidadePage />} />

        {/* Aplicação: layout sem path, mesmos caminhos de antes */}
        <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
          <Route path="organizations" element={<OrganizationList />} />
          <Route path="profile" element={<ProfilePage />} />
          {/* Área administrativa: só o Admin da Plataforma (por enquanto, a tela de usuários) */}
          <Route path="admin" element={<ProtectedRoute requireAdminPlataforma><Navigate to="/users" replace /></ProtectedRoute>} />
          <Route path="users" element={<ProtectedRoute requireAdminPlataforma><UsersPage /></ProtectedRoute>} />
          {/* Organização/projeto: só para quem tem vínculo (o ProjectShell checa o projeto) */}
          {/* A tela da organização é a própria lista de projetos (dados e membros no topo) */}
          <Route path="organizations/:orgId" element={<Navigate to="projects" replace />} />
          <Route path="organizations/:orgId/projects" element={<GuardaOrganizacao><ProjectList /></GuardaOrganizacao>} />
          <Route path="organizations/:orgId/projects/:projectId" element={<ProjectShell />}>
            <Route index element={<ProjectDashboard />} />
            <Route path="wiki" element={<WikiPage />} />
            <Route path="wiki/descricao" element={<WikiEditDescricao />} />
            <Route path="wiki/problema" element={<WikiEditProblema />} />
            <Route path="wiki/publico" element={<WikiEditPublico />} />
            <Route path="wiki/objetivos" element={<WikiEditObjetivos />} />
            <Route path="wiki/restricoes" element={<WikiEditRestricoes />} />
            <Route path="requirements" element={<RequirementList />} />
            <Route path="requirements/:requirementId" element={<RequirementDetail />} />
            <Route path="traceability" element={<TraceabilityMatrix />} />
            <Route path="data-model" element={<DataModelPage />} />
            <Route path="events" element={<EventTimeline />} />
            <Route path="files" element={<FileRepository />} />
            <Route path="stakeholders" element={<StakeholderList />} />
            <Route path="solicitations" element={<SolicitationList />} />
            <Route path="audit" element={<AuditLog />} />
            <Route path="analytics" element={<ProjectAnalytics />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
