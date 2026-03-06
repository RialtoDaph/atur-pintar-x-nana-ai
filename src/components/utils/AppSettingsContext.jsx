import { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const DEFAULT_SETTINGS = {
  language: 'id',
  currency: 'IDR',
  currency_symbol: 'Rp',
  decimal_separator: ',',
  thousand_separator: '.',
  date_format: 'DD/MM/YYYY',
};

const TRANSLATIONS = {
  id: {
    // Investment
    expense: 'Pengeluaran',
    income: 'Pemasukan',
    savings: 'Tabungan',
    add_transaction: 'Tambah Transaksi',
    add: 'Tambah',
    add_investment: 'Tambah Investasi',
    edit_investment: 'Edit Investasi',
    update_investment: 'Update Investasi',
    saving: 'Menyimpan...',
    scanning: 'Memindai...',
    scan_receipt: 'Scan Struk',
    receipt_detected: 'Struk terdeteksi 🧾',
    tax: 'Pajak',
    split_bill_with_friends: 'Split Bill dengan Teman',
    amount: 'Jumlah',
    category: 'Kategori',
    note_optional: 'Catatan (opsional)',
    note_placeholder: 'mis. Belanja, Netflix...',
    date: 'Tanggal',
    recurring_transaction: 'Transaksi berulang',
    daily: 'Harian',
    weekly: 'Mingguan',
    monthly: 'Bulanan',
    yearly: 'Tahunan',
    
    // Category labels
    cat_housing: 'Rumah/Sewa',
    cat_food: 'Makanan',
    cat_transport: 'Transportasi',
    cat_health: 'Kesehatan',
    cat_entertainment: 'Hiburan',
    cat_shopping: 'Belanja',
    cat_subscriptions: 'Langganan',
    cat_salary: 'Gaji',
    cat_freelance: 'Freelance',
    cat_savings: 'Tabungan',
    cat_other: 'Lainnya',
    investment_type: 'Jenis Investasi',
    search_asset: 'Cari Aset',
    asset_search_placeholder: 'Ketik nama atau simbol aset...',
    price_per_unit: 'Harga per Unit',
    quantity_units: 'Jumlah Unit/Lembar',
    current_value_auto: 'Nilai saat ini akan otomatis = modal awal',
    fetch_price: 'Ambil Harga',
    change_if_price_differs: 'Ubah jika harga berbeda dari modal awal',
    purchase_date: 'Tanggal Beli',
    notes: 'Catatan',
    notes_optional_placeholder: 'Catatan opsional',
    total_portfolio: 'Total Nilai Portofolio',
    savings_goal: 'Tujuan Tabungan',
    monthly_budget: 'Anggaran Bulanan',
    profit_loss: 'Untung/Rugi',
    current_value: 'Nilai Saat Ini',
    initial_amount: 'Modal Awal',
    profit_percent: 'Persen Profit',

    // Layout / Nav
    nav_home: 'Home',
    nav_transactions: 'Transaksi',
    nav_goals: 'Tujuan',
    nav_budget: 'Anggaran',
    nav_debts: 'Utang',
    nav_investments: 'Investasi',
    nav_analytics: 'Analitik',
    nav_tips: 'Tips',
    nav_reminders: 'Pengingat',
    nav_alerts: 'Alerts',
    nav_settings: 'Pengaturan',
    nav_more: 'Lainnya',
    nav_manage: 'Kelola keuanganmu',
    search_placeholder: 'Cari...',
    dark_mode: 'Mode Gelap',
    light_mode: 'Mode Terang',
    profile: 'Profil',

    // Dashboard
    dashboard_greeting: 'Halo 👋',
    dashboard_title: 'Keuanganmu',
    recent_transactions: 'Transaksi Terbaru',
    view_all: 'Lihat semua',
    savings_goals: 'Tujuan Tabungan',
    add_goal: '+ Tambah',

    // BalanceCard
    balance_card_title: 'Total Saldo Bulan Ini',
    income_label: 'Pemasukan',
    expense_label: 'Pengeluaran',
    savings_label: 'Tabungan',

    // RecentTransactions
    no_transactions: 'Belum ada transaksi. Tambahkan yang pertama!',

    // GoalsMiniList
    no_goals: 'Belum ada tujuan. Mulai menabung sekarang!',

    // SmartAlerts
    smart_alerts_title: '🔔 Peringatan Cerdas',

    // SubscriptionDetector
    subscriptions_detected: '🔁 Langganan Terdeteksi',
    per_month: '/ bulan',
    no_subscriptions: 'Belum ada langganan terdeteksi.',

    // CashflowForecast
    cashflow_title: 'Proyeksi Cashflow',
    day_progress: 'Hari ke-',
    days_left: 'hari lagi',
    end_of_month_prediction: 'Prediksi akhir bulan',
    safe: 'Aman 🎉',
    warning: 'Awas ⚠️',
    est_income: 'Est. Masuk',
    est_expense: 'Est. Keluar',

    // BudgetAlertWidget
    budget_alert_title: 'Peringatan Anggaran',
    budget_safe_title: 'Anggaran Aman',
    budget_safe_desc: 'Semua kategori masih dalam batas',

    // IncomeExpenseChart
    income_vs_expense: 'Pendapatan vs Pengeluaran',
    months_3: '3 bulan',
    months_6: '6 bulan',
    months_12: '12 bulan',
    no_transaction_data: 'Tidak ada data transaksi',
    income_legend: 'Pendapatan',
    expense_legend: 'Pengeluaran',

    // PortfolioSummary
    portfolio_title: 'Portofolio Investasi',
    total_value: 'Total Nilai',

    // DashboardInsights
    insight_title: 'Insight Bulan Ini',

    // ReminderWidget
    upcoming_reminders: 'Pengingat Mendatang',
    today: 'Hari ini!',
    tomorrow: 'Besok!',

    // Pages - Transactions
    tx_history: 'Riwayat',
    tx_title: 'Transaksi',
    tx_select: 'Pilih',
    tx_cancel: 'Batal',
    tx_select_all: 'Pilih Semua',
    tx_selected: 'dipilih',
    tx_deleting: 'Menghapus...',
    tx_delete_selected: 'Hapus',
    tx_delete_all: 'Hapus Semua',
    tx_empty_title: 'Belum ada transaksi',
    tx_empty_desc: 'Tap + untuk menambah transaksi pertama Anda',
    tx_confirm_delete: 'Hapus transaksi ini?',
    tx_confirm_delete_selected: 'Hapus {count} transaksi?',
    tx_confirm_delete_all: 'Hapus semua {count} transaksi?',
    tx_filter_all: 'Semua',
    tx_filter_expense: 'Pengeluaran',
    tx_filter_income: 'Pemasukan',
    tx_update_success: 'Transaksi berhasil diperbarui',
    tx_update_error: 'Gagal memperbarui transaksi',
    tx_delete_success: 'Transaksi berhasil dihapus',
    tx_delete_error: 'Gagal menghapus transaksi',
    tx_create_success: 'Transaksi berhasil dibuat',
    tx_create_error: 'Gagal membuat transaksi',
    tx_recurring: 'Transaksi berulang',
    all_goals: 'Semua Tujuan',
    no_goal: 'Tanpa tujuan',
    link_to_goal: 'Hubungkan ke tujuan',
    edit_transaction: 'Edit Transaksi',
    save_changes: 'Simpan Perubahan',
    manage_categories: 'Kelola Kategori',
    search_transactions: 'Cari transaksi...',
    error_loading_data: 'Gagal memuat data',

    // Pages - Goals
    goals_plan: 'Rencana',
    goals_title: 'Tujuan Finansial',
    goals_total_target: 'Total Target',
    goals_active: 'tujuan aktif',
    goals_empty_title: 'Belum ada tujuan finansial',
    goals_empty_desc: 'Tap + untuk membuat tujuan tabungan pertama Anda',
    goals_delete_confirm: 'Hapus tujuan ini?',
    goals_days_left: 'hari',
    goals_expired: 'Kadaluarsa',
    goals_delete: 'Hapus',
    goals_back: 'Back',
    goals_add_money: 'Add Money',
    goals_withdraw: 'Withdraw',
    goals_activity: 'Activity',
    goals_delete_goal: 'Delete goal',
    goals_no_tx: 'No transactions yet',
    goals_achieved_pct: '% tercapai',
    goals_remaining: 'Sisa Rp',

    // Pages - Budget
    budget_subtitle: 'Anggaran Bulanan',
    budget_total: 'Total Anggaran',
    budget_spent: 'Terpakai',
    budget_remaining: 'Sisa',
    budget_empty_title: 'Belum ada anggaran',
    budget_empty_desc: 'Tap + untuk menambahkan anggaran per kategori',
    budget_over: 'Melebihi anggaran',

    // Pages - Debts
    debts_management: 'Manajemen',
    debts_title: 'Utang & Kredit',
    debts_total: 'Total Utang',
    debts_monthly: 'Cicilan/Bulan',
    debts_empty_title: 'Tidak ada utang aktif',
    debts_empty_desc: 'Tap + untuk mencatat utang atau kredit',
    debts_paid: 'Sudah Lunas',
    debts_paid_pct: '% sudah dibayar',
    debts_remaining: 'Sisa',
    debts_installment: 'Cicilan',
    debts_mark_paid_title: 'Tandai lunas',

    // Pages - Analytics
    analytics_overview: 'Overview',
    analytics_title: 'Analytics',
    analytics_spending_trend: 'Tren Pengeluaran',
    analytics_income_vs_expense: 'Pemasukan vs Pengeluaran',
    analytics_income_label: 'Pemasukan',
    analytics_expense_label: 'Pengeluaran',
    analytics_category_breakdown: 'Pengeluaran per Kategori',
    analytics_this_month: 'Bulan ini',
    analytics_no_expense_data: 'Tidak ada data pengeluaran bulan ini',
    analytics_budget_vs_spent: 'Alokasi Anggaran vs Pengeluaran',
    analytics_goals_progress: 'Pencapaian Tujuan Tabungan',
    analytics_investment_summary: 'Ringkasan Investasi',
    analytics_initial_value: 'Nilai Awal',
    analytics_current_value: 'Nilai Sekarang',
    analytics_return: 'Return',

    // Month names
    month_jan: 'Januari',
    month_feb: 'Februari',
    month_mar: 'Maret',
    month_apr: 'April',
    month_may: 'Mei',
    month_jun: 'Juni',
    month_jul: 'Juli',
    month_aug: 'Agustus',
    month_sep: 'September',
    month_oct: 'Oktober',
    month_nov: 'November',
    month_dec: 'Desember',

    // Pages - Settings
    settings_preferences: 'Preferensi',
    settings_title: 'Pengaturan',
    settings_user_label: 'Pengguna',
    settings_appearance: 'Tampilan',
    settings_dark_mode: 'Mode Gelap',
    settings_active: 'Aktif',
    settings_inactive: 'Nonaktif',
    settings_language: 'Bahasa / Language',
    settings_currency: 'Mata Uang',
    settings_widget_dashboard: 'Widget Dashboard',
    settings_widget_desc: 'Pilih widget yang ditampilkan di halaman utama',
    settings_account: 'Akun',
    settings_logout: 'Keluar',
    settings_version: 'Atur.in v1.0 · Dibuat dengan ❤️',

    // Pages - Reminders
    reminders_manage: 'Kelola',
    reminders_title: 'Pengingat',
    reminders_total_active: 'Total tagihan aktif bulan ini',
    reminders_active_count: 'pengingat aktif',
    reminders_empty: 'Belum ada pengingat',
    reminders_add_first: '+ Tambah pengingat pertama',
    reminders_upcoming: 'Akan Datang',
    reminders_paid_this_month: 'Sudah Dibayar Bulan Ini',
    reminders_inactive: 'Nonaktif',
    reminders_due_day: 'Tgl',
    reminders_every_month: 'tiap bulan',
    reminders_mark_paid: 'Sudah bayar',
    reminders_edit: 'Edit',

    // Pages - Alerts
    alerts_back: 'Kembali',
    alerts_title: 'Smart Alerts',
    alerts_subtitle: 'Notifikasi finansial cerdas untuk Anda',
    alerts_unread: 'Belum dibaca',
    alerts_all: 'Semua',
    alerts_empty_title: 'Tidak ada alerts',
    alerts_empty_desc: 'Anda semua catan dengan baik!',
    alerts_mark_read: 'Tandai sudah dibaca',
    alerts_follow_up: 'Tindaklanjuti →',
    alerts_delete: 'Hapus',
    alerts_email: 'Email',

    // Pages - Investments
    investments_portfolio: 'Portofolio',
    investments_title: 'Investasi',
    investments_from_capital: 'dari modal',
    investments_empty_title: 'Belum ada investasi',
    investments_empty_desc: 'Tap + untuk mencatat investasi Anda',
    investments_watchlist_title: 'Pantau Aset',
    investments_watchlist_hide: 'Sembunyikan',
    investments_watchlist_show: 'Tampilkan',
    investments_target: 'Target',
    investments_portfolio_weight: '% portofolio',

    // Pages - Tips
    tips_guide: 'Panduan',
    tips_title: 'Tips & Cara Pakai',
    tips_search_placeholder: 'Cari pertanyaan atau topik...',
    tips_empty_title: 'Tidak ada hasil',
    tips_empty_desc: 'Coba kata kunci lain',
    tips_help_title: 'Butuh bantuan lebih?',
    tips_help_desc: 'Tanya langsung ke Nana AI — asisten keuangan pintarmu yang siap membantu 24/7.',

    // Pages - Nana
    nana_subtitle: 'Asisten Keuangan AI',
    nana_new_chat_title: 'Obrolan baru',
    nana_greeting: 'Halo! Aku Nana 👋',
    nana_greeting_desc: 'Asisten keuangan pribadimu. Tanya apa saja soal keuanganmu, aku siap bantu!',
    nana_input_placeholder: 'Tanya Nana sesuatu...',

    // Pages - Menu
    menu_nav: 'Navigasi',
    menu_title: 'Menu Lainnya',
    menu_finance: 'Keuangan',
    menu_notifications: 'Notifikasi & Info',
    menu_account: 'Akun',
  },

  en: {
    // Investment
    expense: 'Expense',
    income: 'Income',
    savings: 'Savings',
    add_transaction: 'Add Transaction',
    add: 'Add',
    add_investment: 'Add Investment',
    edit_investment: 'Edit Investment',
    update_investment: 'Update Investment',
    saving: 'Saving...',
    scanning: 'Scanning...',
    scan_receipt: 'Scan Receipt',
    receipt_detected: 'Receipt detected 🧾',
    tax: 'Tax',
    split_bill_with_friends: 'Split Bill with Friends',
    amount: 'Amount',
    category: 'Category',
    note_optional: 'Note (optional)',
    note_placeholder: 'e.g. Grocery run, Netflix...',
    date: 'Date',
    recurring_transaction: 'Recurring transaction',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly',
    
    // Category labels
    cat_housing: 'Housing/Rent',
    cat_food: 'Food',
    cat_transport: 'Transport',
    cat_health: 'Health',
    cat_entertainment: 'Entertainment',
    cat_shopping: 'Shopping',
    cat_subscriptions: 'Subscriptions',
    cat_salary: 'Salary',
    cat_freelance: 'Freelance',
    cat_savings: 'Savings',
    cat_other: 'Other',
    investment_type: 'Investment Type',
    search_asset: 'Search Asset',
    asset_search_placeholder: 'Type asset name or symbol...',
    price_per_unit: 'Price per Unit',
    quantity_units: 'Quantity / Units',
    current_value_auto: 'Current value will auto-fill = initial amount',
    fetch_price: 'Fetch Price',
    change_if_price_differs: 'Change if price differs from initial',
    purchase_date: 'Purchase Date',
    notes: 'Notes',
    notes_optional_placeholder: 'Optional notes',
    total_portfolio: 'Total Portfolio Value',
    savings_goal: 'Savings Goal',
    monthly_budget: 'Monthly Budget',
    profit_loss: 'Profit/Loss',
    current_value: 'Current Value',
    initial_amount: 'Initial Amount',
    profit_percent: 'Profit %',

    // Layout / Nav
    nav_home: 'Home',
    nav_transactions: 'Transactions',
    nav_goals: 'Goals',
    nav_budget: 'Budget',
    nav_debts: 'Debts',
    nav_investments: 'Investments',
    nav_analytics: 'Analytics',
    nav_tips: 'Tips',
    nav_reminders: 'Reminders',
    nav_alerts: 'Alerts',
    nav_settings: 'Settings',
    nav_more: 'More',
    nav_manage: 'Manage your finances',
    search_placeholder: 'Search...',
    dark_mode: 'Dark Mode',
    light_mode: 'Light Mode',
    profile: 'Profile',

    // Dashboard
    dashboard_greeting: 'Hello 👋',
    dashboard_title: 'Your Finances',
    recent_transactions: 'Recent Transactions',
    view_all: 'View all',
    savings_goals: 'Savings Goals',
    add_goal: '+ Add',

    // BalanceCard
    balance_card_title: 'This Month Balance',
    income_label: 'Income',
    expense_label: 'Expenses',
    savings_label: 'Savings',

    // RecentTransactions
    no_transactions: 'No transactions yet. Add your first one!',

    // GoalsMiniList
    no_goals: 'No goals yet. Start saving now!',

    // SmartAlerts
    smart_alerts_title: '🔔 Smart Alerts',

    // SubscriptionDetector
    subscriptions_detected: '🔁 Subscriptions Detected',
    per_month: '/ month',
    no_subscriptions: 'No subscriptions detected yet.',

    // CashflowForecast
    cashflow_title: 'Cashflow Forecast',
    day_progress: 'Day ',
    days_left: 'days left',
    end_of_month_prediction: 'End of month prediction',
    safe: 'Safe 🎉',
    warning: 'Warning ⚠️',
    est_income: 'Est. Income',
    est_expense: 'Est. Expense',

    // BudgetAlertWidget
    budget_alert_title: 'Budget Alert',
    budget_safe_title: 'Budget on Track',
    budget_safe_desc: 'All categories within limit',

    // IncomeExpenseChart
    income_vs_expense: 'Income vs Expenses',
    months_3: '3 months',
    months_6: '6 months',
    months_12: '12 months',
    no_transaction_data: 'No transaction data',
    income_legend: 'Income',
    expense_legend: 'Expenses',

    // PortfolioSummary
    portfolio_title: 'Investment Portfolio',
    total_value: 'Total Value',

    // DashboardInsights
    insight_title: 'This Month Insights',

    // ReminderWidget
    upcoming_reminders: 'Upcoming Reminders',
    today: 'Today!',
    tomorrow: 'Tomorrow!',

    // Pages - Transactions
    tx_history: 'History',
    tx_title: 'Transactions',
    tx_select: 'Select',
    tx_cancel: 'Cancel',
    tx_select_all: 'Select All',
    tx_selected: 'selected',
    tx_deleting: 'Deleting...',
    tx_delete_selected: 'Delete',
    tx_delete_all: 'Delete All',
    tx_empty_title: 'No transactions yet',
    tx_empty_desc: 'Tap + to add your first transaction',
    tx_confirm_delete: 'Delete this transaction?',
    tx_confirm_delete_selected: 'Delete {count} transactions?',
    tx_confirm_delete_all: 'Delete all {count} transactions?',
    tx_filter_all: 'All',
    tx_filter_expense: 'Expense',
    tx_filter_income: 'Income',
    tx_update_success: 'Transaction updated successfully',
    tx_update_error: 'Failed to update transaction',
    tx_delete_success: 'Transaction deleted successfully',
    tx_delete_error: 'Failed to delete transaction',
    tx_create_success: 'Transaction created successfully',
    tx_create_error: 'Failed to create transaction',
    tx_recurring: 'Recurring transaction',
    all_goals: 'All Goals',
    no_goal: 'No goal',
    link_to_goal: 'Link to goal',
    edit_transaction: 'Edit Transaction',
    save_changes: 'Save Changes',
    manage_categories: 'Manage Categories',
    search_transactions: 'Search transactions...',
    error_loading_data: 'Failed to load data',

    // Pages - Goals
    goals_plan: 'Planning',
    goals_title: 'Financial Goals',
    goals_total_target: 'Total Target',
    goals_active: 'active goals',
    goals_empty_title: 'No financial goals yet',
    goals_empty_desc: 'Tap + to create your first savings goal',
    goals_delete_confirm: 'Delete this goal?',
    goals_days_left: 'days',
    goals_expired: 'Expired',
    goals_delete: 'Delete',
    goals_back: 'Back',
    goals_add_money: 'Add Money',
    goals_withdraw: 'Withdraw',
    goals_activity: 'Activity',
    goals_delete_goal: 'Delete goal',
    goals_no_tx: 'No transactions yet',
    goals_achieved_pct: '% achieved',
    goals_remaining: 'Remaining',

    // Pages - Budget
    budget_subtitle: 'Monthly Budget',
    budget_total: 'Total Budget',
    budget_spent: 'Spent',
    budget_remaining: 'Remaining',
    budget_empty_title: 'No budgets yet',
    budget_empty_desc: 'Tap + to add a budget per category',
    budget_over: 'Over budget',

    // Pages - Debts
    debts_management: 'Management',
    debts_title: 'Debts & Credit',
    debts_total: 'Total Debt',
    debts_monthly: 'Monthly Payment',
    debts_empty_title: 'No active debts',
    debts_empty_desc: 'Tap + to record a debt or credit',
    debts_paid: 'Paid Off',
    debts_paid_pct: '% paid',
    debts_remaining: 'Remaining',
    debts_installment: 'Installment',
    debts_mark_paid_title: 'Mark as paid',

    // Pages - Analytics
    analytics_overview: 'Overview',
    analytics_title: 'Analytics',
    analytics_spending_trend: 'Spending Trend',
    analytics_income_vs_expense: 'Income vs Expenses',
    analytics_income_label: 'Income',
    analytics_expense_label: 'Expenses',
    analytics_category_breakdown: 'Expenses by Category',
    analytics_this_month: 'This month',
    analytics_no_expense_data: 'No expense data this month',
    analytics_budget_vs_spent: 'Budget Allocation vs Spent',
    analytics_goals_progress: 'Savings Goal Progress',
    analytics_investment_summary: 'Investment Summary',
    analytics_initial_value: 'Initial Value',
    analytics_current_value: 'Current Value',
    analytics_return: 'Return',
    
    // Month names
    month_jan: 'January',
    month_feb: 'February',
    month_mar: 'March',
    month_apr: 'April',
    month_may: 'May',
    month_jun: 'June',
    month_jul: 'July',
    month_aug: 'August',
    month_sep: 'September',
    month_oct: 'October',
    month_nov: 'November',
    month_dec: 'December',

    // Pages - Settings
    settings_preferences: 'Preferences',
    settings_title: 'Settings',
    settings_user_label: 'User',
    settings_appearance: 'Appearance',
    settings_dark_mode: 'Dark Mode',
    settings_active: 'Active',
    settings_inactive: 'Inactive',
    settings_language: 'Language',
    settings_currency: 'Currency',
    settings_widget_dashboard: 'Dashboard Widgets',
    settings_widget_desc: 'Choose which widgets to show on the home page',
    settings_account: 'Account',
    settings_logout: 'Logout',
    settings_version: 'Atur.in v1.0 · Made with ❤️',

    // Pages - Reminders
    reminders_manage: 'Manage',
    reminders_title: 'Reminders',
    reminders_total_active: 'Total active bills this month',
    reminders_active_count: 'active reminders',
    reminders_empty: 'No reminders yet',
    reminders_add_first: '+ Add first reminder',
    reminders_upcoming: 'Upcoming',
    reminders_paid_this_month: 'Paid This Month',
    reminders_inactive: 'Inactive',
    reminders_due_day: 'Day',
    reminders_every_month: 'every month',
    reminders_mark_paid: 'Mark as paid',
    reminders_edit: 'Edit',

    // Pages - Alerts
    alerts_back: 'Back',
    alerts_title: 'Smart Alerts',
    alerts_subtitle: 'Smart financial notifications for you',
    alerts_unread: 'Unread',
    alerts_all: 'All',
    alerts_empty_title: 'No alerts',
    alerts_empty_desc: 'You\'re all caught up!',
    alerts_mark_read: 'Mark as read',
    alerts_follow_up: 'Follow up →',
    alerts_delete: 'Delete',
    alerts_email: 'Email',

    // Pages - Investments
    investments_portfolio: 'Portfolio',
    investments_title: 'Investments',
    investments_from_capital: 'from capital',
    investments_empty_title: 'No investments yet',
    investments_empty_desc: 'Tap + to record your investment',
    investments_watchlist_title: 'Watch Assets',
    investments_watchlist_hide: 'Hide',
    investments_watchlist_show: 'Show',
    investments_target: 'Target',
    investments_portfolio_weight: '% portfolio',

    // Pages - Tips
    tips_guide: 'Guide',
    tips_title: 'Tips & How To',
    tips_search_placeholder: 'Search questions or topics...',
    tips_empty_title: 'No results',
    tips_empty_desc: 'Try a different keyword',
    tips_help_title: 'Need more help?',
    tips_help_desc: 'Ask Nana AI directly — your smart financial assistant available 24/7.',

    // Pages - Nana
    nana_subtitle: 'AI Financial Assistant',
    nana_new_chat_title: 'New chat',
    nana_greeting: 'Hello! I\'m Nana 👋',
    nana_greeting_desc: 'Your personal financial assistant. Ask me anything about your finances!',
    nana_input_placeholder: 'Ask Nana something...',

    // Pages - Menu
    menu_nav: 'Navigation',
    menu_title: 'More Options',
    menu_finance: 'Finance',
    menu_notifications: 'Notifications & Info',
    menu_account: 'Account',
  },
};

const AppSettingsContext = createContext(null);

export function AppSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [settingsId, setSettingsId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const user = await base44.auth.me();
        if (!user?.settings_id) {
          const newSettings = await base44.entities.AppSettings.create(DEFAULT_SETTINGS);
          await base44.auth.updateMe({ settings_id: newSettings.id });
          setSettings({ ...DEFAULT_SETTINGS, ...newSettings });
          setSettingsId(newSettings.id);
        } else {
          const appSettings = await base44.entities.AppSettings.list();
          const userSettings = appSettings.find(s => s.id === user.settings_id);
          if (userSettings) {
            setSettings({ ...DEFAULT_SETTINGS, ...userSettings });
            setSettingsId(userSettings.id);
          }
        }
      } catch (e) {
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateSettings = async (newSettings) => {
    setSettings(newSettings);
    if (settingsId) {
      await base44.entities.AppSettings.update(settingsId, newSettings);
    }
  };

  const t = (key) => TRANSLATIONS[settings.language]?.[key] || key;

  const formatCurrency = (value) => {
    if (typeof value !== 'number') value = parseFloat(value) || 0;
    const absValue = Math.abs(value);
    const intPart = Math.floor(absValue);
    const decimalPart = Math.round((absValue - intPart) * 100);
    
    // Format integer part with thousand separator
    const intStr = intPart.toString().split('').reverse();
    const grouped = [];
    for (let i = 0; i < intStr.length; i++) {
      if (i > 0 && i % 3 === 0) grouped.push(settings.thousand_separator);
      grouped.push(intStr[i]);
    }
    const formattedInt = grouped.reverse().join('');
    
    // Add decimal if needed
    const formattedDecimal = decimalPart > 0 ? settings.decimal_separator + decimalPart.toString().padStart(2, '0') : '';
    
    return `${settings.currency_symbol} ${formattedInt}${formattedDecimal}`;
  };

  const formatNumber = (value, decimals = 0) => {
    if (typeof value !== 'number') value = parseFloat(value) || 0;
    const absValue = Math.abs(value);
    const intPart = Math.floor(absValue);
    const decimalPart = decimals > 0 ? Math.round((absValue - intPart) * Math.pow(10, decimals)).toString().padStart(decimals, '0') : '';
    
    // Format integer part with thousand separator
    const intStr = intPart.toString().split('').reverse();
    const grouped = [];
    for (let i = 0; i < intStr.length; i++) {
      if (i > 0 && i % 3 === 0) grouped.push(settings.thousand_separator);
      grouped.push(intStr[i]);
    }
    const formattedInt = grouped.reverse().join('');
    
    return decimals > 0 && decimalPart ? `${formattedInt}${settings.decimal_separator}${decimalPart}` : formattedInt;
  };

  const formatShortNumber = (value) => {
    if (typeof value !== 'number') value = parseFloat(value) || 0;
    const absValue = Math.abs(value);
    if (absValue >= 1000000000) return `${(absValue / 1000000000).toFixed(1)}M`;
    if (absValue >= 1000000) return `${(absValue / 1000000).toFixed(0)}${settings.language === 'id' ? 'jt' : 'M'}`;
    if (absValue >= 1000) return `${(absValue / 1000).toFixed(0)}${settings.language === 'id' ? 'rb' : 'K'}`;
    return absValue.toString();
  };

  return (
    <AppSettingsContext.Provider value={{ settings, setSettings, updateSettings, loading, t, formatCurrency, formatNumber, formatShortNumber }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) throw new Error('useAppSettings must be used within AppSettingsProvider');
  return ctx;
}