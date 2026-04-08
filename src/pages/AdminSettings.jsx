import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Save, Users, Download, Trash2, Plus, X } from "lucide-react";

export default function AdminSettings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [waitingList, setWaitingList] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");

  const [appConfig, setAppConfig] = useState(null);
  const [settings, setSettings] = useState({
    app_name: "Atur Pintar",
    maintenance_mode: false,
    premium_monthly_price: 49000,
    premium_yearly_price: 490000,
    features: {
      split_bill: true,
      shared_wallet: true,
      investments: true,
      nana_ai: true,
      gamification: true,
      waiting_list_form: true
    }
  });
  const [deletingSimData, setDeletingSimData] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u?.role === "admin") loadData();
      else setLoading(false);
    });
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [waitRes, adminRes, configRes] = await Promise.all([
        base44.entities.WaitingList.list("-created_date", 100),
        base44.entities.User.filter({ role: "admin" }),
        base44.asServiceRole.entities.AppConfig.list()
      ]);
      setWaitingList(waitRes);
      setAdmins(adminRes);
      
      if (configRes && configRes.length) {
        const config = configRes[0];
        setAppConfig(config);
        setSettings({
          app_name: config.app_name || "Atur Pintar",
          maintenance_mode: config.maintenance_mode || false,
          premium_monthly_price: config.premium_price_monthly || 49000,
          premium_yearly_price: config.premium_price_yearly || 490000,
          features: {
            split_bill: config.feature_split_bill !== false,
            shared_wallet: config.feature_shared_wallet !== false,
            investments: config.feature_investment !== false,
            nana_ai: config.feature_nana_ai !== false,
            gamification: config.feature_gamification !== false,
            waiting_list_form: config.feature_waiting_list !== false
          }
        });
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function handleSaveSettings() {
    setSaving(true);
    try {
      if (appConfig) {
        await base44.asServiceRole.entities.AppConfig.update(appConfig.id, {
          app_name: settings.app_name,
          maintenance_mode: settings.maintenance_mode,
          premium_price_monthly: settings.premium_monthly_price,
          premium_price_yearly: settings.premium_yearly_price,
          feature_split_bill: settings.features.split_bill,
          feature_shared_wallet: settings.features.shared_wallet,
          feature_investment: settings.features.investments,
          feature_nana_ai: settings.features.nana_ai,
          feature_gamification: settings.features.gamification,
          feature_waiting_list: settings.features.waiting_list_form
        });
      }
      
      const changes = [];
      if (settings.maintenance_mode) changes.push('maintenance_mode');
      if (settings.features.split_bill === false) changes.push('-split_bill');
      if (settings.features.investments === false) changes.push('-investments');
      if (settings.features.nana_ai === false) changes.push('-nana_ai');
      
      await base44.entities.SystemLog.create({
        log_type: "activity",
        user_email: user?.email,
        action: "settings_updated",
        severity: "info",
        details: `Updated AppConfig: ${changes.length ? changes.join(', ') : 'all features enabled'}`
      });
      setSuccessMsg("✓ Pengaturan tersimpan");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  }

  async function inviteWaitingUser(email, name) {
    try {
      await base44.entities.AdminNotification.create({
        title: "🎉 Selamat! Akun Anda Aktif!",
        message: `Halo ${name}, akun Atur Pintar Anda sudah aktif. Silakan login sekarang!`,
        target_type: "specific",
        target_email: email,
        is_read: false
      });
      await base44.entities.SystemLog.create({
        log_type: "activity",
        user_email: user?.email,
        action: "waiting_list_invited",
        severity: "info",
        details: `Invited ${email} from waiting list`
      });
      setSuccessMsg(`✓ Undangan dikirim ke ${email}`);
      setTimeout(() => setSuccessMsg(""), 3000);
      await loadData();
    } catch (e) {
      console.error(e);
    }
  }

  async function addAdmin(email) {
    if (!email.trim()) return;
    try {
      const existing = await base44.entities.User.filter({ email });
      if (existing.length > 0) {
        await base44.entities.User.update(existing[0].id, { role: "admin" });
        setSuccessMsg(`✓ ${email} dijadikan admin`);
      } else {
        setSuccessMsg(`User tidak ditemukan: ${email}`);
      }
      setTimeout(() => setSuccessMsg(""), 3000);
      setNewAdminEmail("");
      setShowAddAdmin(false);
      await loadData();
    } catch (e) {
      console.error(e);
    }
  }

  async function removeAdmin(adminId, adminEmail) {
    if (!window.confirm(`Hapus ${adminEmail} dari admin?`)) return;
    try {
      await base44.entities.User.update(adminId, { role: "user" });
      await base44.entities.SystemLog.create({
        log_type: "activity",
        user_email: user?.email,
        action: "admin_removed",
        severity: "warning",
        details: `Removed ${adminEmail} from admin role`
      });
      setSuccessMsg("✓ Admin dihapus");
      setTimeout(() => setSuccessMsg(""), 3000);
      await loadData();
    } catch (e) {
      console.error(e);
    }
  }

  async function deleteSimulationData() {
    if (!window.confirm("⚠️ YAKIN? Ini akan menghapus semua data simulasi. Tindakan ini TIDAK BISA DIBATALKAN.")) return;
    if (!window.confirm("Hapus investment, alert, dan notifikasi simulasi? Ketik 'HAPUS' untuk konfirmasi.")) return;
    setDeletingSimData(true);
    try {
      const investmentIds = ["69d6ac16b817fa58e538e224", "69d6ac16b817fa58e538e225", "69d6ac16b817fa58e538e226"];
      const alertIds = ["69d6ac61427fef70824fe32a", "69d6ac61427fef70824fe32b", "69d6ac61427fef70824fe32c"];
      const notifIds = ["69d6abc60171dac7dd9eb414", "69d6c10da1db39cbb506cb59"];
      
      let deleted = 0;
      for (const id of investmentIds) {
        try {
          await base44.entities.Investment.delete(id);
          deleted++;
        } catch (e) {}
      }
      for (const id of alertIds) {
        try {
          await base44.entities.Alert.delete(id);
          deleted++;
        } catch (e) {}
      }
      for (const id of notifIds) {
        try {
          await base44.entities.AdminNotification.delete(id);
          deleted++;
        } catch (e) {}
      }
      
      await base44.entities.SystemLog.create({
        log_type: "activity",
        user_email: user?.email,
        action: "simulation_data_deleted",
        severity: "warning",
        details: `Deleted ${deleted} simulation records (investments, alerts, notifications)`
      });
      
      setSuccessMsg(`✓ Berhasil menghapus ${deleted} record simulasi`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (e) {
      console.error(e);
    }
    setDeletingSimData(false);
  }

  const exportWaitingListCSV = () => {
    const headers = ["Nama", "Email", "WhatsApp", "Kota", "Pekerjaan", "Gaji", "Cara Catat", "Minat", "Tanggal"];
    const rows = waitingList.map(w => [
      w.name || "—",
      w.email,
      w.whatsapp || "—",
      w.city || "—",
      w.job || "—",
      w.salary_estimate || "—",
      w.finance_method || "—",
      w.interest || "—",
      new Date(w.created_date).toLocaleDateString("id-ID")
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `waiting_list_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) return (
    <AdminLayout currentPage="AdminSettings">
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-[#FF6A00] border-t-transparent rounded-full animate-spin" />
      </div>
    </AdminLayout>
  );

  if (user?.role !== "admin") return (
    <AdminLayout currentPage="AdminSettings">
      <div className="p-10 text-center text-red-500 font-semibold">Akses Ditolak</div>
    </AdminLayout>
  );

  return (
    <AdminLayout currentPage="AdminSettings">
      <div className="p-8 space-y-6">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Pengaturan Admin</h1>

        {successMsg && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            {successMsg}
          </div>
        )}

        {/* SECTION 1: App Settings */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E2E8F0]">
          <h2 className="text-lg font-bold text-[#1A1A1A] mb-4">Pengaturan Aplikasi</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[#8FA4C8] block mb-1.5">Nama Aplikasi</label>
              <input type="text" value={settings.app_name} onChange={e => setSettings({...settings, app_name: e.target.value})}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]" />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={settings.maintenance_mode} onChange={e => setSettings({...settings, maintenance_mode: e.target.checked})}
                className="w-5 h-5" />
              <label className="text-sm font-medium text-[#1A1A1A]">Mode Maintenance (ON = show maintenance page)</label>
            </div>
            <div>
              <label className="text-xs font-medium text-[#8FA4C8] block mb-1.5">Harga Premium Monthly (Rp)</label>
              <input type="number" value={settings.premium_monthly_price} onChange={e => setSettings({...settings, premium_monthly_price: parseInt(e.target.value)})}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]" />
            </div>
            <div>
              <label className="text-xs font-medium text-[#8FA4C8] block mb-1.5">Harga Premium Yearly (Rp)</label>
              <input type="number" value={settings.premium_yearly_price} onChange={e => setSettings({...settings, premium_yearly_price: parseInt(e.target.value)})}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]" />
            </div>
            <button onClick={handleSaveSettings} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 bg-[#FF6A00] text-white rounded-xl text-sm font-medium hover:bg-[#E55A00] disabled:opacity-60">
              <Save className="w-4 h-4" />
              {saving ? "Menyimpan..." : "Simpan Pengaturan"}
            </button>
          </div>
        </div>

        {/* SECTION 2: Feature Flags */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E2E8F0]">
          <h2 className="text-lg font-bold text-[#1A1A1A] mb-4">Feature Flags</h2>
          <div className="space-y-3">
            {Object.entries(settings.features).map(([key, value]) => {
              const labels = {
                split_bill: "Split Bill",
                shared_wallet: "Dompet Bersama",
                investments: "Investasi",
                nana_ai: "Nana AI Chat",
                gamification: "Gamifikasi & Streak",
                waiting_list_form: "Form Waiting List"
              };
              return (
                <div key={key} className="flex items-center gap-3">
                  <input type="checkbox" checked={value} onChange={e => setSettings({...settings, features: {...settings.features, [key]: e.target.checked}})}
                    className="w-5 h-5" />
                  <label className="text-sm font-medium text-[#1A1A1A]">{labels[key]} {value ? "✓ ON" : "✗ OFF"}</label>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: Waiting List */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E2E8F0]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#1A1A1A]">Waiting List ({waitingList.length})</h2>
            {waitingList.length > 0 && (
              <button onClick={exportWaitingListCSV} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
                <Download className="w-4 h-4" /> Export CSV
              </button>
            )}
          </div>
          {waitingList.length === 0 ? (
            <p className="text-sm text-[#8FA4C8]">Belum ada pendaftar waiting list.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    <th className="text-left py-3 px-2 font-semibold text-[#1A1A1A]">Nama</th>
                    <th className="text-left py-3 px-2 font-semibold text-[#1A1A1A]">Email</th>
                    <th className="text-left py-3 px-2 font-semibold text-[#1A1A1A]">Kota</th>
                    <th className="text-left py-3 px-2 font-semibold text-[#1A1A1A]">Pekerjaan</th>
                    <th className="text-center py-3 px-2 font-semibold text-[#1A1A1A]">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {waitingList.map(w => (
                    <tr key={w.id} className="border-b border-[#F2F4F7] hover:bg-[#F8FAFC]">
                      <td className="py-3 px-2 text-[#1A1A1A]">{w.name || "—"}</td>
                      <td className="py-3 px-2 text-[#1A1A1A] text-xs">{w.email}</td>
                      <td className="py-3 px-2 text-[#8FA4C8] text-xs">{w.city || "—"}</td>
                      <td className="py-3 px-2 text-[#8FA4C8] text-xs">{w.job || "—"}</td>
                      <td className="py-3 px-2 text-center">
                        <button onClick={() => inviteWaitingUser(w.email, w.name)} className="px-3 py-1 bg-[#FF6A00] text-white text-xs font-bold rounded hover:bg-[#E55A00]">
                          Invite
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SECTION 4: Admin Management */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E2E8F0]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#1A1A1A]">Manajemen Admin ({admins.length})</h2>
            <button onClick={() => setShowAddAdmin(true)} className="flex items-center gap-2 px-3 py-2 bg-[#FF6A00] text-white text-sm rounded-lg hover:bg-[#E55A00]">
              <Plus className="w-4 h-4" /> Tambah Admin
            </button>
          </div>
          <div className="space-y-2">
            {admins.map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                <div>
                  <p className="text-sm font-medium text-[#1A1A1A]">{a.full_name}</p>
                  <p className="text-xs text-[#8FA4C8]">{a.email}</p>
                </div>
                <button onClick={() => removeAdmin(a.id, a.email)} className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700">
                  Hapus
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-200">
          <h2 className="text-lg font-bold text-red-600 mb-4">⚠️ Danger Zone</h2>
          <div className="space-y-3">
            <button onClick={deleteSimulationData} disabled={deletingSimData} className="w-full px-4 py-3 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-60">
              {deletingSimData ? "Menghapus..." : "🗑️ Hapus Sisa Data Simulasi"}
            </button>
            <p className="text-xs text-red-600">Menghapus semua investment, alert, dan notifikasi simulasi. Tidak bisa dibatalkan.</p>
          </div>
        </div>

        {/* Add Admin Modal */}
        {showAddAdmin && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#1A1A1A]">Tambah Admin</h3>
                <button onClick={() => setShowAddAdmin(false)} className="p-1 hover:bg-[#F2F4F7] rounded">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input type="email" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)}
                placeholder="Masukkan email user..." className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#FF6A00]" />
              <div className="flex gap-3">
                <button onClick={() => setShowAddAdmin(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-medium hover:bg-[#F8FAFC]">
                  Batal
                </button>
                <button onClick={() => addAdmin(newAdminEmail)} className="flex-1 px-4 py-2.5 rounded-xl bg-[#FF6A00] text-white text-sm font-medium hover:bg-[#E55A00]">
                  Tambah
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}