import { createPageUrl } from "@/utils";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Target, ArrowLeftRight, BarChart2, PiggyBank, CreditCard, Settings, Bell, Lightbulb, Search, Grid3x3, ArrowLeft, Wallet, Users, Sparkles, Plus } from "lucide-react";
import AddTransactionModal from "@/components/transactions/AddTransactionModal";
import AlertsDrawer from "@/components/dashboard/AlertsDrawer";
import AdminNotificationPanel from "@/components/notifications/AdminNotificationPanel";
import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";

import ReminderNotificationPopup from "@/components/reminders/ReminderNotificationPopup";
import { syncAccountBalance } from "@/components/utils/accountSync";
import { updateChallengesAfterTransaction } from "@/lib/updateChallengesAfterTransaction";
import { AppSettingsProvider, useAppSettings } from "@/components/utils/AppSettingsContext";
import GlobalSearch from "@/components/search/GlobalSearch";
import { AnimatePresence, motion } from "framer-motion";
import TourGuide from "@/components/onboarding/TourGuide";
function LayoutInner({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showAlertsDrawer, setShowAlertsDrawer] = useState(false);
  const [anyModalOpen, setAnyModalOpen] = useState(false);
  const [unreadAlertCount, setUnreadAlertCount] = useState(0);
  const [showTour, setShowTour] = useState(false);
  const [unreadAdminCount, setUnreadAdminCount] = useState(0);
  const { t } = useAppSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const scrollPositions = useRef({});
  const mainContentRef = useRef(null);
  const tabHistory = useRef({
    Dashboard: "Dashboard",
    Nana: "Nana",
    Analytics: "Analytics",
    Transactions: "Transactions",
    Menu: "Menu"
  });

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      if (u?.onboarding_completed && !u?.tour_completed) {
        setTimeout(() => setShowTour(true), 1800);
      }
      // Log login
      base44.functions.invoke('logUserLogin', {}).catch(() => {});

      // Fetch unread alerts only (badge count) — dedupe by title+category to avoid hiding distinct alerts
      base44.entities.Alert.filter({ created_by: u.email, status: "unread" }).then((alerts) => {
        const seen = new Set();
        let count = 0;
        for (const a of alerts || []) {
          const key = `${a.title}::${a.category || ""}`;
          if (!seen.has(key)) {
            seen.add(key);
            count++;
          }
        }
        setUnreadAlertCount(Math.min(count, 10));
      }).catch(() => {});

      // Fetch unread admin notifications
      base44.entities.AdminNotification.list().then((notifs) => {
        const relevant = notifs.filter((n) =>
        (n.target_type === 'all' || n.target_email === u.email) &&
        !n.read_by?.includes(u.email)
        );
        setUnreadAdminCount(relevant.length);
      }).catch(() => {});

      // Fetch upcoming reminders
      base44.entities.Reminder.filter({ is_active: true, created_by: u.email }).then((reminders) => {
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const upcoming = reminders.filter((r) => {
          if (r.last_dismissed_month === currentMonth) return false;
          const thisMonth = new Date(now.getFullYear(), now.getMonth(), r.due_day);
          const target = thisMonth < now ? new Date(now.getFullYear(), now.getMonth() + 1, r.due_day) : thisMonth;
          const days = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
          return days <= 7;
        });
        setUnreadAlertCount((prev) => prev + upcoming.length);
      }).catch(() => {});
    }).catch(() => {});
  }, []);

  // Keyboard height detection for mobile
  useEffect(() => {
    if (!window.visualViewport) return;
    const handler = () => {
      const keyH = Math.max(0, window.innerHeight - window.visualViewport.height);
      setKeyboardHeight(keyH);
    };
    window.visualViewport.addEventListener('resize', handler);
    return () => window.visualViewport.removeEventListener('resize', handler);
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
  { name: "Accounts", label: "Rekening", icon: Wallet, page: "Accounts" },
  { name: "SharedFinance", label: "Keuangan Bersama", icon: Users, page: "SharedFinance" },
  { name: "Analytics", label: t('nav_analytics'), icon: BarChart2, page: "Analytics" },
  { name: "Tips", label: t('nav_tips'), icon: Lightbulb, page: "Tips", tourId: "tips-nav-link" }];


  const navSettingsItems = [
  { name: "Notifications", label: "Notifikasi", icon: Bell, page: "Notifications" },
  { name: "Settings", label: t('nav_settings'), icon: Settings, page: "Settings" }];


  // Mobile: 4 main items + "Lainnya" (Budget moved to Menu)
  const NANA_AVATAR_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/7708b64f5_generated_image.png";

  const mobileMainNav = [
  { name: "Dashboard", label: t('nav_home'), icon: LayoutDashboard, page: "Dashboard" },
  { name: "Nana", label: "Nana AI", icon: null, page: "Nana", avatarUrl: NANA_AVATAR_URL },
  { name: "Analytics", label: t('nav_analytics'), icon: BarChart2, page: "Analytics" },
  { name: "Transactions", label: t('nav_transactions'), icon: ArrowLeftRight, page: "Transactions" }];


  const mobileMorePages = ["Goals", "Debts", "Notifications", "Accounts", "SharedFinance", "Tips", "Settings", "Menu", "Budget"];

  const initials = user?.full_name ? user.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "U";

  // Detect open modals → hide mobile nav + Nana
  useEffect(() => {
    const checkModals = () => {
      const hasModal = document.querySelectorAll('[role="dialog"][data-state="open"], .fixed.inset-0:not([data-nana]):not([data-tour-overlay])').length > 0;
      setAnyModalOpen(hasModal);
    };
    const observer = new MutationObserver(checkModals);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-state", "class"] });
    return () => observer.disconnect();
  }, []);

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
    const mobileMainNavNames = ["Dashboard", "Nana", "Analytics", "Transactions"];
    const mobileMorePagesNames = ["Goals", "Debts", "Reminders", "Alerts", "Tips", "Settings", "Menu", "Investments", "Budget", "Accounts", "SharedFinance", "Notifications"];

    if (mobileMainNavNames.includes(currentPageName)) {
      tabHistory.current[currentPageName] = currentPageName;
    } else if (mobileMorePagesNames.includes(currentPageName)) {
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
    <div className="min-h-screen font-sans bg-[#F2F4F7]" style={{ paddingBottom: keyboardHeight > 0 ? `${keyboardHeight}px` : undefined }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; }
        * { -webkit-font-smoothing: antialiased; }
        html { color-scheme: light; }
        html.dark { color-scheme: dark; }
      `}</style>

      {/* Desktop sidebar — shows on sm+ (tablet and desktop) */}
      <div className="hidden sm:flex fixed left-0 top-0 h-full w-60 bg-[#0A0A0A] flex-col px-5 py-8 z-40" style={{ boxShadow: '4px 0 24px rgba(0,0,0,0.5)' }}>
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
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                active ?
                "bg-[#F97316] text-white shadow-md" :
                "text-[#888] hover:text-white hover:bg-white/10 active:bg-white/15"}`
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
                "bg-[#F97316] text-white shadow-sm" :
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

            <div className="w-5 h-5 rounded-full bg-[#F97316] flex items-center justify-center text-white text-[9px] font-bold overflow-hidden">
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
            <button onClick={() => {setShowAlertsDrawer(true);setUnreadAlertCount(0);}} className="relative w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white tap-highlight-fix">
              <Bell className="w-4 h-4" />
              {unreadAlertCount + unreadAdminCount > 0 &&
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#EF4444] text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadAlertCount + unreadAdminCount > 9 ? "9+" : unreadAlertCount + unreadAdminCount}
                </span>
              }
            </button>

            <Link to={createPageUrl("ProfileSettings")} className="w-8 h-8 rounded-full bg-[#F97316] flex items-center justify-center text-white text-xs font-bold tap-highlight-fix overflow-hidden">
              {user?.photo_url ? <img src={user.photo_url} alt="avatar" className="w-full h-full object-cover" /> : initials}
            </Link>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div ref={mainContentRef} className="sm:ml-60 pt-14 sm:pt-6 overflow-y-auto"
        style={{ paddingBottom: window.innerWidth >= 640 ? '24px' : 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
        <AnimatePresence mode="sync">
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

      {/* Mobile bottom nav — hidden on sm+ (tablet/desktop uses sidebar) */}
      {!anyModalOpen && <div className="fixed bottom-0 left-0 right-0 sm:hidden bg-[#0A0A0A] flex z-[60] border-t border-white/10" style={{ boxShadow: '0 -4px 24px rgba(0,0,0,0.5)', paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}>
        {mobileMainNav.map((item) => {
          const active = currentPageName === item.page;
          return (
            <button
              key={`tab-${item.page}`}
              onClick={() => handleTabClick(item.page)}
              className={`flex-1 flex flex-col items-center py-3 gap-0.5 text-[10px] font-medium transition-colors tap-highlight-fix bg-transparent border-none cursor-pointer ${
              active ? "text-[#F97316]" : "text-[#888]"}`}>
              
              {item.avatarUrl ? (
                <div className={`w-5 h-5 rounded-full overflow-hidden flex-shrink-0 ${active ? "ring-2 ring-[#F97316]" : ""}`}>
                  <img src={item.avatarUrl} alt={item.label} className="w-full h-full object-cover" />
                </div>
              ) : (
                <item.icon className="w-5 h-5" />
              )}
              {item.label}
            </button>);

        })}
        {/* More button → goes to Menu page */}
        <button
          key="menu"
          data-tour="mobile-more-tab"
          onClick={() => handleTabClick("Menu")}
          className={`flex-1 flex flex-col items-center py-3 gap-0.5 text-[10px] font-medium transition-colors tap-highlight-fix bg-transparent border-none cursor-pointer ${
          mobileMorePages.includes(currentPageName) ? "text-[#F97316]" : "text-[#888]"}`}>
          
          <Grid3x3 className="w-5 h-5" />
          {t('nav_more')}
        </button>
      </div>}

      {/* FAB - Add Transaction */}
      {!anyModalOpen && !isNestedPage &&
      <button
        onClick={() => setShowAddTransaction(true)}
        data-tour="add-transaction-btn" className="bg-[#FF6B35] py-4 rounded-full fixed z-[55] flex items-center justify-center shadow-lg active:scale-95 transition-all duration-150 tap-highlight-fix sm:hidden"

        style={{
          width: 44, height: 44,
          bottom: 'calc(76px + env(safe-area-inset-bottom, 0px))',
          right: 16,
          boxShadow: '0 2px 12px rgba(255,107,53,0.4)'
        }}>
        
          <Plus className="w-5 h-5 text-white" />
        </button>
      }

      {/* FAB for desktop */}
      {!anyModalOpen &&
      <button
        onClick={() => setShowAddTransaction(true)}
        className="fixed z-[55] bg-[#FF6B35] items-center justify-center rounded-full shadow-lg active:scale-95 transition-all duration-150 tap-highlight-fix hidden sm:flex"
        style={{
          width: 48, height: 48,
          bottom: 24,
          right: 24,
          boxShadow: '0 2px 12px rgba(255,107,53,0.4)'
        }}>
        
          <Plus className="w-5 h-5 text-white" />
        </button>
      }

      {showAddTransaction &&
      <AddTransactionModal
        goals={[]}
        onClose={() => setShowAddTransaction(false)}
        onSave={async (data) => {
          await base44.entities.Transaction.create(data);
          if (data.account_id) await syncAccountBalance(data.account_id, data.amount, data.type, 1);
          // Update challenge progress after transaction
          if (user?.email) await updateChallengesAfterTransaction(user.email);
          setShowAddTransaction(false);
          // Small delay to let account balance update propagate, then refresh dashboard
          setTimeout(() => window.dispatchEvent(new Event("refresh-dashboard")), 400);
        }} />

      }

      {/* Reminder Notification Popup */}
      <ReminderNotificationPopup user={user} />





      {/* Alerts & Notifications Drawer */}
      {showAlertsDrawer && <AlertsDrawer onClose={() => {setShowAlertsDrawer(false);setUnreadAdminCount(0);}} user={user} />}

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