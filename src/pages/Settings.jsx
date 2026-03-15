import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Moon, Sun, Check, MessageSquare, ShieldCheck } from "lucide-react";
import IntegrationSettings from "@/components/settings/IntegrationSettings";
import FeedbackModal from "@/components/settings/FeedbackModal";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

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

const CURRENCY_MAP = {
  IDR: { symbol: "Rp" },
  USD: { symbol: "$" },
  EUR: { symbol: "€" },
};

export default function Settings() {
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");
  const { settings, updateSettings, t } = useAppSettings();
  const [currency, setCurrency] = useState("IDR");
  const [language, setLanguage] = useState("id");
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (settings) {
      setCurrency(settings.currency || "IDR");
      setLanguage(settings.language || "id");
    }
  }, [settings]);

  function toggleDark() {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("darkMode", String(next));
    if (next) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }

  async function selectCurrency(code) {
    setCurrency(code);
    const cur = CURRENCY_MAP[code];
    await updateSettings({ ...settings, currency: code, currency_symbol: cur.symbol });
  }

  async function selectLanguage(code) {
    setLanguage(code);
    await updateSettings({ ...settings, language: code });
  }

  return (
    <div className="min-h-screen bg-[#F2F4F7] pb-10">
      <div className="bg-[#0A0A0A] px-5 pt-10 pb-8">
        <div className="max-w-2xl mx-auto">
          <p className="text-[#8FA4C8] text-sm font-medium">{t('settings_preferences')}</p>
          <h1 className="text-white text-2xl font-bold mt-0.5">{t('settings_title')}</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 mt-6 space-y-4">

        {/* Tampilan */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-2">
            <p className="text-xs font-bold text-[#8FA4C8] uppercase tracking-widest">{t('settings_appearance')}</p>
          </div>
          <button
            onClick={toggleDark}
            aria-pressed={darkMode}
            aria-label={darkMode ? "Nonaktifkan mode gelap" : "Aktifkan mode gelap"}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[#F8FAFC] transition-colors border-t border-[#F2F4F7]"
          >
            <div className="flex items-center gap-3">
              {darkMode ? <Moon className="w-5 h-5 text-[#FF6A00]" /> : <Sun className="w-5 h-5 text-[#FF6A00]" />}
              <div className="text-left">
                <p className="font-medium text-[#1A1A1A] text-sm">{t('settings_dark_mode')}</p>
                <p className="text-xs text-[#8FA4C8]">{darkMode ? t('settings_active') : t('settings_inactive')}</p>
              </div>
            </div>
            <div className={`w-11 h-6 rounded-full transition-colors relative ${darkMode ? "bg-[#FF6A00]" : "bg-[#E2E8F0]"}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${darkMode ? "left-5" : "left-0.5"}`} />
            </div>
          </button>
        </div>

        {/* Bahasa & Mata Uang */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-3 flex items-center justify-between">
            <p className="text-xs font-bold text-[#8FA4C8] uppercase tracking-widest">{t('settings_language')} & {t('settings_currency')}</p>
            {settings?.settings_unlocked ? (
              <span className="text-[10px] font-semibold text-white bg-green-500 px-2 py-0.5 rounded-full">🔓 Terbuka</span>
            ) : (
              <span className="text-[10px] font-semibold text-white bg-[#FF6A00] px-2 py-0.5 rounded-full">🔒 Terkunci</span>
            )}
          </div>
          <div className="px-5 pb-4 space-y-3">
            {/* Language */}
            {settings?.settings_unlocked ? (
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => selectLanguage(l.code)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-medium ${
                      language === l.code
                        ? 'border-[#FF6A00] bg-[#FF6A00]/5 text-[#FF6A00]'
                        : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#1A1A1A] hover:border-[#FF6A00]/50'
                    }`}
                  >
                    <span>{l.flag}</span> {l.label}
                    {language === l.code && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-xl">{LANGUAGES.find((l) => l.code === language)?.flag}</span>
                <div>
                  <p className="text-sm font-semibold text-[#1A1A1A]">{LANGUAGES.find((l) => l.code === language)?.label}</p>
                  <p className="text-xs text-[#8FA4C8]">{t('settings_language')}</p>
                </div>
                <Check className="w-4 h-4 text-[#FF6A00] ml-auto" />
              </div>
            )}

            {/* Currency */}
            {settings?.settings_unlocked ? (
              <div className="flex flex-wrap gap-2">
                {CURRENCIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => selectCurrency(c.code)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-medium ${
                      currency === c.code
                        ? 'border-[#FF6A00] bg-[#FF6A00]/5 text-[#FF6A00]'
                        : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#1A1A1A] hover:border-[#FF6A00]/50'
                    }`}
                  >
                    <span>{c.flag}</span> {c.label}
                    {currency === c.code && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-xl">{CURRENCIES.find((c) => c.code === currency)?.flag}</span>
                <div>
                  <p className="text-sm font-semibold text-[#1A1A1A]">{CURRENCIES.find((c) => c.code === currency)?.label}</p>
                  <p className="text-xs text-[#8FA4C8]">{CURRENCIES.find((c) => c.code === currency)?.symbol} · {currency}</p>
                </div>
                <Check className="w-4 h-4 text-[#FF6A00] ml-auto" />
              </div>
            )}

            {!settings?.settings_unlocked && (
              <p className="text-xs text-[#8FA4C8]">Bahasa dan mata uang ditetapkan saat setup awal. Hubungi admin untuk mengubah.</p>
            )}
          </div>
        </div>

        {/* Integrasi & Export */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <IntegrationSettings />
        </div>

        {/* Feedback */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-2">
            <p className="text-xs font-bold text-[#8FA4C8] uppercase tracking-widest">Feedback</p>
          </div>
          <button
            onClick={() => setShowFeedback(true)}
            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#F8FAFC] transition-colors border-t border-[#F2F4F7]"
            aria-label="Buka form feedback"
          >
            <MessageSquare className="w-5 h-5 text-[#FF6A00]" />
            <div className="text-left">
              <p className="font-medium text-[#1A1A1A] text-sm">Kirim Feedback</p>
              <p className="text-xs text-[#8FA4C8]">Bantu kami untuk terus berkembang</p>
            </div>
          </button>
        </div>

        {/* Admin Panel - hanya untuk admin */}
        {user?.role === 'admin' && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 pt-4 pb-2">
              <p className="text-xs font-bold text-[#8FA4C8] uppercase tracking-widest">Admin</p>
            </div>
            <Link
              to={createPageUrl("AdminDashboard")}
              className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#F8FAFC] transition-colors border-t border-[#F2F4F7]"
            >
              <ShieldCheck className="w-5 h-5 text-[#FF6A00]" />
              <div className="text-left">
                <p className="font-medium text-[#1A1A1A] text-sm">Admin Dashboard</p>
                <p className="text-xs text-[#8FA4C8]">Kelola pengguna, kategori & sistem</p>
              </div>
            </Link>
          </div>
        )}

        <p className="text-center text-xs text-[#8FA4C8] pb-4">{t('settings_version')}</p>
      </div>

      {showFeedback && (
        <FeedbackModal user={user} onClose={() => setShowFeedback(false)} />
      )}
    </div>
  );
}