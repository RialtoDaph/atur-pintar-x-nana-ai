import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { TrendingUp, Check, X } from "lucide-react";
import { useAppSettings } from "@/components/utils/useAppSettings";

const CATEGORY_CONFIG = {
  housing: { label: "Housing", emoji: "🏠", color: "#4F7CFF" },
  food: { label: "Food", emoji: "🍔", color: "#00C9A7" },
  transport: { label: "Transport", emoji: "🚗", color: "#F5A623" },
  health: { label: "Health", emoji: "❤️", color: "#FF6B6B" },
  entertainment: { label: "Entertainment", emoji: "🎬", color: "#9B59B6" },
  shopping: { label: "Shopping", emoji: "🛍️", color: "#E91E8C" },
  subscriptions: { label: "Subscriptions", emoji: "📱", color: "#1ABC9C" },
  other: { label: "Other", emoji: "📦", color: "#95A5A6" },
};

export default function BudgetRecommendation({ transactions, currentMonth, user, onApply }) {
  const { t, formatCurrency } = useAppSettings();
  const [applying, setApplying] = useState(false);
  const [appliedCategories, setAppliedCategories] = useState(new Set());

  // Calculate average spending per category from last 3 months
  const recommendations = useMemo(() => {
    if (!transactions.length) return [];

    const now = new Date();
    const categorySpending = {};

    // Get last 3 months of expense data
    for (let i = 0; i < 3; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;

      transactions
        .filter(tx => {
          const txDate = new Date(tx.date);
          const txMonth = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, "0")}`;
          return txMonth === monthStr && tx.type === "expense";
        })
        .forEach(tx => {
          const cat = tx.category || "other";
          categorySpending[cat] = categorySpending[cat] || [];
          categorySpending[cat].push(tx.amount);
        });
    }

    // Calculate averages with 20% buffer for safety
    return Object.entries(categorySpending)
      .map(([category, amounts]) => ({
        category,
        avgSpending: amounts.reduce((a, b) => a + b, 0) / 3,
        recommendedBudget: Math.ceil((amounts.reduce((a, b) => a + b, 0) / 3) * 1.2),
        monthCount: amounts.length,
      }))
      .filter(r => r.monthCount >= 2) // Only show categories with 2+ months of data
      .sort((a, b) => b.recommendedBudget - a.recommendedBudget);
  }, [transactions]);

  async function applyRecommendation(cat) {
    if (!user) return;
    
    const rec = recommendations.find(r => r.category === cat);
    if (!rec) return;

    setApplying(true);
    try {
      await base44.entities.Budget.create({
        category: cat,
        amount: rec.recommendedBudget,
        month: currentMonth,
        color: CATEGORY_CONFIG[cat]?.color || "#95A5A6",
        created_by: user.email,
      });
      setAppliedCategories(prev => new Set(prev).add(cat));
      if (onApply) onApply(cat);
    } catch (error) {
      console.error("Failed to apply budget:", error);
    } finally {
      setApplying(false);
    }
  }

  if (!recommendations.length) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4 text-[#FF6A00]" />
          <p className="text-xs font-bold text-[#8FA4C8] uppercase tracking-widest">{t('budget_smart_rec') || 'Smart Recommendations'}</p>
        </div>
        <p className="text-xs text-[#8FA4C8]">{t('budget_rec_desc') || 'Based on last 3 months of spending'}</p>
      </div>

      <div className="space-y-2 px-5 pb-4">
        {recommendations.map((rec) => {
          const cat = CATEGORY_CONFIG[rec.category] || CATEGORY_CONFIG.other;
          const isApplied = appliedCategories.has(rec.category);

          return (
            <div key={rec.category} className="flex items-center justify-between p-3 bg-[#F2F4F7] rounded-xl">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-base" style={{ backgroundColor: cat.color + "20" }}>
                  {cat.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#1A1A1A]">{cat.label}</p>
                  <p className="text-xs text-[#8FA4C8]">
                    {t('budget_avg') || 'Avg'}: {formatCurrency(rec.avgSpending)} → {formatCurrency(rec.recommendedBudget)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => applyRecommendation(rec.category)}
                disabled={isApplied || applying}
                className={`flex-shrink-0 ml-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  isApplied
                    ? "bg-[#00C9A7]/10 text-[#00C9A7] cursor-default"
                    : "bg-[#FF6A00]/10 text-[#FF6A00] hover:bg-[#FF6A00]/20"
                }`}
              >
                {isApplied ? <Check className="w-3.5 h-3.5" /> : '+'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}