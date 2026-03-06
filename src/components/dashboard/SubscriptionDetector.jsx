import { RefreshCw } from "lucide-react";
import { useAppSettings } from "@/components/utils/useAppSettings";

export default function SubscriptionDetector({ transactions, loading }) {
  const { formatCurrency, t } = useAppSettings();
  if (loading) return null;

  const subs = transactions.filter(t => t.category === "subscriptions" && t.type === "expense");
  const totalSubs = subs.reduce((s, t) => s + t.amount, 0);

  // Group by note/name
  const grouped = {};
  subs.forEach(t => {
    const key = t.note || "Unknown";
    if (!grouped[key]) grouped[key] = { name: key, total: 0, count: 0 };
    grouped[key].total += t.amount;
    grouped[key].count += 1;
  });

  const list = Object.values(grouped).sort((a, b) => b.total - a.total);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-[#0A0A0A] text-sm">🔁 Langganan Terdeteksi</h2>
        <span className="text-xs font-semibold text-[#FF6A00] bg-orange-50 px-2 py-1 rounded-full">
          {formatCurrency(totalSubs)} / bulan
        </span>
      </div>
      {list.length === 0 ? (
        <p className="text-xs text-[#9B9B9B] py-1">Belum ada langganan terdeteksi.</p>
      ) : (
        <div className="space-y-1">
          {list.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#F5F5F5] last:border-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                  <RefreshCw className="w-3 h-3 text-purple-500" />
                </div>
                <p className="text-xs font-medium text-[#1A1A1A]">{s.name}</p>
              </div>
              <span className="text-xs font-semibold text-[#1A1A1A]">
                {formatCurrency(s.total)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}