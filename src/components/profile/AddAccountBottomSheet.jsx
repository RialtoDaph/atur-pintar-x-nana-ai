import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Check, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import AccountLogo from "@/components/ui/AccountLogo";
import useLockBodyScroll from "@/hooks/useLockBodyScroll";

function parseNum(str) {
  return parseInt(String(str).replace(/[^0-9]/g, ""), 10) || 0;
}

// ─── Form Bottom Sheet ───────────────────────────────────────────────────────
function FormBottomSheet({ preset, accountType, onBack, onClose, onSave }) {
  useLockBodyScroll();
  const [namaRekening, setNamaRekening] = useState(preset.name);
  const [saldoDisplay, setSaldoDisplay] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const created = await base44.entities.Account.create({
        name: namaRekening,
        type: preset.type,
        icon: preset.icon || "🏦",
        color: preset.color || "#F97316",
        institution: preset.institution || preset.name,
        logo_url: preset.logo_url || undefined,
        balance: parseNum(saldoDisplay),
        is_default: isDefault,
      });
      toast.success("Rekening berhasil ditambahkan");
      onSave(created);
      onClose();
    } catch {
      toast.error("Gagal menambah rekening");
    } finally {
      setSaving(false);
    }
  }

  const typeLabel = { bank: "Bank", ewallet: "E-Wallet", cash: "Cash", investment: "Investasi", investasi: "Investasi" };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[90]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="fixed bottom-0 left-0 right-0 z-[95] bg-white rounded-t-3xl shadow-2xl overscroll-contain animate-slide-up-sheet"
        style={{ maxHeight: "85dvh", display: "flex", flexDirection: "column" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-[#E2E8F0] rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-4 border-b border-[#F2F4F7] flex-shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-2 rounded-xl bg-[#F2F4F7]">
              <ChevronLeft className="w-5 h-5 text-[#8FA4C8]" />
            </button>
            <div>
              <p className="font-bold text-[#1A1A1A] text-base">Detail Rekening</p>
              <p className="text-xs text-[#8FA4C8] mt-0.5">Isi informasi rekening</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-[#F2F4F7]">
            <X className="w-5 h-5 text-[#8FA4C8]" />
          </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-5">
          {/* Preset preview */}
          <div className="flex items-center gap-3 p-4 bg-[#FFF7ED] rounded-2xl border border-[#FED7AA]">
            {preset.logo_url ? (
              <AccountLogo
                logoUrl={preset.logo_url}
                size="w-12 h-12"
                fallback={
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (preset.color || "#F97316") + "20" }}>
                    <span className="text-2xl">{preset.icon || "🏦"}</span>
                  </div>
                }
              />
            ) : (
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (preset.color || "#F97316") + "20" }}>
                <span className="text-2xl">{preset.icon || "🏦"}</span>
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-[#1A1A1A]">{preset.name}</p>
              <p className="text-xs text-[#F97316] font-medium">{typeLabel[preset.type] || preset.type}</p>
            </div>
          </div>

          {/* Nama rekening */}
          <div>
            <label className="block text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2">
              Nama Rekening
            </label>
            <input
              type="text"
              value={namaRekening}
              onChange={e => setNamaRekening(e.target.value)}
              className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm font-semibold text-[#1A1A1A] outline-none focus:ring-2 focus:ring-[#F97316]/30"
              placeholder="Nama rekening"
            />
          </div>

          {/* Saldo awal */}
          <div>
            <label className="block text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2">
              Saldo Awal
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#8FA4C8]">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={saldoDisplay}
                onChange={e => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  setSaldoDisplay(raw === "" ? "" : Number(raw).toLocaleString("id-ID"));
                }}
                placeholder="0"
                className="w-full pl-10 pr-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm font-semibold text-[#1A1A1A] outline-none focus:ring-2 focus:ring-[#F97316]/30"
              />
            </div>
          </div>

          {/* Toggle rekening utama */}
          <div className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">
            <div>
              <p className="text-sm font-semibold text-[#1A1A1A]">Rekening Utama</p>
              <p className="text-xs text-[#8FA4C8] mt-0.5">Default saat catat transaksi baru</p>
            </div>
            <button
              onClick={() => setIsDefault(v => !v)}
              style={{ width: 40, height: 22 }}
              className={`rounded-full transition-colors relative flex-shrink-0 ${isDefault ? "bg-[#F97316]" : "bg-[#E2E8F0]"}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${isDefault ? "left-5" : "left-1"}`} />
            </button>
          </div>
        </div>

        {/* CTA */}
        <div className="px-5 pt-3 pb-6 flex-shrink-0 border-t border-[#F2F4F7]">
          <button
            onClick={handleSave}
            disabled={saving || !namaRekening.trim()}
            className="w-full py-4 bg-[#F97316] text-white rounded-2xl font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {saving ? "Menyimpan..." : "Simpan Rekening"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Main: Preset List Bottom Sheet ──────────────────────────────────────────
export default function AddAccountBottomSheet({ accountType, onClose, onSave }) {
  useLockBodyScroll();
  const [defaultAccounts, setDefaultAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState(null);

  useEffect(() => {
    const queryType = (accountType === "investment" || accountType === "investasi") ? "investasi" : accountType;
    base44.entities.DefaultAccount.filter({ type: queryType, is_active: true }, "sort_order")
      .then(res => setDefaultAccounts(res || []))
      .finally(() => setLoading(false));
  }, [accountType]);

  const typeLabel = { bank: "Bank", ewallet: "E-Wallet", cash: "Cash", investment: "Investasi" };

  // If a preset is selected, show the form bottom sheet
  if (selectedPreset) {
    return (
      <FormBottomSheet
        preset={selectedPreset}
        accountType={accountType}
        onBack={() => setSelectedPreset(null)}
        onClose={onClose}
        onSave={onSave}
      />
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-[90]" onClick={onClose} />

      {/* Bottom Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        className="fixed bottom-0 left-0 right-0 z-[95] bg-white rounded-t-3xl shadow-2xl overscroll-contain animate-slide-up-sheet"
        style={{ maxHeight: "80dvh", display: "flex", flexDirection: "column" }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-[#E2E8F0] rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-4 border-b border-[#F2F4F7] flex-shrink-0">
          <div>
            <p className="font-bold text-[#1A1A1A] text-base">Pilih {typeLabel[accountType]}</p>
            <p className="text-xs text-[#8FA4C8] mt-0.5">Tap untuk memilih rekening</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-[#F2F4F7]">
            <X className="w-5 h-5 text-[#8FA4C8]" />
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 px-5 py-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-[#F2F4F7] border-t-[#F97316] rounded-full animate-spin" />
            </div>
          ) : defaultAccounts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-2xl mb-2">🏦</p>
              <p className="text-sm font-semibold text-[#1A1A1A]">Belum ada pilihan</p>
              <p className="text-xs text-[#8FA4C8] mt-1">Admin belum menambahkan pilihan untuk tipe ini</p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {defaultAccounts.map(acc => (
                <button
                  key={acc.id}
                  onClick={() => setSelectedPreset(acc)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 border-[#E2E8F0] bg-[#FAFAFA] hover:border-[#F97316] hover:bg-[#FFF7ED] transition-all text-left active:scale-95"
                >
                  {acc.logo_url ? (
                    <AccountLogo
                      logoUrl={acc.logo_url}
                      size="w-11 h-11"
                      fallback={
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (acc.color || "#F97316") + "20" }}>
                          <span className="text-xl">{acc.icon || "🏦"}</span>
                        </div>
                      }
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (acc.color || "#F97316") + "20" }}>
                      <span className="text-xl">{acc.icon || "🏦"}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1A1A1A]">{acc.name}</p>
                    {acc.institution && acc.institution !== acc.name && (
                      <p className="text-xs text-[#8FA4C8] mt-0.5">{acc.institution}</p>
                    )}
                  </div>
                  <ChevronLeft className="w-4 h-4 text-[#8FA4C8] rotate-180 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}