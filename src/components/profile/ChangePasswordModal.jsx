import { useState } from "react";
import { X, Eye, EyeOff, Lock, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function ChangePasswordModal({ onClose }) {
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (form.newPassword.length < 8) {
      toast.error("Password minimal 8 karakter");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error("Password dan konfirmasi tidak cocok");
      return;
    }
    setSaving(true);
    try {
      await base44.functions.invoke("changePassword", { newPassword: form.newPassword });
      toast.success("Password berhasil diubah");
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.error || "Gagal mengganti password");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#FF6A00]" />
            <h2 className="text-base font-bold text-[#1A1A1A]">Ganti Password</h2>
          </div>
          <button onClick={onClose} className="text-[#9B9B9B] hover:text-[#1A1A1A] tap-highlight-fix">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-wide mb-1.5 block">Password Baru</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                className="w-full px-4 py-3 pr-10 rounded-xl border border-[#E2E8F0] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#FF6A00] bg-[#F8FAFC]"
                placeholder="Minimal 8 karakter"
                value={form.newPassword}
                onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
              />
              <button
                type="button"
                onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8FA4C8] tap-highlight-fix">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-wide mb-1.5 block">Konfirmasi Password Baru</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                className="w-full px-4 py-3 pr-10 rounded-xl border border-[#E2E8F0] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#FF6A00] bg-[#F8FAFC]"
                placeholder="Ulangi password baru"
                value={form.confirmPassword}
                onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8FA4C8] tap-highlight-fix">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {form.confirmPassword && form.newPassword !== form.confirmPassword && (
              <p className="text-xs text-[#FF6B6B] mt-1">Password tidak cocok</p>
            )}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !form.newPassword || !form.confirmPassword}
          className="w-full mt-5 py-3 rounded-xl font-bold text-sm text-white bg-[#FF6A00] hover:bg-[#e05e00] disabled:opacity-40 transition-colors flex items-center justify-center gap-2 tap-highlight-fix">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : "Simpan Password"}
        </button>
      </div>
    </div>
  );
}