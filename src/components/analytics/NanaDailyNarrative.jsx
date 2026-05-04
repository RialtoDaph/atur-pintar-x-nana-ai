import { useMemo, useState } from "react";
import { motion } from "framer-motion";

const NANA_AVATAR = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/7708b64f5_generated_image.png";

function generateNarrative({ firstName, savingRate, budgets, transactions, streak, netWorth, debts, allCategoriesConfig }) {
  const cacheKey = `nana_narrative_${new Date().toISOString().slice(0, 10)}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) return cached;

  let main = "";
  let tip = "";

  const now = new Date();
  const thisMonthExpenses = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.type === "expense";
  });
  const spentByCategory = {};
  thisMonthExpenses.forEach(t => {
    const cat = t.category || "other";
    spentByCategory[cat] = (spentByCategory[cat] || 0) + t.amount;
  });

  // Budget hampir habis?
  const nearLimitBudget = budgets.find(b => {
    const spent = spentByCategory[b.category] || 0;
    return b.amount > 0 && (spent / b.amount) >= 0.9;
  });

  if (savingRate !== null && savingRate >= 50) {
    main = `Wah ${firstName}, kamu lagi on fire! Saving rate kamu ${savingRate.toFixed(1)}% bulan ini — itu angka yang luar biasa dan bikin Nana bangga banget.`;
    tip = "Pertahankan momentum ini, coba sisihkan sebagian ke investasi biar makin optimal ya!";
  } else if (nearLimitBudget) {
    const catConfig = allCategoriesConfig[nearLimitBudget.category];
    const catName = catConfig?.label || nearLimitBudget.category;
    const spent = spentByCategory[nearLimitBudget.category] || 0;
    const pct = ((spent / nearLimitBudget.amount) * 100).toFixed(0);
    main = `Hati-hati ${firstName}, budget ${catName} kamu udah terpakai ${pct}% nih — hampir habis lho!`;
    tip = "Coba tahan pengeluaran di kategori itu sampai akhir bulan, kamu pasti bisa!";
  } else if (streak > 0) {
    main = `Streak ${streak} hari kamu keren banget, ${firstName}! Konsistensi mencatat keuangan adalah kunci kebebasan finansial.`;
    tip = "Jangan sampai putus ya — buka app ini setiap hari biar streak terus naik!";
  } else if (netWorth < 0) {
    const biggestDebt = debts
      .filter(d => d.status === "active")
      .sort((a, b) => (b.remaining_amount || 0) - (a.remaining_amount || 0))[0];
    const debtName = biggestDebt?.name || "utang aktif";
    main = `Net worth kamu masih minus karena ${debtName}, tapi jangan khawatir ${firstName} — semua bisa diatasi selangkah demi selangkah.`;
    tip = "Fokus bayar utang berbunga tertinggi dulu, dan hindari utang baru untuk saat ini.";
  } else {
    main = `Hai ${firstName}! Yuk kita lihat kondisi keuanganmu periode ini dan pastikan semua berjalan sesuai rencana.`;
    tip = "Rutin mencatat setiap transaksi adalah kebiasaan kecil yang berdampak besar untuk masa depan finansialmu.";
  }

  const result = `${main} ${tip}`;
  localStorage.setItem(cacheKey, result);
  return result;
}

export default function NanaDailyNarrative({ user, savingRate, budgets, transactions, streak, netWorth, debts, allCategoriesConfig }) {
  const firstName = user?.full_name?.split(" ")[0] || "Kamu";
  const [expanded, setExpanded] = useState(false);

  const narrative = useMemo(() => {
    if (!user) return null;
    return generateNarrative({ firstName, savingRate, budgets, transactions, streak, netWorth, debts, allCategoriesConfig });
  }, [user?.email, firstName, savingRate, budgets, transactions, streak, netWorth, debts, allCategoriesConfig]);

  if (!narrative) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border-l-4 border-[#FF6A00] overflow-hidden">
      <div className="flex items-start gap-3 p-4">
        <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border-2 border-[#FF6A00]/30 mt-0.5">
          <img src={NANA_AVATAR} alt="Nana" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-[#FF6A00] uppercase tracking-widest mb-1">Nana bilang</p>
          <motion.div
            animate={{ height: expanded ? "auto" : "2.8em" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <p className="text-xs text-[#1A1A1A] leading-relaxed">{narrative}</p>
          </motion.div>
          <button
            onClick={() => setExpanded(e => !e)}
            className="mt-1.5 text-[10px] font-semibold text-[#FF6A00] hover:opacity-75 transition-opacity tap-highlight-fix"
          >
            {expanded ? "Tutup" : "Baca selengkapnya"}
          </button>
        </div>
      </div>
    </div>
  );
}