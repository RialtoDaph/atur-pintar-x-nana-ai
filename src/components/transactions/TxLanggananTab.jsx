import { useMemo } from "react";
import { motion } from "framer-motion";

function daysLeft(dateStr) {
  if (!dateStr) return 999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
}

export default function TxLanggananTab({ subscriptions, formatCurrency }) {
  const stats = useMemo(() => {
    const active = subscriptions.filter(s => s.status === "active");
    const totalMonthly = active.reduce((sum, s) => {
      if (s.billing_cycle === "yearly") return sum + (s.amount || 0) / 12;
      if (s.billing_cycle === "quarterly") return sum + (s.amount || 0) / 3;
      return sum + (s.amount || 0);
    }, 0);
    const dueSoon = subscriptions.filter(s => daysLeft(s.next_due_date) <= 7).length;
    return { activeCount: active.length, totalMonthly, dueSoon };
  }, [subscriptions]);

  return (
    <div className="pb-28 pt-3">
      {/* Summary banner */}
      <div className="mx-3 bg-[#1A1E25] rounded-2xl p-4 mb-4 shadow-sm">
        <p className="text-[11px] text-[#8FA4C8] mb-1">Total per bulan</p>
        <p className="text-xl font-bold text-white">{formatCurrency(stats.totalMonthly)}</p>
        <div className="flex gap-2 mt-2">
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#4ADE80]/20 text-[#4ADE80]">
            ✓ {stats.activeCount} aktif
          </span>
          {stats.dueSoon > 0 && (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#F87171]/20 text-[#F87171]">
              ⚠️ {stats.dueSoon} segera
            </span>
          )}
        </div>
      </div>

      {/* List */}
      {subscriptions.length === 0 ? (
        <div className="text-center py-12 px-6">
          <p className="text-4xl mb-3">💳</p>
          <p className="text-sm font-semibold text-[#4A5568]">Belum ada langganan</p>
        </div>
      ) : (
        <div className="mx-3 space-y-2">
          {subscriptions.map((sub, idx) => {
            const days = daysLeft(sub.next_due_date);
            const isUrgent = days <= 7;
            const dueDateLabel = sub.next_due_date
              ? new Date(sub.next_due_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
              : "-";

            return (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`rounded-2xl p-4 shadow-sm border ${
                  isUrgent
                    ? "bg-[#FFF5F5] border-[#FECACA]"
                    : "bg-white border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0 ${
                    isUrgent ? "bg-[#FEE2E2]" : "bg-[#F2F4F7]"
                  }`}>
                    {sub.icon || "💳"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-[#1A1A1A]">{sub.name}</p>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                        sub.status === "active"
                          ? "bg-[#4ADE80]/20 text-[#16A34A]"
                          : "bg-[#9CA3AF]/20 text-[#6B7280]"
                      }`}>
                        {sub.status === "active" ? "Aktif" : "Dijeda"}
                      </span>
                    </div>
                    <p className={`text-[11px] mt-0.5 ${isUrgent ? "text-[#EF4444] font-semibold" : "text-[#8FA4C8]"}`}>
                      {isUrgent ? "⚠️ Segera perpanjang!" : `✓ Aktif · ${days} hari lagi`}
                    </p>
                    <p className="text-[10px] text-[#B0BEC5] mt-0.5">Jatuh tempo: {dueDateLabel}</p>
                  </div>
                  <p className="text-sm font-bold text-[#1A1A1A] flex-shrink-0">
                    {formatCurrency(sub.amount)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}