import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Check, ChevronRight } from "lucide-react";
import AccountLogo from "@/components/transactions/AccountLogo";

function formatRupiah(n) {
  if (!n) return "";
  return Number(n).toLocaleString("id-ID");
}

function parseNum(str) {
  return parseInt(String(str).replace(/[^0-9]/g, ""), 10) || 0;
}

export default function AddAccountBottomSheet({ accountType, onClose, onSave }) {
  const [defaultAccounts, setDefaultAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [balanceDisplay, setBalanceDisplay] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.DefaultAccount.filter({ type: accountType, is_active: true }, "sort_order")
      .then(res => setDefaultAccounts(res || []))
      .finally(() => setLoading(false));
  }, [accountType]);

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    try {
      const balance = parseNum(balanceDisplay);
      const created = await base44.entities.Account.create({
        name: selected.name,
        type: selected.type,
        icon: selected.icon || "🏦",
        color: selected.color || "#F97316",
        institution: selected.institution || selected.name,
        logo_url: selected.logo_url || undefined,
        balance,
        is_default: false,
      });
      onSave(created);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const typeLabel = { bank: "Bank", ewallet: "E-Wallet", cash: "Cash", investment: "Investasi" };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-50"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl"
        style={{ maxHeight: "85dvh", display: "flex", flexDirection: "column" }}>

        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-[#E2E8F0] rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-4 border-b border-[#F2F4F7] flex-shrink-0">
          <div>
            <p className="font-bold text-[#1A1A1A] text-base">
              Pilih {typeLabel[accountType]}
            </p>
            <p className="text-xs text-[#8FA4C8] mt-0.5">Tap untuk memilih rekening</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-[#F2F4F7]">
            <X className="w-5 h-5 text-[#8FA4C8]" />
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-[#F2F4F7] border-t-[#F97316] rounded-full animate-spin" />
            </div>
          ) : defaultAccounts.length === 0 ? (
            <div className="text-center py-12 px-5">
              <p className="text-2xl mb-2">🏦</p>
              <p className="text-sm font-semibold text-[#1A1A1A]">Belum ada pilihan</p>
              <p className="text-xs text-[#8FA4C8] mt-1">Admin belum menambahkan pilihan untuk tipe ini</p>
            </div>
          ) : (
            <div className="px-5 py-3 space-y-2">
              {defaultAccounts.map(acc => {
                const isSelected = selected?.id === acc.id;
                return (
                  <button
                    key={acc.id}
                    onClick={() => setSelected(acc)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-all text-left"
                    style={{
                      borderColor: isSelected ? "#F97316" : "#E2E8F0",
                      backgroundColor: isSelected ? "#FFF7ED" : "#FAFAFA",
                    }}
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: acc.logo_url ? "transparent" : (acc.color || "#F97316") + "20" }}
                    >
                      {acc.logo_url ? (
                        <img src={acc.logo_url} alt="Logo" className="w-8 h-8 object-contain" onError={(e) => e.target.style.display = 'none'} />
                      ) : (
                        <span className="text-xl">{acc.icon || "🏦"}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1A1A1A]">{acc.name}</p>
                      {acc.institution && acc.institution !== acc.name && (
                        <p className="text-xs text-[#8FA4C8] mt-0.5">{acc.institution}</p>
                      )}
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-[#F97316] flex items-center justify-center flex-shrink-0">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Balance input — shown after selection */}
          {selected && (
           <div className="px-5 pb-4 pt-2">
             <div className="bg-[#F8FAFC] rounded-2xl p-4 border border-[#E2E8F0]">
               <p className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-3">Saldo Awal (Opsional)</p>
               <div className="relative mb-2">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#8FA4C8]">Rp</span>
                 <input
                   type="text"
                   inputMode="numeric"
                   value={balanceDisplay}
                   onChange={e => {
                     const raw = e.target.value.replace(/[^0-9]/g, "");
                     setBalanceDisplay(raw === "" ? "" : Number(raw).toLocaleString("id-ID"));
                   }}
                   placeholder="0"
                   className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#1A1A1A] outline-none focus:ring-2 focus:ring-[#F97316]/30"
                 />
               </div>
               <p className="text-[10px] text-[#8FA4C8]">Tidak ada saldo awal berarti mulai dari Rp 0</p>
             </div>
           </div>
          )}
        </div>

        {/* CTA */}
        <div className="px-5 pt-3 pb-6 flex-shrink-0 border-t border-[#F2F4F7]">
          <button
            onClick={handleSave}
            disabled={!selected || saving}
            className="w-full py-4 bg-[#F97316] text-white rounded-2xl font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2 transition-all"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {saving ? "Menyimpan..." : selected ? `Tambah ${selected.name}` : "Pilih rekening dulu"}
          </button>
        </div>
      </div>
    </>
  );
}