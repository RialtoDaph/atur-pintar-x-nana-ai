import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Plus, Pencil, Check, X, Eye, EyeOff, Trash2 } from "lucide-react";
import { toast } from "sonner";

const TYPES = [
  { key: "bank", label: "BANK", icon: "🏦" },
  { key: "ewallet", label: "E-WALLET", icon: "📱" },
  { key: "cash", label: "CASH", icon: "💵" },
  { key: "investasi", label: "INVESTASI", icon: "📈" },
];

const ICONS = ["🏦","💵","📱","💳","🏧","🐷","💰","🎯","📈","💹","🏛️","🌟","⚡","🎪","🛡️","💎"];
const COLORS = ["#1976D2","#7B1FA2","#388E3C","#F57C00","#E91E63","#00BCD4","#F97316","#EF4444","#8BC34A","#FF9800","#607D8B","#795548"];

const EMPTY = { name: "", institution: "", type: "bank", icon: "🏦", color: "#1976D2", logo_url: "", sort_order: 0, is_active: true };

export default function AdminDefaultAccounts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("bank");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const res = await base44.entities.DefaultAccount.list("sort_order");
    setItems(res || []);
    setLoading(false);
  }

  function openAdd() {
    setEditId(null);
    setForm({ ...EMPTY, type: activeTab });
    setShowForm(true);
  }

  function openEdit(item) {
    setEditId(item.id);
    setForm({
      name: item.name || "",
      institution: item.institution || "",
      type: item.type || "bank",
      icon: item.icon || "🏦",
      color: item.color || "#1976D2",
      logo_url: item.logo_url || "",
      sort_order: item.sort_order || 0,
      is_active: item.is_active !== false,
    });
    setShowForm(true);
    setActiveTab(item.type || "bank");
  }

  function cancel() {
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY);
  }

  async function save() {
    if (!form.name.trim()) return toast.error("Nama wajib diisi");
    setSaving(true);
    if (editId) {
      await base44.entities.DefaultAccount.update(editId, form);
      toast.success("Diperbarui ✓");
    } else {
      await base44.entities.DefaultAccount.create(form);
      toast.success("Ditambahkan ✓");
    }
    await load();
    cancel();
    setSaving(false);
  }

  async function toggleActive(item) {
    const newVal = !item.is_active;
    await base44.entities.DefaultAccount.update(item.id, { is_active: newVal });
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_active: newVal } : i));
    toast.success(newVal ? "Diaktifkan" : "Dinonaktifkan");
  }

  async function remove(item) {
    await base44.entities.DefaultAccount.delete(item.id);
    setItems(prev => prev.filter(i => i.id !== item.id));
    toast.success("Dihapus");
  }

  const filtered = items.filter(i => i.type === activeTab);

  if (loading) return (
    <AdminLayout currentPage="AdminDefaultAccounts">
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#FF6A00] border-t-transparent rounded-full animate-spin" />
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout currentPage="AdminDefaultAccounts">
      <div className="p-4 max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A]">Default Rekening</h1>
            <p className="text-xs text-[#8FA4C8] mt-0.5">Pilihan rekening yang muncul saat user tambah akun</p>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#FF6A00] text-white rounded-xl text-sm font-semibold hover:bg-[#E55A00] transition-colors">
            <Plus className="w-4 h-4" /> Tambah
          </button>
        </div>

        {/* Type tabs */}
        <div className="flex gap-1 bg-[#F2F4F7] p-1 rounded-xl mb-4">
          {TYPES.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === t.key ? "bg-white text-[#1A1A1A] shadow-sm" : "text-[#8FA4C8]"}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Inline form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#FF6A00]/30 p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-sm text-[#1A1A1A]">{editId ? "Edit" : "Tambah Baru"}</p>
              <button onClick={cancel} className="p-1.5 rounded-lg hover:bg-[#F2F4F7]">
                <X className="w-4 h-4 text-[#8FA4C8]" />
              </button>
            </div>

            {/* Preview */}
            <div className="flex items-center gap-3 bg-[#F8FAFC] rounded-xl px-3 py-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ backgroundColor: form.color + "25" }}>
                {form.icon}
              </div>
              <div>
                <p className="text-sm font-bold text-[#1A1A1A]">{form.name || <span className="text-[#CBD5E0]">nama rekening</span>}</p>
                {form.institution && <p className="text-xs text-[#8FA4C8]">{form.institution}</p>}
              </div>
              <div className="ml-auto w-3 h-3 rounded-full" style={{ backgroundColor: form.color }} />
            </div>

            <div className="space-y-3">
              {/* Tipe */}
              <div>
                <p className="text-xs font-semibold text-[#8FA4C8] mb-1.5">Tipe</p>
                <div className="flex gap-2">
                  {TYPES.map(t => (
                    <button key={t.key} type="button" onClick={() => setForm(f => ({ ...f, type: t.key }))}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${form.type === t.key ? "bg-[#FF6A00]/10 border-[#FF6A00] text-[#FF6A00]" : "bg-[#F2F4F7] border-transparent text-[#8FA4C8]"}`}>
                      {t.icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nama & Institusi */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs font-semibold text-[#8FA4C8] mb-1">Nama *</p>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="BCA, GoPay..."
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-[#F8FAFC] outline-none focus:ring-2 focus:ring-[#FF6A00]" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#8FA4C8] mb-1">Institusi</p>
                  <input value={form.institution} onChange={e => setForm(f => ({ ...f, institution: e.target.value }))}
                    placeholder="PT Bank BCA..."
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-[#F8FAFC] outline-none focus:ring-2 focus:ring-[#FF6A00]" />
                </div>
              </div>

              {/* Logo URL */}
              <div>
                <p className="text-xs font-semibold text-[#8FA4C8] mb-1">Logo URL (opsional)</p>
                <input value={form.logo_url} onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-[#F8FAFC] outline-none focus:ring-2 focus:ring-[#FF6A00]" />
                {form.logo_url && (
                  <div className="mt-2 flex items-center gap-2">
                    <p className="text-xs text-[#8FA4C8]">Preview:</p>
                    <img src={form.logo_url} alt="logo" className="h-6 max-w-24 object-contain" onError={(e) => e.target.style.display = 'none'} />
                  </div>
                )}
              </div>

              {/* Sort order */}
              <div>
                <p className="text-xs font-semibold text-[#8FA4C8] mb-1">Urutan (sort_order)</p>
                <input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                  className="w-24 px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-[#F8FAFC] outline-none focus:ring-2 focus:ring-[#FF6A00]" />
              </div>

              {/* Icons */}
              <div>
                <p className="text-xs font-semibold text-[#8FA4C8] mb-1.5">Icon</p>
                <div className="flex flex-wrap gap-1.5">
                  {ICONS.map(ic => (
                    <button key={ic} type="button" onClick={() => setForm(f => ({ ...f, icon: ic }))}
                      className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${form.icon === ic ? "ring-2 ring-[#FF6A00] bg-[#FF6A00]/10" : "bg-[#F2F4F7]"}`}>
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div>
                <p className="text-xs font-semibold text-[#8FA4C8] mb-1.5">Warna</p>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                      className={`w-8 h-8 rounded-full transition-all ${form.color === c ? "ring-2 ring-offset-2 ring-[#1A1A1A] scale-110" : "hover:scale-105"}`}
                      style={{ backgroundColor: c }} />
                  ))}
                  <div className="flex items-center gap-1 ml-1">
                    <div className="w-7 h-7 rounded-lg border border-[#E2E8F0]" style={{ backgroundColor: form.color }} />
                    <input type="text" value={form.color}
                      onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                      className="w-22 px-2 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-mono outline-none focus:ring-2 focus:ring-[#FF6A00]" />
                  </div>
                </div>
              </div>

              {/* is_active toggle */}
              <div className="flex items-center justify-between py-1">
                <p className="text-sm font-semibold text-[#1A1A1A]">Aktif (tampil ke user)</p>
                <button type="button" onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                  className="w-11 h-6 rounded-full transition-colors relative flex-shrink-0"
                  style={{ backgroundColor: form.is_active ? "#F97316" : "#E2E8F0" }}>
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.is_active ? "left-6" : "left-1"}`} />
                </button>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={cancel} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-medium hover:bg-[#F8FAFC] transition-colors">
                <X className="w-4 h-4" /> Batal
              </button>
              <button onClick={save} disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#FF6A00] text-white text-sm font-semibold hover:bg-[#E55A00] disabled:opacity-60 transition-colors">
                <Check className="w-4 h-4" />
                {saving ? "Menyimpan..." : editId ? "Simpan" : "Tambah"}
              </button>
            </div>
          </div>
        )}

        {/* List */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-[#8FA4C8] text-sm bg-white rounded-2xl">
            Belum ada data untuk tipe ini. Klik "Tambah" untuk mulai.
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(item => (
              <div key={item.id}
                className={`bg-white rounded-2xl border transition-all shadow-sm ${!item.is_active ? "opacity-50 border-[#F2F4F7]" : "border-[#F2F4F7]"}`}>
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ backgroundColor: (item.color || "#F97316") + "20" }}>
                    {item.icon || "🏦"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-[#1A1A1A]">{item.name}</p>
                      <span className="text-[10px] bg-[#F2F4F7] text-[#8FA4C8] px-1.5 py-0.5 rounded-full font-medium">#{item.sort_order}</span>
                    </div>
                    {item.institution && <p className="text-xs text-[#8FA4C8] mt-0.5">{item.institution}</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => toggleActive(item)}
                      className={`p-1.5 rounded-lg transition-colors ${item.is_active ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-gray-100 text-gray-400 hover:bg-gray-200"}`}
                      title={item.is_active ? "Nonaktifkan" : "Aktifkan"}>
                      {item.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => openEdit(item)}
                      className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => remove(item)}
                      className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}