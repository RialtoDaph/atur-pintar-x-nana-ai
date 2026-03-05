import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Mail, FileJson, LogOut, Loader2 } from "lucide-react";

export default function IntegrationSettings() {
  const [sendingEmail, setSendingEmail] = useState(false);
  const [exportingSheets, setExportingSheets] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleSendMonthlySummary() {
    setSendingEmail(true);
    setMessage(null);
    const response = await base44.functions.invoke("sendMonthlySummaryEmail", {});
    setSendingEmail(false);
    if (response.data?.success) {
      setMessage({ type: "success", text: "📧 Email ringkasan bulanan berhasil dikirim!" });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: "error", text: "Gagal mengirim email. Coba lagi." });
    }
  }

  async function handleExportToSheets() {
    setExportingSheets(true);
    setMessage(null);
    try {
      const response = await base44.functions.invoke("exportMonthlyReportToGoogleSheets", {});
      if (response.data?.spreadsheetUrl) {
        setMessage({ type: "success", text: "📊 Laporan berhasil dibuat di Google Sheets!" });
        window.open(response.data.spreadsheetUrl, '_blank');
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: "Gagal membuat laporan. Coba lagi." });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Gagal mengekspor data. Coba lagi." });
    }
    setExportingSheets(false);
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold text-[#8FA4C8] uppercase tracking-widest mb-3">Integrasi & Export</p>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
          message.type === 'success' 
            ? 'bg-[#34C87A]/10 text-[#34C87A]' 
            : 'bg-[#FF6B6B]/10 text-[#FF6B6B]'
        }`}>
          {message.text}
        </div>
      )}

      {/* Email Summary */}
      <button
        onClick={handleSendMonthlySummary}
        disabled={sendingEmail}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-white rounded-2xl hover:bg-[#F8FAFC] transition-colors border border-[#E2E8F0]"
      >
        <div className="flex items-center gap-3">
          <Mail className="w-5 h-5 text-[#FF6A00]" />
          <div className="text-left">
            <p className="font-medium text-[#1A1A1A] text-sm">Ringkasan Email Bulanan</p>
            <p className="text-xs text-[#8FA4C8]">Kirim laporan ke email Anda</p>
          </div>
        </div>
        {sendingEmail ? (
          <Loader2 className="w-4 h-4 text-[#FF6A00] animate-spin" />
        ) : (
          <span className="text-xs font-semibold text-[#FF6A00]">Kirim</span>
        )}
      </button>

      {/* Export to Google Sheets (for now JSON) */}
      <button
        onClick={handleExportToSheets}
        disabled={exportingSheets}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-white rounded-2xl hover:bg-[#F8FAFC] transition-colors border border-[#E2E8F0]"
      >
        <div className="flex items-center gap-3">
          <FileJson className="w-5 h-5 text-[#4F7CFF]" />
          <div className="text-left">
            <p className="font-medium text-[#1A1A1A] text-sm">Export Data Bulanan</p>
            <p className="text-xs text-[#8FA4C8]">Unduh laporan lengkap</p>
          </div>
        </div>
        {exportingSheets ? (
          <Loader2 className="w-4 h-4 text-[#4F7CFF] animate-spin" />
        ) : (
          <span className="text-xs font-semibold text-[#4F7CFF]">Download</span>
        )}
      </button>

      <p className="text-xs text-[#8FA4C8] mt-4">Fitur Google Sheets akan segera tersedia. Saat ini data dapat diunduh sebagai JSON.</p>
    </div>
  );
}