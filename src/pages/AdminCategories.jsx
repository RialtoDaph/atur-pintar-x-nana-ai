import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Plus, Pencil, Trash2, Tag, Check, X } from "lucide-react";

const COLORS = ["#FF6A00", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#06B6D4", "#EC4899"];
const EMOJIS = ["🍔", "🚗", "🛒", "💊", "🎮", "📚", "⚡", "💰", "🏠", "✈️", "🎁", "💳", "🏋️", "🎵", "🌿", "📱"];

const DEFAULT_CATEGORIES = [
  { name: "Makanan & Minuman", emoji: "🍔", color: "#FF6A00", type: "expense", is_default: true },
  { name: "Transportasi", emoji: "🚗", color: "#3B82F6", type: "expense", is_default: true },
  { name: "Belanja", emoji: "🛒", color: "#8B5CF6", type: "expense", is_default: true },
  { name: "Kesehatan", emoji: "💊", color: "#10B981", type: "expense", is_default: true },
  { name: "Hiburan", emoji: "🎮", color: "#F59E0B", type: "expense", is_default: true },
  { name: "Pendidikan", emoji: "📚", color: "#06B6D4", type: "expense", is_default: true },
  { name: "Tagihan", emoji: "⚡", color: "#EF4444", type: "expense", is_default: true },
  { name: "Sewa/Kos", emoji: "🏠", color: "#8B5CF6", type: "expense", is_default: true },
  { name: "Investasi", emoji: "📈", color: "#10B981", type: "expense", is_default: true },
  { name: "Asuransi", emoji: "🛡️", color: "#EF4444", type: "expense", is_default: true },
  { name: "Donasi", emoji: "💝", color: "#EC4899", type: "expense", is_default: true },
  { name: "Tabungan", emoji: "🏦", color: "#10B981", type: "expense", is_default: true },
  { name: "Gaji", emoji: "💼", color: "#10B981", type: "income", is_default: true },
  { name: "Bonus", emoji: "🎁", color: "#F59E0B", type: "income", is_default: true },
  { name: "Freelance", emoji: "💻", color: "#3B82F6", type: "income", is_default: true },
];

export default function AdminCategories() {
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: "", emoji: "🍔", color: "#FF6A00", type: "expense" });
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
    const res = await base44.entities.GlobalCategory.list();
    if (res.length === 0) {
      // Seed defaults
      for (const cat of DEFAULT_CATEGORIES) {
        await base44.entities.GlobalCategory.create(cat);
      }
      const res2 = await base44.entities.GlobalCategory.list();
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
      setCategories(prev => prev.map(c => c.id === editId ? { ...c, ...updated } : c));
    } else {
      const created = await base44.entities.GlobalCategory.create({ ...form, is_default: false, is_active: true });
      setCategories(prev => [...prev, created]);
    }
    setSaving(false);
    setShowForm(false);
    setEditId(null);
    setForm({ name: "", emoji: "🍔", color: "#FF6A00", type: "expense" });
  }

  async function handleDelete(id) {
    await base44.entities.GlobalCategory.delete(id);
    setCategories(prev => prev.filter(c => c.id !== id));
    setDeleteConfirm(null);
  }

  function startEdit(cat) {
    setEditId(cat.id);
    setForm({ name: cat.name, emoji: cat.emoji, color: cat.color, type: cat.type });
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
            <h1 className="text-2xl font-bold text-[#1A1A1A]">Category Manager</h1>
            <p className="text-sm text-[#8FA4C8] mt-1">Kelola kategori default untuk semua user</p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ name: "", emoji: "🍔", color: "#FF6A00", type: "expense" }); }}
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
                  placeholder="contoh: Investasi Saham" className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#8FA4C8] mb-1.5 block">Tipe</label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6A00]">
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="both">Both</option>
                </select>
              </div>
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

        {/* Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => (
            <div key={cat.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: (cat.color || "#FF6A00") + "20" }}>
                {cat.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1A1A1A] truncate">{cat.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    cat.type === "income" ? "bg-green-50 text-green-600" :
                    cat.type === "expense" ? "bg-red-50 text-red-500" :
                    "bg-blue-50 text-blue-600"
                  }`}>
                    {cat.type}
                  </span>
                  {cat.is_default && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FF6A00]/10 text-[#FF6A00]">default</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <button onClick={() => startEdit(cat)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setDeleteConfirm(cat)} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
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