import { useState } from "react";
import { Shield, X, AlertTriangle, Phone, CreditCard, Lock, FileText } from "lucide-react";
import { base44 } from "@/api/base44Client";

const securitySteps = [
  { icon: CreditCard, title: "Blokir Kartu Segera", desc: "Hubungi bank untuk memblokir kartu debit/kredit yang terkait dengan transaksi ini." },
  { icon: Phone, title: "Lapor ke Bank", desc: "Hubungi call center bank 24 jam dan laporkan transaksi mencurigakan ini." },
  { icon: Lock, title: "Ganti PIN & Password", desc: "Segera ganti PIN ATM, password mobile banking, dan aplikasi keuangan Anda." },
  { icon: FileText, title: "Catat & Simpan Bukti", desc: "Dokumentasikan detail transaksi ini untuk keperluan laporan ke bank atau kepolisian." },
];

export default function AnomalySecurityModal({ anomaly, transactions, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleReport = async () => {
    setLoading(true);
    // Find transactions in this category this month and mark them as suspicious
    const now = new Date();
    const suspicious = transactions.filter(t => {
      const d = new Date(t.date);
      return t.type === "expense"
        && t.category === anomaly.category
        && d.getMonth() === now.getMonth()
        && d.getFullYear() === now.getFullYear();
    });

    await Promise.all(
      suspicious.map(t =>
        base44.entities.Transaction.update(t.id, {
          note: `[MENCURIGAKAN] ${t.note || ""}`.trim()
        })
      )
    );

    // Create an Alert record
    await base44.entities.Alert.create({
      type: "unusual_pattern",
      title: `Transaksi Mencurigakan: ${anomaly.label}`,
      message: `Pengeluaran kategori ${anomaly.label} bulan ini ${anomaly.isNew ? "adalah transaksi baru yang besar" : `melonjak ${anomaly.pctIncrease}% di atas rata-rata`}. User menandai sebagai bukan transaksinya.`,
      severity: "high",
      status: "unread",
      category: anomaly.category,
      metadata: { user_feedback: "not_mine", amount: anomaly.current, average: anomaly.average }
    });

    setLoading(false);
    setDone(true);
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Transaksi Mencurigakan</p>
                <p className="text-red-100 text-xs">{anomaly.emoji} {anomaly.label}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white tap-highlight-fix">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {!done ? (
            <>
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-sm text-red-700 font-medium">⚠️ Kamu melaporkan transaksi ini bukan milikmu!</p>
                <p className="text-xs text-red-500 mt-1">Transaksi di kategori <b>{anomaly.label}</b> bulan ini akan ditandai sebagai mencurigakan di sistem.</p>
              </div>

              <div>
                <p className="text-xs font-bold text-[#1A1A1A] mb-2 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#FF6A00]" />
                  Langkah Keamanan yang Disarankan
                </p>
                <div className="space-y-2">
                  {securitySteps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-[#F8FAFC] rounded-xl">
                      <div className="w-7 h-7 rounded-full bg-[#FF6A00]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <step.icon className="w-3.5 h-3.5 text-[#FF6A00]" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#1A1A1A]">{step.title}</p>
                        <p className="text-[11px] text-[#8FA4C8] mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-medium text-[#8FA4C8] hover:bg-[#F8FAFC] transition-colors tap-highlight-fix"
                >
                  Batal
                </button>
                <button
                  onClick={handleReport}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors tap-highlight-fix disabled:opacity-60"
                >
                  {loading ? "Memproses..." : "Laporkan & Tandai"}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <Shield className="w-7 h-7 text-green-600" />
              </div>
              <p className="text-sm font-bold text-[#1A1A1A]">Transaksi Berhasil Ditandai!</p>
              <p className="text-xs text-[#8FA4C8] mt-1">Segera ikuti langkah keamanan di atas untuk melindungi akun kamu.</p>
              <button
                onClick={onClose}
                className="mt-4 w-full py-2.5 rounded-xl bg-[#0A0A0A] text-white text-sm font-bold tap-highlight-fix"
              >
                Mengerti
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}