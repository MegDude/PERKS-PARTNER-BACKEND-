import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MapOS from './pages/MapOS';
import PartnerDashboardLayout from './components/layout/PartnerDashboardLayout';
import Dashboard from './pages/Dashboard';
import BuildingsManagement from './pages/BuildingsManagement';
import PropertiesManagement from './pages/PropertiesManagement';
import EngagementHub from './pages/EngagementHub';
import DowntownPerks from './pages/DowntownPerks';

import DeveloperEngagement from './pages/DeveloperEngagement';
import About from './pages/About';
import EventDetail from './pages/EventDetail';

import PartnerDashboard from './pages/PartnerDashboard';
import PartnerPortal from './pages/PartnerPortal';
import Residents from './pages/Residents';
import Segmentation from './pages/Segmentation';
import PerkAnalytics from './pages/PerkAnalytics';
import Events from './pages/Events';

import Home from './pages/Home';
import WelcomeFlow from './pages/WelcomeFlow';
import Reports from './pages/Reports';
import Surveys from './pages/Surveys';
import AnnouncementManager from './pages/AnnouncementManager';
import BackendWorkspace from './pages/BackendWorkspace';
import PlatformCommandCenter from './pages/PlatformCommandCenter';
import PartnerLifecycle from './pages/PartnerLifecycle';
import Promotions from './pages/Promotions';
import TheShoreWorkspace from './routes/TheShoreWorkspace';
import PlatformModuleAudit from './pages/PlatformModuleAudit';

export default function App() {
  return (
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
      <Route path="/the-shore-workspace" element={<TheShoreWorkspace />} />
      <Route path="/admin/workspaces/the-shore" element={<TheShoreWorkspace />} />
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
        
        {/* Buildings Context Setup if needed */}
        <Route path="buildings" element={<BuildingsManagement />} />
        <Route path="properties" element={<PropertiesManagement />} />
        <Route path="buildings/:tab" element={<BuildingsManagement />} />
        
        {/* Direct Building Dashboard equivalent via BuildingManagement or direct access */}
        <Route path="buildings/:buildingId/*" element={<BuildingsManagement />} />
        
        <Route path="buildings-with-residents" element={<Navigate to="/admin/buildings/residents" replace />} />
        <Route path="engagement" element={<EngagementHub />} />
        <Route path="perks" element={<DowntownPerks />} />
        <Route path="about" element={<About />} />
        <Route path="developer-engagement" element={<DeveloperEngagement />} />
        <Route path="events" element={<Events />} />
        <Route path="events/:eventId" element={<EventDetail />} />
        <Route path="partner" element={<PartnerDashboard />} />
        <Route path="partner-portal" element={<PartnerPortal />} />
        <Route path="residents" element={<Residents />} />
        <Route path="segmentation" element={<Segmentation />} />
        <Route path="analytics" element={<PerkAnalytics />} />
        <Route path="settings" element={<BackendWorkspace />} />
        
        {/* New Pages */}
        <Route path="reports" element={<Reports />} />
        <Route path="surveys" element={<Surveys />} />
        <Route path="announcements" element={<AnnouncementManager />} />
        <Route path="promotions" element={<Promotions />} />
      </Route>
    </Routes>
  );
}
