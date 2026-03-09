import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Users, LockOpen, Lock, ShieldAlert, RefreshCw, Check, Headphones } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const LANGUAGES = { id: "🇮🇩 Indonesia", en: "🇺🇸 English", de: "🇩🇪 Deutsch" };
const CURRENCIES = { IDR: "🇮🇩 Rupiah (Rp)", USD: "🇺🇸 US Dollar ($)", EUR: "🇪🇺 Euro (€)" };

export default function AdminPanel() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [successMsg, setSuccessMsg] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      setCurrentUser(u);
      if (u?.role === 'admin') loadUsers();
      else setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('adminGetUsers', {});
      setUsers(res.data.users || []);
    } catch (e) {
      setError("Gagal memuat data pengguna.");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleLock(u, unlock) {
    if (!u.settings?.id) return;
    const key = u.id;
    setActionLoading(prev => ({ ...prev, [key]: true }));
    try {
      await base44.functions.invoke('adminUnlockSettings', {
        settings_id: u.settings.id,
        unlock,
      });
      setUsers(prev => prev.map(usr =>
        usr.id === u.id
          ? { ...usr, settings: { ...usr.settings, settings_unlocked: unlock } }
          : usr
      ));
      setSuccessMsg(prev => ({ ...prev, [key]: unlock ? "Dibuka!" : "Dikunci!" }));
      setTimeout(() => setSuccessMsg(prev => { const n = { ...prev }; delete n[key]; return n; }), 2000);
    } catch {
      // ignore
    } finally {
      setActionLoading(prev => ({ ...prev, [key]: false }));
    }
  }

  const filtered = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F4F7] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#FF6A00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#F2F4F7] flex flex-col items-center justify-center gap-4 px-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-[#1A1A1A]">Akses Ditolak</h1>
        <p className="text-sm text-[#8FA4C8] text-center">Halaman ini hanya bisa diakses oleh Admin.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F4F7] pb-10">
      {/* Header */}
      <div className="bg-[#0A0A0A] px-5 pt-10 pb-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-[#8FA4C8] text-sm font-medium">Panel Admin</p>
          <h1 className="text-white text-2xl font-bold mt-0.5">Manajemen Pengguna</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 mt-6 space-y-4">
        {/* Search + Refresh */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8FA4C8]" />
            <input
              type="text"
              placeholder="Cari berdasarkan email atau nama..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
            />
          </div>
          <button
            onClick={loadUsers}
            className="w-10 h-10 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center hover:bg-[#F8FAFC] transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-[#8FA4C8]" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-[#FF6A00]" />
              <p className="text-xs text-[#8FA4C8] font-medium">Total Pengguna</p>
            </div>
            <p className="text-2xl font-bold text-[#1A1A1A]">{users.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <LockOpen className="w-4 h-4 text-green-500" />
              <p className="text-xs text-[#8FA4C8] font-medium">Settings Terbuka</p>
            </div>
            <p className="text-2xl font-bold text-[#1A1A1A]">
              {users.filter(u => u.settings?.settings_unlocked).length}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* User List */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-2">
            <p className="text-xs font-bold text-[#8FA4C8] uppercase tracking-widest">
              Daftar Pengguna ({filtered.length})
            </p>
          </div>

          {filtered.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-[#8FA4C8]">
              Tidak ada pengguna ditemukan.
            </div>
          ) : (
            <div className="divide-y divide-[#F2F4F7]">
              {filtered.map(u => {
                const isUnlocked = u.settings?.settings_unlocked;
                const isLoading = actionLoading[u.id];
                const msg = successMsg[u.id];
                const hasSettings = !!u.settings;

                return (
                  <div key={u.id} className="px-5 py-4 flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-[#FF6A00] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {u.full_name?.[0]?.toUpperCase() || "U"}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-[#1A1A1A] text-sm truncate">{u.full_name || "—"}</p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          u.role === 'admin'
                            ? 'bg-[#FF6A00]/10 text-[#FF6A00]'
                            : 'bg-[#F2F4F7] text-[#8FA4C8]'
                        }`}>
                          {u.role || 'user'}
                        </span>
                      </div>
                      <p className="text-xs text-[#8FA4C8] truncate mt-0.5">{u.email}</p>

                      {hasSettings && (
                        <div className="flex gap-3 mt-2 text-xs text-[#8FA4C8]">
                          <span>🌐 {LANGUAGES[u.settings.language] || u.settings.language}</span>
                          <span>💰 {CURRENCIES[u.settings.currency] || u.settings.currency}</span>
                        </div>
                      )}

                      {!hasSettings && (
                        <p className="text-xs text-[#8FA4C8] mt-1 italic">Belum ada pengaturan</p>
                      )}
                    </div>

                    {/* Action */}
                    {hasSettings && (
                      <div className="flex-shrink-0">
                        {msg ? (
                          <div className="flex items-center gap-1 text-green-600 text-xs font-semibold">
                            <Check className="w-3.5 h-3.5" />
                            {msg}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleToggleLock(u, !isUnlocked)}
                            disabled={isLoading}
                            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                              isUnlocked
                                ? 'bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200'
                                : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
                            } disabled:opacity-50`}
                          >
                            {isLoading ? (
                              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : isUnlocked ? (
                              <Lock className="w-3 h-3" />
                            ) : (
                              <LockOpen className="w-3 h-3" />
                            )}
                            {isUnlocked ? 'Kunci Lagi' : 'Buka Kunci'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-[#8FA4C8] pb-4">
          Hanya admin yang dapat mengakses panel ini.
        </p>
      </div>
    </div>
  );
}