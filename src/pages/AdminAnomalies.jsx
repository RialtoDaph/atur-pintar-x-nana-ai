import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AdminLayout from "@/components/admin/AdminLayout";
import { AlertTriangle, RefreshCw, Search, TrendingUp, Copy, Bug, Zap } from "lucide-react";

const ANOMALY_TYPES = {
  spending_spike: { label: "Spending Spike", icon: TrendingUp, color: "red" },
  duplicate_transaction: { label: "Duplikat Transaksi", icon: Copy, color: "yellow" },
  data_bug: { label: "Bug Data", icon: Bug, color: "red" },
  high_frequency: { label: "Frekuensi Tinggi", icon: Zap, color: "orange" },
};

const SEVERITY_COLORS = {
  high: "bg-red-50 text-red-600 border-red-100",
  medium: "bg-amber-50 text-amber-600 border-amber-100",
  low: "bg-blue-50 text-blue-600 border-blue-100",
};

export default function AdminAnomalies() {
  const [user, setUser] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u?.role === "admin") loadData();
      else setLoading(false);
    });
  }, []);

  async function loadData() {
    setLoading(true);
    const res = await base44.functions.invoke("adminDetectAnomalies", {});
    setAnomalies(res.data?.anomalies || []);
    setLoading(false);
  }

  const filtered = anomalies.filter(a => {
    const matchSearch = a.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      a.description?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || a.type === filterType;
    const matchSev = filterSeverity === "all" || a.severity === filterSeverity;
    return matchSearch && matchType && matchSev;
  });

  const highCount = anomalies.filter(a => a.severity === "high").length;
  const mediumCount = anomalies.filter(a => a.severity === "medium").length;
  const uniqueUsers = new Set(anomalies.map(a => a.user_email)).size;

  const fmt = (n) => n != null ? n.toLocaleString("id-ID") : "-";

  if (loading) return (
    <AdminLayout currentPage="AdminAnomalies">
      <div className="flex flex-col items-center justify-center h-screen gap-3">
        <div className="w-8 h-8 border-4 border-[#FF6A00] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#8FA4C8]">Menganalisis pola transaksi...</p>
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout currentPage="AdminAnomalies">
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">Anomaly Detector</h1>
            <p className="text-sm text-[#8FA4C8] mt-1">Deteksi pengeluaran mencurigakan, duplikat, dan bug data</p>
          </div>
          <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E2E8F0] rounded-xl text-sm font-medium hover:bg-[#F8FAFC] shadow-sm">
            <RefreshCw className="w-4 h-4" />
            Re-scan
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-[#FF6A00]" /><p className="text-xs text-[#8FA4C8]">Total Anomali</p></div>
            <p className="text-2xl font-bold text-[#1A1A1A]">{anomalies.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-red-500" /><p className="text-xs text-[#8FA4C8]">High Severity</p></div>
            <p className="text-2xl font-bold text-red-500">{highCount}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-amber-500" /><p className="text-xs text-[#8FA4C8]">Medium Severity</p></div>
            <p className="text-2xl font-bold text-amber-500">{mediumCount}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-blue-500" /><p className="text-xs text-[#8FA4C8]">User Terpengaruh</p></div>
            <p className="text-2xl font-bold text-blue-600">{uniqueUsers}</p>
          </div>
        </div>

        {anomalies.length === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-700">Tidak ada anomali terdeteksi</p>
              <p className="text-xs text-green-600 mt-0.5">Semua data transaksi terlihat normal.</p>
            </div>
          </div>
        )}

        {/* Filters */}
        {anomalies.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8FA4C8]" />
                <input type="text" placeholder="Cari user atau deskripsi..." value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]" />
              </div>
              <select value={filterType} onChange={e => setFilterType(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6A00]">
                <option value="all">Semua Tipe</option>
                {Object.entries(ANOMALY_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6A00]">
                <option value="all">Semua Severity</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        )}

        {/* Anomaly Cards */}
        <div className="space-y-3">
          {filtered.map((a, idx) => {
            const typeInfo = ANOMALY_TYPES[a.type] || { label: a.type, icon: AlertTriangle, color: "gray" };
            const Icon = typeInfo.icon;
            return (
              <div key={idx} className={`bg-white rounded-2xl p-5 shadow-sm border ${a.severity === "high" ? "border-red-100" : a.severity === "medium" ? "border-amber-100" : "border-[#E2E8F0]"}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    a.severity === "high" ? "bg-red-50 text-red-500" :
                    a.severity === "medium" ? "bg-amber-50 text-amber-500" :
                    "bg-blue-50 text-blue-500"
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${SEVERITY_COLORS[a.severity]}`}>
                        {a.severity?.toUpperCase()}
                      </span>
                      <span className="text-xs font-semibold text-[#8FA4C8] bg-[#F2F4F7] px-2.5 py-1 rounded-full">
                        {typeInfo.label}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-[#1A1A1A]">{a.description}</p>
                    <div className="flex flex-wrap gap-4 mt-2">
                      <div>
                        <p className="text-[10px] text-[#8FA4C8] font-medium">User</p>
                        <p className="text-xs text-[#1A1A1A] font-medium">{a.user_email}</p>
                      </div>
                      {a.date && (
                        <div>
                          <p className="text-[10px] text-[#8FA4C8] font-medium">Tanggal</p>
                          <p className="text-xs text-[#1A1A1A]">{a.date}</p>
                        </div>
                      )}
                      {a.amount != null && (
                        <div>
                          <p className="text-[10px] text-[#8FA4C8] font-medium">Jumlah</p>
                          <p className="text-xs font-bold text-red-500">Rp {fmt(a.amount)}</p>
                        </div>
                      )}
                      {a.category && (
                        <div>
                          <p className="text-[10px] text-[#8FA4C8] font-medium">Kategori</p>
                          <p className="text-xs text-[#1A1A1A]">{a.category}</p>
                        </div>
                      )}
                      {a.note && (
                        <div>
                          <p className="text-[10px] text-[#8FA4C8] font-medium">Note</p>
                          <p className="text-xs text-[#8FA4C8] truncate max-w-[200px]">{a.note}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && anomalies.length > 0 && (
          <div className="py-12 text-center text-sm text-[#8FA4C8]">Tidak ada anomali sesuai filter</div>
        )}
      </div>
    </AdminLayout>
  );
}