import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { MessageSquare, Bug, Lightbulb, Heart, MessageCircle, Clock, Eye, CheckCircle2, XCircle, RefreshCw, X, Send, Trash2 } from "lucide-react";

const TYPE_META = {
  bug: { label: "Bug", icon: Bug, color: "text-red-500", bg: "bg-red-50" },
  suggestion: { label: "Saran", icon: Lightbulb, color: "text-amber-500", bg: "bg-amber-50" },
  praise: { label: "Pujian", icon: Heart, color: "text-pink-500", bg: "bg-pink-50" },
  other: { label: "Lain", icon: MessageCircle, color: "text-[#8FA4C8]", bg: "bg-[#F8FAFC]" },
};

const STATUS_META = {
  open: { label: "Menunggu", icon: Clock, color: "text-[#8FA4C8]", bg: "bg-[#F8FAFC]", dot: "bg-[#8FA4C8]" },
  in_review: { label: "Diproses", icon: Eye, color: "text-blue-500", bg: "bg-blue-50", dot: "bg-blue-500" },
  resolved: { label: "Selesai", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50", dot: "bg-green-500" },
  wont_fix: { label: "Ditolak", icon: XCircle, color: "text-red-500", bg: "bg-red-50", dot: "bg-red-500" },
};

const KANBAN_COLUMNS = [
  { key: "open", label: "Menunggu", statuses: ["open"] },
  { key: "in_review", label: "Diproses", statuses: ["in_review"] },
  { key: "done", label: "Selesai", statuses: ["resolved", "wont_fix"] },
];

export default function AdminFeedback() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await base44.entities.FeedbackReport.list("-created_date", 200);
      setItems(res || []);
    } catch {
      setItems([]);
    }
    setLoading(false);
  }

  const filtered = useMemo(() => {
    if (filterType === "all") return items;
    return items.filter((i) => i.type === filterType);
  }, [items, filterType]);

  const grouped = useMemo(() => KANBAN_COLUMNS.map((col) => ({
    ...col,
    items: filtered.filter((h) => col.statuses.includes(h.status || "open")),
  })), [filtered]);

  const counts = useMemo(() => ({
    total: items.length,
    open: items.filter((i) => (i.status || "open") === "open").length,
    in_review: items.filter((i) => i.status === "in_review").length,
    done: items.filter((i) => i.status === "resolved" || i.status === "wont_fix").length,
  }), [items]);

  async function handleUpdate(id, patch) {
    const updated = await base44.entities.FeedbackReport.update(id, patch);
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
    if (selected?.id === id) setSelected((s) => ({ ...s, ...patch }));
    return updated;
  }

  async function handleDelete(id) {
    await base44.entities.FeedbackReport.delete(id);
    setItems((prev) => prev.filter((it) => it.id !== id));
    setDeleteConfirm(null);
    if (selected?.id === id) setSelected(null);
  }

  return (
    <AdminLayout currentPage="AdminFeedback">
      <div className="p-4 sm:p-8">
        <AdminPageHeader
          title="Feedback Report"
          subtitle="Kelola laporan dari user"
          action={
            <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E2E8F0] rounded-xl text-sm font-medium hover:bg-[#F8FAFC] shadow-sm">
              <RefreshCw className="w-4 h-4" />
            </button>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total" value={counts.total} icon={MessageSquare} color="text-[#F97316]" />
          <StatCard label="Menunggu" value={counts.open} icon={Clock} color="text-[#8FA4C8]" />
          <StatCard label="Diproses" value={counts.in_review} icon={Eye} color="text-blue-500" />
          <StatCard label="Selesai" value={counts.done} icon={CheckCircle2} color="text-green-500" />
        </div>

        {/* Type filter */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          <FilterChip active={filterType === "all"} onClick={() => setFilterType("all")} label="Semua" />
          {Object.entries(TYPE_META).map(([key, meta]) => (
            <FilterChip key={key} active={filterType === key} onClick={() => setFilterType(key)} label={meta.label} icon={meta.icon} />
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-64 animate-pulse shadow-sm" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {grouped.map((col) => (
              <div key={col.key} className="bg-white rounded-2xl p-3 shadow-sm border border-[#E2E8F0] flex flex-col min-h-[400px]">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${STATUS_META[col.statuses[0]].dot}`} />
                    <h3 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">{col.label}</h3>
                  </div>
                  <span className="text-[10px] font-semibold text-[#8FA4C8] bg-[#F8FAFC] rounded-full px-2 py-0.5">{col.items.length}</span>
                </div>
                <div className="space-y-2 flex-1 overflow-y-auto">
                  {col.items.length === 0 ? (
                    <p className="text-xs text-[#CBD5E1] text-center py-6">Tidak ada</p>
                  ) : (
                    col.items.map((item) => (
                      <FeedbackCard key={item.id} item={item} onClick={() => setSelected(item)} />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {selected && (
          <RespondModal
            item={selected}
            onClose={() => setSelected(null)}
            onUpdate={handleUpdate}
            onDelete={() => setDeleteConfirm(selected)}
          />
        )}

        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">Hapus Report?</h3>
              <p className="text-sm text-[#8FA4C8] mb-4">Report dari <strong>{deleteConfirm.user_name || deleteConfirm.user_email || "user"}</strong> akan dihapus permanen.</p>
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

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${color}`} />
        <p className="text-xs text-[#8FA4C8]">{label}</p>
      </div>
      <p className="text-2xl font-bold text-[#1A1A1A]">{value}</p>
    </div>
  );
}

function FilterChip({ active, onClick, label, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
        active ? "bg-[#F97316] text-white border-[#F97316]" : "bg-white text-[#8FA4C8] border-[#E2E8F0] hover:bg-[#F8FAFC]"
      }`}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {label}
    </button>
  );
}

function FeedbackCard({ item, onClick }) {
  const typeMeta = TYPE_META[item.type] || TYPE_META.other;
  const TypeIcon = typeMeta.icon;
  const date = item.created_date ? new Date(item.created_date).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "";

  return (
    <button
      onClick={onClick}
      className="w-full text-left border border-[#E2E8F0] rounded-xl p-3 bg-white hover:bg-[#F8FAFC] transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className={`w-6 h-6 rounded-md ${typeMeta.bg} flex items-center justify-center flex-shrink-0`}>
            <TypeIcon className={`w-3 h-3 ${typeMeta.color}`} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#1A1A1A] truncate">{item.title || typeMeta.label}</p>
            <p className="text-[10px] text-[#8FA4C8] truncate">{item.user_name || item.user_email || "Anon"} • {date}</p>
          </div>
        </div>
        {item.admin_response && (
          <span className="text-[9px] font-semibold text-[#F97316] bg-[#F97316]/10 rounded px-1.5 py-0.5 leading-none flex-shrink-0">Replied</span>
        )}
      </div>
      <p className="text-xs text-[#5A6A7E] leading-relaxed line-clamp-2">{item.message}</p>
    </button>
  );
}

function RespondModal({ item, onClose, onUpdate, onDelete }) {
  const [status, setStatus] = useState(item.status || "open");
  const [response, setResponse] = useState(item.admin_response || "");
  const [saving, setSaving] = useState(false);

  const typeMeta = TYPE_META[item.type] || TYPE_META.other;
  const TypeIcon = typeMeta.icon;
  const date = item.created_date ? new Date(item.created_date).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";

  async function handleSave() {
    setSaving(true);
    try {
      await onUpdate(item.id, { status, admin_response: response.trim() });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-[#F2F4F7] sticky top-0 bg-white">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-8 h-8 rounded-lg ${typeMeta.bg} flex items-center justify-center flex-shrink-0`}>
                <TypeIcon className={`w-4 h-4 ${typeMeta.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#1A1A1A] truncate">{item.title || typeMeta.label}</p>
                <p className="text-[11px] text-[#8FA4C8]">{date}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F2F4F7] flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[#8FA4C8]">
            <span className="font-semibold text-[#1A1A1A]">{item.user_name || "Anon"}</span>
            {item.user_email && <span>• {item.user_email}</span>}
          </div>
          {item.page && <p className="text-[10px] text-[#CBD5E1] mt-1">Halaman: {item.page}</p>}
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Message */}
          <div>
            <p className="text-[10px] font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5">Pesan User</p>
            <div className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0]">
              <p className="text-xs text-[#1A1A1A] whitespace-pre-wrap break-words leading-relaxed">{item.message}</p>
            </div>
          </div>

          {/* Status */}
          <div>
            <p className="text-[10px] font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5">Status</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {Object.entries(STATUS_META).map(([key, meta]) => {
                const Icon = meta.icon;
                const active = status === key;
                return (
                  <button
                    key={key}
                    onClick={() => setStatus(key)}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-lg border-2 transition-all ${
                      active ? `${meta.bg} border-current ${meta.color}` : "bg-white border-[#E2E8F0] text-[#8FA4C8]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-semibold">{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Response */}
          <div>
            <label className="text-[10px] font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">
              Balasan untuk User <span className="text-[#CBD5E1] normal-case">(opsional)</span>
            </label>
            <textarea
              rows={4}
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Tulis balasan untuk user..."
              className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-xs text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-[#F8FAFC] resize-none"
            />
            <p className="text-[10px] text-[#8FA4C8] mt-1">Balasan akan muncul di tab Riwayat user.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#F2F4F7] flex gap-2 sticky bottom-0 bg-white">
          <button
            onClick={onDelete}
            className="px-3 py-2.5 rounded-xl border border-red-200 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Hapus
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] text-xs font-semibold text-[#8FA4C8] hover:bg-[#F8FAFC] transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-[#F97316] text-white text-xs font-semibold hover:bg-[#EA580C] transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}