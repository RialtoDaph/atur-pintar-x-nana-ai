import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X } from 'lucide-react';

export default function AdminNotificationPanel({ user, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadNotifications();
  }, [user]);

  async function loadNotifications() {
    setLoading(true);
    try {
      const allNotifs = await base44.entities.AdminNotification.list();
      const relevant = allNotifs.filter(n => 
        n.target_type === 'all' || 
        (n.target_type === 'specific' && n.target_email === user.email)
      );
      setNotifications(relevant);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
    setLoading(false);
  }

  async function markAsRead(notif) {
    try {
      const readBy = notif.read_by || [];
      if (readBy.includes(user.email)) return; // already read by this user
      const newReadBy = [...readBy, user.email];

      // For broadcast (target_type === 'all'), do NOT touch is_read — it's a
      // shared record and would leak read-status to other users. Only flip
      // is_read for user-specific notifications.
      const update = notif.target_type === 'specific'
        ? { read_by: newReadBy, is_read: true }
        : { read_by: newReadBy };

      await base44.entities.AdminNotification.update(notif.id, update);
      await loadNotifications();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-white w-full sm:w-96 rounded-t-2xl sm:rounded-2xl max-h-96 overflow-y-auto p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#1A1A1A]">Notifikasi Admin</h2>
          <button onClick={onClose} className="p-1 hover:bg-[#F8FAFC] rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-3 border-[#FF6A00] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <p className="text-center text-[#8FA4C8] py-8">Tidak ada notifikasi</p>
        ) : (
          <div className="space-y-3">
            {notifications.map(notif => {
              const isRead = notif.read_by?.includes(user.email);
              return (
                <button
                  key={notif.id}
                  onClick={() => markAsRead(notif)}
                  className={`w-full text-left p-4 rounded-xl border transition-colors ${
                    isRead
                      ? 'bg-[#F8FAFC] border-[#E2E8F0] text-[#8FA4C8]'
                      : 'bg-white border-[#FF6A00] text-[#1A1A1A]'
                  }`}
                >
                  <p className="font-semibold">{notif.title}</p>
                  <p className="text-sm mt-1">{notif.message}</p>
                  <p className="text-xs mt-2 opacity-60">{new Date(notif.created_date).toLocaleDateString('id-ID')}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}