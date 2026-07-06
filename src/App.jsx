import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect, lazy, Suspense } from 'react';
// (useEffect juga dipakai oleh ExternalRedirect di bawah)
import { QueryClientProvider } from '@tanstack/react-query'
import { base44 } from '@/api/base44Client';
import { queryClientInstance } from '@/lib/query-client'
import { AppConfigProvider } from '@/components/utils/AppConfigContext'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ErrorBoundary from '@/components/utils/ErrorBoundary';
import RouteErrorBoundary from '@/components/utils/RouteErrorBoundary';
import AdminProtect from '@/components/admin/AdminProtect';
import ProtectedRoute from '@/components/ProtectedRoute';

// Eager — needed for first paint (lightweight pages)
import MaintenancePage from '@/pages/MaintenancePage';
import TourGuide from '@/components/onboarding/TourGuide';

// Landing page & halaman legal (Privacy, Terms, Refund, Cancellation) sekarang
// di-serve dari app terpisah di https://aturpintar.com — bukan lagi bagian dari app ini.

// Auth pages (custom auth) — eager so /login loads instantly
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

// Lazy — loaded only when user navigates to them
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Subscription = lazy(() => import('@/pages/Subscription'));
const ProfileSettings = lazy(() => import('@/pages/ProfileSettings'));
const Accounts = lazy(() => import('@/pages/Accounts'));
const SharedFinance = lazy(() => import('@/pages/SharedFinance'));
const About = lazy(() => import('@/pages/About'));
const ReceiptScanHistory = lazy(() => import('@/pages/ReceiptScanHistory'));
const Gamifikasi = lazy(() => import('@/pages/Gamifikasi'));
const Investments = lazy(() => import('@/pages/Investments'));
const AdminInbox = lazy(() => import('@/pages/AdminInbox'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const AdminUsers = lazy(() => import('@/pages/AdminUsers'));
const AdminLogs = lazy(() => import('@/pages/AdminLogs'));
const AdminNotifications = lazy(() => import('@/pages/AdminNotifications'));
const AdminCategories = lazy(() => import('@/pages/AdminCategories'));
const AdminSettings = lazy(() => import('@/pages/AdminSettings'));
const AdminDefaultAccounts = lazy(() => import('@/pages/AdminDefaultAccounts'));
const AdminSubscriptions = lazy(() => import('@/pages/AdminSubscriptions'));
const AdminFeedback = lazy(() => import('@/pages/AdminFeedback'));

// Suspense fallback — inline spinner that respects layout (sidebar/nav stay visible)
const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

const { Pages, Layout } = pagesConfig;

// Root route: logged-in users go to dashboard, everyone else goes to login.
// Landing page dipindah ke app terpisah (https://aturpintar.com).
const RootRoute = () => {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }
  return isAuthenticated ? <Navigate to="/Dashboard" replace /> : <Navigate to="/login" replace />;
};

// External redirect helper — dipakai untuk semua route legal lama.
// Kalau ada link/email lama yang buka /PrivacyPolicy dll, langsung dilempar ke domain landing.
const ExternalRedirect = ({ url }) => {
  useEffect(() => { window.location.replace(url); }, [url]);
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
    </div>
  );
};

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>
    <RouteErrorBoundary pageKey={currentPageName}>{children}</RouteErrorBoundary>
  </Layout>
  : <RouteErrorBoundary pageKey={currentPageName}>{children}</RouteErrorBoundary>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings } = useAuth();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    base44.entities.AppConfig.list().then(configs => {
      if (configs && configs.length && configs[0].maintenance_mode === true) {
        setMaintenanceMode(true);
      }
    }).catch(() => {});

    const checkUserForTour = () => {
      base44.auth.me().then(u => {
        setCurrentUser(u);
        if (u?.onboarding_completed && !u?.tour_completed) {
          setTimeout(() => setShowTour(true), 1800);
        }
      }).catch(() => {});
    };

    checkUserForTour();

    // Re-check after onboarding completes in the same session
    // (Dashboard dispatches this event after refetching the user)
    const onOnboardingDone = () => checkUserForTour();
    window.addEventListener("onboarding-completed", onOnboardingDone);
    return () => window.removeEventListener("onboarding-completed", onOnboardingDone);
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

  // Render the main app
  // Public routes: /login, /register, /forgot-password, /reset-password, /LandingPage, /PrivacyPolicy, /TermsOfService
  // All other routes are gated by ProtectedRoute → unauthenticated users redirect to /login
  return (
    <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* ── Public auth pages ── */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* ── Public marketing/legal pages ──
          Semua di-redirect ke landing app (https://aturpintar.com). */}
      <Route path="/" element={<RootRoute />} />
      <Route path="/LandingPage" element={<ExternalRedirect url="https://aturpintar.com" />} />
      <Route path="/PrivacyPolicy" element={<ExternalRedirect url="https://aturpintar.com/PrivacyPolicy" />} />
      <Route path="/TermsOfService" element={<ExternalRedirect url="https://aturpintar.com/TermsOfService" />} />
      <Route path="/RefundPolicy" element={<ExternalRedirect url="https://aturpintar.com/RefundPolicy" />} />
      <Route path="/CancellationPolicy" element={<ExternalRedirect url="https://aturpintar.com/CancellationPolicy" />} />
      <Route path="/About" element={<About />} />

      {/* ── Gated app routes ── */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/Dashboard" element={
          <LayoutWrapper currentPageName="Dashboard">
            <Dashboard />
          </LayoutWrapper>
        } />
        {Object.entries(Pages).filter(([path]) => !['Dashboard', 'LandingPage', 'Reminders'].includes(path)).map(([path, Page]) => (
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
        <Route path="/Subscription" element={<LayoutWrapper currentPageName="Subscription"><Subscription /></LayoutWrapper>} />
        <Route path="/AdminSubscriptions" element={<AdminProtect><AdminSubscriptions /></AdminProtect>} />
        <Route path="/ProfileSettings" element={<LayoutWrapper currentPageName="ProfileSettings"><ProfileSettings /></LayoutWrapper>} />
        <Route path="/Notifications" element={<Navigate to="/Dashboard" replace />} />
        <Route path="/Reminders" element={<Navigate to="/Dashboard" replace />} />
        <Route path="/Alerts" element={<Navigate to="/Dashboard" replace />} />
        <Route path="/Accounts" element={<LayoutWrapper currentPageName="Accounts"><Accounts /></LayoutWrapper>} />
        <Route path="/SharedFinance" element={<LayoutWrapper currentPageName="SharedFinance"><SharedFinance /></LayoutWrapper>} />
        <Route path="/Menu" element={<Navigate to="/Accounts" replace />} />
        <Route path="/AdminInbox" element={<AdminProtect><AdminInbox /></AdminProtect>} />
        <Route path="/AdminDashboard" element={<AdminProtect><AdminDashboard /></AdminProtect>} />
        <Route path="/AdminUsers" element={<AdminProtect><AdminUsers /></AdminProtect>} />
        <Route path="/AdminLogs" element={<AdminProtect><AdminLogs /></AdminProtect>} />
        <Route path="/AdminNotifications" element={<AdminProtect><AdminNotifications /></AdminProtect>} />
        <Route path="/AdminCategories" element={<AdminProtect><AdminCategories /></AdminProtect>} />
        <Route path="/AdminSettings" element={<AdminProtect><AdminSettings /></AdminProtect>} />
        <Route path="/AdminFeedback" element={<AdminProtect><AdminFeedback /></AdminProtect>} />
        <Route path="/AdminDefaultAccounts" element={<AdminProtect><AdminDefaultAccounts /></AdminProtect>} />
        <Route path="/AdminAIInsights" element={<Navigate to="/AdminDashboard" replace />} />
        <Route path="/AdminAnomalies" element={<Navigate to="/AdminDashboard" replace />} />
        <Route path="/AdminTransactions" element={<Navigate to="/AdminUsers" replace />} />
        <Route path="/Achievements" element={<Navigate to="/Gamifikasi" replace />} />
        <Route path="/ReceiptScanHistory" element={<LayoutWrapper currentPageName="ReceiptScanHistory"><ReceiptScanHistory /></LayoutWrapper>} />
        <Route path="/Gamifikasi" element={<LayoutWrapper currentPageName="Gamifikasi"><Gamifikasi /></LayoutWrapper>} />
        <Route path="/Investments" element={<LayoutWrapper currentPageName="Investments"><Investments /></LayoutWrapper>} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
    {showTour && (
      <TourGuide onComplete={async () => {
        setShowTour(false);
        try { await base44.auth.updateMe({ tour_completed: true }); } catch {}
      }} />
    )}
    </Suspense>
  );
};


function App() {

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  )
}

export default App