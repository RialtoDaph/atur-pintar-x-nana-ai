import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Moon, Sun, DollarSign, Globe, LayoutDashboard, Bell, User, LogOut, ChevronRight, Check } from "lucide-react";
import NanaPreferencesSettings from "@/components/settings/NanaPreferencesSettings";
import RiskProfileAssessment from "@/components/settings/RiskProfileAssessment";

const LANGUAGES = [
  { code: "id", label: "Indonesia", flag: "🇮🇩" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
];

const CURRENCIES = [
  { code: "IDR", label: "Rupiah", symbol: "Rp", flag: "🇮🇩" },
  { code: "USD", label: "US Dollar", symbol: "$", flag: "🇺🇸" },
  { code: "EUR", label: "Euro", symbol: "€", flag: "🇪🇺" },
];

const WIDGETS = [
  { key: "smartAlerts", label: "Smart Alerts", desc: "Peringatan keuangan otomatis" },
  { key: "cashflowForecast", label: "Cashflow Forecast", desc: "Prediksi akhir bulan" },
  { key: "subscriptionDetector", label: "Subscription Detector", desc: "Deteksi langganan aktif" },
  { key: "spendingChart", label: "Spending Chart", desc: "Grafik pengeluaran kategori" },
  { key: "recentTransactions", label: "Transaksi Terbaru", desc: "5 transaksi terakhir" },
  { key: "savingsGoals", label: "Savings Goals", desc: "Daftar tujuan tabungan" },
];

export default function Settings() {
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");
  const [currency, setCurrency] = useState(() => localStorage.getItem("currency") || "IDR");
  const [language, setLanguage] = useState(() => localStorage.getItem("language") || "id");
  const [widgets, setWidgets] = useState(() => {
    const saved = localStorage.getItem("widgets");
    if (saved) return JSON.parse(saved);
    return { smartAlerts: true, cashflowForecast: true, subscriptionDetector: true, spendingChart: true, recentTransactions: true, savingsGoals: true };
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  function toggleDark() {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("darkMode", String(next));
    if (next) document.documentElement.classList.add("dark-app");
    else document.documentElement.classList.remove("dark-app");
  }

  function selectCurrency(code) {
    setCurrency(code);
    localStorage.setItem("currency", code);
  }

  function selectLanguage(code) {
    setLanguage(code);
    localStorage.setItem("language", code);
  }

  function toggleWidget(key) {
    const next = { ...widgets, [key]: !widgets[key] };
    setWidgets(next);
    localStorage.setItem("widgets", JSON.stringify(next));
  }

  async function handleLogout() {
    base44.auth.logout();
  }

  return (
    <div className="min-h-screen bg-[#F2F4F7] pb-10">
      <div className="bg-[#0A0A0A] px-5 pt-10 pb-8">
        <div className="max-w-2xl mx-auto">
          <p className="text-[#8FA4C8] text-sm font-medium">Preferensi</p>
          <h1 className="text-white text-2xl font-bold mt-0.5">Pengaturan</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 mt-6 space-y-4">

        {/* Profile */}
        {user && (
          <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#FF6A00] flex items-center justify-center text-white font-bold text-lg">
              {user.full_name?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <p className="font-bold text-[#1A1A1A]">{user.full_name || "Pengguna"}</p>
              <p className="text-sm text-[#8FA4C8]">{user.email}</p>
            </div>
          </div>
        )}

        {/* Tampilan */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-2">
            <p className="text-xs font-bold text-[#8FA4C8] uppercase tracking-widest">Tampilan</p>
          </div>
          <button
            onClick={toggleDark}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[#F8FAFC] transition-colors"
          >
            <div className="flex items-center gap-3">
              {darkMode ? <Moon className="w-5 h-5 text-[#FF6A00]" /> : <Sun className="w-5 h-5 text-[#FF6A00]" />}
              <div className="text-left">
                <p className="font-medium text-[#1A1A1A] text-sm">Mode Gelap</p>
                <p className="text-xs text-[#8FA4C8]">{darkMode ? "Aktif" : "Nonaktif"}</p>
              </div>
            </div>
            <div className={`w-11 h-6 rounded-full transition-colors relative ${darkMode ? "bg-[#FF6A00]" : "bg-[#E2E8F0]"}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${darkMode ? "left-5" : "left-0.5"}`} />
            </div>
          </button>
        </div>

        {/* Bahasa */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-2">
            <p className="text-xs font-bold text-[#8FA4C8] uppercase tracking-widest">Bahasa / Language</p>
          </div>
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => selectLanguage(lang.code)}
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[#F8FAFC] transition-colors border-t border-[#F2F4F7] first:border-0"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{lang.flag}</span>
                <p className="font-medium text-[#1A1A1A] text-sm">{lang.label}</p>
              </div>
              {language === lang.code && <Check className="w-4 h-4 text-[#FF6A00]" />}
            </button>
          ))}
        </div>

        {/* Mata Uang */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-2">
            <p className="text-xs font-bold text-[#8FA4C8] uppercase tracking-widest">Mata Uang</p>
          </div>
          {CURRENCIES.map(cur => (
            <button
              key={cur.code}
              onClick={() => selectCurrency(cur.code)}
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[#F8FAFC] transition-colors border-t border-[#F2F4F7] first:border-0"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{cur.flag}</span>
                <div className="text-left">
                  <p className="font-medium text-[#1A1A1A] text-sm">{cur.label}</p>
                  <p className="text-xs text-[#8FA4C8]">{cur.symbol} · {cur.code}</p>
                </div>
              </div>
              {currency === cur.code && <Check className="w-4 h-4 text-[#FF6A00]" />}
            </button>
          ))}
        </div>

        {/* Nana AI Preferences */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <NanaPreferencesSettings />
        </div>

        {/* Risk Profile Assessment */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <RiskProfileAssessment />
        </div>

        {/* Widget Dashboard */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-2">
            <p className="text-xs font-bold text-[#8FA4C8] uppercase tracking-widest">Widget Dashboard</p>
            <p className="text-xs text-[#8FA4C8] mt-0.5">Pilih widget yang ditampilkan di halaman utama</p>
          </div>
          {WIDGETS.map((w, i) => (
            <button
              key={w.key}
              onClick={() => toggleWidget(w.key)}
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[#F8FAFC] transition-colors border-t border-[#F2F4F7]"
            >
              <div className="text-left">
                <p className="font-medium text-[#1A1A1A] text-sm">{w.label}</p>
                <p className="text-xs text-[#8FA4C8]">{w.desc}</p>
              </div>
              <div className={`w-11 h-6 rounded-full transition-colors relative ${widgets[w.key] ? "bg-[#FF6A00]" : "bg-[#E2E8F0]"}`}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${widgets[w.key] ? "left-5" : "left-0.5"}`} />
              </div>
            </button>
          ))}
        </div>

        {/* Akun */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-2">
            <p className="text-xs font-bold text-[#8FA4C8] uppercase tracking-widest">Akun</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#FFF5F5] transition-colors border-t border-[#F2F4F7] text-[#FF6B6B]"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Keluar</span>
          </button>
        </div>

        <p className="text-center text-xs text-[#8FA4C8] pb-4">SaveWise v1.0 · Dibuat dengan ❤️</p>
      </div>
    </div>
  );
}