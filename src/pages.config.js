/**
 * pages.config.js - Page routing configuration
 *
 * NOTE: This file is NO LONGER auto-generated. Routes for new pages must be
 * added explicitly in App.jsx as <Route> elements. The PAGES map below is kept
 * for the legacy pagesConfig loop in App.jsx (only OLD pages live here).
 *
 * All pages here are lazy-loaded — code-split per route to keep initial bundle small.
 * Admin pages are NOT included here because they have explicit <Route> declarations
 * in App.jsx (already lazy-loaded there).
 */
import { lazy } from 'react';

import __Layout from './Layout.jsx';

// Lazy-loaded pages — bundled separately, only fetched when user navigates to them
const Analytics = lazy(() => import('./pages/Analytics'));
const Budget = lazy(() => import('./pages/Budget'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Debts = lazy(() => import('./pages/Debts'));
const Goals = lazy(() => import('./pages/Goals'));
const InvestmentDetail = lazy(() => import('./pages/InvestmentDetail'));
const Investments = lazy(() => import('./pages/Investments'));
const Nana = lazy(() => import('./pages/Nana.jsx'));
const Reminders = lazy(() => import('./pages/Reminders'));
const Settings = lazy(() => import('./pages/Settings'));
const Tips = lazy(() => import('./pages/Tips'));
const Transactions = lazy(() => import('./pages/Transactions.jsx'));


export const PAGES = {
    "Analytics": Analytics,
    "Budget": Budget,
    "Dashboard": Dashboard,
    "Debts": Debts,
    "Goals": Goals,
    "InvestmentDetail": InvestmentDetail,
    "Investments": Investments,
    "Nana": Nana,
    "Reminders": Reminders,
    "Settings": Settings,
    "Tips": Tips,
    "Transactions": Transactions,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};