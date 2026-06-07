import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  LogOut, Trash2, Crown, Pencil, Lock, ChevronRight,
  Plus, X, Check, AlertTriangle, Settings as SettingsIcon
} from "lucide-react";
import ChangePasswordModal from "@/components/profile/ChangePasswordModal";
import EditProfileForm from "@/components/profile/EditProfileForm";
import AddAccountBottomSheet from "@/components/profile/AddAccountBottomSheet";
import EditAccountModal from "@/components/profile/EditAccountModal";
import AccountAvatar from "@/components/ui/AccountAvatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import RiskProfileAssessment from "@/components/settings/RiskProfileAssessment";
import { toast } from "sonner";

function formatRupiah(n) {
  if (n === undefined || n === null) return "Rp 0";
  return "Rp " + Number(n).toLocaleString("id-ID");
}

// ─── Profile completion helper ────────────────────────────────────────────────
function calcCompletion(user) {
  if (!user) return 0;
  const fields = [
    !!(user.display_name || user.full_name),
    !!user.photo_url,
    !!user.whatsapp,
    !!user.date_of_birth,
    !!user.job,
    !!user.monthly_salary,
  ];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

// ─── Sub-screens ─────────────────────────────────────────────────────────────
function RiskScreen({ onBack }) {
  return (
    <div className="min-h-screen bg-[#F2F4F7] pb-10">
      <div className="bg-[#0A0A0A] px-5 pt-10 pb-6">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors">
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
          <div>
            <p className="text-[#8FA4C8] text-xs">Pengaturan</p>
            <h1 className="text-white text-lg font-bold">Profil Risiko Investasi</h1>
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-5 mt-5">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <RiskProfileAssessment />
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProfileSettings() {
  const [user, setUser] = useState(null);
  const { t } = useAppSettings();
  const [screen, setScreen] = useState("main"); // main | risk
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Accounts state
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editAccount, setEditAccount] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteInfo, setDeleteInfo] = useState(null);
  const [deletingAcc, setDeletingAcc] = useState(false);
  const [showAddBottomSheet, setShowAddBottomSheet] = useState(false);
  const [bottomSheetType, setBottomSheetType] = useState("bank");

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      return base44.entities.Account.filter({ created_by: u.email });
    }).then(list => {
      setAccounts(list || []);
    }).finally(() => setLoadingAccounts(false));
  }, []);

  async function handleLogout() { base44.auth.logout('/'); }
  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      const me = await base44.auth.me();
      const email = me?.email;
      if (email) {
        // Delete user-owned entity data (best-effort, ignore individual failures)
        const entitiesToWipe = [
          "Transaction", "Account", "SavingsGoal", "Budget", "Debt",
          "CustomCategory", "Investment", "InvestmentTransaction", "InvestmentWatchlist",
          "Subscription", "DetectedSubscription", "Reminder", "Alert",
          "GamificationProfile", "DailyMission", "Achievement", "Challenge",
          "BossBattleContribution", "WeeklyRecap", "ReceiptScan", "MoodCheckIn",
          "NanaConversation", "NanaPreferences", "AppSettings", "UserPersona",
          "UserRiskProfile", "FinancialHealthScore", "CategoryLearning",
          "ShareableCard", "ExportLog", "FeedbackReport", "SharedWalletTransaction",
        ];
        for (const ent of entitiesToWipe) {
          try {
            const rows = await base44.entities[ent].filter({ created_by: email });
            await Promise.all((rows || []).map(r => base44.entities[ent].delete(r.id).catch(() => {})));
          } catch {}
        }
      }
      // Attempt platform-level account deletion if SDK supports it
      try { if (typeof base44.auth.deleteAccount === "function") await base44.auth.deleteAccount(); } catch {}
      toast.success("Akun & semua data berhasil dihapus.");
      // Force logout & redirect to landing
      setTimeout(() => base44.auth.logout('/'), 600);
    } catch {
      toast.error("Gagal menghapus akun. Coba lagi.");
      setDeleting(false);
    }
  }

  // Account actions
  async function confirmDelete(acc) {
    if (acc.is_default && accounts.length > 1) {
      toast.error("Tidak bisa menghapus rekening utama saat masih ada rekening lain.");
      return;
    }
    const txs = await base44.entities.Transaction.filter({ account_id: acc.id });
    setDeleteTarget(acc);
    setDeleteInfo({ count: txs.length });
  }

  async function handleDeleteAcc() {
    if (!deleteTarget) return;
    setDeletingAcc(true);
    const txs = await base44.entities.Transaction.filter({ account_id: deleteTarget.id });
    await Promise.all(txs.map(tx => base44.entities.Transaction.update(tx.id, { account_id: null })));
    await base44.entities.Account.delete(deleteTarget.id);
    setAccounts(prev => prev.filter(a => a.id !== deleteTarget.id));
    toast.success(`Rekening "${deleteTarget.name}" dihapus.`);
    setDeletingAcc(false);
    setDeleteTarget(null);
    setDeleteInfo(null);
  }

  if (screen === "risk") return <RiskScreen onBack={() => setScreen("main")} />;

  const completion = calcCompletion(user);
  const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);

  return (
    <div className="min-h-screen bg-[#F2F4F7] pb-10">
      {/* Header */}
      <div className="bg-[#0A0A0A] px-5 pt-10 pb-8">
        <div className="max-w-2xl mx-auto flex items-start justify-between gap-3">
          <div>
            <p className="text-[#8FA4C8] text-sm font-medium">{t('settings_preferences')}</p>
            <h1 className="text-white text-2xl font-bold mt-0.5">Profil Saya</h1>
          </div>
          <Link
            to={createPageUrl("Settings")}
            aria-label="Pengaturan"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors flex-shrink-0"
          >
            <SettingsIcon className="w-5 h-5" />
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 mt-6 space-y-4">

        {/* ── Profile + Completion Card (merged, completion on top) ── */}
        {user && !editingProfile && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Simple completion bar on top — hidden when 100% complete */}
            {completion < 100 && (
              <div className="px-5 pt-4 pb-3">
                <div className="flex items-center gap-2">
                  <p className="text-[11px] font-medium text-[#8FA4C8]">Kelengkapan Profil</p>
                  <div className="flex-1 h-1.5 bg-[#F2F4F7] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${completion}%`,
                        background: completion >= 60 ? "#F97316" : "#FBBF24"
                      }}
                    />
                  </div>
                  <p className="text-[11px] font-bold text-[#F97316]">{completion}%</p>
                </div>
              </div>
            )}

            <div className={`px-5 ${completion < 100 ? 'pb-5' : 'py-5'}`}>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-[#F97316] flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                  {user.photo_url
                    ? <img src={user.photo_url} alt="Foto" className="w-full h-full object-cover" />
                    : (user.display_name || user.full_name)?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#1A1A1A] text-lg truncate">{user.display_name || user.full_name || t('settings_user_label')}</p>
                  <p className="text-sm text-[#8FA4C8] mt-0.5 truncate">{user.email}</p>
                  {user.job && <p className="text-xs text-[#8FA4C8] mt-0.5 truncate">💼 {user.job}{user.city ? ` · 📍 ${user.city}` : ""}</p>}
                  {user.role && <p className="text-xs font-semibold text-[#F97316] mt-1 uppercase tracking-wider">{user.role}</p>}
                </div>
                <button onClick={() => setEditingProfile(true)}
                  className="w-10 h-10 rounded-full bg-[#F2F4F7] flex items-center justify-center hover:bg-[#E2E8F0] transition-colors flex-shrink-0">
                  <Pencil className="w-4 h-4 text-[#8FA4C8]" />
                </button>
              </div>
            </div>
          </div>
        )}

        {user && editingProfile && (
          <EditProfileForm
            user={user}
            onSaved={(updated) => { setUser(updated); setEditingProfile(false); }}
            onCancel={() => setEditingProfile(false)}
          />
        )}

        {/* ── Rekening & Dompet ────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-3 flex items-center justify-between">
            <div>
              <p className="text-base font-bold text-[#1A1A1A]">Rekening & Dompet</p>
              <p className="text-xs text-[#8FA4C8] mt-0.5">Total: <span className="font-semibold text-[#1A1A1A]">{formatRupiah(totalBalance)}</span></p>
            </div>
            <Link to={createPageUrl("Accounts")} className="text-xs font-semibold text-[#F97316] hover:opacity-80 transition-opacity">
              Semua →
            </Link>
          </div>

          {loadingAccounts ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#F2F4F7] border-t-[#F97316] rounded-full animate-spin" />
            </div>
          ) : (
            <div className="px-4 pb-4 space-y-3">
              {[
                { key: "bank", label: "BANK", icon: "🏦" },
                { key: "ewallet", label: "E-WALLET", icon: "📱" },
                { key: "investasi", label: "INVESTASI", icon: "📈" },
                { key: "cash", label: "CASH", icon: "💵" },
              ].map(group => {
                const groupAccounts = accounts.filter(a => (a.type || "").toLowerCase() === group.key);
                return (
                  <div key={group.key}>
                    <p className="text-[9px] font-bold text-[#8FA4C8] uppercase tracking-widest mb-1.5">{group.label}</p>
                    <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
                      {groupAccounts.map(acc => (
                        <button key={acc.id}
                          onClick={() => { setEditAccount(acc); setShowAccountModal(true); }}
                          className="flex-shrink-0 bg-white border border-[#E2E8F0] rounded-xl px-2.5 py-2 text-left hover:border-[#F97316]/50 transition-all flex items-center gap-2 min-w-0"
                          style={{ maxWidth: 140 }}>
                          <AccountAvatar logoUrl={acc.logo_url} name={acc.name} color={acc.color || "#F97316"} />
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-[#1A1A1A] truncate leading-tight">{acc.name}</p>
                            <p className="text-[10px] font-bold truncate" style={{ color: (acc.balance || 0) < 0 ? "#EF4444" : "#27AE60" }}>
                              {formatRupiah(acc.balance)}
                            </p>
                          </div>
                        </button>
                      ))}
                      <button
                        onClick={() => { setBottomSheetType(group.key === "investasi" ? "investasi" : group.key); setShowAddBottomSheet(true); }}
                        className="flex-shrink-0 border border-dashed border-[#E2E8F0] rounded-xl px-3 py-2 flex items-center gap-1.5 hover:border-[#F97316] hover:bg-[#FFF7ED] transition-all">
                        <Plus className="w-3.5 h-3.5 text-[#8FA4C8]" />
                        <p className="text-[10px] font-medium text-[#8FA4C8] whitespace-nowrap">Tambah</p>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Tile navigation: Langganan, Nana, Risiko ──────── */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <Link to={createPageUrl("Subscription")}
            className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#F8FAFC] transition-colors border-b border-[#F2F4F7]">
            <div className="w-8 h-8 rounded-xl bg-[#FFF3E0] flex items-center justify-center flex-shrink-0">
              <Crown className="w-4 h-4 text-[#F97316]" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-[#1A1A1A]">Langganan</p>
              <p className="text-xs text-[#8FA4C8]">
                {user?.subscription_status === "active" ? "Premium aktif" : user?.subscription_status === "pending" ? "Menunggu konfirmasi" : "Paket Free"}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8FA4C8]" />
          </Link>

          <button onClick={() => setScreen("risk")}
            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#F8FAFC] transition-colors border-b border-[#F2F4F7]">
            <div className="w-8 h-8 rounded-xl bg-[#E8F5E9] flex items-center justify-center flex-shrink-0 text-lg">
              📊
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-[#1A1A1A]">Profil Risiko Investasi</p>
              <p className="text-xs text-[#8FA4C8]">Tentukan toleransi risiko kamu</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8FA4C8]" />
          </button>

          <Link to={createPageUrl("Tips")}
            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#F8FAFC] transition-colors">
            <div className="w-8 h-8 rounded-xl bg-[#FFF3E0] flex items-center justify-center flex-shrink-0 text-lg">
              💡
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-[#1A1A1A]">Tips & Bantuan</p>
              <p className="text-xs text-[#8FA4C8]">Panduan penggunaan & FAQ</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8FA4C8]" />
          </Link>
        </div>

        {/* ── Security ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-2">
            <p className="text-xs font-bold text-[#8FA4C8] uppercase tracking-widest">Keamanan</p>
          </div>
          <button onClick={() => setShowChangePassword(true)}
            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#F8FAFC] transition-colors border-t border-[#F2F4F7]">
            <div className="w-8 h-8 rounded-xl bg-[#E3F2FD] flex items-center justify-center flex-shrink-0">
              <Lock className="w-4 h-4 text-[#1976D2]" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-[#1A1A1A]">Ganti Password</p>
              <p className="text-xs text-[#8FA4C8]">Perbarui password akun kamu</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8FA4C8]" />
          </button>
        </div>

        {/* ── Account Management ───────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-2">
            <p className="text-xs font-bold text-[#8FA4C8] uppercase tracking-widest">{t('settings_account')}</p>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#FFF5F5] transition-colors border-t border-[#F2F4F7] text-[#FF6B6B]">
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">{t('settings_logout')}</span>
          </button>
          <button onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#FFF5F5] transition-colors border-t border-[#F2F4F7] text-[#FF6B6B]">
            <Trash2 className="w-5 h-5" />
            <span className="font-medium text-sm">Hapus Akun Selamanya</span>
          </button>
        </div>

        <div className="text-center pb-4 space-y-1">
          <p className="text-[11px] text-[#8FA4C8]/60">Atur Pintar · PT Rideff Vreka Tech</p>
          <p className="text-[10px] text-[#8FA4C8]/40 italic">"Kelola uangmu hari ini, raih kebebasan finansialmu esok hari."</p>
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────── */}
      {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}

      {showAddBottomSheet && (
        <AddAccountBottomSheet
          accountType={bottomSheetType}
          onClose={() => setShowAddBottomSheet(false)}
          onSave={(acc) => {
            setAccounts(prev => [...prev, acc]);
            setShowAddBottomSheet(false);
            toast.success(`${acc.name} berhasil ditambahkan ✓`);
          }}
        />
      )}

      {showAccountModal && editAccount && (
        <EditAccountModal
          account={editAccount}
          onClose={() => { setShowAccountModal(false); setEditAccount(null); }}
          onSave={(acc) => {
            setAccounts(prev => prev.map(a => a.id === acc.id ? acc : a));
            setShowAccountModal(false);
            setEditAccount(null);
            toast.success(`${acc.name} diperbarui ✓`);
          }}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <p className="font-bold text-[#1A1A1A]">Hapus Rekening?</p>
            </div>
            <p className="text-sm text-[#4A5568] mb-5">
              Rekening <span className="font-semibold">"{deleteTarget.name}"</span> akan dihapus.{" "}
              <span className="font-semibold text-red-500">{deleteInfo?.count || 0} transaksi</span> tidak akan ikut terhapus.
            </p>
            <div className="flex gap-2">
              <button onClick={() => { setDeleteTarget(null); setDeleteInfo(null); }}
                className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#4A5568] hover:bg-[#F2F4F7] transition-colors">
                Batal
              </button>
              <button onClick={handleDeleteAcc} disabled={deletingAcc}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50">
                {deletingAcc ? "..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogTitle>Hapus Akun Selamanya?</AlertDialogTitle>
          <AlertDialogDescription>
            Tindakan ini tidak dapat dibatalkan. Semua data akun Anda akan dihapus secara permanen.
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} disabled={deleting} className="bg-[#FF6B6B] hover:bg-[#FF5252]">
              {deleting ? "Menghapus..." : "Hapus Akun"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}