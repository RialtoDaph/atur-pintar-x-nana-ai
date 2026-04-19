import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Plus, Pencil, Trash2, Check, X, Eye, EyeOff, ChevronDown, ChevronRight, FolderOpen, Folder } from "lucide-react";
import { toast } from "sonner";

const COLORS = [
  "#FF6A00", "#F59E0B", "#EF4444", "#E91E63", "#EC4899",
  "#8B5CF6", "#3B82F6", "#06B6D4", "#10B981", "#27AE60",
  "#64748B", "#95A5A6"
];

const EMOJIS = [
  "🍔","🍚","🥗","☕","🍜","🛒","🏠","🚗","✈️","🚌",
  "💊","🏋️","🎮","🎵","📚","🎬","📱","💻","🛍️","👗",
  "💼","💰","🎁","🐷","🏦","💳","⚡","🌿","📦","🛡️",
  "💝","🎓","🏖️","🏡","💍","🔧","🎯","🌍","🤝","📊"
];

const EMPTY_FORM = { name: "", emoji: "📦", color: "#FF6A00", type: "expense", is_subcategory: false, parent_category: "" };

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [expandedParents, setExpandedParents] = useState({});
  const [filterType, setFilterType] = useState("all");

  useEffect(() => { loadCategories(); }, []);

  async function loadCategories() {
    setLoading(true);
    const res = await base44.entities.GlobalCategory.list("sort_order");
    setCategories(res || []);
    // Auto-expand all parents
    const exp = {};
    (res || []).filter(c => !c.is_subcategory).forEach(c => { exp[c.id] = true; });
    setExpandedParents(exp);
    setLoading(false);
  }

  const parentCategories = categories.filter(c => !c.is_subcategory);

  function openAddForm(parentName = "") {
    setEditId(null);
    setForm({ ...EMPTY_FORM, is_subcategory: !!parentName, parent_category: parentName });
    setShowForm(true);
  }

  function startEdit(cat) {
    setEditId(cat.id);
    setForm({
      name: cat.name,
      emoji: cat.emoji || "📦",
      color: cat.color || "#FF6A00",
      type: cat.type || "expense",
      is_subcategory: cat.is_subcategory || false,
      parent_category: cat.parent_category || "",
    });
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSave() {
    if (!form.name.trim()) return toast.error("Nama kategori wajib diisi");
    if (form.is_subcategory && !form.parent_category) return toast.error("Pilih kategori induk");
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      emoji: form.emoji,
      color: form.color,
      type: form.type,
      is_subcategory: form.is_subcategory,
      parent_category: form.is_subcategory ? form.parent_category : "",
      is_active: true,
      is_default: false,
    };
    if (editId) {
      await base44.entities.GlobalCategory.update(editId, payload);
      toast.success("Kategori diperbarui ✓");
    } else {
      const maxOrder = categories.reduce((m, c) => Math.max(m, c.sort_order || 0), 0);
      await base44.entities.GlobalCategory.create({ ...payload, sort_order: maxOrder + 1 });
      toast.success("Kategori ditambahkan ✓");
    }
    await loadCategories();
    cancelForm();
    setSaving(false);
  }

  async function handleDelete(id) {
    // Also delete children if deleting a parent
    const cat = categories.find(c => c.id === id);
    if (cat && !cat.is_subcategory) {
      const children = categories.filter(c => c.is_subcategory && c.parent_category === cat.name);
      for (const child of children) {
        await base44.entities.GlobalCategory.delete(child.id);
      }
    }
    await base44.entities.GlobalCategory.delete(id);
    setCategories(prev => {
      const toRemove = new Set([id]);
      if (cat && !cat.is_subcategory) {
        categories.filter(c => c.is_subcategory && c.parent_category === cat.name).forEach(c => toRemove.add(c.id));
      }
      return prev.filter(c => !toRemove.has(c.id));
    });
    setDeleteConfirm(null);
    toast.success("Dihapus ✓");
  }

  async function toggleActive(cat) {
    const newVal = !cat.is_active;
    await base44.entities.GlobalCategory.update(cat.id, { is_active: newVal });
    setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, is_active: newVal } : c));
    toast.success(newVal ? "Diaktifkan" : "Dinonaktifkan");
  }

  function toggleExpand(parentId) {
    setExpandedParents(prev => ({ ...prev, [parentId]: !prev[parentId] }));
  }

  // Build tree: parents with their children
  const filteredParents = parentCategories.filter(p =>
    filterType === "all" || p.type === filterType || p.type === "both"
  );

  const typeLabel = { expense: "Pengeluaran", income: "Pemasukan", both: "Keduanya" };
  const typeBadge = { 
    expense: "bg-red-50 text-red-500", 
    income: "bg-green-50 text-green-600", 
    both: "bg-blue-50 text-blue-600" 
  };

  if (loading) return (
    <AdminLayout currentPage="AdminCategories">
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#FF6A00] border-t-transparent rounded-full animate-spin" />
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout currentPage="AdminCategories">
      <div className="p-6 max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">Kelola Kategori</h1>
            <p className="text-sm text-[#8FA4C8] mt-1">
              {categories.filter(c => !c.is_subcategory).length} induk · {categories.filter(c => c.is_subcategory).length} subkategori · Berlaku untuk semua user
            </p>
          </div>
          <button
            onClick={() => openAddForm()}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#FF6A00] text-white rounded-xl text-sm font-semibold hover:bg-[#E55A00] shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Tambah Kategori
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-[#F2F4F7] p-1 rounded-xl mb-5 w-fit">
          {[["all","Semua"],["expense","Pengeluaran"],["income","Pemasukan"]].map(([val, label]) => (
            <button key={val} onClick={() => setFilterType(val)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterType === val ? "bg-white text-[#1A1A1A] shadow-sm" : "text-[#8FA4C8]"}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Inline Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#FF6A00]/30 p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#1A1A1A]">
                {editId ? "Edit Kategori" : "Tambah Kategori Baru"}
              </h3>
              <button onClick={cancelForm} className="p-1.5 rounded-lg hover:bg-[#F2F4F7] text-[#8FA4C8]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Preview */}
            <div className="flex items-center gap-3 bg-[#F8FAFC] rounded-xl px-4 py-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ backgroundColor: form.color + "25" }}>
                {form.emoji}
              </div>
              <div>
                <p className="text-sm font-bold text-[#1A1A1A]">{form.name || <span className="text-[#CBD5E0]">Nama kategori...</span>}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {form.is_subcategory && form.parent_category && (
                    <span className="text-[10px] text-[#8FA4C8]">↳ {form.parent_category}</span>
                  )}
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${typeBadge[form.type] || typeBadge.expense}`}>
                    {typeLabel[form.type]}
                  </span>
                </div>
              </div>
              <div className="ml-auto w-3 h-3 rounded-full" style={{ backgroundColor: form.color }} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-[#8FA4C8] mb-1.5 block">Nama Kategori *</label>
                <input type="text" value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="contoh: Makanan & Minuman"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]" />
              </div>

              {/* Tipe & Jenis */}
              <div>
                <label className="text-xs font-medium text-[#8FA4C8] mb-1.5 block">Tipe Transaksi</label>
                <div className="flex gap-2">
                  {[["expense","💸 Keluar"],["income","💰 Masuk"],["both","↔️ Dua"]].map(([val, lbl]) => (
                    <button key={val} type="button"
                      onClick={() => setForm(p => ({ ...p, type: val }))}
                      className={`flex-1 py-2 rounded-xl text-[11px] font-semibold border transition-all ${form.type === val ? "bg-[#FF6A00]/10 border-[#FF6A00] text-[#FF6A00]" : "bg-[#F2F4F7] border-transparent text-[#8FA4C8]"}`}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#8FA4C8] mb-1.5 block">Jenis</label>
                <div className="flex gap-2">
                  <button type="button"
                    onClick={() => setForm(p => ({ ...p, is_subcategory: false, parent_category: "" }))}
                    className={`flex-1 py-2 rounded-xl text-[11px] font-semibold border transition-all ${!form.is_subcategory ? "bg-[#FF6A00]/10 border-[#FF6A00] text-[#FF6A00]" : "bg-[#F2F4F7] border-transparent text-[#8FA4C8]"}`}>
                    📁 Induk
                  </button>
                  <button type="button"
                    onClick={() => setForm(p => ({ ...p, is_subcategory: true }))}
                    className={`flex-1 py-2 rounded-xl text-[11px] font-semibold border transition-all ${form.is_subcategory ? "bg-[#FF6A00]/10 border-[#FF6A00] text-[#FF6A00]" : "bg-[#F2F4F7] border-transparent text-[#8FA4C8]"}`}>
                    📂 Sub
                  </button>
                </div>
              </div>

              {/* Parent selector */}
              {form.is_subcategory && (
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-[#8FA4C8] mb-1.5 block">Kategori Induk *</label>
                  <div className="flex flex-wrap gap-2">
                    {parentCategories.filter(p => !editId || p.id !== editId).map(p => (
                      <button key={p.id} type="button"
                        onClick={() => setForm(prev => ({ ...prev, parent_category: p.name }))}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${form.parent_category === p.name ? "border-[#FF6A00] bg-[#FF6A00]/10 text-[#FF6A00]" : "border-[#E2E8F0] bg-[#F8FAFC] text-[#4A5568] hover:border-[#CBD5E0]"}`}>
                        <span>{p.emoji}</span> {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Emoji */}
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-[#8FA4C8] mb-1.5 block">Emoji Icon</label>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                  {EMOJIS.map(e => (
                    <button key={e} type="button" onClick={() => setForm(p => ({ ...p, emoji: e }))}
                      className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${form.emoji === e ? "ring-2 ring-[#FF6A00] bg-[#FF6A00]/10" : "bg-[#F2F4F7] hover:bg-[#E2E8F0]"}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-[#8FA4C8] mb-1.5 block">Warna</label>
                <div className="flex flex-wrap gap-2 items-center">
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setForm(p => ({ ...p, color: c }))}
                      className={`w-8 h-8 rounded-full transition-all flex-shrink-0 ${form.color === c ? "ring-2 ring-offset-2 ring-[#1A1A1A] scale-110" : "hover:scale-105"}`}
                      style={{ backgroundColor: c }} />
                  ))}
                  <div className="flex items-center gap-2 ml-1">
                    <div className="w-7 h-7 rounded-lg border border-[#E2E8F0]" style={{ backgroundColor: form.color }} />
                    <input type="text" value={form.color}
                      onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                      placeholder="#FF6A00"
                      className="w-24 px-2 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#FF6A00]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-5">
              <button onClick={cancelForm}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-medium hover:bg-[#F8FAFC] transition-colors">
                <X className="w-4 h-4" /> Batal
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#FF6A00] text-white text-sm font-semibold hover:bg-[#E55A00] disabled:opacity-60 transition-colors">
                <Check className="w-4 h-4" />
                {saving ? "Menyimpan..." : editId ? "Simpan Perubahan" : "Tambah Kategori"}
              </button>
            </div>
          </div>
        )}

        {/* Category Tree */}
        <div className="space-y-2">
          {filteredParents.length === 0 && (
            <div className="text-center py-12 text-[#8FA4C8] text-sm">
              Belum ada kategori. Klik "Tambah Kategori" untuk mulai.
            </div>
          )}
          {filteredParents.map(parent => {
            const children = categories.filter(c => c.is_subcategory && c.parent_category === parent.name);
            const isExpanded = expandedParents[parent.id];
            return (
              <div key={parent.id} className={`bg-white rounded-2xl shadow-sm overflow-hidden border transition-all ${!parent.is_active ? "opacity-50" : "border-[#F2F4F7]"}`}>
                {/* Parent row */}
                <div className="flex items-center gap-3 px-4 py-3.5">
                  {/* Expand toggle */}
                  <button onClick={() => toggleExpand(parent.id)}
                    className="p-1 rounded-lg hover:bg-[#F2F4F7] transition-colors flex-shrink-0">
                    {isExpanded
                      ? <ChevronDown className="w-4 h-4 text-[#8FA4C8]" />
                      : <ChevronRight className="w-4 h-4 text-[#8FA4C8]" />
                    }
                  </button>

                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ backgroundColor: (parent.color || "#FF6A00") + "20" }}>
                    {parent.emoji}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-[#1A1A1A] truncate">{parent.name}</p>
                      {children.length > 0 && (
                        <span className="text-[10px] font-semibold text-[#8FA4C8] bg-[#F2F4F7] px-1.5 py-0.5 rounded-full flex-shrink-0">
                          {children.length} sub
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${typeBadge[parent.type] || typeBadge.expense}`}>
                        {typeLabel[parent.type]}
                      </span>
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: parent.color || "#95A5A6" }} />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => openAddForm(parent.name)}
                      className="p-1.5 rounded-lg bg-[#F2F4F7] text-[#8FA4C8] hover:bg-[#E2E8F0] hover:text-[#1A1A1A] transition-colors"
                      title="Tambah subkategori">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => toggleActive(parent)}
                      className={`p-1.5 rounded-lg transition-colors ${parent.is_active ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-gray-100 text-gray-400 hover:bg-gray-200"}`}
                      title={parent.is_active ? "Nonaktifkan" : "Aktifkan"}>
                      {parent.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => startEdit(parent)}
                      className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteConfirm(parent)}
                      className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Children */}
                {isExpanded && children.length > 0 && (
                  <div className="border-t border-[#F2F4F7] bg-[#FAFBFC]">
                    {children.map((child, idx) => (
                      <div key={child.id}
                        className={`flex items-center gap-3 px-4 py-2.5 ${idx < children.length - 1 ? "border-b border-[#F2F4F7]" : ""} ${!child.is_active ? "opacity-50" : ""}`}>
                        <div className="w-5 flex-shrink-0" /> {/* indent */}
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                          style={{ backgroundColor: (child.color || "#FF6A00") + "20" }}>
                          {child.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#1A1A1A] truncate">{child.name}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${typeBadge[child.type] || typeBadge.expense}`}>
                              {typeLabel[child.type]}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => toggleActive(child)}
                            className={`p-1 rounded-lg transition-colors ${child.is_active ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-gray-100 text-gray-400 hover:bg-gray-200"}`}>
                            {child.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          </button>
                          <button onClick={() => startEdit(child)}
                            className="p-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button onClick={() => setDeleteConfirm(child)}
                            className="p-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add sub button when expanded */}
                {isExpanded && (
                  <button onClick={() => openAddForm(parent.name)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#8FA4C8] hover:text-[#FF6A00] hover:bg-[#FFF7ED] border-t border-[#F2F4F7] transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                    Tambah subkategori "{parent.name}"
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Orphan subcategories (parent deleted) */}
        {categories.filter(c => c.is_subcategory && !parentCategories.find(p => p.name === c.parent_category)).length > 0 && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
            <p className="text-xs font-bold text-yellow-700 mb-2">⚠️ Subkategori tanpa induk</p>
            {categories.filter(c => c.is_subcategory && !parentCategories.find(p => p.name === c.parent_category)).map(cat => (
              <div key={cat.id} className="flex items-center gap-2 py-1.5">
                <span>{cat.emoji}</span>
                <span className="text-xs text-yellow-800 flex-1">{cat.name} <span className="text-yellow-500">(induk: {cat.parent_category || "—"})</span></span>
                <button onClick={() => startEdit(cat)} className="p-1 rounded-lg bg-blue-50 text-blue-600"><Pencil className="w-3 h-3" /></button>
                <button onClick={() => setDeleteConfirm(cat)} className="p-1 rounded-lg bg-red-50 text-red-500"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        )}

        {/* Delete confirm modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <h3 className="text-base font-bold text-[#1A1A1A] mb-1">Hapus Kategori?</h3>
              {!deleteConfirm.is_subcategory && categories.filter(c => c.is_subcategory && c.parent_category === deleteConfirm.name).length > 0 && (
                <p className="text-xs font-semibold text-red-500 mb-2">
                  ⚠️ {categories.filter(c => c.is_subcategory && c.parent_category === deleteConfirm.name).length} subkategori juga akan ikut terhapus!
                </p>
              )}
              <p className="text-sm text-[#8FA4C8] mb-5">
                Kategori <strong className="text-[#1A1A1A]">{deleteConfirm.emoji} {deleteConfirm.name}</strong> akan dihapus permanen.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-medium hover:bg-[#F8FAFC] transition-colors">
                  Batal
                </button>
                <button onClick={() => handleDelete(deleteConfirm.id)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors">
                  Hapus
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}