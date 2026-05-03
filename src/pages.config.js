/**
 * pages.config.js - Page routing configuration
 *
 * NOTE: This file is NO LONGER auto-generated. Routes for new pages must be
 * added explicitly in App.jsx as <Route> elements. The PAGES map below is kept
 * for the legacy pagesConfig loop in App.jsx (only OLD pages live here).
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
import AdminSubscriptions from './pages/AdminSubscriptions';
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
import Tips from './pages/Tips';
import Transactions from './pages/Transactions.jsx';

import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminCategories": AdminCategories,
    "AdminDashboard": AdminDashboard,
    "AdminLogs": AdminLogs,
    "AdminNotifications": AdminNotifications,
    "AdminSubscriptions": AdminSubscriptions,
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
    "Tips": Tips,
    "Transactions": Transactions,
}

export const pagesConfig = {
    mainPage: "LandingPage",
    Pages: PAGES,
    Layout: __Layout,
};