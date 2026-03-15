import { useState, useEffect } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAppSettings } from "@/components/utils/useAppSettings";
import AddTransactionModal from "@/components/transactions/AddTransactionModal";

const CATEGORY_EMOJI = { housing: "🏠", transport: "🚗", health: "❤️", food: "🍔", shopping: "🛍️", entertainment: "🎬", other: "📦" };

export default function ContractPaymentsCard({ user }) {
  const { formatCurrency } = useAppSettings();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    loadTemplates();
  }, [user?.email]);

  async function loadTemplates() {
    setLoading(true);
    const all = await base44.entities.Transaction.filter({ is_recurring: true, created_by: user.email });
    setTemplates(all.filter(t => !t.is_recurring_child && t.category !== "subscriptions"));
    setLoading(false);
  }

  const totalMonthly = templates.reduce((s, t) => {
    if (t.recurring_interval === "yearly") return s + t.amount / 12;
    if (t.recurring_interval === "weekly") return s + t.amount * 4.33;
    if (t.recurring_interval === "daily") return s + t.amount * 30;
    return s + t.amount;
  }, 0);

  if (loading) return <div className="bg-white rounded-2xl h-20 animate-pulse shadow-sm" />;

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-bold text-[#0A0A0A] text-sm">🏠 Kontrak & Tagihan</h2>
            {templates.length > 0 && (
              <p className="text-xs text-[#8FA4C8] mt-0.5">{formatCurrency(totalMonthly)}/bulan</p>
            )}
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 text-xs text-[#FF6A00] font-semibold bg-orange-50 px-2.5 py-1.5 rounded-lg hover:bg-orange-100 transition-colors tap-highlight-fix"
          >
            <Plus className="w-3 h-3" />
            Tambah
          </button>
        </div>
        {templates.length === 0 ? (
          <p className="text-xs text-[#9B9B9B] py-2">Belum ada kontrak. Tambahkan seperti sewa rumah, listrik, internet, dll.</p>
        ) : (
          <div className="space-y-0">
            {templates.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-[#F5F5F5] last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-sm">
                    {CATEGORY_EMOJI[tx.category] || "📄"}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#1A1A1A]">{tx.note || "Tagihan"}</p>
                    <p className="text-[10px] text-[#8FA4C8] capitalize flex items-center gap-1">
                      <RefreshCw className="w-2.5 h-2.5" />
                      {tx.recurring_interval}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#1A1A1A]">{formatCurrency(tx.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <AddTransactionModal
          goals={[]}
          initialValues={{ category: "housing", recurring: true, recurringInterval: "monthly" }}
          onClose={() => setShowAdd(false)}
          onSave={async (data) => {
            await base44.entities.Transaction.create(data);
            setShowAdd(false);
            loadTemplates();
          }}
        />
      )}
    </>
  );
}