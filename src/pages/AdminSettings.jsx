import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Save, Plus, X } from "lucide-react";
import { toast } from "sonner";

const FEATURE_FLAGS = [
  { key: "feature_split_bill", label: "Split Bill", desc: "Aktifkan fitur Split Bill & IOU antar teman" },
  { key: "feature_shared_wallet", label: "Dompet Bersama", desc: "Aktifkan Shared Finance untuk pasangan/keluarga" },
  { key: "feature_investment", label: "Investasi", desc: "Aktifkan modul Investasi (saham, reksa dana, crypto)" },
  { key: "feature_nana_ai", label: "Nana AI Chat", desc: "Aktifkan asisten keuangan AI Nana" },
  { key: "feature_gamification", label: "Gamifikasi & Streak", desc: "Aktifkan sistem streak dan pencapaian pengguna" },
];

export default function AdminSettings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [admins, setAdmins] = useState([]);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");

  const [appConfig, setAppConfig] = useState(null);
  const [settings, setSettings] = useState({
    app_name: "Atur Pintar",
    maintenance_mode: false,
    premium_price_monthly: 39000,
    premium_price_yearly: 299000,
    feature_split_bill: true,
    feature_shared_wallet: true,
    feature_investment: true,
    feature_nana_ai: true,
    feature_gamification: true,
    settings_unlocked: false,
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
      const [adminRes, configRes] = await Promise.all([
        base44.entities.User.filter({ role: "admin" }),
        base44.asServiceRole.entities.AppConfig.list()
      ]);
      setAdmins(adminRes);

      if (configRes && configRes.length) {
        const config = configRes[0];
        setAppConfig(config);
        setSettings({
          app_name: config.app_name || "Atur Pintar",
          maintenance_mode: config.maintenance_mode === true,
          premium_price_monthly: config.premium_price_monthly || 39000,
          premium_price_yearly: config.premium_price_yearly || 299000,
          feature_split_bill: config.feature_split_bill !== false,
          feature_shared_wallet: config.feature_shared_wallet !== false,
          feature_investment: config.feature_investment !== false,
          feature_nana_ai: config.feature_nana_ai !== false,
          feature_gamification: config.feature_gamification !== false,
          settings_unlocked: config.settings_unlocked === true,
        });
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("Gagal memuat data: " + e.message);
    }
    setLoading(false);
  }

  async function handleSaveSettings() {
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const payload = {
        app_name: settings.app_name,
        maintenance_mode: Boolean(settings.maintenance_mode),
        premium_price_monthly: Number(settings.premium_price_monthly),
        premium_price_yearly: Number(settings.premium_price_yearly),
        feature_split_bill: Boolean(settings.feature_split_bill),
        feature_shared_wallet: Boolean(settings.feature_shared_wallet),
        feature_investment: Boolean(settings.feature_investment),
        feature_nana_ai: Boolean(settings.feature_nana_ai),
        feature_gamification: Boolean(settings.feature_gamification),
        settings_unlocked: Boolean(settings.settings_unlocked),
      };

      if (appConfig) {
        await base44.asServiceRole.entities.AppConfig.update(appConfig.id, payload);
      } else {
        const created = await base44.asServiceRole.entities.AppConfig.create(payload);
        setAppConfig(created);
      }

      await base44.entities.SystemLog.create({
        log_type: "activity",
        user_email: user?.email,
        action: "settings_updated",
        severity: "info",
        details: `Updated AppConfig by ${user?.email}`
      });

      toast.success("Konfigurasi berhasil disimpan");
      setSuccessMsg("✓ Pengaturan berhasil disimpan!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (e) {
      console.error(e);
      toast.error("Gagal menyimpan pengaturan: " + e.message);
      setErrorMsg("❌ Gagal menyimpan pengaturan: " + e.message);
    }
    setSaving(false);
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
      setErrorMsg("Gagal menambah admin: " + e.message);
    }
  }

  async function removeAdmin(adminId, adminEmail) {
    if (!window.confirm(`Hapus ${adminEmail} dari admin?`)) return;
    try {
      await base44.entities.User.update(adminId, { role: "user" });
      setSuccessMsg("✓ Admin dihapus");
      setTimeout(() => setSuccessMsg(""), 3000);
      await loadData();
    } catch (e) {
      console.error(e);
      setErrorMsg("Gagal menghapus admin: " + e.message);
    }
  }

  async function deleteSimulationData() {
    if (!window.confirm("⚠️ YAKIN? Ini akan menghapus data simulasi. Tindakan ini TIDAK BISA DIBATALKAN.")) return;
    setDeletingSimData(true);
    try {
      const investmentIds = ["69d6ac16b817fa58e538e224", "69d6ac16b817fa58e538e225", "69d6ac16b817fa58e538e226"];
      const alertIds = ["69d6ac61427fef70824fe32a", "69d6ac61427fef70824fe32b", "69d6ac61427fef70824fe32c"];
      const notifIds = ["69d6abc60171dac7dd9eb414", "69d6c10da1db39cbb506cb59"];

      let deleted = 0;
      for (const id of [...investmentIds, ...alertIds, ...notifIds]) {
        try {
          if (investmentIds.includes(id)) await base44.entities.Investment.delete(id);
          else if (alertIds.includes(id)) await base44.entities.Alert.delete(id);
          else await base44.entities.AdminNotification.delete(id);
          deleted++;
        } catch (_) {}
      }

      setSuccessMsg(`✓ Berhasil menghapus ${deleted} record simulasi`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (e) {
      console.error(e);
      setErrorMsg("Gagal menghapus data simulasi: " + e.message);
    }
    setDeletingSimData(false);
  }

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
      <div className="p-8 space-y-6 max-w-3xl">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Pengaturan Admin</h1>

        {successMsg && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{successMsg}</div>
        )}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{errorMsg}</div>
        )}

        {/* SECTION 1: App Settings */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E2E8F0]">
          <h2 className="text-lg font-bold text-[#1A1A1A] mb-4">Pengaturan Aplikasi</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[#8FA4C8] block mb-1.5">Nama Aplikasi</label>
              <input type="text" value={settings.app_name} onChange={e => setSettings({ ...settings, app_name: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]" />
            </div>

            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
              <input type="checkbox" id="maintenance_mode" checked={settings.maintenance_mode}
                onChange={e => setSettings({ ...settings, maintenance_mode: e.target.checked })}
                className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <label htmlFor="maintenance_mode" className="text-sm font-semibold text-red-700 cursor-pointer">Mode Maintenance</label>
                <p className="text-xs text-red-500 mt-0.5">Jika ON, user biasa akan melihat halaman pemeliharaan. Admin tetap bisa akses normal.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <input type="checkbox" id="settings_unlocked" checked={settings.settings_unlocked}
                onChange={e => setSettings({ ...settings, settings_unlocked: e.target.checked })}
                className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <label htmlFor="settings_unlocked" className="text-sm font-semibold text-blue-700 cursor-pointer">Izinkan User Ubah Bahasa & Mata Uang</label>
                <p className="text-xs text-blue-500 mt-0.5">Jika ON, user bisa mengubah bahasa dan mata uang sendiri di halaman Pengaturan. Jika OFF, pilihan terkunci.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[#8FA4C8] block mb-1.5">Harga Premium Bulanan (Rp)</label>
                <input type="number" value={settings.premium_price_monthly}
                  onChange={e => setSettings({ ...settings, premium_price_monthly: parseInt(e.target.value) || 39000 })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]" />
                <p className="text-xs text-[#8FA4C8] mt-1">Default: Rp 39.000</p>
              </div>
              <div>
                <label className="text-xs font-medium text-[#8FA4C8] block mb-1.5">Harga Premium Tahunan (Rp)</label>
                <input type="number" value={settings.premium_price_yearly}
                  onChange={e => setSettings({ ...settings, premium_price_yearly: parseInt(e.target.value) || 299000 })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]" />
                <p className="text-xs text-[#8FA4C8] mt-1">Default: Rp 299.000</p>
              </div>
            </div>

            <button onClick={handleSaveSettings} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#FF6A00] text-white rounded-xl text-sm font-bold hover:bg-[#E55A00] disabled:opacity-60 transition-colors">
              <Save className="w-4 h-4" />
              {saving ? "Menyimpan..." : "Simpan Pengaturan"}
            </button>
          </div>
        </div>

        {/* SECTION 2: Feature Flags */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E2E8F0]">
          <h2 className="text-lg font-bold text-[#1A1A1A] mb-1">Feature Flags</h2>
          <p className="text-xs text-[#8FA4C8] mb-4">Aktifkan atau nonaktifkan fitur tertentu untuk seluruh pengguna.</p>
          <div className="space-y-3">
            {FEATURE_FLAGS.map(({ key, label, desc }) => (
              <div key={key} className="flex items-start gap-3 p-3 bg-[#F8FAFC] rounded-xl">
                <input type="checkbox" id={key} checked={settings[key] !== false}
                  onChange={e => setSettings({ ...settings, [key]: e.target.checked })}
                  className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <label htmlFor={key} className="text-sm font-semibold text-[#1A1A1A] cursor-pointer flex items-center gap-2">
                    {label}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${settings[key] !== false ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {settings[key] !== false ? "ON" : "OFF"}
                    </span>
                  </label>
                  <p className="text-xs text-[#8FA4C8] mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <button onClick={handleSaveSettings} disabled={saving}
            className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-[#FF6A00] text-white rounded-xl text-sm font-bold hover:bg-[#E55A00] disabled:opacity-60 transition-colors">
            <Save className="w-4 h-4" />
            {saving ? "Menyimpan..." : "Simpan Feature Flags"}
          </button>
        </div>

        {/* SECTION 3: Admin Management */}
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
                {a.email !== user?.email && (
                  <button onClick={() => removeAdmin(a.id, a.email)} className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700">
                    Hapus
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-200">
          <h2 className="text-lg font-bold text-red-600 mb-4">⚠️ Danger Zone</h2>
          <button onClick={deleteSimulationData} disabled={deletingSimData}
            className="w-full px-4 py-3 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-60">
            {deletingSimData ? "Menghapus..." : "🗑️ Hapus Sisa Data Simulasi"}
          </button>
          <p className="text-xs text-red-600 mt-2">Menghapus semua investment, alert, dan notifikasi simulasi. Tidak bisa dibatalkan.</p>
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