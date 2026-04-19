import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Plus, Pencil, Trash2, Check, X, ChevronUp, ChevronDown, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const COLORS = ["#FF6A00", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#06B6D4", "#EC4899", "#27AE60", "#E91E63"];
const EMOJIS = ["🍔", "🚗", "🛒", "💊", "🎮", "📚", "⚡", "💰", "🏠", "✈️", "🎁", "💳", "🏋️", "🎵", "🌿", "📱", "🍚", "💼", "🐷", "📦", "💻", "🏦", "🛡️", "💝"];

const DEFAULT_SEED = [
  { name: "Makanan & Minuman", emoji: "🍚", color: "#FF6A00", type: "expense", is_active: true, sort_order: 1 },
  { name: "Transportasi", emoji: "🚗", color: "#3B82F6", type: "expense", is_active: true, sort_order: 2 },
  { name: "Belanja", emoji: "🛒", color: "#EC4899", type: "expense", is_active: true, sort_order: 3 },
  { name: "Kesehatan", emoji: "💊", color: "#10B981", type: "expense", is_active: true, sort_order: 4 },
  { name: "Hiburan", emoji: "🎮", color: "#F59E0B", type: "expense", is_active: true, sort_order: 5 },
  { name: "Pendidikan", emoji: "📚", color: "#06B6D4", type: "expense", is_active: true, sort_order: 6 },
  { name: "Rumah & Utilitas", emoji: "🏠", color: "#8B5CF6", type: "expense", is_active: true, sort_order: 7 },
  { name: "Asuransi", emoji: "🛡️", color: "#EF4444", type: "expense", is_active: true, sort_order: 8 },
  { name: "Donasi", emoji: "💝", color: "#E91E63", type: "expense", is_active: true, sort_order: 9 },
  { name: "Gaji", emoji: "💼", color: "#27AE60", type: "income", is_active: true, sort_order: 10 },
  { name: "Bonus", emoji: "🎁", color: "#F59E0B", type: "income", is_active: true, sort_order: 11 },
  { name: "Freelance", emoji: "💻", color: "#3B82F6", type: "income", is_active: true, sort_order: 12 },
  { name: "Pendapatan Lain", emoji: "💰", color: "#2ECC71", type: "income", is_active: true, sort_order: 13 },
  { name: "Tabungan", emoji: "🐷", color: "#95A5A6", type: "both", is_active: true, sort_order: 14 },
  { name: "Lainnya", emoji: "📦", color: "#95A5A6", type: "both", is_active: true, sort_order: 15 },
];

export default function AdminCategories() {
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: "", emoji: "🍔", color: "#FF6A00", type: "expense", is_subcategory: false, parent_category: "" });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u?.role === "admin") loadCategories();
      else setLoading(false);
    });
  }, []);

  async function loadCategories() {
    setLoading(true);
    const res = await base44.entities.GlobalCategory.list("sort_order");
    if (res.length === 0) {
      for (const cat of DEFAULT_SEED) {
        await base44.entities.GlobalCategory.create({ ...cat, is_default: true });
      }
      const res2 = await base44.entities.GlobalCategory.list("sort_order");
      setCategories(res2);
    } else {
      setCategories(res);
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    if (editId) {
      const updated = await base44.entities.GlobalCategory.update(editId, form);
      setCategories(prev => prev.map(c => c.id === editId ? { ...c, ...form } : c));
      toast.success("Kategori diperbarui");
    } else {
      const maxOrder = categories.reduce((m, c) => Math.max(m, c.sort_order || 0), 0);
      const created = await base44.entities.GlobalCategory.create({ ...form, is_default: false, is_active: true, sort_order: maxOrder + 1 });
      setCategories(prev => [...prev, created]);
      toast.success("Kategori berhasil ditambahkan");
    }
    setSaving(false);
    setShowForm(false);
    setEditId(null);
    setForm({ name: "", emoji: "🍔", color: "#FF6A00", type: "expense", is_subcategory: false, parent_category: "" });
  }

  async function handleDelete(id) {
    await base44.entities.GlobalCategory.delete(id);
    setCategories(prev => prev.filter(c => c.id !== id));
    setDeleteConfirm(null);
    toast.success("Kategori dihapus");
  }

  async function toggleActive(cat) {
    const newVal = !cat.is_active;
    await base44.entities.GlobalCategory.update(cat.id, { is_active: newVal });
    setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, is_active: newVal } : c));
    toast.success(newVal ? "Kategori diaktifkan" : "Kategori dinonaktifkan");
  }

  async function moveOrder(cat, direction) {
    const idx = categories.findIndex(c => c.id === cat.id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= categories.length) return;

    const newCats = [...categories];
    const aOrder = newCats[idx].sort_order ?? idx;
    const bOrder = newCats[swapIdx].sort_order ?? swapIdx;

    await Promise.all([
      base44.entities.GlobalCategory.update(newCats[idx].id, { sort_order: bOrder }),
      base44.entities.GlobalCategory.update(newCats[swapIdx].id, { sort_order: aOrder }),
    ]);

    // Swap in local array
    [newCats[idx], newCats[swapIdx]] = [newCats[swapIdx], newCats[idx]];
    setCategories(newCats);
  }

  const parentCategories = categories.filter(c => !c.is_subcategory);

  function startEdit(cat) {
    setEditId(cat.id);
    setForm({ name: cat.name, emoji: cat.emoji, color: cat.color, type: cat.type, is_subcategory: cat.is_subcategory || false, parent_category: cat.parent_category || "" });
    setShowForm(true);
  }

  if (loading) return (
    <AdminLayout currentPage="AdminCategories">
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-[#FF6A00] border-t-transparent rounded-full animate-spin" />
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout currentPage="AdminCategories">
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">Kelola Kategori</h1>
            <p className="text-sm text-[#8FA4C8] mt-1">Perubahan langsung berlaku untuk semua user</p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ name: "", emoji: "🍔", color: "#FF6A00", type: "expense", is_subcategory: false, parent_category: "" }); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#FF6A00] text-white rounded-xl text-sm font-medium hover:bg-[#E55A00] shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Tambah Kategori
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 border border-[#FF6A00]/20">
            <h3 className="text-sm font-bold text-[#1A1A1A] mb-4">{editId ? "Edit Kategori" : "Tambah Kategori Baru"}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[#8FA4C8] mb-1.5 block">Nama Kategori</label>
                <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="contoh: Makanan & Minuman" className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#8FA4C8] mb-1.5 block">Tipe</label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6A00]">
                  <option value="expense">Pengeluaran</option>
                  <option value="income">Pemasukan</option>
                  <option value="both">Keduanya</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-[#8FA4C8] mb-1.5 block">Jenis Kategori</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setForm(p => ({ ...p, is_subcategory: false, parent_category: "" }))}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${!form.is_subcategory ? "bg-[#FF6A00]/10 border-[#FF6A00] text-[#FF6A00]" : "bg-[#F2F4F7] border-transparent text-[#8FA4C8]"}`}>
                    📁 Kategori Induk
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(p => ({ ...p, is_subcategory: true }))}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${form.is_subcategory ? "bg-[#FF6A00]/10 border-[#FF6A00] text-[#FF6A00]" : "bg-[#F2F4F7] border-transparent text-[#8FA4C8]"}`}>
                    📂 Subkategori
                  </button>
                </div>
              </div>
              {form.is_subcategory && (
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-[#8FA4C8] mb-1.5 block">Kategori Induk</label>
                  <select value={form.parent_category} onChange={e => setForm(p => ({ ...p, parent_category: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6A00]">
                    <option value="">-- Pilih Kategori Induk --</option>
                    {parentCategories.filter(p => !editId || p.id !== editId).map(p => (
                      <option key={p.id} value={p.name}>{p.emoji} {p.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-[#8FA4C8] mb-1.5 block">Emoji Icon</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map(e => (
                    <button key={e} onClick={() => setForm(p => ({ ...p, emoji: e }))}
                      className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${form.emoji === e ? "bg-[#FF6A00]/10 ring-2 ring-[#FF6A00]" : "bg-[#F2F4F7] hover:bg-[#E2E8F0]"}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[#8FA4C8] mb-1.5 block">Warna</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setForm(p => ({ ...p, color: c }))}
                      className={`w-9 h-9 rounded-xl transition-all ${form.color === c ? "ring-2 ring-offset-2 ring-[#1A1A1A]" : ""}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
                {/* Custom hex input */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-7 h-7 rounded-lg border border-[#E2E8F0]" style={{ backgroundColor: form.color }} />
                  <input type="text" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                    placeholder="#FF6A00" className="flex-1 px-2 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#FF6A00]" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowForm(false); setEditId(null); }} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-medium hover:bg-[#F8FAFC]">
                <X className="w-4 h-4" /> Batal
              </button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FF6A00] text-white text-sm font-medium hover:bg-[#E55A00] disabled:opacity-60">
                <Check className="w-4 h-4" />
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        )}

        {/* Category List */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {categories.map((cat, idx) => (
            <div key={cat.id} className={`flex items-center gap-4 px-5 py-3.5 border-b border-[#F2F4F7] last:border-0 ${!cat.is_active ? "opacity-50" : ""}`}>
              {/* Sort buttons */}
              <div className="flex flex-col gap-0.5">
                <button onClick={() => moveOrder(cat, -1)} disabled={idx === 0}
                  className="p-0.5 rounded hover:bg-[#F2F4F7] disabled:opacity-30 transition-colors">
                  <ChevronUp className="w-3.5 h-3.5 text-[#8FA4C8]" />
                </button>
                <button onClick={() => moveOrder(cat, 1)} disabled={idx === categories.length - 1}
                  className="p-0.5 rounded hover:bg-[#F2F4F7] disabled:opacity-30 transition-colors">
                  <ChevronDown className="w-3.5 h-3.5 text-[#8FA4C8]" />
                </button>
              </div>

              {/* Emoji */}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: (cat.color || "#FF6A00") + "20" }}>
                {cat.emoji}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1A1A1A] truncate">{cat.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    cat.type === "income" ? "bg-green-50 text-green-600" :
                    cat.type === "expense" ? "bg-red-50 text-red-500" :
                    "bg-blue-50 text-blue-600"
                  }`}>{cat.type === "expense" ? "Pengeluaran" : cat.type === "income" ? "Pemasukan" : "Keduanya"}</span>
                  {cat.is_subcategory && cat.parent_category && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-500">↳ {cat.parent_category}</span>
                  )}
                  {!cat.is_subcategory && categories.some(c => c.is_subcategory && c.parent_category === cat.name) && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-500">📁 Induk</span>
                  )}
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color || "#95A5A6" }} />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5">
                <button onClick={() => toggleActive(cat)}
                  className={`p-1.5 rounded-lg transition-colors ${cat.is_active ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-gray-100 text-gray-400 hover:bg-gray-200"}`}
                  title={cat.is_active ? "Nonaktifkan" : "Aktifkan"}>
                  {cat.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => startEdit(cat)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setDeleteConfirm(cat)} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {categories.length === 0 && (
            <div className="text-center py-12 text-[#8FA4C8] text-sm">Belum ada kategori. Klik "Tambah Kategori" untuk memulai.</div>
          )}
        </div>

        {/* Delete confirm */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">Hapus Kategori?</h3>
              <p className="text-sm text-[#8FA4C8] mb-4">Kategori <strong>{deleteConfirm.name}</strong> akan dihapus permanen.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-medium hover:bg-[#F8FAFC]">Batal</button>
                <button onClick={() => handleDelete(deleteConfirm.id)} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600">Hapus</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}