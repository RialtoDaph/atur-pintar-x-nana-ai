import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useAppSettings } from "@/components/utils/useAppSettings";

const COLORS = [
  { key: "blue", hex: "#4F7CFF" },
  { key: "green", hex: "#34C87A" },
  { key: "orange", hex: "#F5A623" },
  { key: "purple", hex: "#9B59B6" },
  { key: "pink", hex: "#E91E8C" },
  { key: "teal", hex: "#1ABC9C" },
];

const ICONS = ["💰", "🏠", "🚗", "✈️", "🎓", "💍", "🎮", "📱", "💻", "🏖️", "👶", "🎁"];

const formatNumber = (val) => {
  if (val === "" || val === null || val === undefined) return "";
  const num = String(val).replace(/[^\d]/g, "");
  if (!num) return "";
  return Number(num).toLocaleString("id-ID");
};

const parseNumber = (val) => {
  if (!val) return 0;
  return Number(String(val).replace(/[^\d]/g, "")) || 0;
};

export default function AddGoalModal({ goal, onClose, onSave }) {
  const { t } = useAppSettings();
  const isEdit = !!goal?.id;
  const isRaiseOnly = !!goal?._raiseOnly;

  const [name, setName] = useState(goal?.name || "");
  const [targetAmount, setTargetAmount] = useState(goal?.target_amount ? formatNumber(goal.target_amount) : "");
  const [deadline, setDeadline] = useState(goal?.deadline || "");
  const [icon, setIcon] = useState(goal?.icon || "💰");
  const [color, setColor] = useState(goal?.color || "blue");
  const [description, setDescription] = useState(goal?.description || "");
  const [saving, setSaving] = useState(false);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const canSave = name.trim() && parseNumber(targetAmount) > 0 && !saving;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!canSave) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        target_amount: parseNumber(targetAmount),
        deadline: deadline || null,
        icon,
        color,
        description: description.trim() || null,
        current_amount: goal?.current_amount || 0,
        status: goal?.status || "active",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50">
      <div className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl max-h-[92vh] flex flex-col animate-slide-up-sheet">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#F2F4F7]">
          <div>
            <h2 className="text-lg font-bold text-[#1A1A1A]">
              {isRaiseOnly ? "Naikkan Target" : isEdit ? "Edit Tujuan" : "Tujuan Baru"}
            </h2>
            <p className="text-xs text-[#8FA4C8] mt-0.5">
              {isRaiseOnly ? "Atur target baru" : "Atur tujuan tabunganmu"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F2F4F7] tap-highlight-fix"
            aria-label="Tutup"
          >
            <X className="w-5 h-5 text-[#8FA4C8]" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Name */}
          {!isRaiseOnly && (
            <div>
              <label className="block text-[11px] font-semibold text-[#8FA4C8] uppercase tracking-wider mb-2">
                Nama Tujuan
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Misal: Beli Motor"
                className="w-full px-4 py-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#1A1A1A] text-sm placeholder:text-[#8FA4C8] focus:outline-none focus:border-[#FF6A00] transition-colors"
                autoFocus
              />
            </div>
          )}

          {/* Target amount */}
          <div>
            <label className="block text-[11px] font-semibold text-[#8FA4C8] uppercase tracking-wider mb-2">
              Target Jumlah
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8FA4C8] text-sm font-medium">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={targetAmount}
                onChange={(e) => setTargetAmount(formatNumber(e.target.value))}
                placeholder="0"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#1A1A1A] text-sm placeholder:text-[#8FA4C8] focus:outline-none focus:border-[#FF6A00] transition-colors"
              />
            </div>
          </div>

          {!isRaiseOnly && (
            <>
              {/* Deadline */}
              <div>
                <label className="block text-[11px] font-semibold text-[#8FA4C8] uppercase tracking-wider mb-2">
                  Target Tanggal (opsional)
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#1A1A1A] text-sm focus:outline-none focus:border-[#FF6A00] transition-colors"
                />
              </div>

              {/* Icon */}
              <div>
                <label className="block text-[11px] font-semibold text-[#8FA4C8] uppercase tracking-wider mb-2">
                  Ikon
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {ICONS.map((ic) => (
                    <button
                      type="button"
                      key={ic}
                      onClick={() => setIcon(ic)}
                      className={`h-12 rounded-xl flex items-center justify-center text-xl transition-all tap-highlight-fix ${
                        icon === ic
                          ? "bg-[#FF6A00]/10 border-2 border-[#FF6A00]"
                          : "bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#F2F4F7]"
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-[11px] font-semibold text-[#8FA4C8] uppercase tracking-wider mb-2">
                  Warna
                </label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button
                      type="button"
                      key={c.key}
                      onClick={() => setColor(c.key)}
                      className={`w-10 h-10 rounded-full transition-all tap-highlight-fix ${
                        color === c.key ? "ring-2 ring-offset-2 ring-[#1A1A1A] scale-110" : ""
                      }`}
                      style={{ backgroundColor: c.hex }}
                      aria-label={c.key}
                    />
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-semibold text-[#8FA4C8] uppercase tracking-wider mb-2">
                  Catatan (opsional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tambah catatan..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#1A1A1A] text-sm placeholder:text-[#8FA4C8] focus:outline-none focus:border-[#FF6A00] transition-colors resize-none"
                />
              </div>
            </>
          )}
        </form>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#F2F4F7]" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}>
          <button
            onClick={handleSubmit}
            disabled={!canSave}
            className="w-full py-3.5 rounded-xl bg-[#FF6A00] text-white text-sm font-bold hover:bg-[#EA580C] disabled:bg-[#E2E8F0] disabled:text-[#8FA4C8] disabled:cursor-not-allowed transition-colors tap-highlight-fix"
          >
            {saving ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Buat Tujuan"}
          </button>
        </div>
      </div>
    </div>
  );
}