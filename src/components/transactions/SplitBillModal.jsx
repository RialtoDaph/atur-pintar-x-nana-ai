import { useState, useEffect } from "react";
import { X, Plus, Users, Equal, List, Mail } from "lucide-react";
import { formatRupiah } from "@/components/utils/formatRupiah";
import { base44 } from "@/api/base44Client";

export default function SplitBillModal({ receiptData, onClose, onConfirm }) {
  const [participants, setParticipants] = useState(["Saya"]);
  const [newName, setNewName] = useState("");
  const [splitMode, setSplitMode] = useState("equal"); // "equal" | "itemized"
  const [items, setItems] = useState(
    (receiptData.items || []).map(item => ({ ...item, allocated_to: [] }))
  );

  function addParticipant() {
    const name = newName.trim();
    if (!name || participants.includes(name)) return;
    setParticipants(p => [...p, name]);
    setNewName("");
  }

  function removeParticipant(name) {
    setParticipants(p => p.filter(n => n !== name));
    // Remove from allocations
    setItems(prev => prev.map(item => ({
      ...item,
      allocated_to: item.allocated_to.filter(n => n !== name)
    })));
  }

  function toggleItemAllocation(itemIdx, person) {
    setItems(prev => prev.map((item, i) => {
      if (i !== itemIdx) return item;
      const already = item.allocated_to.includes(person);
      return {
        ...item,
        allocated_to: already
          ? item.allocated_to.filter(n => n !== person)
          : [...item.allocated_to, person]
      };
    }));
  }

  // Calculate share per person
  function calcShares() {
    if (splitMode === "equal") {
      const perPerson = participants.length > 0
        ? receiptData.total_amount / participants.length
        : 0;
      return participants.map(name => ({ name, amount: perPerson }));
    } else {
      // itemized
      const shares = {};
      participants.forEach(n => shares[n] = 0);
      items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        const people = item.allocated_to.length > 0 ? item.allocated_to : participants;
        const perPerson = itemTotal / people.length;
        people.forEach(n => { if (shares[n] !== undefined) shares[n] += perPerson; });
      });
      // Add tax equally
      const taxPerPerson = (receiptData.tax_amount || 0) / Math.max(participants.length, 1);
      return participants.map(name => ({ name, amount: (shares[name] || 0) + taxPerPerson }));
    }
  }

  const shares = calcShares();

  function handleConfirm() {
    onConfirm({
      splitMode,
      participants,
      shares,
      items,
      receiptData
    });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-3xl px-6 pt-6 pb-4 border-b border-[#F2F4F7] z-10">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">🧾</span>
              <h2 className="text-lg font-bold text-[#1A1A1A]">Split Bill</h2>
            </div>
            <button onClick={onClose} className="text-[#9B9B9B] hover:text-[#1A1A1A] transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-[#8FA4C8] font-medium">
            {receiptData.store_name} · {formatRupiah(receiptData.total_amount)}
            {receiptData.tax_amount > 0 && ` (pajak: ${formatRupiah(receiptData.tax_amount)})`}
          </p>
        </div>

        <div className="px-6 py-4 space-y-5">
          {/* Split Mode */}
          <div>
            <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2 block">Mode Pembagian</label>
            <div className="flex gap-2">
              <button
                onClick={() => setSplitMode("equal")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                  splitMode === "equal" ? "border-[#FF6A00] bg-[#FF6A00]/10 text-[#FF6A00]" : "border-[#E2E8F0] text-[#4A5568] bg-[#F8FAFC]"
                }`}
              >
                <Equal className="w-4 h-4" /> Bagi Rata
              </button>
              <button
                onClick={() => setSplitMode("itemized")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                  splitMode === "itemized" ? "border-[#FF6A00] bg-[#FF6A00]/10 text-[#FF6A00]" : "border-[#E2E8F0] text-[#4A5568] bg-[#F8FAFC]"
                }`}
              >
                <List className="w-4 h-4" /> Per Item
              </button>
            </div>
          </div>

          {/* Participants */}
          <div>
            <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2 block flex items-center gap-1">
              <Users className="w-3 h-3" /> Peserta
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {participants.map(name => (
                <div key={name} className="flex items-center gap-1 bg-[#F2F4F7] rounded-full px-3 py-1">
                  <span className="text-xs font-medium text-[#1A1A1A]">{name}</span>
                  {name !== "Saya" && (
                    <button onClick={() => removeParticipant(name)} className="text-[#9B9B9B] hover:text-red-500 transition-colors ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
                placeholder="Nama teman..."
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addParticipant()}
              />
              <button
                onClick={addParticipant}
                disabled={!newName.trim()}
                className="px-3 py-2 rounded-xl bg-[#0A0A0A] text-white disabled:opacity-40 hover:bg-[#333] transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Items (for itemized mode) */}
          {splitMode === "itemized" && (
            <div>
              <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2 block">Alokasi Item</label>
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="border border-[#E2E8F0] rounded-xl p-3 bg-[#F8FAFC]">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-semibold text-[#1A1A1A]">{item.name}</p>
                        <p className="text-xs text-[#8FA4C8]">{item.quantity}x · {formatRupiah(item.price)}</p>
                      </div>
                      <p className="text-sm font-bold text-[#1A1A1A]">{formatRupiah(item.price * item.quantity)}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {participants.map(person => (
                        <button
                          key={person}
                          onClick={() => toggleItemAllocation(idx, person)}
                          className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                            item.allocated_to.includes(person)
                              ? "bg-[#FF6A00] border-[#FF6A00] text-white"
                              : "bg-white border-[#E2E8F0] text-[#4A5568] hover:border-[#FF6A00]"
                          }`}
                        >
                          {person}
                        </button>
                      ))}
                    </div>
                    {item.allocated_to.length === 0 && (
                      <p className="text-[10px] text-[#F5A623] mt-1">⚠ Belum dialokasikan (akan dibagi rata)</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          <div>
            <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2 block">Ringkasan</label>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl divide-y divide-[#F2F4F7]">
              {shares.map(s => (
                <div key={s.name} className="flex justify-between items-center px-4 py-3">
                  <span className="text-sm font-medium text-[#1A1A1A]">{s.name}</span>
                  <span className="text-sm font-bold text-[#FF6A00]">{formatRupiah(s.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white rounded-b-3xl px-6 pb-6 pt-3 border-t border-[#F2F4F7]">
          <button
            onClick={handleConfirm}
            disabled={participants.length === 0}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-[#FF6A00] hover:bg-[#e05e00] disabled:opacity-40 transition-colors"
          >
            Konfirmasi & Catat Transaksi
          </button>
        </div>
      </div>
    </div>
  );
}