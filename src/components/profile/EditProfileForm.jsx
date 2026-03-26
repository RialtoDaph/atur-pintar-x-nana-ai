import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Camera, Save, X } from "lucide-react";
import { useAppSettings } from "@/components/utils/useAppSettings";

export default function EditProfileForm({ user, onSaved, onCancel }) {
  const { formatCurrency } = useAppSettings();
  const [form, setForm] = useState({
    full_name: user?.full_name || "",
    date_of_birth: user?.date_of_birth || "",
    city: user?.city || "",
    motivation: user?.motivation || "",
    job: user?.job || "",
    monthly_salary: user?.monthly_salary || "",
    photo_url: user?.photo_url || "",
  });
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm((f) => ({ ...f, photo_url: file_url }));
    setUploadingPhoto(false);
  }

  async function handleSave() {
    setSaving(true);
    await base44.auth.updateMe({
      full_name: form.full_name,
      date_of_birth: form.date_of_birth,
      city: form.city,
      motivation: form.motivation,
      job: form.job,
      monthly_salary: form.monthly_salary ? Number(form.monthly_salary) : undefined,
      photo_url: form.photo_url,
    });
    setSaving(false);
    onSaved({ ...user, ...form });
  }

  const initials = form.full_name?.[0]?.toUpperCase() || "U";

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <p className="font-bold text-[#1A1A1A] text-base">Edit Profil</p>
        <button onClick={onCancel} className="text-[#8FA4C8] hover:text-[#1A1A1A]">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Photo */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          {form.photo_url ? (
            <img
              src={form.photo_url}
              alt="Foto Profil"
              className="w-20 h-20 rounded-full object-cover border-2 border-[#FF6A00]"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#FF6A00] flex items-center justify-center text-white font-bold text-3xl">
              {initials}
            </div>
          )}
          <label className="absolute bottom-0 right-0 bg-[#FF6A00] rounded-full p-1.5 cursor-pointer hover:bg-[#e55d00] transition-colors">
            <Camera className="w-3.5 h-3.5 text-white" />
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </label>
        </div>
        {uploadingPhoto && <p className="text-xs text-[#8FA4C8]">Mengunggah foto...</p>}
      </div>

      {/* Fields */}
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-wide">Nama Lengkap</label>
          <input
            className="w-full mt-1 px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#FF6A00] bg-white"
            value={form.full_name}
            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            placeholder="Nama lengkap kamu"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-wide">Tanggal Lahir</label>
            <input
              type="date"
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#FF6A00] bg-white"
              value={form.date_of_birth}
              onChange={(e) => setForm((f) => ({ ...f, date_of_birth: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-wide">Kota</label>
            <input
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#FF6A00] bg-white"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              placeholder="Kota kamu"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-wide">Pekerjaan</label>
            <input
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#FF6A00] bg-white"
              value={form.job}
              onChange={(e) => setForm((f) => ({ ...f, job: e.target.value }))}
              placeholder="Pekerjaan kamu"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-wide">Gaji / Bln (Rp)</label>
            <input
              type="number"
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#FF6A00] bg-white"
              value={form.monthly_salary}
              onChange={(e) => setForm((f) => ({ ...f, monthly_salary: e.target.value }))}
              placeholder="5000000"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-wide">Motivasi Keuangan</label>
          <textarea
            className="w-full mt-1 px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#FF6A00] bg-white resize-none"
            rows={3}
            value={form.motivation}
            onChange={(e) => setForm((f) => ({ ...f, motivation: e.target.value }))}
            placeholder="Contoh: Ingin bebas finansial di usia 40 dan punya rumah impian 🏠"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-[#FF6A00] text-white font-semibold py-3 rounded-xl hover:bg-[#e55d00] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
      >
        <Save className="w-4 h-4" />
        {saving ? "Menyimpan..." : "Simpan Profil"}
      </button>
    </div>
  );
}