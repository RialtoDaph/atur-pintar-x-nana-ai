import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Loader2, Eye, EyeOff } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORIES = [
  "food",
  "transport",
  "utilities",
  "shopping",
  "subscription",
  "salary",
  "other",
];

export default function TransactionReview({ transactions, onConfirm, onCancel, loading }) {
  const [selectedTx, setSelectedTx] = useState(transactions[0]?.id);
  const [editedTx, setEditedTx] = useState({});
  const [showDuplicates, setShowDuplicates] = useState(false);

  const newTransactions = transactions.filter((t) => t.status === "new");
  const duplicates = transactions.filter((t) => t.status === "duplicate");

  const currentTx = transactions.find((t) => t.id === selectedTx);
  const current = editedTx[selectedTx] || currentTx;

  function handleConfirmAll() {
    const toSave = transactions
      .filter((t) => t.status === "new")
      .map((t) => ({
        ...t,
        ...editedTx[t.id],
      }));

    onConfirm(toSave);
  }

  function updateTransaction(txId, field, value) {
    setEditedTx((prev) => ({
      ...prev,
      [txId]: {
        ...(prev[txId] || {}),
        [field]: value,
      },
    }));
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#F9FAFB] rounded-lg p-3 border border-[#E2E8F0]">
          <p className="text-xs text-[#8FA4C8] mb-1">New Transactions</p>
          <p className="text-2xl font-bold text-[#1A1A1A]">{newTransactions.length}</p>
        </div>
        <div className="bg-[#FFF5F0] rounded-lg p-3 border border-[#FFE0CC]">
          <p className="text-xs text-[#FF6A00] mb-1">Possible Duplicates</p>
          <p className="text-2xl font-bold text-[#FF6A00]">{duplicates.length}</p>
        </div>
      </div>

      {/* Duplicates Warning */}
      {duplicates.length > 0 && (
        <button
          onClick={() => setShowDuplicates(!showDuplicates)}
          className="w-full flex items-center gap-2 p-3 bg-[#FFF5F0] border border-[#FFE0CC] rounded-lg hover:bg-[#FFEDDB] transition-colors text-left"
        >
          <AlertCircle className="w-4 h-4 text-[#FF6A00] flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-[#1A1A1A]">{duplicates.length} similar transaction(s) detected</p>
            <p className="text-xs text-[#FF6A00]">Click to review and skip duplicates</p>
          </div>
          {showDuplicates ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      )}

      {/* Duplicates List */}
      {showDuplicates && duplicates.length > 0 && (
        <div className="space-y-2 p-3 bg-[#FFF5F0] rounded-lg border border-[#FFE0CC] max-h-40 overflow-y-auto">
          {duplicates.map((tx) => (
            <div key={tx.id} className="text-sm">
              <p className="font-medium text-[#FF6A00]">{tx.merchant}</p>
              <p className="text-xs text-[#8FA4C8]">
                {tx.date} • Rp {tx.amount.toLocaleString("id-ID")}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Transaction Editor */}
      {newTransactions.length > 0 && (
        <div className="border border-[#E2E8F0] rounded-lg p-4 space-y-4">
          {/* Transaction List */}
          <div className="max-h-48 overflow-y-auto space-y-2">
            {newTransactions.map((tx) => (
              <button
                key={tx.id}
                onClick={() => setSelectedTx(tx.id)}
                className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                  selectedTx === tx.id
                    ? "border-[#FF6A00] bg-[#FFF5F0]"
                    : "border-[#E2E8F0] hover:border-[#FFE0CC] bg-white"
                }`}
              >
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#1A1A1A] truncate">{tx.merchant}</p>
                    <p className="text-xs text-[#8FA4C8]">{tx.date}</p>
                  </div>
                  <p className="font-semibold text-[#1A1A1A]">Rp {tx.amount.toLocaleString("id-ID")}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Edit Form */}
          {current && (
            <div className="space-y-3 p-4 bg-[#F9FAFB] rounded-lg border border-[#E2E8F0]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#8FA4C8] block mb-1">Date</label>
                  <input
                    type="date"
                    value={current.date || ""}
                    onChange={(e) => updateTransaction(current.id, "date", e.target.value)}
                    className="w-full px-2 py-1.5 border border-[#E2E8F0] rounded text-xs focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#8FA4C8] block mb-1">Amount (Rp)</label>
                  <input
                    type="number"
                    value={current.amount || ""}
                    onChange={(e) => updateTransaction(current.id, "amount", Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-[#E2E8F0] rounded text-xs focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#8FA4C8] block mb-1">Merchant</label>
                <input
                  type="text"
                  value={current.merchant || ""}
                  onChange={(e) => updateTransaction(current.id, "merchant", e.target.value)}
                  className="w-full px-2 py-1.5 border border-[#E2E8F0] rounded text-xs focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#8FA4C8] block mb-1">Type</label>
                  <Select value={current.type || "expense"} onValueChange={(val) => updateTransaction(current.id, "type", val)}>
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#8FA4C8] block mb-1">Category</label>
                  <Select value={current.category || "other"} onValueChange={(val) => updateTransaction(current.id, "category", val)}>
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-[#E2E8F0]">
        <Button variant="outline" onClick={onCancel} disabled={loading} className="flex-1">
          Cancel
        </Button>
        <Button
          onClick={handleConfirmAll}
          disabled={loading || newTransactions.length === 0}
          className="flex-1 bg-[#FF6A00] hover:bg-[#e05e00] text-white"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            `Import ${newTransactions.length} Transaction${newTransactions.length !== 1 ? "s" : ""}`
          )}
        </Button>
      </div>
    </div>
  );
}