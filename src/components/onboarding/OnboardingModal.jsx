import { useState } from "react";
import { X, ArrowRight, PlusCircle, Target, BarChart2, CreditCard, Settings } from "lucide-react";

const STEPS = [
  {
    icon: "👋",
    title: "Selamat datang di Atur.in!",
    desc: "Aplikasi keuangan pribadi yang membantu kamu mencatat, menganalisis, dan merencanakan keuangan lebih cerdas.",
  },
  {
    icon: "➕",
    title: "Catat Transaksi",
    desc: 'Tap tombol + oranye di pojok kanan atas untuk tambah pemasukan atau pengeluaran. Isi jumlah dalam Rupiah, pilih kategori, dan tambah catatan.',
    hint: "Contoh: Rp 5.000.000 gaji bulan ini, atau Rp 50.000 makan siang.",
  },
  {
    icon: "🎯",
    title: "Buat Tujuan Tabungan",
    desc: 'Pergi ke menu "Tujuan" untuk buat target tabungan seperti dana darurat, liburan, atau beli rumah.',
    hint: "Contoh: Target Rp 10.000.000 untuk dana darurat dalam 6 bulan.",
  },
  {
    icon: "💳",
    title: "Kelola Utang & Anggaran",
    desc: 'Di menu "Utang" catat cicilan KPR, kartu kredit, dll. Di "Anggaran" atur batas pengeluaran per kategori tiap bulan.',
    hint: "Contoh: Anggaran makan Rp 1.500.000/bulan.",
  },
  {
    icon: "📊",
    title: "Lihat Analitik",
    desc: 'Menu "Analitik" menampilkan grafik tren keuangan dan breakdown pengeluaran per kategori setiap bulan.',
  },
  {
    icon: "⚙️",
    title: "Siap dimulai!",
    desc: "Semua data contoh yang ada bisa kamu edit atau hapus sesuai kebutuhan. Mulai dengan tambah transaksi pertamamu!",
    hint: "Tips: Aktifkan fitur Recurring untuk transaksi rutin seperti gaji atau cicilan.",
  },
];

export default function OnboardingModal({ onClose }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-[#F2F4F7]">
          <div
            className="h-1 bg-[#FF6A00] transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-[#8FA4C8]">{step + 1} / {STEPS.length}</span>
            <button onClick={onClose} className="text-[#8FA4C8] hover:text-[#1A1A1A] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center mb-6">
            <div className="text-5xl mb-3">{current.icon}</div>
            <h2 className="text-lg font-bold text-[#1A1A1A] mb-2">{current.title}</h2>
            <p className="text-sm text-[#4A5568] leading-relaxed">{current.desc}</p>
            {current.hint && (
              <div className="mt-3 bg-[#FFF5EB] border border-[#FF6A00]/20 rounded-xl px-4 py-2.5">
                <p className="text-xs text-[#FF6A00] font-medium">{current.hint}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex-1 py-3 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#4A5568] hover:bg-[#F8FAFC] transition-colors"
              >
                Kembali
              </button>
            )}
            <button
              onClick={isLast ? onClose : () => setStep(s => s + 1)}
              className="flex-1 py-3 rounded-xl bg-[#FF6A00] text-white text-sm font-bold hover:bg-[#e05e00] transition-colors flex items-center justify-center gap-2"
            >
              {isLast ? "Mulai Sekarang 🚀" : (
                <>Selanjutnya <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}