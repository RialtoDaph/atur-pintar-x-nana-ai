import { useState } from "react";
import { Trophy, Calendar, Coffee, Flame, Scale } from "lucide-react";
import BehaviorInsightsCard from "./BehaviorInsightsCard";
import SpendingPatternCard from "./SpendingPatternCard";
import SpendingHeatmapCard from "./SpendingHeatmapCard";

/**
 * BehaviorInsightsTabs — Gabungkan 5 behavior view jadi 1 card dengan tabs.
 * Tabs: Merchant, 50/30/20, No-Spend, Pola Hari/Jam, Heatmap
 */
export default function BehaviorInsightsTabs({ transactions, filterPeriod, customDateRange, allCategoriesConfig }) {
  const [tab, setTab] = useState("merchant");

  const tabs = [
    { id: "merchant", label: "Merchant", icon: Trophy },
    { id: "lifestyle", label: "50/30/20", icon: Scale },
    { id: "nospend", label: "No-Spend", icon: Coffee },
    { id: "pattern", label: "Pola", icon: Calendar },
    { id: "heatmap", label: "Heatmap", icon: Flame },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 p-5 sm:p-6 pb-3">
        <span className="text-xl">🧠</span>
        <div>
          <h3 className="text-[#1A1A1A] font-bold text-base sm:text-lg leading-tight">Kebiasaanmu</h3>
          <p className="text-[10px] sm:text-xs text-[#8FA4C8] mt-0.5">Pahami pola finansialmu</p>
        </div>
      </div>

      {/* Scrollable Tabs (mobile-first) */}
      <div className="px-5 sm:px-6 pb-3">
        <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
          {tabs.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 tap-highlight-fix ${
                  active ? "bg-[#FF6A00] text-white shadow-sm" : "bg-[#F2F4F7] text-[#8FA4C8]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content — render embedded versions (strip outer card via wrapper) */}
      <div className="px-5 sm:px-6 pb-5 sm:pb-6">
        {(tab === "merchant" || tab === "lifestyle" || tab === "nospend") && (
          <EmbedWrap>
            <BehaviorInsightsCard
              key={tab}
              transactions={transactions}
              filterPeriod={filterPeriod}
              customDateRange={customDateRange}
              allCategoriesConfig={allCategoriesConfig}
              initialTab={tab}
            />
          </EmbedWrap>
        )}
        {tab === "pattern" && (
          <EmbedWrap>
            <SpendingPatternCard
              transactions={transactions}
              filterPeriod={filterPeriod}
              customDateRange={customDateRange}
            />
          </EmbedWrap>
        )}
        {tab === "heatmap" && (
          <EmbedWrap>
            <SpendingHeatmapCard transactions={transactions} />
          </EmbedWrap>
        )}
      </div>
    </div>
  );
}

/**
 * EmbedWrap — strip outer card (bg-white shadow padding) + hide internal header & internal tabs
 * agar bisa dirender sebagai content tab di parent card tanpa double-wrap.
 */
function EmbedWrap({ children }) {
  return (
    <div className="[&>div]:!p-0 [&>div]:!shadow-none [&>div]:!bg-transparent [&>div>div:first-child]:hidden [&>div>.flex.bg-\\[\\#F2F4F7\\].rounded-xl]:hidden">
      {children}
    </div>
  );
}