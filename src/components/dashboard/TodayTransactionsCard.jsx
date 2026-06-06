import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { resolveTransactionCategory } from "@/components/utils/resolveTransactionCategory";

function compactRupiah(value) {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}Rp ${(abs / 1_000_000_000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} M`;
  if (abs >= 1_000_000) return `${sign}Rp ${(abs / 1_000_000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Jt`;
  if (abs >= 1_000) return `${sign}Rp ${(abs / 1_000).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 1 })} rb`;
  return `${sign}Rp ${abs.toLocaleString('id-ID')}`;
}

function formatTime(dateStr, createdDate) {
  if (!createdDate) return "";
  const date = new Date(createdDate);
  return date.toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function TodayTransactionsCard({ transactions, allCategories, goals = [] }) {
  const navigate = useNavigate();
  const todayStr = new Date().toISOString().split("T")[0];
  
  // Filter transactions for today, not deleted, sorted by created_date descending
  const todayTx = transactions
    .filter(t => t.date === todayStr && !t.is_deleted)
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 5);

  if (todayTx.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-[#1A1A1A] mb-2">Transaksi Hari Ini</h3>
        <EmptyState
          emoji="✨"
          title="Belum ada transaksi hari ini"
          subtitle="Yuk catat pemasukan atau pengeluaran pertamamu hari ini"
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h3 className="text-sm font-bold text-[#1A1A1A] mb-4">Transaksi Hari Ini</h3>
      
      <div className="space-y-3">
        {todayTx.map((tx) => {
          const catInfo = resolveTransactionCategory(tx, { categories: allCategories || [], goals });
          const isExpense = tx.type === "expense";
          const goal = tx.type === "savings" && tx.goal_id ? goals.find(g => g.id === tx.goal_id) : null;
          
          return (
            <div key={tx.id} className="flex items-center justify-between p-3 bg-[#F2F4F7] rounded-xl hover:bg-[#E8EBEF] transition-colors">
              <div className="flex items-center gap-3 flex-1">
                <span className="text-xl">{catInfo.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#1A1A1A] truncate">{tx.note || goal?.name || catInfo.label}</p>
                  <p className="text-[10px] text-[#8FA4C8]">{formatTime(tx.date, tx.created_date)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-xs font-bold ${isExpense ? "text-red-600" : "text-green-600"}`}>
                  {isExpense ? "-" : "+"}{compactRupiah(tx.amount)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => navigate("/Transactions")}
        className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-[#F97316] hover:bg-[#F2F4F7] rounded-lg transition-colors"
      >
        Lihat Semua <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}