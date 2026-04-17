const QUICK_ACTIONS = [
  { label: "📊 Analisa bulan ini", message: "Analisa pengeluaran dan pemasukan gue bulan ini" },
  { label: "💡 Saran nabung", message: "Kasih saran nabung yang realistis buat kondisi keuangan gue sekarang" },
  { label: "🎯 Review goal gue", message: "Review target tabungan dan goal finansial gue, udah on track belum?" },
  { label: "😤 Lagi stress duit", message: "Gue lagi stress soal keuangan, butuh bantuan" },
  { label: "🔥 Roast pengeluaran gue", message: "Roast pengeluaran gue bulan ini" },
];

export default function NanaQuickActions({ onSelect, disabled }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none px-1">
      {QUICK_ACTIONS.map(a => (
        <button
          key={a.label}
          onClick={() => !disabled && onSelect(a.message)}
          disabled={disabled}
          className="flex-shrink-0 text-xs font-semibold bg-white dark:bg-[#1A1E25] border border-[#E2E8F0] dark:border-[#2D2D2D] text-[#1A1A1A] dark:text-white rounded-full px-3 py-1.5 hover:border-[#FF6A00] hover:bg-[#FF6A00]/5 dark:hover:bg-[#FF6A00]/10 transition-all disabled:opacity-40 tap-highlight-fix whitespace-nowrap"
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}