import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AdminLayout from "@/components/admin/AdminLayout";
import { ScrollText, RefreshCw, Search, LogIn, Activity, AlertCircle, Filter, ShieldAlert } from "lucide-react";

const LOG_TYPE_CONFIG = {
  login: { label: "Login", icon: LogIn, color: "blue" },
  activity: { label: "Activity", icon: Activity, color: "green" },
  error: { label: "Error", icon: AlertCircle, color: "red" },
  sensitive_access: { label: "Akses Sensitif", icon: ShieldAlert, color: "orange" },
};

const SEVERITY_COLORS = {
  info: "bg-blue-50 text-blue-600",
  warning: "bg-amber-50 text-amber-600",
  error: "bg-red-50 text-red-500",
};

export default function AdminLogs() {
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [page, setPage] = useState(1);
  const PER_PAGE = 30;
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u?.role === "admin") loadLogs();
      else setLoading(false);
    });
  }, []);

  async function loadLogs(type = "all") {
    setLoading(true);
    try {
      const allLogs = await base44.entities.SystemLog.list("-created_date", 100);
      setLogs(allLogs);
    } catch (e) {
      setLogs([]);
    }
    setLoading(false);
  }

  async function clearOldLogs() {
    if (!window.confirm("Hapus semua log lebih dari 30 hari? Tindakan ini tidak bisa dibatalkan.")) return;
    setClearing(true);
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const oldLogs = logs.filter(l => new Date(l.created_date) < thirtyDaysAgo);
      for (const log of oldLogs) {
        await base44.entities.SystemLog.delete(log.id);
      }
      
      // Log the cleanup action itself
      await base44.entities.SystemLog.create({
        log_type: "activity",
        user_email: user?.email,
        action: "old_logs_cleared",
        severity: "warning",
        details: `Deleted ${oldLogs.length} logs older than 30 days`
      });
      
      await loadLogs();
    } catch (e) {
      console.error(e);
    }
    setClearing(false);
  }

  const filtered = logs.filter(l => {
    const matchSearch =
      l.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      l.action?.toLowerCase().includes(search.toLowerCase()) ||
      l.details?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || l.log_type === filterType;
    const matchSev = filterSeverity === "all" || l.severity === filterSeverity;
    return matchSearch && matchType && matchSev;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const loginCount = logs.filter(l => l.log_type === "login").length;
  const activityCount = logs.filter(l => l.log_type === "activity").length;
  const errorCount = logs.filter(l => l.log_type === "error").length;
  const sensitiveCount = logs.filter(l => l.log_type === "sensitive_access").length;

  const formatDate = (d) => d ? new Date(d).toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  }) : "-";

  if (loading) return (
    <AdminLayout currentPage="AdminLogs">
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-[#FF6A00] border-t-transparent rounded-full animate-spin" />
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout currentPage="AdminLogs">
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">System Logs</h1>
            <p className="text-sm text-[#8FA4C8] mt-1">Login logs, activity logs, dan error logs</p>
          </div>
          <div className="flex gap-2">
            <button onClick={clearOldLogs} disabled={clearing} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-60 shadow-sm">
              🗑️ Clear Old
            </button>
            <button onClick={() => loadLogs(filterType)} className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E2E8F0] rounded-xl text-sm font-medium hover:bg-[#F8FAFC] shadow-sm">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1"><ScrollText className="w-4 h-4 text-[#FF6A00]" /><p className="text-xs text-[#8FA4C8]">Total Logs</p></div>
            <p className="text-2xl font-bold text-[#1A1A1A]">{logs.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1"><LogIn className="w-4 h-4 text-blue-500" /><p className="text-xs text-[#8FA4C8]">Login</p></div>
            <p className="text-2xl font-bold text-blue-600">{loginCount}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1"><Activity className="w-4 h-4 text-green-500" /><p className="text-xs text-[#8FA4C8]">Activity</p></div>
            <p className="text-2xl font-bold text-green-600">{activityCount}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1"><AlertCircle className="w-4 h-4 text-red-400" /><p className="text-xs text-[#8FA4C8]">Errors</p></div>
            <p className="text-2xl font-bold text-red-500">{errorCount}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-orange-100">
            <div className="flex items-center gap-2 mb-1"><ShieldAlert className="w-4 h-4 text-orange-500" /><p className="text-xs text-[#8FA4C8]">Akses Sensitif</p></div>
            <p className="text-2xl font-bold text-orange-500">{sensitiveCount}</p>
          </div>
        </div>

        {logs.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
            <p className="text-sm font-semibold text-amber-700">Belum ada log tercatat</p>
            <p className="text-xs text-amber-600 mt-1">
              Log akan mulai tercatat secara otomatis ketika user melakukan transaksi atau aksi lainnya.
              Pastikan fungsi <code className="bg-amber-100 px-1 rounded">adminLogAction</code> dipanggil dari frontend untuk mencatat aktivitas.
            </p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <div className="flex gap-3 flex-wrap items-center">
            <Filter className="w-4 h-4 text-[#8FA4C8]" />
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8FA4C8]" />
              <input type="text" placeholder="Cari user, action, detail..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]" />
            </div>
            <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}
              className="px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6A00]">
              <option value="all">Semua Tipe</option>
              <option value="login">Login</option>
              <option value="activity">Activity</option>
              <option value="error">Error</option>
              <option value="sensitive_access">Akses Sensitif</option>
            </select>
            <select value={filterSeverity} onChange={e => { setFilterSeverity(e.target.value); setPage(1); }}
              className="px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6A00]">
              <option value="all">Semua Severity</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F2F4F7]">
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#8FA4C8] uppercase tracking-wider">Timestamp</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#8FA4C8] uppercase tracking-wider">Tipe</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#8FA4C8] uppercase tracking-wider">User</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#8FA4C8] uppercase tracking-wider">Action</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#8FA4C8] uppercase tracking-wider">Entity</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#8FA4C8] uppercase tracking-wider">Target User</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#8FA4C8] uppercase tracking-wider">IP</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#8FA4C8] uppercase tracking-wider">Severity</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#8FA4C8] uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F4F7]">
                {paginated.map(l => {
                  const typeConf = LOG_TYPE_CONFIG[l.log_type] || { label: l.log_type, icon: ScrollText, color: "gray" };
                  const Icon = typeConf.icon;
                  return (
                    <tr key={l.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-5 py-3 text-xs text-[#8FA4C8] whitespace-nowrap">{formatDate(l.created_date)}</td>
                      <td className="px-5 py-3">
                        <span className={`flex items-center gap-1.5 text-xs font-semibold w-fit px-2.5 py-1 rounded-full ${
                          typeConf.color === "blue" ? "bg-blue-50 text-blue-600" :
                          typeConf.color === "green" ? "bg-green-50 text-green-600" :
                          typeConf.color === "orange" ? "bg-orange-50 text-orange-600" :
                          "bg-red-50 text-red-500"
                        }`}>
                          <Icon className="w-3 h-3" />
                          {typeConf.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-[#8FA4C8] max-w-[150px] truncate">{l.user_email || "—"}</td>
                      <td className="px-5 py-3 text-sm text-[#1A1A1A] font-medium">{l.action}</td>
                      <td className="px-5 py-3 text-xs text-[#8FA4C8]">{l.entity_type || "—"}</td>
                      <td className="px-5 py-3 text-xs text-[#8FA4C8] max-w-[150px] truncate">
                        {l.target_email ? (
                          <span className={`font-medium ${l.target_email === 'ALL_USERS' ? 'text-red-500' : 'text-orange-500'}`}>{l.target_email}</span>
                        ) : "—"}
                      </td>
                      <td className="px-5 py-3 text-xs font-mono text-[#8FA4C8]">{l.ip_address || "—"}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${SEVERITY_COLORS[l.severity] || "bg-gray-50 text-gray-500"}`}>
                          {l.severity}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-[#8FA4C8] max-w-[200px] truncate">{l.details || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {paginated.length === 0 && (
            <div className="py-12 text-center text-sm text-[#8FA4C8]">Tidak ada log ditemukan</div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-4 border-t border-[#F2F4F7] flex items-center justify-between">
              <p className="text-xs text-[#8FA4C8]">
                Menampilkan {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} dari {filtered.length}
              </p>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-sm hover:bg-[#F8FAFC] disabled:opacity-40">Prev</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
                  <button key={n} onClick={() => setPage(n)}
                    className={`px-3 py-1.5 rounded-lg border text-sm ${page === n ? "bg-[#FF6A00] text-white border-[#FF6A00]" : "border-[#E2E8F0] hover:bg-[#F8FAFC]"}`}>
                    {n}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-sm hover:bg-[#F8FAFC] disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}