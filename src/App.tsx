import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MapOS from './pages/MapOS';
import PartnerDashboardLayout from './components/layout/PartnerDashboardLayout';
import Dashboard from './pages/Dashboard';
import BuildingsManagement from './pages/BuildingsManagement';
import PropertiesManagement from './pages/PropertiesManagement';
import EngagementHub from './pages/EngagementHub';
import DowntownPerks from './pages/DowntownPerks';

import BuildingsWithResidents from './pages/BuildingsWithResidents';
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
import BuildingEngagement from './pages/BuildingEngagement';
import BackendWorkspace from './pages/BackendWorkspace';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/map" element={<MapOS />} />
      <Route path="/welcome" element={<WelcomeFlow />} />
      <Route path="/admin" element={<PartnerDashboardLayout />}>
        <Route index element={<BackendWorkspace />} />
        <Route path="home" element={<Home />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Buildings Context Setup if needed */}
        <Route path="buildings" element={<BuildingsManagement />} />
        <Route path="properties" element={<PropertiesManagement />} />
        <Route path="buildings/:tab" element={<BuildingsManagement />} />
        
        {/* Direct Building Dashboard equivalent via BuildingManagement or direct access */}
        <Route path="buildings/:buildingId/*" element={<BuildingsManagement />} />
        
        <Route path="buildings-with-residents" element={<BuildingsWithResidents />} />
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
        
        {/* New Pages */}
        <Route path="reports" element={<Reports />} />
        <Route path="surveys" element={<Surveys />} />
        <Route path="announcements" element={<AnnouncementManager />} />
      </Route>
    </Routes>
  );
}
