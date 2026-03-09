import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, ShieldAlert, Pencil, Trash2, Check, X, ChevronUp, ChevronDown, Search, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const ENTITY_LABELS = {
  Transaction: { label: "Transaksi", emoji: "💸", dataKey: "transactions" },
  SavingsGoal: { label: "Tabungan", emoji: "🎯", dataKey: "goals" },
  Budget:      { label: "Budget",   emoji: "📊", dataKey: "budgets" },
  Debt:        { label: "Utang",    emoji: "💳", dataKey: "debts" },
  Reminder:    { label: "Pengingat",emoji: "🔔", dataKey: "reminders" },
};

const ENTITY_FIELDS = {
  Transaction: ["date", "amount", "type", "category", "note"],
  SavingsGoal: ["name", "target_amount", "current_amount", "status", "deadline"],
  Budget:      ["category", "amount", "month"],
  Debt:        ["name", "total_amount", "remaining_amount", "type", "status"],
  Reminder:    ["title", "type", "amount", "due_day", "is_active"],
};

const PAGE_SIZE = 20;

function fmtVal(v) {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "Ya" : "Tidak";
  if (typeof v === "number") return v.toLocaleString("id-ID");
  return String(v);
}

function EditRow({ record, fields, entity, onDone }) {
  const [form, setForm] = useState({ ...record });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await base44.functions.invoke("adminMutateEntity", {
      operation: "update", entity, id: record.id,
      data: Object.fromEntries(fields.map(f => [f, form[f]])),
    });
    setSaving(false);
    onDone(true);
  }

  return (
    <tr className="bg-[#FFF8F4]">
      <td className="px-3 py-2 text-xs text-[#8FA4C8]">{record.id?.slice(0, 8)}…</td>
      {fields.map(f => (
        <td key={f} className="px-3 py-2">
          <input
            className="w-full min-w-[80px] border border-[#E2E8F0] rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#FF6A00] bg-white"
            value={form[f] ?? ""}
            onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))}
          />
        </td>
      ))}
      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          <button onClick={handleSave} disabled={saving}
            className="p-1.5 rounded-lg bg-[#FF6A00] text-white hover:bg-[#e05e00] disabled:opacity-50">
            {saving ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-3 h-3" />}
          </button>
          <button onClick={() => onDone(false)} className="p-1.5 rounded-lg bg-[#F2F4F7] text-[#4A5568] hover:bg-[#E2E8F0]">
            <X className="w-3 h-3" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function EntityTable({ records, fields, entity, onRefresh }) {
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch]     = useState("");
  const [sortCol, setSortCol]   = useState(fields[0]);
  const [sortDir, setSortDir]   = useState("asc");
  const [page, setPage]         = useState(1);

  // Reset page when search/sort changes
  useEffect(() => { setPage(1); }, [search, sortCol, sortDir]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return records.filter(r =>
      !q || fields.some(f => String(r[f] ?? "").toLowerCase().includes(q))
    );
  }, [records, search, fields]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const va = a[sortCol] ?? "";
      const vb = b[sortCol] ?? "";
      const cmp = typeof va === "number" ? va - vb : String(va).localeCompare(String(vb));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(col) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  }

  async function handleDelete(id) {
    if (!confirm("Yakin hapus data ini?")) return;
    await base44.functions.invoke("adminMutateEntity", { operation: "delete", entity, id });
    onRefresh();
  }

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <ChevronUp className="w-3 h-3 text-[#CBD5E0]" />;
    return sortDir === "asc"
      ? <ChevronUp className="w-3 h-3 text-[#FF6A00]" />
      : <ChevronDown className="w-3 h-3 text-[#FF6A00]" />;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Search bar */}
      <div className="px-4 py-3 border-b border-[#F2F4F7] flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8FA4C8]" />
          <input
            type="text"
            placeholder={`Cari di ${records.length} data...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
          />
        </div>
        <span className="text-xs text-[#8FA4C8] flex-shrink-0">{filtered.length} hasil</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <th className="px-3 py-2.5 text-left text-[#8FA4C8] font-semibold w-20">ID</th>
              {fields.map(f => (
                <th key={f} className="px-3 py-2.5 text-left">
                  <button
                    onClick={() => toggleSort(f)}
                    className="flex items-center gap-1 text-[#8FA4C8] font-semibold hover:text-[#1A1A1A] transition-colors"
                  >
                    {f} <SortIcon col={f} />
                  </button>
                </th>
              ))}
              <th className="px-3 py-2.5 text-left text-[#8FA4C8] font-semibold w-20">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F2F4F7]">
            {paged.length === 0 && (
              <tr>
                <td colSpan={fields.length + 2} className="px-4 py-8 text-center text-[#8FA4C8]">
                  Tidak ada data
                </td>
              </tr>
            )}
            {paged.map(record => (
              editingId === record.id
                ? <EditRow key={record.id} record={record} fields={fields} entity={entity}
                    onDone={(saved) => { setEditingId(null); if (saved) onRefresh(); }} />
                : (
                  <tr key={record.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-3 py-2.5 text-[#CBD5E0]">{record.id?.slice(0, 8)}…</td>
                    {fields.map(f => (
                      <td key={f} className={`px-3 py-2.5 text-[#1A1A1A] max-w-[160px] truncate ${
                        (f === 'amount' || f === 'total_amount' || f === 'remaining_amount' || f === 'target_amount' || f === 'current_amount')
                          ? 'font-semibold text-[#FF6A00]' : ''
                      }`}>
                        {fmtVal(record[f])}
                      </td>
                    ))}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditingId(record.id)}
                          className="p-1.5 rounded-lg hover:bg-[#F2F4F7] text-[#8FA4C8] hover:text-[#1A1A1A]">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button onClick={() => handleDelete(record.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-[#8FA4C8] hover:text-red-500">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-[#F2F4F7] flex items-center justify-between">
          <span className="text-xs text-[#8FA4C8]">
            Hal {page} / {totalPages} · {sorted.length} record
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={page === 1}
              className="p-1.5 rounded-lg hover:bg-[#F2F4F7] disabled:opacity-30 text-[#4A5568]">
              <ChevronsLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                    page === p ? 'bg-[#FF6A00] text-white' : 'hover:bg-[#F2F4F7] text-[#4A5568]'
                  }`}>
                  {p}
                </button>
              );
            })}
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
              className="p-1.5 rounded-lg hover:bg-[#F2F4F7] disabled:opacity-30 text-[#4A5568]">
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminUserSupport() {
  const [currentUser, setCurrentUser] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(false);
  const [activeTab, setActiveTab]     = useState("Transaction");
  const [usersList, setUsersList]     = useState([]);

  useEffect(() => {
    base44.auth.me().then(u => {
      setCurrentUser(u);
      if (u?.role === "admin") loadUsers();
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const email = new URLSearchParams(window.location.search).get("email");
    if (email) { setSearchInput(email); setTargetEmail(email); loadUserData(email); }
  }, []);

  async function loadUsers() {
    const res = await base44.functions.invoke("adminGetUsers", {});
    setUsersList(res.data?.users || []);
  }

  async function loadUserData(email) {
    if (!email) return;
    setLoading(true);
    setData(null);
    const res = await base44.functions.invoke("adminGetUserData", { user_email: email });
    setData(res.data);
    setLoading(false);
  }

  function handleSearch(e) {
    e.preventDefault();
    setTargetEmail(searchInput);
    loadUserData(searchInput);
  }

  const activeRecords = data?.[ENTITY_LABELS[activeTab]?.dataKey] || [];

  if (currentUser && currentUser.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#F2F4F7] flex flex-col items-center justify-center gap-4 px-6">
        <ShieldAlert className="w-10 h-10 text-red-500" />
        <p className="text-[#1A1A1A] font-bold">Akses Ditolak</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F4F7] pb-10">
      {/* Header */}
      <div className="bg-[#0A0A0A] px-5 pt-10 pb-8">
        <div className="max-w-5xl mx-auto">
          <Link to={createPageUrl("AdminPanel")} className="flex items-center gap-2 text-[#8FA4C8] text-sm mb-3 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Admin Panel
          </Link>
          <p className="text-[#8FA4C8] text-sm font-medium">Support Mode</p>
          <h1 className="text-white text-2xl font-bold mt-0.5">Data Pengguna</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 mt-6 space-y-4">
        {/* Search user */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-xs font-bold text-[#8FA4C8] uppercase tracking-widest mb-3">Cari Pengguna</p>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="email"
              placeholder="Masukkan email pengguna..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              list="users-datalist"
              className="flex-1 border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
            />
            <datalist id="users-datalist">
              {usersList.map(u => <option key={u.id} value={u.email}>{u.full_name}</option>)}
            </datalist>
            <button type="submit" className="px-5 py-2.5 rounded-xl bg-[#FF6A00] text-white text-sm font-bold hover:bg-[#e05e00] transition-colors">
              Buka
            </button>
          </form>
        </div>

        {loading && (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-[#FF6A00] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {data && targetEmail && (
          <>
            {/* User banner */}
            <div className="bg-[#FF6A00]/10 border border-[#FF6A00]/20 rounded-2xl px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-[#FF6A00] font-bold uppercase tracking-widest mb-0.5">Sedang melihat data</p>
                <p className="font-bold text-[#1A1A1A]">{targetEmail}</p>
                <p className="text-xs text-[#8FA4C8] mt-0.5">Semua perubahan bersifat permanen</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(ENTITY_LABELS).map(([key, { label, emoji, dataKey }]) => (
                  <div key={key} className="text-center">
                    <p className="text-xs font-bold text-[#1A1A1A]">{data?.[dataKey]?.length || 0}</p>
                    <p className="text-[10px] text-[#8FA4C8]">{emoji} {label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Entity tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {Object.entries(ENTITY_LABELS).map(([key, { label, emoji, dataKey }]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === key ? "bg-[#0A0A0A] text-white" : "bg-white text-[#4A5568] hover:bg-[#F2F4F7]"
                  }`}
                >
                  <span>{emoji}</span>
                  {label}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    activeTab === key ? "bg-white/20 text-white" : "bg-[#F2F4F7] text-[#8FA4C8]"
                  }`}>
                    {data?.[dataKey]?.length || 0}
                  </span>
                </button>
              ))}
            </div>

            {/* Table */}
            <EntityTable
              key={activeTab}
              records={activeRecords}
              fields={ENTITY_FIELDS[activeTab]}
              entity={activeTab}
              onRefresh={() => loadUserData(targetEmail)}
            />
          </>
        )}
      </div>
    </div>
  );
}