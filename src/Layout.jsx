import { createPageUrl } from "@/utils";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Target, ArrowLeftRight, BarChart2, PiggyBank, CreditCard, TrendingUp, Settings, Bell, Lightbulb, Search, Grid3x3, ArrowLeft } from "lucide-react";
import AlertsDrawer from "@/components/dashboard/AlertsDrawer";
import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import NanaFloatingChat from "@/components/nana/NanaFloatingChat";
import ReminderNotificationPopup from "@/components/reminders/ReminderNotificationPopup";
import { AppSettingsProvider, useAppSettings } from "@/components/utils/AppSettingsContext";
import GlobalSearch from "@/components/search/GlobalSearch";
import { AnimatePresence, motion } from "framer-motion";
import TourGuide from "@/components/onboarding/TourGuide";
function LayoutInner({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showAlertsDrawer, setShowAlertsDrawer] = useState(false);
  const [unreadAlertCount, setUnreadAlertCount] = useState(0);
  const [showTour, setShowTour] = useState(false);
  const { t } = useAppSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const scrollPositions = useRef({});
  const mainContentRef = useRef(null);
  const tabHistory = useRef({
    Dashboard: "Dashboard",
    Transactions: "Transactions",
    Analytics: "Analytics",
    Investments: "Investments",
    Menu: "Menu"
  });

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      if (u?.onboarding_completed && !u?.tour_completed) {
        setTimeout(() => setShowTour(true), 1800);
      }
      // Fetch unread alerts count
      base44.entities.Alert.filter({ created_by: u.email, status: "unread" }).then((alerts) => {
        setUnreadAlertCount(alerts?.length || 0);
      }).catch(() => {});
    }).catch(() => {});
  }, []);

  // Dark mode: default light, only enable if user manually set it
  useEffect(() => {
    const manualDarkMode = localStorage.getItem("darkMode");
    if (manualDarkMode === "true") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const navItems = [
  { name: "Dashboard", label: t('nav_home'), icon: LayoutDashboard, page: "Dashboard" },
  { name: "Transactions", label: t('nav_transactions'), icon: ArrowLeftRight, page: "Transactions" },
  { name: "Goals", label: t('nav_goals'), icon: Target, page: "Goals" },
  { name: "Budget", label: t('nav_budget'), icon: PiggyBank, page: "Budget" },
  { name: "Debts", label: t('nav_debts'), icon: CreditCard, page: "Debts" },
  { name: "Investments", label: t('nav_investments'), icon: TrendingUp, page: "Investments" },
  { name: "Analytics", label: t('nav_analytics'), icon: BarChart2, page: "Analytics" },
  { name: "Tips", label: t('nav_tips'), icon: Lightbulb, page: "Tips", tourId: "tips-nav-link" }];


  const navSettingsItems = [
  { name: "Reminders", label: t('nav_reminders'), icon: Bell, page: "Reminders" },
  { name: "Alerts", label: t('nav_alerts'), icon: Bell, page: "Alerts" },
  { name: "Settings", label: t('nav_settings'), icon: Settings, page: "Settings" }];


  // Mobile: only 4 main + "Lainnya"
  const mobileMainNav = [
  { name: "Dashboard", label: t('nav_home'), icon: LayoutDashboard, page: "Dashboard" },
  { name: "Transactions", label: t('nav_transactions'), icon: ArrowLeftRight, page: "Transactions" },
  { name: "Analytics", label: t('nav_analytics'), icon: BarChart2, page: "Analytics" },
  { name: "Budget", label: t('nav_budget'), icon: PiggyBank, page: "Budget" }];


  const mobileMorePages = ["Goals", "Debts", "Reminders", "Alerts", "Tips", "Settings", "Menu"];

  const initials = user?.full_name ? user.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "U";

  // Detect if we're on a nested page (detail view)
  const mainPages = ["Dashboard", "Transactions", "Goals", "Budget", "Debts", "Investments", "Analytics", "Tips", "Reminders", "Alerts", "Settings", "Menu"];
  const isNestedPage = !mainPages.includes(currentPageName);

  // Handle browser back button (hardware back on Android, swipe-back on iOS)
  useEffect(() => {
    const handlePopState = (e) => {
      if (isNestedPage) {
        window.history.back();
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isNestedPage]);

  // Update tab history when navigating to a main page
  useEffect(() => {
    const mobileMainNav = ["Dashboard", "Transactions", "Analytics", "Investments"];
    const mobileMorePages = ["Goals", "Budget", "Debts", "Reminders", "Alerts", "Tips", "Settings", "Menu"];

    if (mobileMainNav.includes(currentPageName)) {
      tabHistory.current[currentPageName] = currentPageName;
    } else if (mobileMorePages.includes(currentPageName)) {
      tabHistory.current["Menu"] = currentPageName;
    }
  }, [currentPageName]);

  // Handle tab clicks - navigate with React Router for soft navigation
  const handleTabClick = (tabName) => {
    const targetPage = tabHistory.current[tabName];
    if (currentPageName === targetPage) {
      // Already on this tab, scroll to top
      if (mainContentRef.current) {
        mainContentRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      // Navigate to tab using React Router for better history preservation
      navigate(createPageUrl(tabName));
    }
  };

  // Save scroll position when leaving a page
  useEffect(() => {
    if (mainContentRef.current) {
      scrollPositions.current[currentPageName] = mainContentRef.current.scrollTop;
    }
  }, [currentPageName]);

  // Restore scroll position when returning to a page
  useEffect(() => {
    if (mainContentRef.current && scrollPositions.current[currentPageName]) {
      mainContentRef.current.scrollTop = scrollPositions.current[currentPageName];
    }
  }, [currentPageName]);

  return (
    <div className="min-h-screen font-sans bg-[#F2F4F7] sm:pb-0" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 64px)' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; }
        * { -webkit-font-smoothing: antialiased; }
        html { color-scheme: light; }
        html.dark { color-scheme: dark; }
      `}</style>

      {/* Desktop sidebar */}
      <div className="hidden sm:flex fixed left-0 top-0 h-full w-60 bg-[#0A0A0A] flex-col px-5 py-8 z-40">
        {/* Logo */}
        <div className="mb-8 px-2 flex items-center gap-2">
          <img src="https://media.base44.com/images/public/69a82e8090f60786b869983c/d2e52bdf2_3.png" alt="Logo" className="w-10 h10" />
          <div>
            <p className="text-xl font-bold text-white tracking-tight">Atur Pintar</p>
            <p className="text-xs text-[#8FA4C8] mt-0.5">Financial Tracker</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => {
            const active = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                data-tour={item.tourId || undefined}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active ?
                "bg-[#FF6A00] text-white shadow-sm" :
                "text-[#888] hover:text-white hover:bg-white/10"}`
                }>

                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>);

          })}
        </nav>

        {/* Search */}
        <button
          onClick={() => setShowSearch(true)}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-[#888] hover:text-white hover:bg-white/10 transition-colors w-full tap-highlight-fix">

          <Search className="w-4 h-4" />
          {t('search_placeholder')}
        </button>

        {/* Settings group at bottom */}
        <div className="border-t border-white/10 pt-2 mt-2 space-y-1">
          {navSettingsItems.map((item) => {
            const active = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active ?
                "bg-[#FF6A00] text-white shadow-sm" :
                "text-[#888] hover:text-white hover:bg-white/10"}`
                }>

                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>);

          })}
        </div>

        {/* Profile */}
        <div className="space-y-1 mt-2">
          <Link
            to={createPageUrl("ProfileSettings")}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-[#888] hover:text-white hover:bg-white/10 transition-colors">

            <div className="w-5 h-5 rounded-full bg-[#FF6A00] flex items-center justify-center text-white text-[9px] font-bold overflow-hidden">
              {user?.photo_url ? <img src={user.photo_url} alt="avatar" className="w-full h-full object-cover" /> : initials}
            </div>
            <span className="truncate">{user?.full_name || t('profile')}</span>
          </Link>
        </div>
      </div>

      {/* Mobile top header */}
      <div className="sm:hidden fixed top-0 left-0 right-0 z-40 bg-[#0A0A0A] border-b border-white/10" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="flex items-center justify-between px-5 py-3">
          {isNestedPage ?
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-white hover:bg-white/10 px-2 py-1 rounded-lg transition-colors tap-highlight-fix">
            
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">{t('back')}</span>
            </button> :

          <div className="flex items-center gap-1">
              <img src="https://media.base44.com/images/public/69a82e8090f60786b869983c/d2e52bdf2_3.png" alt="Logo" className="w-8 h-8 flex-shrink-0" />
              <p className="text-white text-base font-bold tracking-tight">Atur Pintar</p>
            </div>
          }

          <div className="flex items-center gap-2">
            <button onClick={() => { setShowAlertsDrawer(true); setUnreadAlertCount(0); }} className="relative w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white tap-highlight-fix">
              <Bell className="w-4 h-4" />
              {unreadAlertCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF6A00] text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadAlertCount > 9 ? "9+" : unreadAlertCount}
                </span>
              )}
            </button>
            <button onClick={() => setShowSearch(true)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white tap-highlight-fix">
              <Search className="w-4 h-4" />
            </button>
            <Link to={createPageUrl("ProfileSettings")} className="w-8 h-8 rounded-full bg-[#FF6A00] flex items-center justify-center text-white text-xs font-bold tap-highlight-fix overflow-hidden">
              {user?.photo_url ? <img src={user.photo_url} alt="avatar" className="w-full h-full object-cover" /> : initials}
            </Link>
          </div>
        </div>
      </div>

      {/* Main content — add top padding on mobile for header */}
      <div ref={mainContentRef} className="sm:ml-60 pt-14 sm:pt-0 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPageName}
            initial={{ opacity: 0, x: isNestedPage ? 50 : -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isNestedPage ? -50 : 50 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}>
            
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 sm:hidden bg-[#0A0A0A] flex z-40 border-t border-white/10" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {mobileMainNav.map((item) => {
          const active = currentPageName === item.page;
          return (
            <button
              key={`tab-${item.page}`}
              onClick={() => handleTabClick(item.page)}
              className={`flex-1 flex flex-col items-center py-3 gap-0.5 text-[10px] font-medium transition-colors tap-highlight-fix bg-transparent border-none cursor-pointer ${
              active ? "text-[#FF6A00]" : "text-[#888]"}`}>
              
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>);

        })}
        {/* More button → goes to Menu page */}
        <button
          key="menu"
          data-tour="mobile-more-tab"
          onClick={() => handleTabClick("Menu")}
          className={`flex-1 flex flex-col items-center py-3 gap-0.5 text-[10px] font-medium transition-colors tap-highlight-fix bg-transparent border-none cursor-pointer ${
          mobileMorePages.includes(currentPageName) ? "text-[#FF6A00]" : "text-[#888]"}`}>
          
          <Grid3x3 className="w-5 h-5" />
          {t('nav_more')}
        </button>
      </div>

      {/* Nana Floating Chat */}
      <NanaFloatingChat />

      {/* Reminder Notification Popup */}
      <ReminderNotificationPopup user={user} />



      {/* Alerts Drawer */}
      {showAlertsDrawer && <AlertsDrawer onClose={() => setShowAlertsDrawer(false)} user={user} />}

      {/* Global Search */}
      {showSearch && <GlobalSearch onClose={() => setShowSearch(false)} />}

      {/* Tour Guide - lives in Layout so it persists across page navigations */}
      {showTour &&
      <TourGuide onComplete={async () => {
        setShowTour(false);
        await base44.auth.updateMe({ tour_completed: true });
      }} />
      }
    </div>);

}

export default function Layout({ children, currentPageName }) {
  return (
    <AppSettingsProvider>
      <LayoutInner currentPageName={currentPageName}>{children}</LayoutInner>
    </AppSettingsProvider>);

}