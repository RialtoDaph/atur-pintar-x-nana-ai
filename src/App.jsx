import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query'
import { base44 } from '@/api/base44Client';
import { queryClientInstance } from '@/lib/query-client'
import { AppConfigProvider } from '@/components/utils/AppConfigContext'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Subscription from '@/pages/Subscription';
import LandingPage from '@/pages/LandingPage';
import AdminSubscriptions from '@/pages/AdminSubscriptions';
import Dashboard from '@/pages/Dashboard';
import ProfileSettings from '@/pages/ProfileSettings';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import TermsOfService from '@/pages/TermsOfService';
import Notifications from '@/pages/Notifications';
import Accounts from '@/pages/Accounts';
import SharedFinance from '@/pages/SharedFinance';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminUsers from '@/pages/AdminUsers';
import AdminLogs from '@/pages/AdminLogs';
import AdminNotifications from '@/pages/AdminNotifications';
import AdminCategories from '@/pages/AdminCategories';
import AdminSettings from '@/pages/AdminSettings';
import AdminDefaultAccounts from '@/pages/AdminDefaultAccounts';
import MaintenancePage from '@/pages/MaintenancePage';
import About from '@/pages/About';
import Achievements from '@/pages/Achievements';
import ReceiptScanHistory from '@/pages/ReceiptScanHistory';
import Gamifikasi from '@/pages/Gamifikasi';
import Investments from '@/pages/Investments';
import AdminProtect from '@/components/admin/AdminProtect';

const { Pages, Layout } = pagesConfig;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.entities.AppConfig.list().then(configs => {
      if (configs && configs.length && configs[0].maintenance_mode === true) {
        setMaintenanceMode(true);
      }
    }).catch(() => {});
    base44.auth.me().then(u => setCurrentUser(u)).catch(() => {});
  }, []);

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Maintenance mode check
  if (maintenanceMode && currentUser?.role !== 'admin') {
    return <MaintenancePage />;
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Allow landing page to be public
      const publicPaths = ['/', '/LandingPage', '/PrivacyPolicy', '/TermsOfService'];
      if (publicPaths.includes(window.location.pathname)) {
        return (
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />
            <Route path="/TermsOfService" element={<TermsOfService />} />
            <Route path="*" element={<LandingPage />} />
          </Routes>
        );
      }
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/Dashboard" replace />} />
      <Route path="/Dashboard" element={
        <LayoutWrapper currentPageName="Dashboard">
          <Dashboard />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).filter(([path]) => path !== 'Dashboard' && path !== 'LandingPage' && path !== 'Subscription' && path !== 'AdminSubscriptions' && path !== 'ProfileSettings' && path !== 'Investments' && path !== 'Reminders' && path !== 'Alerts' && path !== 'Notifications' && path !== 'Accounts' && path !== 'SharedFinance' && path !== 'AdminUsers' && path !== 'AdminLogs' && path !== 'AdminNotifications' && path !== 'AdminCategories' && path !== 'AdminDashboard').map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/LandingPage" element={<LandingPage />} />
      <Route path="/Subscription" element={<LayoutWrapper currentPageName="Subscription"><Subscription /></LayoutWrapper>} />
      <Route path="/AdminSubscriptions" element={<LayoutWrapper currentPageName="AdminSubscriptions"><AdminSubscriptions /></LayoutWrapper>} />
      <Route path="/ProfileSettings" element={<LayoutWrapper currentPageName="ProfileSettings"><ProfileSettings /></LayoutWrapper>} />
      <Route path="/Notifications" element={<LayoutWrapper currentPageName="Notifications"><Notifications /></LayoutWrapper>} />
      <Route path="/Accounts" element={<LayoutWrapper currentPageName="Accounts"><Accounts /></LayoutWrapper>} />
      <Route path="/SharedFinance" element={<LayoutWrapper currentPageName="SharedFinance"><SharedFinance /></LayoutWrapper>} />
      <Route path="/AdminDashboard" element={<LayoutWrapper currentPageName="AdminDashboard"><AdminProtect><AdminDashboard /></AdminProtect></LayoutWrapper>} />
      <Route path="/AdminUsers" element={<LayoutWrapper currentPageName="AdminUsers"><AdminProtect><AdminUsers /></AdminProtect></LayoutWrapper>} />
      <Route path="/AdminLogs" element={<LayoutWrapper currentPageName="AdminLogs"><AdminProtect><AdminLogs /></AdminProtect></LayoutWrapper>} />
      <Route path="/AdminNotifications" element={<LayoutWrapper currentPageName="AdminNotifications"><AdminProtect><AdminNotifications /></AdminProtect></LayoutWrapper>} />
      <Route path="/AdminCategories" element={<LayoutWrapper currentPageName="AdminCategories"><AdminProtect><AdminCategories /></AdminProtect></LayoutWrapper>} />
      <Route path="/AdminSettings" element={<LayoutWrapper currentPageName="AdminSettings"><AdminProtect><AdminSettings /></AdminProtect></LayoutWrapper>} />
      <Route path="/AdminDefaultAccounts" element={<LayoutWrapper currentPageName="AdminDefaultAccounts"><AdminProtect><AdminDefaultAccounts /></AdminProtect></LayoutWrapper>} />
      <Route path="/AdminAIInsights" element={<Navigate to="/AdminDashboard" replace />} />
      <Route path="/AdminAnomalies" element={<Navigate to="/AdminDashboard" replace />} />
      <Route path="/AdminTransactions" element={<Navigate to="/AdminUsers" replace />} />
      <Route path="/About" element={<About />} />
      <Route path="/Achievements" element={<LayoutWrapper currentPageName="Achievements"><Achievements /></LayoutWrapper>} />
      <Route path="/ReceiptScanHistory" element={<LayoutWrapper currentPageName="ReceiptScanHistory"><ReceiptScanHistory /></LayoutWrapper>} />
      <Route path="/Gamifikasi" element={<LayoutWrapper currentPageName="Gamifikasi"><Gamifikasi /></LayoutWrapper>} />
      <Route path="/Investments" element={<LayoutWrapper currentPageName="Investments"><Investments /></LayoutWrapper>} />
      <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />
      <Route path="/TermsOfService" element={<TermsOfService />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <AppConfigProvider>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </AppConfigProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App