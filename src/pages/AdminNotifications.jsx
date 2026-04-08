import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AdminLayout from "@/components/admin/AdminLayout";
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

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u?.role === "admin") loadData();
      else setLoading(false);
    });
  }, []);

  async function loadData() {
    setLoading(true);
    const [notifRes, usersRes] = await Promise.all([
      base44.entities.AdminNotification.list("-created_date", 100),
      base44.functions.invoke("adminGetUsers", {}),
    ]);
    setNotifications(notifRes);
    setAllUsers(usersRes.data?.users || []);
    setLoading(false);
  }

  async function sendToInactiveUsers() {
    if (!window.confirm("Send notification to all users inactive >14 days?")) return;
    setSending(true);
    try {
      const allUsers = await base44.entities.User.list();
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      const inactive = allUsers.filter(u => new Date(u.updated_date || u.created_date) < fourteenDaysAgo);
      for (const u of inactive) {
        await base44.entities.AdminNotification.create({
          title: "We miss you!",
          message: "Haven't seen you in a while. Come back to Atur Pintar to manage your finances.",
          target_type: "specific",
          target_email: u.email,
          is_read: false,
          read_by: []
        });
      }
      await loadData();
    } catch (e) {}
    setSending(false);
  }

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
    setNotifications(prev => [created, ...prev]);
    setForm({ title: "", message: "", target_type: "all", target_email: "" });
    setSending(false);
    setShowForm(false);
  }

  async function handleDelete(id) {
    await base44.entities.AdminNotification.delete(id);
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
              <button onClick={sendToInactiveUsers} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 shadow-sm">
                <Send className="w-4 h-4" />
                Inactive Users
              </button>
            </div>
          </div>
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