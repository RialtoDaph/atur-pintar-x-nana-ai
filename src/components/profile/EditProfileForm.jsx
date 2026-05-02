import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Camera, Save, X } from "lucide-react";

// Strip leading/trailing commas, extra spaces, and normalize order if "word, word" pattern
function sanitizeName(name) {
  if (!name) return name;
  let n = name.trim();
  // Remove leading/trailing commas and spaces
  n = n.replace(/^[,\s]+|[,\s]+$/g, "");
  // If contains comma, swap order: "sakit, Amnahfy" → "Amnahfy"
  if (n.includes(",")) {
    const parts = n.split(",").map(p => p.trim()).filter(Boolean);
    // Take everything after the first comma as the real name
    n = parts.slice(1).join(" ").trim() || parts[0];
  }
  return n;
}

function formatIDR(val) {
  const num = String(val).replace(/\D/g, '');
  if (!num) return '';
  return Number(num).toLocaleString('id-ID');
}

export default function EditProfileForm({ user, onSaved, onCancel }) {
  const [form, setForm] = useState({
    full_name: user?.full_name || "",
    date_of_birth: user?.date_of_birth || "",
    city: user?.city || "",
    whatsapp: user?.whatsapp || "",
    job: user?.job || "",
    monthly_salary: user?.monthly_salary ? formatIDR(user.monthly_salary) : "",
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

  function handleSalaryChange(val) {
    const digits = val.replace(/\D/g, '');
    setForm(f => ({ ...f, monthly_salary: digits ? formatIDR(digits) : '' }));
  }

  async function handleSave() {
    setSaving(true);
    const salaryNum = form.monthly_salary ? Number(String(form.monthly_salary).replace(/\D/g, '')) : undefined;
    await base44.auth.updateMe({
      full_name: sanitizeName(form.full_name),
      date_of_birth: form.date_of_birth,
      city: form.city,
      whatsapp: form.whatsapp,
      job: form.job,
      monthly_salary: salaryNum,
      photo_url: form.photo_url,
    });
    setSaving(false);
    onSaved({ ...user, ...form, monthly_salary: salaryNum });
  }

  const initials = form.full_name?.[0]?.toUpperCase() || "U";

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-bold text-[#1A1A1A] text-base">Edit Profil</p>
        <button onClick={onCancel} className="text-[#8FA4C8] hover:text-[#1A1A1A] tap-highlight-fix">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Photo */}
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          {form.photo_url ? (
            <img src={form.photo_url} alt="Foto Profil" className="w-20 h-20 rounded-full object-cover border-2 border-[#FF6A00]" />
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
        <p className="text-xs text-[#8FA4C8]">Tap kamera untuk ganti foto</p>
      </div>

      {/* Fields */}
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-wide mb-1 block">Nama Lengkap</label>
          <input
            className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#FF6A00] bg-[#F8FAFC]"
            value={form.full_name}
            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            placeholder="Nama lengkap kamu"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-wide mb-1 block">Email</label>
          <input
            className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#8FA4C8] bg-[#F2F4F7] cursor-not-allowed"
            value={user?.email || ''}
            readOnly
            disabled
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-wide mb-1 block">WhatsApp</label>
            <input
              type="tel"
              className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#FF6A00] bg-[#F8FAFC]"
              value={form.whatsapp}
              onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
              placeholder="08xxxxxxxxxx"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-wide mb-1 block">Kota</label>
            <input
              className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#FF6A00] bg-[#F8FAFC]"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              placeholder="Kota kamu"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-wide mb-1 block">Pekerjaan</label>
            <input
              className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#FF6A00] bg-[#F8FAFC]"
              value={form.job}
              onChange={(e) => setForm((f) => ({ ...f, job: e.target.value }))}
              placeholder="Pekerjaan kamu"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-wide mb-1 block">Tanggal Lahir</label>
            <input
              type="date"
              className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#FF6A00] bg-[#F8FAFC]"
              value={form.date_of_birth}
              onChange={(e) => setForm((f) => ({ ...f, date_of_birth: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-wide mb-1 block">Pendapatan Bulanan</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#8FA4C8] font-medium pointer-events-none">Rp</span>
            <input
              type="text"
              inputMode="numeric"
              className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#FF6A00] bg-[#F8FAFC]"
              value={form.monthly_salary}
              onChange={(e) => handleSalaryChange(e.target.value)}
              placeholder="5.000.000"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-[#FF6A00] text-white font-semibold py-3 rounded-xl hover:bg-[#e55d00] transition-colors flex items-center justify-center gap-2 disabled:opacity-60 tap-highlight-fix"
      >
        <Save className="w-4 h-4" />
        {saving ? "Menyimpan..." : "Simpan Perubahan"}
      </button>
    </div>
  );
}