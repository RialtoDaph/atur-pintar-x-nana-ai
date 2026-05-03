import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminActivityFeed from "@/components/admin/AdminActivityFeed";
import { Bell, Send, Users, User, Trash2, RefreshCw, Plus, X } from "lucide-react";

export default function AdminNotifications() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", target_type: "all", target_email: "" });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [inactiveUsers, setInactiveUsers] = useState([]);
  const [showReengagement, setShowReengagement] = useState(false);

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
      const [notifRes, usersRes, transRes] = await Promise.all([
        base44.entities.AdminNotification.list("-created_date", 100),
        base44.functions.invoke("adminGetUsers", {}),
        base44.entities.Transaction.list()
      ]);
      setNotifications(notifRes);
      const users = usersRes.data?.users || [];
      setAllUsers(users);
      
      // Calculate inactive users (no transactions in 14 days)
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      const userLastActivity = {};
      transRes.forEach(t => {
        if (!userLastActivity[t.created_by] || new Date(t.created_date) > new Date(userLastActivity[t.created_by])) {
          userLastActivity[t.created_by] = t.created_date;
        }
      });
      
      const inactive = users.filter(u => {
        const lastDate = userLastActivity[u.email] ? new Date(userLastActivity[u.email]) : new Date(u.created_date);
        return new Date() - lastDate > 14 * 24 * 60 * 60 * 1000;
      }).map(u => ({
        ...u,
        daysSinceActivity: Math.floor((new Date() - new Date(userLastActivity[u.email] || u.created_date)) / (1000 * 60 * 60 * 24))
      }));
      setInactiveUsers(inactive);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  const sendToInactiveUser = async (userEmail, userName, daysSince) => {
    try {
      const n = await base44.entities.AdminNotification.create({
        title: "📱 Halo " + userName + "!",
        message: `Sudah ${daysSince} hari kamu tidak mencatat keuangan. Yuk balik lagi, Nana kangen nih! 😊`,
        target_type: "specific",
        target_email: userEmail,
        is_read: false,
        read_by: []
      });
      
      // Log to SystemLog
      await base44.entities.SystemLog.create({
        log_type: "activity",
        user_email: user?.email,
        action: "reengagement_sent",
        severity: "info",
        details: `Sent to ${userEmail}`
      });
    } catch (e) {
      console.error(e);
    }
  };

  const sendToAllInactive = async () => {
    if (!window.confirm(`Send reminder to ${inactiveUsers.length} inactive users?`)) return;
    setSending(true);
    for (const u of inactiveUsers) {
      await sendToInactiveUser(u.email, u.full_name || u.email, u.daysSinceActivity);
    }
    setSending(false);
    await loadData();
  };

  const applyTemplate = (template) => {
    const templates = {
      approved: { title: "✅ Pembayaran Premium Diterima", message: "Terima kasih atas pembayaran Anda. Akun Anda sudah diupgrade ke premium! Nikmati fitur-fitur eksklusif." },
      welcome: { title: "🎉 Selamat di Premium!", message: "Selamat datang di Atur Pintar Premium! Akses unlimited analitik, laporan, dan fitur canggih lainnya." },
      renewal: { title: "⏰ Perpanjangan Berakhir Segera", message: "Langganan premium Anda akan berakhir dalam 3 hari. Perpanjang sekarang untuk akses tanpa gangguan!" },
      reengagement: { title: "📱 Kami Rindu Kamu!", message: "Sudah lama tidak ada berita dari Anda. Yuk kembali mencatat keuangan dan raih target Anda!" },
      maintenance: { title: "🔧 Pemeliharaan Sistem", message: "Atur Pintar akan melakukan pemeliharaan sistem. Kami akan offline selama beberapa jam. Terima kasih atas kesabaran Anda." }
    };
    if (templates[template]) {
      setForm({ ...form, ...templates[template] });
    }
  };

  async function handleSend() {
    if (!form.title.trim() || !form.message.trim()) return;
    if (form.target_type === "specific" && !form.target_email.trim()) return;
    setSending(true);
    const created = await base44.entities.AdminNotification.create({
      title: form.title,
      message: form.message,
      target_type: form.target_type,
      target_email: form.target_type === "specific" ? form.target_email : "",
      is_read: false,
      read_by: [],
    });
    
    // Log to SystemLog
    await base44.entities.SystemLog.create({
      log_type: "activity",
      user_email: user?.email,
      action: "notification_sent",
      severity: "info",
      details: `Title: ${form.title}, Target: ${form.target_type === "all" ? "Semua User" : form.target_email}`
    });
    
    setNotifications(prev => [created, ...prev]);
    setForm({ title: "", message: "", target_type: "all", target_email: "" });
    setSending(false);
    setShowForm(false);
  }

  async function handleDelete(id) {
    const notif = notifications.find(n => n.id === id);
    await base44.entities.AdminNotification.delete(id);
    
    // Log to SystemLog
    await base44.entities.SystemLog.create({
      log_type: "activity",
      user_email: user?.email,
      action: "notification_deleted",
      severity: "info",
      details: `Deleted: ${notif?.title}`
    });
    
    setNotifications(prev => prev.filter(n => n.id !== id));
    setDeleteConfirm(null);
  }

  const formatDate = (d) => d ? new Date(d).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";

  if (loading) return (
    <AdminLayout currentPage="AdminNotifications">
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-[#FF6A00] border-t-transparent rounded-full animate-spin" />
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout currentPage="AdminNotifications">
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">Notification System</h1>
            <p className="text-sm text-[#8FA4C8] mt-1">Kirim pengumuman ke semua atau user tertentu</p>
          </div>
          <div className="flex gap-3">
            <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E2E8F0] rounded-xl text-sm font-medium hover:bg-[#F8FAFC] shadow-sm">
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="flex gap-3">
              <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-[#FF6A00] text-white rounded-xl text-sm font-medium hover:bg-[#E55A00] shadow-sm">
                <Plus className="w-4 h-4" />
                Kirim Notifikasi
              </button>
              <button onClick={() => setShowReengagement(!showReengagement)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 shadow-sm">
                <Send className="w-4 h-4" />
                Re-engagement ({inactiveUsers.length})
              </button>
            </div>
          </div>
        </div>

        {/* Real-time Activity Feed */}
        <div className="mb-6">
          <AdminActivityFeed />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1"><Bell className="w-4 h-4 text-[#FF6A00]" /><p className="text-xs text-[#8FA4C8]">Total Notifikasi</p></div>
            <p className="text-2xl font-bold text-[#1A1A1A]">{notifications.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1"><Users className="w-4 h-4 text-blue-500" /><p className="text-xs text-[#8FA4C8]">Global</p></div>
            <p className="text-2xl font-bold text-blue-600">{notifications.filter(n => n.target_type === "all").length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1"><User className="w-4 h-4 text-purple-500" /><p className="text-xs text-[#8FA4C8]">Targeted</p></div>
            <p className="text-2xl font-bold text-purple-600">{notifications.filter(n => n.target_type === "specific").length}</p>
          </div>
        </div>

        {/* Re-engagement Section */}
        {showReengagement && (
          <div className="mb-8 bg-white rounded-xl p-6 shadow-sm border border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#1A1A1A]">Re-engagement ({inactiveUsers.length} users)</h2>
              <button onClick={() => setShowReengagement(false)} className="text-sm text-[#8FA4C8] hover:text-[#1A1A1A]">×</button>
            </div>
            {inactiveUsers.length === 0 ? (
              <p className="text-sm text-[#8FA4C8]">Semua user aktif! Tidak ada yang perlu di-reengage.</p>
            ) : (
              <>
                <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto">
                  {inactiveUsers.map(u => (
                    <div key={u.id} className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#1A1A1A]">{u.full_name || u.email}</p>
                        <p className="text-xs text-[#8FA4C8]">{u.email} • {u.daysSinceActivity} days inactive</p>
                      </div>
                      <button onClick={() => sendToInactiveUser(u.email, u.full_name || u.email, u.daysSinceActivity)}
                        className="px-3 py-1 bg-[#FF6A00] text-white text-xs font-bold rounded hover:bg-[#E55A00]">Send</button>
                    </div>
                  ))}
                </div>
                <button onClick={sendToAllInactive} disabled={sending}
                  className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
                  {sending ? "Sending..." : "Send to All Inactive"}
                </button>
              </>
            )}
          </div>
        )}

        {/* Notification Templates */}
        <div className="mb-6 bg-white rounded-xl p-6 shadow-sm border border-[#E2E8F0]">
          <p className="text-sm font-semibold text-[#1A1A1A] mb-3">Templates</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {['approved', 'welcome', 'renewal', 'reengagement', 'maintenance'].map(t => (
              <button key={t}
                onClick={() => applyTemplate(t)}
                className="px-3 py-2 text-xs font-medium text-[#FF6A00] border border-[#FF6A00] rounded-lg hover:bg-[#FF6A00]/5">
                {t === 'approved' ? '✅ Approved' : t === 'welcome' ? '🎉 Welcome' : t === 'renewal' ? '⏰ Renewal' : t === 'reengagement' ? '📱 Reeng' : '🔧 Maintenance'}
              </button>
            ))}
          </div>
        </div>

        {/* Notification history */}
        <div className="space-y-3">
          {notifications.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
              <Bell className="w-12 h-12 text-[#E2E8F0] mx-auto mb-3" />
              <p className="text-sm text-[#8FA4C8]">Belum ada notifikasi dikirim</p>
            </div>
          )}
          {notifications.map(n => (
            <div key={n.id} className="bg-white rounded-2xl p-5 shadow-sm flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                n.target_type === "all" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
              }`}>
                {n.target_type === "all" ? <Users className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-[#1A1A1A]">{n.title}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    n.target_type === "all" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                  }`}>
                    {n.target_type === "all" ? "Semua User" : `@${n.target_email}`}
                  </span>
                </div>
                <p className="text-sm text-[#8FA4C8] mt-1 leading-relaxed">{n.message}</p>
                <p className="text-xs text-[#8FA4C8] mt-2">{formatDate(n.created_date)}</p>
              </div>
              <button onClick={() => setDeleteConfirm(n)} className="p-1.5 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 flex-shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Send form modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-[#1A1A1A]">Kirim Notifikasi</h3>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-[#F2F4F7]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-[#8FA4C8] mb-1.5 block">Target</label>
                  <div className="flex gap-3">
                    <button onClick={() => setForm(p => ({ ...p, target_type: "all" }))}
                      className={`flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${form.target_type === "all" ? "border-[#FF6A00] bg-[#FF6A00]/5 text-[#FF6A00]" : "border-[#E2E8F0] hover:bg-[#F8FAFC]"}`}>
                      <Users className="w-4 h-4" /> Semua User
                    </button>
                    <button onClick={() => setForm(p => ({ ...p, target_type: "specific" }))}
                      className={`flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${form.target_type === "specific" ? "border-[#FF6A00] bg-[#FF6A00]/5 text-[#FF6A00]" : "border-[#E2E8F0] hover:bg-[#F8FAFC]"}`}>
                      <User className="w-4 h-4" /> User Tertentu
                    </button>
                  </div>
                </div>

                {form.target_type === "specific" && (
                  <div>
                    <label className="text-xs font-medium text-[#8FA4C8] mb-1.5 block">Email User</label>
                    <select value={form.target_email} onChange={e => setForm(p => ({ ...p, target_email: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6A00]">
                      <option value="">Pilih user...</option>
                      {allUsers.map(u => (
                        <option key={u.id} value={u.email}>{u.full_name} ({u.email})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-[#8FA4C8] mb-1.5 block">Judul</label>
                  <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="contoh: Update fitur baru..." className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]" />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#8FA4C8] mb-1.5 block">Pesan</label>
                  <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                    placeholder="Tulis pesan notifikasi..." rows={4}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00] resize-none" />
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-medium hover:bg-[#F8FAFC]">
                  Batal
                </button>
                <button onClick={handleSend} disabled={sending || !form.title || !form.message}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF6A00] text-white text-sm font-medium hover:bg-[#E55A00] disabled:opacity-60">
                  <Send className="w-4 h-4" />
                  {sending ? "Mengirim..." : "Kirim"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete confirm */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">Hapus Notifikasi?</h3>
              <p className="text-sm text-[#8FA4C8] mb-4">Notifikasi <strong>{deleteConfirm.title}</strong> akan dihapus.</p>
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