import { createPageUrl } from "@/utils";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Target, ArrowLeftRight, BarChart2, PiggyBank, CreditCard, TrendingUp, Settings, MoreHorizontal, Bell, Lightbulb, Search, Grid3x3, ArrowLeft } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import NanaFloatingChat from "@/components/nana/NanaFloatingChat";
import { AppSettingsProvider, useAppSettings } from "@/components/utils/AppSettingsContext";
import GlobalSearch from "@/components/search/GlobalSearch";
import { AnimatePresence, motion } from "framer-motion";
import LandingPage from "@/pages/LandingPage";

const WAITING_LIST_MODE = false;

function LayoutInner({ children, currentPageName }) {
  if (WAITING_LIST_MODE) {
    return <LandingPage />;
  }
  const [user, setUser] = useState(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
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
    Menu: "Menu",
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Initialize dark mode with system preference detection and manual override support
  useEffect(() => {
    const manualDarkMode = localStorage.getItem("darkMode");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    // Respect manual override if set, otherwise use system preference
    const shouldBeDark = manualDarkMode !== null ? manualDarkMode === "true" : prefersDark;
    if (shouldBeDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, []);

  // Listen for system color scheme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => {
      const manualDarkMode = localStorage.getItem("darkMode");
      // Only apply system change if user hasn't manually overridden
      if (manualDarkMode === null) {
        if (e.matches) document.documentElement.classList.add("dark");
        else document.documentElement.classList.remove("dark");
      }
    };
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const navItems = [
  { name: "Dashboard", label: t('nav_home'), icon: LayoutDashboard, page: "Dashboard" },
  { name: "Transactions", label: t('nav_transactions'), icon: ArrowLeftRight, page: "Transactions" },
  { name: "Goals", label: t('nav_goals'), icon: Target, page: "Goals" },
  { name: "Budget", label: t('nav_budget'), icon: PiggyBank, page: "Budget" },
  { name: "Debts", label: t('nav_debts'), icon: CreditCard, page: "Debts" },
  { name: "Investments", label: t('nav_investments'), icon: TrendingUp, page: "Investments" },
  { name: "Analytics", label: t('nav_analytics'), icon: BarChart2, page: "Analytics" },
  { name: "Tips", label: t('nav_tips'), icon: Lightbulb, page: "Tips" }];


  const navSettingsItems = [
  { name: "Reminders", label: t('nav_reminders'), icon: Bell, page: "Reminders" },
  { name: "Alerts", label: t('nav_alerts'), icon: Bell, page: "Alerts" },
  { name: "Settings", label: t('nav_settings'), icon: Settings, page: "Settings" }];


  // Mobile: only 4 main + "Lainnya"
  const mobileMainNav = [
  { name: "Dashboard", label: t('nav_home'), icon: LayoutDashboard, page: "Dashboard" },
  { name: "Transactions", label: t('nav_transactions'), icon: ArrowLeftRight, page: "Transactions" },
  { name: "Analytics", label: t('nav_analytics'), icon: BarChart2, page: "Analytics" },
  { name: "Investments", label: t('nav_investments'), icon: TrendingUp, page: "Investments" }];


  const mobileMorePages = ["Goals", "Budget", "Debts", "Reminders", "Alerts", "Tips", "Settings", "Menu"];

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
        <div className="mb-8 px-2">
          <p className="text-xl font-bold text-white tracking-tight">Atur Pintar</p>
          <p className="text-xs text-[#8FA4C8] mt-0.5">Financial Tracker</p>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => {
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
            to={createPageUrl("Settings")}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-[#888] hover:text-white hover:bg-white/10 transition-colors">

            <div className="w-5 h-5 rounded-full bg-[#FF6A00] flex items-center justify-center text-white text-[9px] font-bold">
              {initials}
            </div>
            <span className="truncate">{user?.full_name || t('profile')}</span>
          </Link>
        </div>
      </div>

      {/* Mobile top header */}
      <div className="sm:hidden fixed top-0 left-0 right-0 z-40 bg-[#0A0A0A] border-b border-white/10" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="flex items-center justify-between px-5 py-3">
          {isNestedPage ? (
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 text-white hover:bg-white/10 px-2 py-1 rounded-lg transition-colors tap-highlight-fix"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">{t('back')}</span>
            </button>
          ) : (
            <p className="text-white font-bold text-lg tracking-tight">Atur Pintar</p>
          )}

          <div className="flex items-center gap-2">
            <button onClick={() => setShowSearch(true)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white tap-highlight-fix">
              <Search className="w-4 h-4" />
            </button>
            <Link to={createPageUrl("Settings")} className="w-8 h-8 rounded-full bg-[#FF6A00] flex items-center justify-center text-white text-xs font-bold tap-highlight-fix">
              {initials}
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
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
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
              active ? "text-[#FF6A00]" : "text-[#888]"}`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          );
        })}
        {/* More button → goes to Menu page */}
        <button
          key="menu"
          onClick={() => handleTabClick("Menu")}
          className={`flex-1 flex flex-col items-center py-3 gap-0.5 text-[10px] font-medium transition-colors tap-highlight-fix bg-transparent border-none cursor-pointer ${
          mobileMorePages.includes(currentPageName) ? "text-[#FF6A00]" : "text-[#888]"}`}
        >
          <Grid3x3 className="w-5 h-5" />
          {t('nav_more')}
        </button>
      </div>

      {/* Nana Floating Chat */}
      {currentPageName !== "Nana" && <NanaFloatingChat />}

      {/* Global Search */}
      {showSearch && <GlobalSearch onClose={() => setShowSearch(false)} />}
    </div>);

}

export default function Layout({ children, currentPageName }) {
  return (
    <AppSettingsProvider>
      <LayoutInner currentPageName={currentPageName}>{children}</LayoutInner>
    </AppSettingsProvider>);

}