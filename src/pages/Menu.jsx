import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Target, CreditCard, Lightbulb, ChevronRight, Bell, Settings, User, Users, PiggyBank, Trophy, Gamepad2, TrendingUp } from "lucide-react";
import { useAppSettings } from "@/components/utils/useAppSettings";

export default function Menu() {
  const { t } = useAppSettings();
  const MENU_GROUPS = [
    {
      title: t('menu_finance'),
      items: [
        { label: t('nav_goals'), desc: "Pantau dan capai target keuanganmu", icon: Target, emoji: "🎯", page: "Goals", color: "#FF6A00" },
        { label: t('nav_debts'), desc: "Lacak cicilan dan sisa hutang", icon: CreditCard, emoji: "💳", page: "Debts", color: "#FF6B6B" },
        { label: t('nav_budget'), desc: "Atur dan pantau anggaran bulananmu", icon: PiggyBank, emoji: "📊", page: "Budget", color: "#00C9A7" },
        { label: "Investasi", desc: "Pantau portofolio saham, reksa dana, dan aset", icon: TrendingUp, emoji: "📈", page: "Investments", color: "#00C9A7" },
        { label: "Keuangan Bersama", desc: "Kelola keuangan bersama pasangan atau keluarga", icon: Users, emoji: "👨‍👩‍👧", page: "SharedFinance", color: "#9C27B0" },
      ],
    },
    {
      title: t('menu_notifications'),
      items: [
        { label: "Notifikasi", desc: "Pengingat tagihan dan notifikasi cerdas", icon: Bell, emoji: "🔔", page: "Notifications", color: "#F5A623" },
        { label: "Achievement", desc: "Lihat semua pencapaian dan badge kamu", icon: Trophy, emoji: "🏅", page: "Achievements", color: "#FFD700" },
        { label: "Gamifikasi", desc: "Boss Battle, Challenge, Level & Achievement", icon: Gamepad2, emoji: "🎮", page: "Gamifikasi", color: "#8B5CF6" },
        { label: t('nav_tips'), desc: "Saran dan tips mengelola keuangan", icon: Lightbulb, emoji: "💡", page: "Tips", color: "#F5A623" },
      ],
    },
    {
      title: t('menu_account'),
      items: [
        { label: "Profil Saya", desc: "Kelola profil dan akun Anda", icon: User, emoji: "👤", page: "ProfileSettings", color: "#FF6A00" },
        { label: t('nav_settings'), desc: "Preferensi dan pengaturan aplikasi", icon: Settings, emoji: "⚙️", page: "Settings", color: "#888" },
      ],
    },
  ];
  return (
    <div className="min-h-screen bg-[#F2F4F7] pb-8">
      {/* Header */}
      <div className="bg-[#0A0A0A] px-5 pt-10 pb-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-[#8FA4C8] text-sm font-medium">{t('menu_nav')}</p>
          <h1 className="text-white text-2xl font-bold mt-0.5">{t('menu_title')}</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 mt-4 space-y-5">
        {MENU_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="text-xs font-bold text-[#8FA4C8] uppercase tracking-widest mb-2 px-1">{group.title}</p>
            <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-[#F0F2F5]">
              {group.items.map((item, idx) => (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  data-tour={item.page === "Tips" ? "tips-nav-link" : undefined}
                  className={`flex items-center gap-4 px-5 py-4 hover:bg-[#F8FAFC] active:bg-[#F2F4F7] transition-all duration-150 ${
                    idx < group.items.length - 1 ? "border-b border-[#F2F4F7]" : ""
                  }`}
                >
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: item.color + "20", boxShadow: `0 2px 8px ${item.color}25` }}
                  >
                    {item.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1A1A1A]">{item.label}</p>
                    <p className="text-xs text-[#8FA4C8] mt-0.5">{item.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#CBD5E0] flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}