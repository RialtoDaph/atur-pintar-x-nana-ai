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
import Alerts from './pages/Alerts';
import Dashboard from './pages/Dashboard';
import InvestmentDetail from './pages/InvestmentDetail';
import Menu from './pages/Menu';
import Nana from './pages/Nana';
import Settings from './pages/Settings';
import Tips from './pages/Tips';
import Budget from './pages/Budget';
import Debts from './pages/Debts';
import Investments from './pages/Investments';
import Reminders from './pages/Reminders';
import Transactions from './pages/Transactions';
import Analytics from './pages/Analytics';
import Goals from './pages/Goals';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Alerts": Alerts,
    "Dashboard": Dashboard,
    "InvestmentDetail": InvestmentDetail,
    "Menu": Menu,
    "Nana": Nana,
    "Settings": Settings,
    "Tips": Tips,
    "Budget": Budget,
    "Debts": Debts,
    "Investments": Investments,
    "Reminders": Reminders,
    "Transactions": Transactions,
    "Analytics": Analytics,
    "Goals": Goals,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};