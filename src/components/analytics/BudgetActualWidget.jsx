import { useAppSettings } from "@/components/utils/useAppSettings";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export default function BudgetActualWidget({ budgets, transactions, allCategoriesConfig, periodSubtitle }) {
  const { formatCurrency } = useAppSettings();
  const [globalCategories, setGlobalCategories] = useState([]);
  const now = new Date();

  useEffect(() => {
    base44.entities.GlobalCategory.list("sort_order").catch(() => []).then(data => {
      setGlobalCategories(data || []);
    });
  }, []);

  // Resolve category ID ke nama + emoji
  function resolveCat(categoryKey) {
    if (!categoryKey) return { emoji: "📦", label: "Kategori Lainnya" };
    // Sudah ada di allCategoriesConfig (default keys atau custom_<id>)
    if (allCategoriesConfig[categoryKey]) return allCategoriesConfig[categoryKey];
    // Coba cari di globalCategories by id (raw mongo id)
    const globalMatch = globalCategories.find(c => c.id === categoryKey);
    if (globalMatch) return { emoji: globalMatch.emoji || "📦", label: globalMatch.name };
    return { emoji: "📦", label: "Kategori Lainnya" };
  }

  // Hitung spending bulan ini per kategori
  const thisMonthExpenses = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.type === "expense";
  });

  const spentByCategory = {};
  thisMonthExpenses.forEach(t => {
    const cat = t.category || "other";
    spentByCategory[cat] = (spentByCategory[cat] || 0) + t.amount;
  });

  if (budgets.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-5 pr-14">
        <div className="mb-3">
          <h2 className="font-bold text-[#1A1A1A] text-base">Budget vs Aktual</h2>
          {periodSubtitle && <p className="text-xs text-[#8FA4C8] mt-0.5">{periodSubtitle}</p>}
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <span className="text-4xl mb-3">💸</span>
          <p className="font-semibold text-[#1A1A1A] text-sm mb-1">Kamu belum punya budget nih!</p>
          <p className="text-xs text-[#8FA4C8] mb-4">Set budget bulananmu sekarang biar pengeluaran lebih terkontrol</p>
          <Link
            to={createPageUrl("Budget")}
            className="px-4 py-2 bg-[#FF6A00] text-white text-xs font-semibold rounded-xl hover:bg-[#e55f00] transition-colors"
          >
            Buat Budget
          </Link>
        </div>
      </div>
    );
  }

  const budgetItems = budgets.map(b => {
    const catConfig = resolveCat(b.category);
    const spent = spentByCategory[b.category] || 0;
    const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0;
    const isOver = pct > 100;
    const isNear = pct >= 90 && pct <= 100;
    const isWarning = pct >= 70 && pct < 90;
    const barColor = pct > 90 ? "#FF6B6B" : pct > 70 ? "#F5A623" : "#00C9A7";

    return { ...b, catConfig, spent, pct, isOver, isNear, isWarning, barColor };
  });

  const overCount = budgetItems.filter(b => b.pct > 100).length;
  const nearCount = budgetItems.filter(b => b.pct >= 90 && b.pct <= 100).length;
  const warnCount = budgetItems.filter(b => b.pct >= 70 && b.pct < 90).length;

  let footerText, footerColor;
  if (overCount > 0) {
    footerText = `🚨 ${overCount} kategori sudah melebihi budget!`;
    footerColor = "text-[#FF6B6B]";
  } else if (nearCount > 0) {
    footerText = `⚠️ ${nearCount} kategori hampir melebihi budget bulan ini!`;
    footerColor = "text-[#FF6B6B]";
  } else if (warnCount > 0) {
    footerText = `🟡 Hati-hati, ${warnCount} kategori mendekati batas budget!`;
    footerColor = "text-[#F5A623]";
  } else {
    footerText = "✅ Semua budget masih aman!";
    footerColor = "text-[#00C9A7]";
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 pr-14">
      <div className="mb-4">
        <h2 className="font-bold text-[#1A1A1A] text-base">Budget vs Aktual</h2>
        {periodSubtitle && <p className="text-xs text-[#8FA4C8] mt-0.5">{periodSubtitle}</p>}
      </div>

      <div className="space-y-4">
        {budgetItems.map((item, i) => (
          <div key={item.id || i}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs text-[#4A5568] truncate">
                  {item.catConfig.emoji} {item.catConfig.label}
                </span>
                {item.isOver && (
                  <span className="px-1.5 py-0.5 bg-[#FF6B6B]/15 text-[#FF6B6B] text-[9px] font-bold rounded-full flex-shrink-0">
                    Melebihi!
                  </span>
                )}
                {item.isNear && !item.isOver && (
                  <span className="px-1.5 py-0.5 bg-[#FF6B6B]/10 text-[#FF6B6B] text-[9px] font-bold rounded-full flex-shrink-0">
                    Hampir!
                  </span>
                )}
                {item.isWarning && (
                  <span className="px-1.5 py-0.5 bg-[#F5A623]/15 text-[#F5A623] text-[9px] font-bold rounded-full flex-shrink-0">
                    Hati-hati
                  </span>
                )}
              </div>
              <span className={`text-xs font-bold flex-shrink-0 ml-2 ${item.isOver ? "text-[#FF6B6B]" : item.isNear ? "text-[#FF6B6B]" : item.isWarning ? "text-[#F5A623]" : "text-[#4A5568]"}`}>
                {item.pct.toFixed(0)}%
              </span>
            </div>

            <div className="h-2 bg-[#F2F4F7] rounded-full overflow-hidden mb-1">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(item.pct, 100)}%`,
                  backgroundColor: item.barColor,
                }}
              />
            </div>

            <p className="text-[10px] text-[#8FA4C8]">
              {formatCurrency(item.spent)} terpakai dari {formatCurrency(item.amount)}
            </p>
          </div>
        ))}
      </div>

      <div className={`mt-4 pt-3 border-t border-[#F2F4F7] text-xs font-medium ${footerColor}`}>
        {footerText}
      </div>
    </div>
  );
}