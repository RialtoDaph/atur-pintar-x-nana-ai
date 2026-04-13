import { useState, useEffect } from "react";
import { X, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

function formatIDR(n) {
  return "Rp" + Math.round(n || 0).toLocaleString("id-ID");
}

export default function AccountPickerModal({ isOpen, onClose, onConfirm, title, amount }) {
  const [accounts, setAccounts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    base44.auth.me().then(u => {
      base44.entities.Account.filter({ created_by: u.email }, "name").then(list => {
        setAccounts(list || []);
        const def = (list || []).find(a => a.is_default) || list?.[0];
        if (def) setSelected(def.id);
      });
    });
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedAcc = accounts.find(a => a.id === selected);
  const willBeNegative = selectedAcc && (selectedAcc.balance || 0) < (amount || 0);

  async function handleConfirm() {
    if (!selected) return;
    if (willBeNegative) {
      setConfirming(true);
      return;
    }
    onConfirm(accounts.find(a => a.id === selected));
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-sm shadow-2xl p-5">
        {confirming ? (
          <>
            <p className="text-sm font-bold text-[#1A1A1A] mb-2">⚠️ Saldo Tidak Cukup</p>
            <p className="text-xs text-[#8FA4C8] mb-5">
              Saldo {selectedAcc?.name} akan menjadi negatif ({formatIDR((selectedAcc?.balance || 0) - (amount || 0))}). Tetap lanjutkan?
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirming(false)} className="flex-1 py-3 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#8FA4C8]">Batal</button>
              <button onClick={() => { setConfirming(false); onConfirm(accounts.find(a => a.id === selected)); }}
                className="flex-1 py-3 rounded-xl bg-[#EF4444] text-white text-sm font-bold">Tetap Lanjutkan</button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-bold text-[#1A1A1A]">{title || "Pilih Rekening"}</p>
                {amount > 0 && <p className="text-xs text-[#8FA4C8]">{formatIDR(amount)}</p>}
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-[#F2F4F7] rounded-lg"><X className="w-4 h-4 text-[#8FA4C8]" /></button>
            </div>

            <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
              {accounts.map(acc => {
                const insufficient = (acc.balance || 0) < (amount || 0);
                const isSelected = selected === acc.id;
                return (
                  <button key={acc.id} onClick={() => setSelected(acc.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${isSelected ? "border-[#FF6A00] bg-[#FFF5EB]" : "border-[#E2E8F0] hover:border-[#CBD5E0]"}`}>
                    <span className="text-xl">{acc.icon || "💳"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1A1A1A]">{acc.name}</p>
                      <p className="text-xs text-[#8FA4C8]">{formatIDR(acc.balance || 0)}</p>
                    </div>
                    {insufficient && <span className="text-[10px] text-red-500 font-semibold flex-shrink-0">saldo kurang</span>}
                    {isSelected && <CheckCircle className="w-4 h-4 text-[#FF6A00] flex-shrink-0" />}
                  </button>
                );
              })}
              {accounts.length === 0 && <p className="text-xs text-[#8FA4C8] text-center py-4">Belum ada rekening. Tambah dulu di menu Rekening.</p>}
            </div>

            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#8FA4C8]">Batal</button>
              <button onClick={handleConfirm} disabled={!selected}
                className="flex-1 py-3 rounded-xl bg-[#FF6A00] text-white text-sm font-bold disabled:opacity-40">Konfirmasi</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}