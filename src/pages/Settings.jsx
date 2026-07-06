import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { MessageSquare, ShieldCheck, MapPin, Download, Trophy } from "lucide-react";
import ExportLaporanModal from "@/components/analytics/ExportLaporanModal";
import IntegrationSettings from "@/components/settings/IntegrationSettings";
import FeedbackModal from "@/components/settings/FeedbackModal";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

// NOTE: Bahasa & mata uang HANYA dipilih sekali di onboarding dan tidak bisa
// diubah lagi setelahnya. Section-nya sudah dihapus dari halaman ini.

export default function Settings() {
  const [user, setUser] = useState(null);

  const { t } = useAppSettings();
  const [showFeedback, setShowFeedback] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [restartingTour, setRestartingTour] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  async function handleRestartTour() {
    setRestartingTour(true);
    await base44.auth.updateMe({ tour_completed: false });
    navigate('/Dashboard');
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

        {/* Legal — halaman legal dipindah ke landing app (https://aturpintar.com) */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-[#F0F2F5]">
          <div className="px-5 pt-4 pb-2">
            <p className="text-xs font-bold text-[#8FA4C8] uppercase tracking-widest">Legal</p>
          </div>
          <a
            href="https://aturpintar.com/PrivacyPolicy"
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
            href="https://aturpintar.com/TermsOfService"
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
            href="https://aturpintar.com/RefundPolicy"
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
            href="https://aturpintar.com/CancellationPolicy"
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

        <p className="text-center text-xs text-[#8FA4C8] pb-4">{t('settings_version')}</p>
      </div>

      {showFeedback && (
        <FeedbackModal user={user} onClose={() => setShowFeedback(false)} />
      )}

      {showExport && (
        <ExportLaporanModal user={user} onClose={() => setShowExport(false)} />
      )}
    </div>
  );
}