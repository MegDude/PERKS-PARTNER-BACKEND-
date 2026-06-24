import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { ThemeProvider } from '@/components/ThemeProvider'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import EngagementHub from './pages/EngagementHub';
import Events from './pages/Events';
import Residents from './pages/Residents';
import PerkDetail from './pages/PerkDetail.jsx';
import EventDetail from './pages/EventDetail.jsx';
import AmenityReservations from './pages/AmenityReservations';
import BuildingsManagement from './pages/BuildingsManagement';
import Segmentation from './pages/Segmentation';
import Surveys from './pages/Surveys';
import AnnouncementManager from './pages/AnnouncementManager';
import AnnouncementFeed from './pages/AnnouncementFeed';
import PartnerDashboard from './pages/PartnerDashboard';
import PartnerPortal from './pages/PartnerPortal';
import PerkReporting from './pages/PerkReporting';
import BuildingLayout from './pages/BuildingLayout';
import Dashboard from './pages/Dashboard';
import DowntownPerks from './pages/DowntownPerks';
import Home from './pages/Home';
import EngagementCampaigns from './pages/EngagementCampaigns';
import SeedDemo from './pages/SeedDemo';
import PerkAnalytics from './pages/PerkAnalytics';
import ProductOfferings from './pages/ProductOfferings';
import Offers from './pages/Offers';
import ResidentProfile from './pages/ResidentProfile';

const LayoutWrapper = ({ children, currentPageName }) => {
  return children;
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      
      {/* Building Tab Module - Nested Routes */}
      <Route path="/buildings/:buildingId" element={<BuildingLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="residents" element={<Residents />} />
        <Route path="events" element={<Events />} />
        <Route path="events/:eventId" element={<EventDetail />} />
        <Route path="perks" element={<DowntownPerks />} />
        <Route path="perks/:perkId" element={<PerkDetail />} />
        <Route path="reports" element={<PerkReporting />} />
        <Route path="segmentation" element={<Segmentation />} />
        <Route path="surveys" element={<Surveys />} />
        <Route path="announcements" element={<AnnouncementManager />} />
        <Route path="announcements-feed" element={<AnnouncementFeed />} />
        <Route path="engagement" element={<EngagementHub />} />
        <Route path="campaigns" element={<EngagementCampaigns />} />
        <Route path="amenities" element={<AmenityReservations />} />
        <Route path="partners" element={<PartnerDashboard />} />
      </Route>

      {/* Seed Demo Data */}
      <Route path="/seed-demo" element={<SeedDemo />} />

      {/* Perk Analytics Dashboard */}
      <Route path="/perk-analytics" element={<LayoutWrapper currentPageName="PerkAnalytics"><PerkAnalytics /></LayoutWrapper>} />

      {/* Product Offerings Catalog */}
      <Route path="/product-offerings" element={<LayoutWrapper currentPageName="ProductOfferings"><ProductOfferings /></LayoutWrapper>} />

      {/* Offers — Image System */}
      <Route path="/offers" element={<LayoutWrapper currentPageName="Offers"><Offers /></LayoutWrapper>} />

      {/* Buildings Management - Main Portal */}
      <Route path="/buildings" element={<LayoutWrapper currentPageName="BuildingsManagement"><BuildingsManagement /></LayoutWrapper>} />

      {/* Partner Portal - Self-Service */}
      <Route path="/partner-portal" element={<LayoutWrapper currentPageName="PartnerPortal"><PartnerPortal /></LayoutWrapper>} />

      {/* Partner Workspace - Admin */}
      <Route path="/partner-workspace" element={<LayoutWrapper currentPageName="PartnerWorkspace"><PartnerDashboard /></LayoutWrapper>} />

      {/* Resident Profile */}
      <Route path="/profile" element={<LayoutWrapper currentPageName="ResidentProfile"><ResidentProfile /></LayoutWrapper>} />

      {/* Settings */}
      <Route path="/Settings" element={<LayoutWrapper currentPageName="Settings"><BuildingsManagement /></LayoutWrapper>} />
      
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <NavigationTracker />
            <AuthenticatedApp />
          </Router>
          <Toaster />
          <VisualEditAgent />
        </QueryClientProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App