/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdminCategories from './pages/AdminCategories';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogs from './pages/AdminLogs';
import AdminNotifications from './pages/AdminNotifications';
import AdminPanel from './pages/AdminPanel';
import AdminSubscriptions from './pages/AdminSubscriptions';
import AdminUserSupport from './pages/AdminUserSupport';
import AdminUsers from './pages/AdminUsers';
import Alerts from './pages/Alerts';
import Analytics from './pages/Analytics';
import Budget from './pages/Budget';
import Dashboard from './pages/Dashboard';
import Debts from './pages/Debts';
import Goals from './pages/Goals';
import InvestmentDetail from './pages/InvestmentDetail';
import Investments from './pages/Investments';
import LandingPage from './pages/LandingPage';
import Menu from './pages/Menu';
import Nana from './pages/Nana.jsx';
import Reminders from './pages/Reminders';
import Settings from './pages/Settings';
import SpendingDetail from './pages/SpendingDetail';
import Tips from './pages/Tips';
import Transactions from './pages/Transactions';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminCategories": AdminCategories,
    "AdminDashboard": AdminDashboard,
    "AdminLogs": AdminLogs,
    "AdminNotifications": AdminNotifications,
    "AdminPanel": AdminPanel,
    "AdminSubscriptions": AdminSubscriptions,
    "AdminUserSupport": AdminUserSupport,
    "AdminUsers": AdminUsers,
    "Alerts": Alerts,
    "Analytics": Analytics,
    "Budget": Budget,
    "Dashboard": Dashboard,
    "Debts": Debts,
    "Goals": Goals,
    "InvestmentDetail": InvestmentDetail,
    "Investments": Investments,
    "LandingPage": LandingPage,
    "Menu": Menu,
    "Nana": Nana,
    "Reminders": Reminders,
    "Settings": Settings,
    "SpendingDetail": SpendingDetail,
    "Tips": Tips,
    "Transactions": Transactions,
}

export const pagesConfig = {
    mainPage: "LandingPage",
    Pages: PAGES,
    Layout: __Layout,
};