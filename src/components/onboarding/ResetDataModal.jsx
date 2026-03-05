import { useState } from "react";
import { Trash2, RefreshCw, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ResetDataModal({ onClose }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleReset() {
    setLoading(true);

    // Fetch all records for data-only entities
    const [transactions, goals, debts, investments, splitIOUs, splitBills, alerts] = await Promise.all([
      base44.entities.Transaction.list(),
      base44.entities.SavingsGoal.list(),
      base44.entities.Debt.list(),
      base44.entities.Investment.list(),
      base44.entities.SplitIOU.list(),
      base44.entities.SplitBill.list(),
      base44.entities.Alert.list(),
    ]);

    // Delete all records in parallel
    await Promise.all([
      ...transactions.map(r => base44.entities.Transaction.delete(r.id)),
      ...goals.map(r => base44.entities.SavingsGoal.delete(r.id)),
      ...debts.map(r => base44.entities.Debt.delete(r.id)),
      ...investments.map(r => base44.entities.Investment.delete(r.id)),
      ...splitIOUs.map(r => base44.entities.SplitIOU.delete(r.id)),
      ...splitBills.map(r => base44.entities.SplitBill.delete(r.id)),
      ...alerts.map(r => base44.entities.Alert.delete(r.id)),
    ]);

    setLoading(false);
    setDone(true);
  }

  function handleClose() {
    localStorage.setItem("reset_prompt_shown", "true");
    onClose();
    if (done) window.location.reload();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6">
        {!done ? (
          <>
            <div className="flex items-center justify-between mb-5">
              <div className="w-12 h-12 rounded-2xl bg-[#FF6B6B]/10 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-[#FF6B6B]" />
              </div>
              <button onClick={handleClose} className="text-[#9B9B9B] hover:text-[#1A1A1A]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <h2 className="text-lg font-bold text-[#1A1A1A] mb-2">Mulai dari Awal?</h2>
            <p className="text-sm text-[#8FA4C8] mb-1 leading-relaxed">
              Hapus semua data contoh (transaksi, tujuan, utang, investasi) agar kamu bisa mulai dengan data milikmu sendiri.
            </p>
            <p className="text-xs text-[#CBD5E0] mb-6">
              Kategori, anggaran, dan pengaturan lain tidak akan terhapus.
            </p>

            <div className="space-y-2">
              <button
                onClick={handleReset}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#FF6B6B] text-white font-bold text-sm hover:bg-[#e05555] transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {loading ? "Menghapus..." : "Hapus Semua Data"}
              </button>
              <button
                onClick={handleClose}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#F2F4F7] text-[#4A5568] font-semibold text-sm hover:bg-[#E2E8F0] transition-colors"
              >
                Tidak, Lanjutkan
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center py-4">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-lg font-bold text-[#1A1A1A] mb-2">Data Berhasil Dihapus</h2>
              <p className="text-sm text-[#8FA4C8] mb-6">Selamat datang! Mulai catat keuanganmu dari awal.</p>
              <button
                onClick={handleClose}
                className="w-full py-3 rounded-xl bg-[#0A0A0A] text-white font-bold text-sm hover:bg-[#333] transition-colors"
              >
                Mulai Sekarang
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}