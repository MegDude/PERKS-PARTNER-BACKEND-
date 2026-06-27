import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/context/AuthContext';

const MapOS = lazy(() => import('./pages/MapOS'));
const PartnerDashboardLayout = lazy(() => import('./components/layout/PartnerDashboardLayout'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const BuildingsManagement = lazy(() => import('./pages/BuildingsManagement'));
const PropertiesManagement = lazy(() => import('./pages/PropertiesManagement'));
const EngagementHub = lazy(() => import('./pages/EngagementHub'));
const DowntownPerks = lazy(() => import('./pages/DowntownPerks'));
const DeveloperEngagement = lazy(() => import('./pages/DeveloperEngagement'));
const About = lazy(() => import('./pages/About'));
const EventDetail = lazy(() => import('./pages/EventDetail'));
const PartnerDashboard = lazy(() => import('./pages/PartnerDashboard'));
const PartnerPortal = lazy(() => import('./pages/PartnerPortal'));
const Residents = lazy(() => import('./pages/Residents'));
const Segmentation = lazy(() => import('./pages/Segmentation'));
const PerkAnalytics = lazy(() => import('./pages/PerkAnalytics'));
const Events = lazy(() => import('./pages/Events'));
const Home = lazy(() => import('./pages/Home'));
const WelcomeFlow = lazy(() => import('./pages/WelcomeFlow'));
const Reports = lazy(() => import('./pages/Reports'));
const Surveys = lazy(() => import('./pages/Surveys'));
const AnnouncementManager = lazy(() => import('./pages/AnnouncementManager'));
const BackendWorkspace = lazy(() => import('./pages/BackendWorkspace'));
const PlatformCommandCenter = lazy(() => import('./pages/PlatformCommandCenter'));
const PartnerLifecycle = lazy(() => import('./pages/PartnerLifecycle'));
const Promotions = lazy(() => import('./pages/Promotions'));
const PartnerWorkspaceRoute = lazy(() => import('./routes/PartnerWorkspaceRoute'));
const PlatformModuleAudit = lazy(() => import('./pages/PlatformModuleAudit'));
const PartnerOutreachCRM = lazy(() => import('./pages/PartnerOutreachCRM'));

function RouteFallback() {
  return (
    <div className="min-h-screen bg-white p-6 text-sm font-semibold text-[#0B1F33]">
      Loading Downtown Perks.
    </div>
  );
}

function AuthAction() {
  const { user, configured, loading, signInWithGoogle, logout } = useAuth();
  const label = !configured ? 'Firebase pending' : user ? 'Sign out' : 'Sign in with Google';

  return (
    <button
      type="button"
      onClick={() => {
        if (!configured) return;
        void (user ? logout() : signInWithGoogle());
      }}
      className="fixed right-3 top-16 z-50 border border-[rgba(11,31,51,0.12)] bg-white px-2.5 py-1.5 text-[10px] font-semibold uppercase text-[#0B1F33] sm:top-20"
      aria-label={label}
    >
      {loading ? 'Checking session' : label}
    </button>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthAction />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
        <Route path="/" element={<PartnerDashboardLayout />}>
          <Route index element={<Home />} />
        </Route>
        <Route path="/map" element={<MapOS />} />
        <Route path="/welcome" element={<WelcomeFlow />} />
        <Route path="/partners" element={<PartnerLifecycle />} />
        <Route path="/partners/*" element={<PartnerLifecycle />} />
        <Route path="/workspace" element={<Navigate to="/workspace/home" replace />} />
        <Route path="/workspace/*" element={<PartnerLifecycle />} />
        <Route path="/partner/workspace" element={<Navigate to="/workspace/home" replace />} />
        <Route path="/partner-portal" element={<Navigate to="/admin/partner-portal" replace />} />
        <Route path="/partner-workspace" element={<Navigate to="/workspace/home" replace />} />
        <Route path="/partner-workspace/*" element={<Navigate to="/workspace/home" replace />} />
        <Route path="/the-shore-workspace" element={<PartnerWorkspaceRoute />} />
        <Route path="/workspaces/:slug" element={<PartnerWorkspaceRoute />} />
        <Route path="/admin/workspaces/:slug" element={<PartnerWorkspaceRoute />} />
        <Route path="/admin" element={<PartnerDashboardLayout />}>
          <Route index element={<BackendWorkspace />} />
          <Route path="home" element={<Home />} />
          <Route path="platform" element={<PlatformCommandCenter />} />
          <Route path="platform/modules" element={<PlatformModuleAudit />} />
          <Route path="platform/partners" element={<Navigate to="/admin/partner" replace />} />
          <Route path="platform/buildings" element={<Navigate to="/admin/buildings" replace />} />
          <Route path="platform/events" element={<Navigate to="/admin/events" replace />} />
          <Route path="platform/perks" element={<Navigate to="/admin/perks" replace />} />
          <Route path="platform/campaigns" element={<Navigate to="/admin/engagement" replace />} />
          <Route path="platform/residents" element={<Navigate to="/admin/residents" replace />} />
          <Route path="platform/reports" element={<Navigate to="/admin/reports" replace />} />
          <Route path="platform/settings" element={<Navigate to="/admin/settings" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="buildings" element={<BuildingsManagement />} />
          <Route path="properties" element={<PropertiesManagement />} />
          <Route path="buildings/:tab" element={<BuildingsManagement />} />
          <Route path="buildings/:buildingId/*" element={<BuildingsManagement />} />
          <Route path="buildings-with-residents" element={<Navigate to="/admin/buildings/residents" replace />} />
          <Route path="engagement" element={<EngagementHub />} />
          <Route path="perks" element={<DowntownPerks />} />
          <Route path="about" element={<About />} />
          <Route path="developer-engagement" element={<DeveloperEngagement />} />
          <Route path="events" element={<Events />} />
          <Route path="events/:eventId" element={<EventDetail />} />
          <Route path="partner" element={<PartnerDashboard />} />
          <Route path="outreach-crm" element={<PartnerOutreachCRM />} />
          <Route path="partner-portal" element={<PartnerPortal />} />
          <Route path="residents" element={<Residents />} />
          <Route path="segmentation" element={<Segmentation />} />
          <Route path="analytics" element={<PerkAnalytics />} />
          <Route path="settings" element={<BackendWorkspace />} />
          <Route path="reports" element={<Reports />} />
          <Route path="surveys" element={<Surveys />} />
          <Route path="announcements" element={<AnnouncementManager />} />
          <Route path="promotions" element={<Promotions />} />
        </Route>
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}
