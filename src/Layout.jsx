import { createPageUrl } from "@/utils";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Target, ArrowLeftRight, BarChart2, PiggyBank, CreditCard, Settings, Bell, Search, ArrowLeft, Wallet, Users, Plus, Shield } from "lucide-react";
import { toast } from "sonner";
import AddTransactionModal from "@/components/transactions/AddTransactionModal";
import AlertsDrawer from "@/components/dashboard/AlertsDrawer";
import { haptic } from "@/hooks/useHaptic";
import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";

import ReminderNotificationPopup from "@/components/reminders/ReminderNotificationPopup";
import FloatingFeedback from "@/components/feedback/FloatingFeedback";
import { saveTransactionWithSync } from "@/components/utils/saveTransaction";
import { AppSettingsProvider, useAppSettings } from "@/components/utils/AppSettingsContext";
import GlobalSearch from "@/components/search/GlobalSearch";
import DashboardTopTabs from "@/components/dashboard/DashboardTopTabs";
import PullToRefresh from "@/components/utils/PullToRefresh";
import { AnimatePresence, motion } from "framer-motion";
function LayoutInner({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showAlertsDrawer, setShowAlertsDrawer] = useState(false);
  const [anyModalOpen, setAnyModalOpen] = useState(false);
  const [unreadAlertCount, setUnreadAlertCount] = useState(0);
  const [unreadAdminCount, setUnreadAdminCount] = useState(0);
  const { t } = useAppSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const scrollPositions = useRef({});
  const mainContentRef = useRef(null);
  // Each tab remembers the LAST path visited within its stack (including nested pages),
  // so switching tabs and coming back restores the exact sub-screen the user was on.
  const tabHistory = useRef({
    Dashboard: "/Dashboard",
    Nana: "/Nana",
    Analytics: "/Analytics",
    Transactions: "/Transactions"
  });

  // Map main tab → pages that belong to its stack (nested/detail views).
  // Keep this small and explicit — only pages that logically "live under" a tab.
  const TAB_STACKS = {
    Dashboard: ["Dashboard", "Goals", "Budget", "Debts", "Reminders", "Alerts", "Tips", "ReceiptScanHistory"],
    Nana: ["Nana"],
    Analytics: ["Analytics"],
    Transactions: ["Transactions"]
  };

  const getTabForPage = (pageName) => {
    for (const [tab, pages] of Object.entries(TAB_STACKS)) {
      if (pages.includes(pageName)) return tab;
    }
    return null;
  };

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      // Log login
      base44.functions.invoke('logUserLogin', {}).catch(() => {});

      // Ping gamification streak once per session (app_opened activity)
      if (!sessionStorage.getItem("streak_ping_sent")) {
        sessionStorage.setItem("streak_ping_sent", "1");
        base44.functions.invoke('processGamification', { trigger: 'app_opened' }).catch(() => {});
      }

      // Subscription expiry check (skip for admin) — runs once per session
      if (u?.role !== 'admin' && u?.subscription_status === "active" && !sessionStorage.getItem("sub_expiry_checked")) {
        sessionStorage.setItem("sub_expiry_checked", "1");
        const endDate = u?.subscription_end_date || u?.subscription_expiry;
        if (endDate) {
          const today = new Date().toISOString().split("T")[0];
          if (endDate < today) {
            base44.auth.updateMe({ subscription_status: "expired", subscription_plan: "free" }).catch(() => {});
          }
        }
      }

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

      // Note: upcoming reminders intentionally NOT added to unreadAlertCount —
      // reminders are shown in their own tab and counted there. Mixing them into
      // the alert badge caused double-counting with the admin/alert totals.
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

  // Dark mode: follow system preference unless user has set a manual override
  useEffect(() => {
    const manualDarkMode = localStorage.getItem("darkMode");
    const applyTheme = (isDark) => {
      if (isDark) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    };

    if (manualDarkMode === "true") {
      applyTheme(true);
      return;
    }
    if (manualDarkMode === "false") {
      applyTheme(false);
      return;
    }
    // No manual override → follow system preference
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    applyTheme(mql.matches);
    const listener = (e) => {
      // Re-check override in case user toggled it during this session
      if (localStorage.getItem("darkMode") !== null) return;
      applyTheme(e.matches);
    };
    mql.addEventListener("change", listener);
    return () => mql.removeEventListener("change", listener);
  }, []);

  const navItems = [
  { name: "Dashboard", label: t('nav_home'), icon: LayoutDashboard, page: "Dashboard" },
  { name: "Goals", label: t('nav_goals'), icon: Target, page: "Goals" },
  { name: "Budget", label: t('nav_budget'), icon: PiggyBank, page: "Budget" },
  { name: "Debts", label: t('nav_debts'), icon: CreditCard, page: "Debts" },
  { name: "Accounts", label: "Rekening", icon: Wallet, page: "Accounts" },
  { name: "SharedFinance", label: "Keuangan Bersama", icon: Users, page: "SharedFinance" },
  { name: "Gamifikasi", label: "Gamifikasi", icon: Target, page: "Gamifikasi" }];


  const navSettingsItems = [
  { name: "Settings", label: t('nav_settings'), icon: Settings, page: "Settings" }];


  // Mobile: 4 main items + "Lainnya" (Budget moved to Menu)
  const NANA_AVATAR_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/7708b64f5_generated_image.png";

  const mobileMainNav = [
  { name: "Dashboard", label: t('nav_home'), icon: LayoutDashboard, page: "Dashboard" },
  { name: "Nana", label: "Nana AI", icon: null, page: "Nana", avatarUrl: NANA_AVATAR_URL },
  { name: "Analytics", label: t('nav_analytics'), icon: BarChart2, page: "Analytics" },
  { name: "Transactions", label: t('nav_transactions'), icon: ArrowLeftRight, page: "Transactions" }];


  const displayName = user?.display_name || user?.full_name;
  const initials = displayName ? displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "U";

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
  const mainPages = ["Dashboard", "Transactions", "Goals", "Budget", "Debts", "Investments", "Analytics", "Tips", "Reminders", "Alerts", "Settings", "Accounts", "SharedFinance", "ProfileSettings", "Gamifikasi"];
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

  // Update tab history when navigating anywhere within a tab's stack
  // — cache the FULL path (incl. search params) so nested screens are preserved.
  useEffect(() => {
    const owningTab = getTabForPage(currentPageName);
    if (owningTab) {
      tabHistory.current[owningTab] = location.pathname + (location.search || "");
    }
  }, [currentPageName, location.pathname, location.search]);

  // FAB click: guard — require at least 1 account before opening AddTransactionModal.
  // If no account → navigate langsung ke halaman Accounts (lebih jelas dari sekadar toast yang gampang ke-skip di mobile).
  const handleFabClick = async () => {
    haptic.medium();
    if (showAddTransaction) { setShowAddTransaction(false); return; }
    try {
      const u = user || (await base44.auth.me());
      const accs = await base44.entities.Account.filter({ created_by: u.email });
      if (!accs || accs.length === 0) {
        toast.info("Buat rekening dulu yuk sebelum catat transaksi 💳", { duration: 3500 });
        navigate(createPageUrl("Accounts"));
        return;
      }
      setShowAddTransaction(true);
    } catch {
      // fallback: open modal anyway if check fails
      setShowAddTransaction(true);
    }
  };

  // Mobile bottom-nav tabs whose scroll position we preserve across switches
  const STACK_TABS = ["Dashboard", "Nana", "Analytics", "Transactions"];

  // Save scroll position BEFORE navigating away from a stack tab
  const saveCurrentScroll = () => {
    if (STACK_TABS.includes(currentPageName)) {
      const y = mainContentRef.current?.scrollTop ?? window.scrollY ?? 0;
      scrollPositions.current[currentPageName] = y;
    }
  };

  // Handle tab clicks - navigate with React Router for soft navigation
  const handleTabClick = (tabName) => {
    const currentTab = getTabForPage(currentPageName);
    const savedPath = tabHistory.current[tabName];
    // Fall back to root of tab if nothing cached yet
    const targetPath = savedPath || createPageUrl(tabName);

    if (currentTab === tabName) {
      // Tapping the tab we're already inside — reset to tab root & scroll to top (native pattern)
      haptic.light();
      scrollPositions.current[tabName] = 0;
      tabHistory.current[tabName] = createPageUrl(tabName);
      if (mainContentRef.current) mainContentRef.current.scrollTo({ top: 0, behavior: "smooth" });
      window.scrollTo({ top: 0, behavior: "smooth" });
      // If we're on a nested page of this tab, pop back to the tab root
      if (currentPageName !== tabName) {
        navigate(createPageUrl(tabName));
      }
    } else {
      haptic.light();
      // Save current tab's scroll before leaving
      saveCurrentScroll();
      // Restore the exact sub-screen this tab was last on
      navigate(targetPath);
    }
  };

  // Restore scroll position when entering a stack tab; scroll to top for all other pages
  useEffect(() => {
    const saved = scrollPositions.current[currentPageName];
    const isStackTab = STACK_TABS.includes(currentPageName);
    const targetY = isStackTab && typeof saved === "number" ? saved : 0;

    // Use rAF to ensure DOM is painted before restoring scroll
    requestAnimationFrame(() => {
      if (mainContentRef.current) {
        mainContentRef.current.scrollTop = targetY;
      }
      window.scrollTo(0, targetY);
    });
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

      {/* Desktop sidebar — floating, slim 56px by default, expands to 224px on hover */}
      <div
        className="hidden sm:flex group fixed left-3 top-3 bottom-3 w-14 hover:w-56 bg-[#0A0A0A] rounded-2xl flex-col px-2 hover:px-3 py-4 z-40 overflow-hidden transition-[width,padding] duration-300 ease-out"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>

        {/* Logo — only icon when collapsed, with text when expanded */}
        <div className="mb-6 h-8 px-1 flex items-center gap-2">
          <img src="https://media.base44.com/images/public/69a82e8090f60786b869983c/d2e52bdf2_3.png" alt="Atur Pintar logo" className="w-8 h-8 flex-shrink-0" />
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            <div className="flex items-center gap-1.5">
              <p className="text-base font-bold text-white tracking-tight leading-tight">Atur Pintar</p>
              <span className="text-[8px] font-bold text-[#F97316] bg-[#F97316]/15 border border-[#F97316]/30 rounded px-1 py-0.5 leading-none uppercase tracking-wider">Beta</span>
            </div>
            <p className="text-[10px] text-[#8FA4C8] leading-tight">Financial Tracker</p>
          </div>
        </div>

        <nav className="flex flex-col gap-0.5 flex-1">
          {navItems.map((item) => {
            const active = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                data-tour={item.tourId || undefined}
                title={item.label}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2.5 h-9 px-3 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                active ?
                "bg-[#F97316] text-white shadow-md" :
                "text-[#888] hover:text-white hover:bg-white/10 active:bg-white/15"}`
                }>

                <item.icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                <span className="truncate opacity-0 group-hover:opacity-100 transition-opacity duration-200">{item.label}</span>
              </Link>);

          })}
        </nav>

        {/* Search */}
        <button
          onClick={() => setShowSearch(true)}
          title={t('search_placeholder')}
          className="flex items-center gap-2.5 h-9 px-3 rounded-lg text-[13px] font-medium text-[#888] hover:text-white hover:bg-white/10 transition-colors w-full tap-highlight-fix">

          <Search className="w-4 h-4 flex-shrink-0" />
          <span className="truncate opacity-0 group-hover:opacity-100 transition-opacity duration-200">{t('search_placeholder')}</span>
        </button>

        {/* Settings group */}
        <div className="border-t border-white/10 pt-1.5 mt-1.5 space-y-0.5">
          {navSettingsItems.map((item) => {
            const active = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                title={item.label}
                className={`flex items-center gap-2.5 h-9 px-3 rounded-lg text-[13px] font-medium transition-colors ${
                active ?
                "bg-[#F97316] text-white shadow-sm" :
                "text-[#888] hover:text-white hover:bg-white/10"}`
                }>

                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate opacity-0 group-hover:opacity-100 transition-opacity duration-200">{item.label}</span>
              </Link>);

          })}
        </div>

        {/* Profile */}
        <div className="space-y-0.5 mt-1.5">
          <Link
            to={createPageUrl("ProfileSettings")}
            title={displayName || t('profile')}
            className="flex items-center gap-2.5 h-9 px-2 rounded-lg text-[13px] font-medium text-[#888] hover:text-white hover:bg-white/10 transition-colors">

            <div className="w-6 h-6 rounded-full bg-[#F97316] flex items-center justify-center text-white text-[10px] font-bold overflow-hidden flex-shrink-0">
              {user?.photo_url ? <img src={user.photo_url} alt="avatar" className="w-full h-full object-cover" /> : initials}
            </div>
            <span className="truncate opacity-0 group-hover:opacity-100 transition-opacity duration-200">{displayName || t('profile')}</span>
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
              <img src="https://media.base44.com/images/public/69a82e8090f60786b869983c/d2e52bdf2_3.png" alt="Atur Pintar logo" className="w-8 h-8 flex-shrink-0" />
              <p className="text-white text-base font-bold tracking-tight">Atur Pintar</p>
              <span className="ml-1 text-[8px] font-bold text-[#F97316] bg-[#F97316]/15 border border-[#F97316]/30 rounded px-1 py-0.5 leading-none uppercase tracking-wider">Beta</span>
            </div>
          }

          <div className="flex items-center gap-2">
            {user?.role === 'admin' && (
              <Link
                to={createPageUrl("AdminDashboard")}
                aria-label="Buka halaman admin"
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white tap-highlight-fix">
                <Shield className="w-4 h-4" aria-hidden="true" />
              </Link>
            )}
            <button
              onClick={() => {setShowAlertsDrawer(true);setUnreadAlertCount(0);setUnreadAdminCount(0);}}
              aria-label={`Buka notifikasi${unreadAlertCount + unreadAdminCount > 0 ? ` (${unreadAlertCount + unreadAdminCount} belum dibaca)` : ''}`}
              className="relative w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white tap-highlight-fix">
              <Bell className="w-4 h-4" aria-hidden="true" />
              {unreadAlertCount + unreadAdminCount > 0 &&
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#EF4444] text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadAlertCount + unreadAdminCount > 9 ? "9+" : unreadAlertCount + unreadAdminCount}
                </span>
              }
            </button>

            <Link
              to={createPageUrl("ProfileSettings")}
              data-tour="profile-avatar"
              aria-label="Buka pengaturan profil"
              className="w-8 h-8 rounded-full bg-[#F97316] flex items-center justify-center text-white text-xs font-bold tap-highlight-fix overflow-hidden">
              {user?.photo_url ? <img src={user.photo_url} alt={`Foto profil ${displayName || 'pengguna'}`} className="w-full h-full object-cover" /> : initials}
            </Link>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div ref={mainContentRef} className="sm:ml-20 pt-14 sm:pt-4 overflow-y-auto"
        style={{ paddingBottom: window.innerWidth >= 640 ? '16px' : (currentPageName === "Nana" ? '0px' : 'calc(80px + env(safe-area-inset-bottom, 0px))') }}>
        {/* Desktop top tabs — persist across Dashboard/Transactions/Analytics/Tips */}
        {["Dashboard", "Transactions", "Analytics", "Tips"].includes(currentPageName) && (
          <div className="hidden sm:block sm:max-w-6xl sm:mx-auto px-5 pt-2">
            <DashboardTopTabs />
          </div>
        )}
        <PullToRefresh onRefresh={() => {
          window.dispatchEvent(new CustomEvent("refresh-dashboard"));
          return new Promise(resolve => setTimeout(resolve, 600));
        }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPageName}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="sm:max-w-6xl sm:mx-auto">
              {children}
            </motion.div>
          </AnimatePresence>
        </PullToRefresh>
      </div>

      {/* Mobile bottom nav — hidden on sm+ (tablet/desktop uses sidebar), and hidden on Nana page */}
      {currentPageName !== "Nana" && (
      <div className="fixed bottom-0 left-0 right-0 sm:hidden bg-[#0A0A0A] flex z-[60] border-t border-white/10 select-none" style={{ boxShadow: '0 -4px 24px rgba(0,0,0,0.5)', paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}>
        {mobileMainNav.flatMap((item, idx) => {
          const active = currentPageName === item.page;
          const button = (
            <button
              key={`nav-${item.page}`}
              onClick={() => handleTabClick(item.page)}
              data-tour={item.page === "Nana" ? "nana-tab" : item.page === "Analytics" ? "analytics-tab" : undefined}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className={`flex-1 flex flex-col items-center py-3 gap-0.5 text-[10px] font-medium transition-colors tap-highlight-fix bg-transparent border-none cursor-pointer select-none ${
              active ? "text-[#F97316]" : "text-[#888]"}`}>

              {item.avatarUrl ? (
                <div className={`w-5 h-5 rounded-full overflow-hidden flex-shrink-0 ${active ? "ring-2 ring-[#F97316]" : ""}`}>
                  <img src={item.avatarUrl} alt="" aria-hidden="true" className="w-full h-full object-cover" />
                </div>
              ) : (
                <item.icon className="w-5 h-5" aria-hidden="true" />
              )}
              {item.label}
            </button>
          );
          return idx === 2
            ? [<div key={`spacer-${item.page}`} className="w-16 flex-shrink-0" aria-hidden="true" />, button]
            : [button];
        })}
      </div>
      )}

      {/* Mobile FAB - center-bottom, z-[85] sits above bottom nav (z-60) but BELOW modal backdrop (z-90) */}
      {!isNestedPage && currentPageName !== "Nana" &&
      <button
        onClick={handleFabClick}
        data-tour="add-transaction-btn"
        aria-label={showAddTransaction ? "Tutup form transaksi" : "Catat transaksi baru"}
        className="fixed left-1/2 -translate-x-1/2 z-[85] flex items-center justify-center rounded-full active:scale-95 transition-all duration-200 tap-highlight-fix select-none sm:hidden"
        style={{
          width: 56, height: 56,
          bottom: 'calc(32px + env(safe-area-inset-bottom, 0px))',
          background: '#0A0A0A',
          padding: 4,
          boxShadow: '0 6px 18px rgba(0,0,0,0.35)'
        }}>
          <span className="w-full h-full rounded-full flex items-center justify-center transition-transform duration-300" style={{
            background: showAddTransaction ? 'linear-gradient(145deg, #4A4A4A 0%, #1A1A1A 100%)' : 'linear-gradient(145deg, #FF8A50 0%, #F97316 100%)',
            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)',
            transform: showAddTransaction ? 'rotate(135deg)' : 'rotate(0deg)'
          }}>
            <Plus className="w-6 h-6 text-white" strokeWidth={2.5} aria-hidden="true" />
          </span>
        </button>
      }

      {showAddTransaction &&
      <AddTransactionModal
        goals={[]}
        onClose={() => setShowAddTransaction(false)}
        onSave={async (data) => {
          await saveTransactionWithSync(data);
          setShowAddTransaction(false);
        }} />

      }

      {/* Reminder Notification Popup */}
      <ReminderNotificationPopup user={user} />

      {/* Floating Beta Feedback — global on every page */}
      <FloatingFeedback user={user} />





      {/* Alerts & Notifications Drawer */}
      {showAlertsDrawer && <AlertsDrawer onClose={() => setShowAlertsDrawer(false)} user={user} />}

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