import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { MessageSquare, ShieldCheck, MapPin, Download, Trophy, AlertTriangle, Trash2 } from "lucide-react";
import ExportLaporanModal from "@/components/analytics/ExportLaporanModal";
import IntegrationSettings from "@/components/settings/IntegrationSettings";
import FeedbackModal from "@/components/settings/FeedbackModal";
import DeleteAccountConfirmDialog from "@/components/profile/DeleteAccountConfirmDialog";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

// NOTE: Bahasa & mata uang HANYA dipilih sekali di onboarding dan tidak bisa
// diubah lagi setelahnya. Section-nya sudah dihapus dari halaman ini.

export default function Settings() {
  const [user, setUser] = useState(null);

  const { t } = useAppSettings();
  const [showFeedback, setShowFeedback] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [restartingTour, setRestartingTour] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  async function handleRestartTour() {
    setRestartingTour(true);
    await base44.auth.updateMe({ tour_completed: false });
    navigate('/Dashboard');
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      const me = await base44.auth.me();
      const email = me?.email;
      if (email) {
        // Hapus semua data user (best-effort, ignore kegagalan per-entity)
        const entitiesToWipe = [
          "Transaction", "Account", "SavingsGoal", "Budget", "Debt",
          "CustomCategory", "Investment", "InvestmentTransaction", "InvestmentWatchlist",
          "Subscription", "DetectedSubscription", "Reminder", "Alert",
          "GamificationProfile", "DailyMission", "Achievement", "Challenge",
          "BossBattleContribution", "WeeklyRecap", "ReceiptScan", "MoodCheckIn",
          "NanaConversation", "NanaPreferences", "AppSettings", "UserPersona",
          "UserRiskProfile", "FinancialHealthScore", "CategoryLearning",
          "ShareableCard", "ExportLog", "FeedbackReport", "SharedWalletTransaction",
        ];
        for (const ent of entitiesToWipe) {
          try {
            const rows = await base44.entities[ent].filter({ created_by: email });
            await Promise.all((rows || []).map(r => base44.entities[ent].delete(r.id).catch(() => {})));
          } catch {}
        }
      }
      // Attempt platform-level account deletion if SDK supports it
      try { if (typeof base44.auth.deleteAccount === "function") await base44.auth.deleteAccount(); } catch {}
      toast.success("Akun & semua data berhasil dihapus.");
      // Force logout & redirect ke landing
      setTimeout(() => base44.auth.logout('/'), 600);
    } catch {
      toast.error("Gagal menghapus akun. Coba lagi.");
      setDeleting(false);
    }
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

        {/* Ekspor Laporan */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-[#F0F2F5]">
          <div className="px-5 pt-4 pb-2">
            <p className="text-xs font-bold text-[#8FA4C8] uppercase tracking-widest">Data & Ekspor</p>
          </div>
          <button
            onClick={() => setShowExport(true)}
            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#F8FAFC] transition-colors border-t border-[#F2F4F7]"
          >
            <Download className="w-5 h-5 text-[#F97316]" />
            <div className="text-left">
              <p className="font-medium text-[#1A1A1A] text-sm">Ekspor Laporan</p>
              <p className="text-xs text-[#8FA4C8]">Unduh transaksi sebagai CSV atau PDF</p>
            </div>
          </button>
        </div>

        {/* Integrasi & Export */}
        <div className="bg-white rounded-2xl shadow-md p-5 border border-[#F0F2F5]">
          <IntegrationSettings />
        </div>

        {/* Gamifikasi & Streak */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-[#F0F2F5]">
          <div className="px-5 pt-4 pb-2">
            <p className="text-xs font-bold text-[#8FA4C8] uppercase tracking-widest">Gamifikasi</p>
          </div>
          <Link
            to={createPageUrl("Gamifikasi")}
            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#F8FAFC] transition-colors border-t border-[#F2F4F7]"
          >
            <Trophy className="w-5 h-5 text-[#F97316]" />
            <div className="text-left">
              <p className="font-medium text-[#1A1A1A] text-sm">Streak & Reset Mingguan</p>
              <p className="text-xs text-[#8FA4C8]">Lihat streak, sisa freeze & tanggal reset mingguan</p>
            </div>
          </Link>
        </div>

        {/* Tour Panduan */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-[#F0F2F5]">
          <div className="px-5 pt-4 pb-2">
            <p className="text-xs font-bold text-[#8FA4C8] uppercase tracking-widest">Panduan</p>
          </div>
          <button
            onClick={handleRestartTour}
            disabled={restartingTour}
            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#F8FAFC] transition-colors border-t border-[#F2F4F7]"
          >
            <MapPin className="w-5 h-5 text-[#F97316]" />
            <div className="text-left flex-1">
              <p className="font-medium text-[#1A1A1A] text-sm">Mulai Tour Ulang</p>
              <p className="text-xs text-[#8FA4C8]">Lihat panduan fitur-fitur Atur Pintar dari awal</p>
            </div>
            {restartingTour && <div className="w-4 h-4 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />}
          </button>
        </div>

        {/* Feedback */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-[#F0F2F5]">
          <div className="px-5 pt-4 pb-2">
            <p className="text-xs font-bold text-[#8FA4C8] uppercase tracking-widest">Feedback</p>
          </div>
          <button
            onClick={() => setShowFeedback(true)}
            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#F8FAFC] transition-colors border-t border-[#F2F4F7]"
            aria-label="Buka form feedback"
          >
            <MessageSquare className="w-5 h-5 text-[#F97316]" />
            <div className="text-left">
              <p className="font-medium text-[#1A1A1A] text-sm">Kirim Feedback</p>
              <p className="text-xs text-[#8FA4C8]">Bantu kami untuk terus berkembang</p>
            </div>
          </button>
        </div>

        {/* Admin Panel - hanya untuk admin */}
        {user?.role === 'admin' && (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-[#F0F2F5]">
            <div className="px-5 pt-4 pb-2">
              <p className="text-xs font-bold text-[#8FA4C8] uppercase tracking-widest">Admin</p>
            </div>
            <Link
              to={createPageUrl("AdminDashboard")}
              className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#F8FAFC] transition-colors border-t border-[#F2F4F7]"
            >
              <ShieldCheck className="w-5 h-5 text-[#F97316]" />
              <div className="text-left">
                <p className="font-medium text-[#1A1A1A] text-sm">Admin Dashboard</p>
                <p className="text-xs text-[#8FA4C8]">Kelola pengguna, kategori & sistem</p>
              </div>
            </Link>
          </div>
        )}

        {/* Legal — halaman legal dipindah ke landing app (https://aturpintar.id) */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-[#F0F2F5]">
          <div className="px-5 pt-4 pb-2">
            <p className="text-xs font-bold text-[#8FA4C8] uppercase tracking-widest">Legal</p>
          </div>
          <a
            href="https://aturpintar.id/PrivacyPolicy"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#F8FAFC] transition-colors border-t border-[#F2F4F7]"
          >
            <ShieldCheck className="w-5 h-5 text-[#F97316]" />
            <div className="text-left">
              <p className="font-medium text-[#1A1A1A] text-sm">Kebijakan Privasi</p>
              <p className="text-xs text-[#8FA4C8]">Pelajari bagaimana kami melindungi data kamu</p>
            </div>
          </a>
          <a
            href="https://aturpintar.id/TermsOfService"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#F8FAFC] transition-colors border-t border-[#F2F4F7]"
          >
            <ShieldCheck className="w-5 h-5 text-[#8FA4C8]" />
            <div className="text-left">
              <p className="font-medium text-[#1A1A1A] text-sm">Syarat & Ketentuan</p>
              <p className="text-xs text-[#8FA4C8]">Ketentuan penggunaan layanan Atur Pintar</p>
            </div>
          </a>
          <a
            href="https://aturpintar.id/RefundPolicy"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#F8FAFC] transition-colors border-t border-[#F2F4F7]"
          >
            <ShieldCheck className="w-5 h-5 text-[#8FA4C8]" />
            <div className="text-left">
              <p className="font-medium text-[#1A1A1A] text-sm">Kebijakan Refund</p>
              <p className="text-xs text-[#8FA4C8]">Ketentuan & cara mengajukan refund</p>
            </div>
          </a>
          <a
            href="https://aturpintar.id/CancellationPolicy"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#F8FAFC] transition-colors border-t border-[#F2F4F7]"
          >
            <ShieldCheck className="w-5 h-5 text-[#8FA4C8]" />
            <div className="text-left">
              <p className="font-medium text-[#1A1A1A] text-sm">Pembatalan Langganan</p>
              <p className="text-xs text-[#8FA4C8]">Cara membatalkan langganan Premium</p>
            </div>
          </a>
          <Link
            to="/About"
            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#F8FAFC] transition-colors border-t border-[#F2F4F7]"
          >
            <ShieldCheck className="w-5 h-5 text-[#8FA4C8]" />
            <div className="text-left">
              <p className="font-medium text-[#1A1A1A] text-sm">Tentang Atur Pintar</p>
              <p className="text-xs text-[#8FA4C8]">Dikembangkan oleh PT Rideff Vreka Tech</p>
            </div>
          </Link>
        </div>

        {/* Danger Zone — Hapus Akun */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-red-100">
          <div className="px-5 pt-4 pb-2 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            <p className="text-xs font-bold text-red-500 uppercase tracking-widest">Danger Zone</p>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-start gap-3 px-5 py-4 hover:bg-red-50 transition-colors border-t border-[#F2F4F7] text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-4 h-4 text-red-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-red-600">Hapus Akun Selamanya</p>
              <p className="text-xs text-[#8FA4C8] mt-0.5">Semua data kamu (transaksi, rekening, goal, dll) akan dihapus permanen dan tidak bisa dikembalikan.</p>
            </div>
          </button>
        </div>

        <p className="text-center text-xs text-[#8FA4C8] pb-4">{t('settings_version')}</p>
      </div>

      {showFeedback && (
        <FeedbackModal user={user} onClose={() => setShowFeedback(false)} />
      )}

      {showExport && (
        <ExportLaporanModal user={user} onClose={() => setShowExport(false)} />
      )}

      <DeleteAccountConfirmDialog
        open={showDeleteConfirm}
        loading={deleting}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
}