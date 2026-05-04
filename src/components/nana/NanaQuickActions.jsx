import { useState } from "react";
import { Lightbulb, ChevronUp, ChevronDown } from "lucide-react";

const QUICK_ACTIONS = [
  { label: "Boleh jajan berapa hari ini?", message: "Hari ini aku boleh jajan berapa biar tetap aman?" },
  { label: "Progress tabungan aku", message: "Tunjukin progress semua goal tabungan aku" },
  { label: "Analisa bulan ini", message: "Analisa pengeluaran dan pemasukan aku bulan ini" },
  { label: "Tagihan minggu ini", message: "Ada tagihan atau cicilan apa aja yang jatuh tempo minggu ini?" },
  { label: "Kategori paling boros", message: "Kategori apa yang paling boros bulan ini?" },
  { label: "Saran nabung", message: "Kasih saran nabung yang realistis buat kondisi keuangan aku sekarang" },
  { label: "Roast pengeluaran aku", message: "Roast pengeluaran aku bulan ini" },
];

export default function NanaQuickActions({ onSelect, disabled }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[#8FA4C8] hover:text-[#1A1A1A] dark:hover:text-white transition-colors mb-1.5 tap-highlight-fix"
      >
        <Lightbulb className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">Suggestions</span>
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {open && (
        <div className="flex flex-wrap gap-1.5">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.label}
              onClick={() => !disabled && onSelect(a.message)}
              disabled={disabled}
              className="text-[12px] text-[#1A1A1A] dark:text-white bg-white dark:bg-[#1A1E25] border border-[#E2E8F0] dark:border-[#2D2D2D] rounded-full px-3 py-1.5 hover:border-[#FF6A00] hover:bg-[#FF6A00]/5 dark:hover:bg-[#FF6A00]/10 transition-all disabled:opacity-40 tap-highlight-fix"
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}