import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  LogOut, Trash2, Crown, Pencil, Lock, ChevronRight,
  Plus, Star, RefreshCw, X, Check, AlertTriangle
} from "lucide-react";
import ChangePasswordModal from "@/components/profile/ChangePasswordModal";
import EditProfileForm from "@/components/profile/EditProfileForm";
import AddAccountBottomSheet from "@/components/profile/AddAccountBottomSheet";
import AccountLogo from "@/components/transactions/AccountLogo";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import NanaPreferencesSettings from "@/components/settings/NanaPreferencesSettings";
import RiskProfileAssessment from "@/components/settings/RiskProfileAssessment";
import { toast } from "sonner";

// ─── Account presets ────────────────────────────────────────────────────────
const ACCOUNT_PRESETS = [
  { group: "Bank", icon: "🏦", color: "#1976D2", items: ["BCA", "Mandiri", "BNI", "BRI", "BSI", "Jenius", "SeaBank"] },
  { group: "E-Wallet", icon: "📱", color: "#7B1FA2", items: ["GoPay", "OVO", "DANA", "ShopeePay", "LinkAja"] },
  { group: "Investment", icon: "📈", color: "#16A34A", items: ["Bibit", "Pluang", "Bareksa", "Manulife", "BNI Investasi", "Ipotfund", "CommonWealth"] },
  { group: "Cash", icon: "💵", color: "#388E3C", items: ["Dompet", "Celengan", "Kas"] },
];

const TYPE_MAP = { "Bank": "bank", "E-Wallet": "ewallet", "Cash": "cash", "Investment": "investment" };
const DEFAULT_ICONS = ["🏦", "💵", "📱", "💳", "🏧", "🐷", "💰", "🎯"];
const DEFAULT_COLORS = ["#F97316", "#1976D2", "#388E3C", "#7B1FA2", "#F57C00", "#E91E63", "#00BCD4", "#607D8B"];

function formatRupiah(n) {
  if (n === undefined || n === null) return "Rp 0";
  return "Rp " + Number(n).toLocaleString("id-ID");
}

// ─── Account Modal ────────────────────────────────────────────────────────────
function AccountModal({ account, defaultType, onClose, onSave }) {
  const [form, setForm] = useState({
    name: account?.name || "",
    type: account?.type || defaultType || "bank",
    balance: account?.balance || 0,
    icon: account?.icon || "🏦",
    color: account?.color || "#F97316",
    is_default: account?.is_default || false,
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    if (account?.id) {
      const updated = await base44.entities.Account.update(account.id, form);
      onSave(updated);
    } else {
      const created = await base44.entities.Account.create(form);
      onSave(created);
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#F2F4F7]">
          <p className="font-bold text-[#1A1A1A]">{account?.id ? "Edit Rekening" : "Tambah Rekening"}</p>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#F2F4F7]"><X className="w-5 h-5 text-[#8FA4C8]" /></button>
        </div>
        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <p className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2">Icon</p>
            <div className="flex gap-2 flex-wrap">
              {DEFAULT_ICONS.map(ic => (
                <button key={ic} onClick={() => setForm(f => ({ ...f, icon: ic }))}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${form.icon === ic ? "ring-2 ring-[#F97316] bg-[#F97316]/10" : "bg-[#F2F4F7]"}`}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5">Nama Rekening</p>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g., Rekening BCA, OVO, Dompet"
              className="w-full px-4 py-3 bg-[#F2F4F7] rounded-xl text-sm text-[#1A1A1A] outline-none focus:ring-2 focus:ring-[#F97316]/30" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5">Saldo Awal</p>
            <input type="text" inputMode="numeric"
              value={form._balanceDisplay ?? (form.balance ? Number(form.balance).toLocaleString("id-ID") : "")}
              onChange={e => {
                const raw = e.target.value.replace(/[^0-9]/g, "");
                setForm(f => ({ ...f, balance: parseFloat(raw) || 0, _balanceDisplay: raw === "" ? "" : Number(raw).toLocaleString("id-ID") }));
              }}
              placeholder="0"
              className="w-full px-4 py-3 bg-[#F2F4F7] rounded-xl text-sm text-[#1A1A1A] outline-none focus:ring-2 focus:ring-[#F97316]/30" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#1A1A1A]">Rekening Utama</p>
              <p className="text-xs text-[#8FA4C8]">Default saat catat transaksi</p>
            </div>
            <button onClick={() => setForm(f => ({ ...f, is_default: !f.is_default }))}
              className={`w-11 h-6 rounded-full transition-colors relative ${form.is_default ? "bg-[#F97316]" : "bg-[#E2E8F0]"}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.is_default ? "left-6" : "left-1"}`} />
            </button>
          </div>
        </div>
        <div className="px-5 pb-6 pt-2">
          <button onClick={handleSave} disabled={saving || !form.name.trim()}
            className="w-full py-3.5 bg-[#F97316] text-white rounded-2xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
            {account?.id ? "Simpan Perubahan" : "Buat Rekening"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Profile completion helper ────────────────────────────────────────────────
function calcCompletion(user) {
  if (!user) return 0;
  const fields = [
    !!user.full_name,
    !!user.photo_url,
    !!user.whatsapp,
    !!user.date_of_birth,
    !!user.job,
    !!user.monthly_salary,
  ];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

// ─── Sub-screens ─────────────────────────────────────────────────────────────
function NanaScreen({ onBack }) {
  return (
    <div className="min-h-screen bg-[#F2F4F7] pb-10">
      <div className="bg-[#0A0A0A] px-5 pt-10 pb-6">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors">
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
          <div>
            <p className="text-[#8FA4C8] text-xs">Pengaturan</p>
            <h1 className="text-white text-lg font-bold">Preferensi Nana AI</h1>
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-5 mt-5">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <NanaPreferencesSettings />
        </div>
      </div>
    </div>
  );
}

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
  const [screen, setScreen] = useState("main"); // main | nana | risk
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
  const [syncing, setSyncing] = useState(null);
  const [presetOpen, setPresetOpen] = useState(null);
  const [defaultAccountType, setDefaultAccountType] = useState("bank");
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
    try { await base44.auth.deleteAccount(); } catch {}
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

  async function syncBalance(acc) {
    setSyncing(acc.id);
    const txs = await base44.entities.Transaction.filter({ account_id: acc.id });
    const income = txs.filter(t => !t.is_deleted && t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
    const expense = txs.filter(t => !t.is_deleted && t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
    const savings = txs.filter(t => !t.is_deleted && t.type === 'savings').reduce((s, t) => s + (t.amount || 0), 0);
    const newBalance = income - expense - savings;
    await base44.entities.Account.update(acc.id, { balance: newBalance });
    setAccounts(prev => prev.map(a => a.id === acc.id ? { ...a, balance: newBalance } : a));
    toast.success(`Saldo ${acc.name}: ${formatRupiah(newBalance)}`);
    setSyncing(null);
  }

  async function setDefault(acc) {
    await Promise.all(accounts.map(a => base44.entities.Account.update(a.id, { is_default: a.id === acc.id })));
    setAccounts(prev => prev.map(a => ({ ...a, is_default: a.id === acc.id })));
  }

  async function addPreset(preset, itemName) {
    const typeKey = TYPE_MAP[preset.group] || "bank";
    const created = await base44.entities.Account.create({
      name: itemName,
      type: typeKey,
      balance: 0,
      icon: preset.icon,
      color: preset.color,
      is_default: accounts.length === 0,
    });
    setAccounts(prev => [...prev, created]);
    toast.success(`${itemName} ditambahkan ✓`);
    setPresetOpen(null);
  }

  if (screen === "nana") return <NanaScreen onBack={() => setScreen("main")} />;
  if (screen === "risk") return <RiskScreen onBack={() => setScreen("main")} />;

  const completion = calcCompletion(user);
  const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);
  const typeLabel = { bank: "Bank", cash: "Cash", ewallet: "E-Wallet", other: "Lainnya" };

  return (
    <div className="min-h-screen bg-[#F2F4F7] pb-10">
      {/* Header */}
      <div className="bg-[#0A0A0A] px-5 pt-10 pb-8">
        <div className="max-w-2xl mx-auto">
          <p className="text-[#8FA4C8] text-sm font-medium">{t('settings_preferences')}</p>
          <h1 className="text-white text-2xl font-bold mt-0.5">Profil Saya</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 mt-6 space-y-4">

        {/* ── Profile Completion Bar ────────────────────────── */}
        {user && !editingProfile && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-[#1A1A1A]">Kelengkapan Profil</p>
              <p className="text-xs font-bold text-[#FF6A00]">{completion}%</p>
            </div>
            <div className="w-full h-2 bg-[#F2F4F7] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${completion}%`,
                  background: completion === 100 ? "#22C55E" : completion >= 60 ? "#F97316" : "#FBBF24"
                }}
              />
            </div>
            {completion < 100 && (
              <p className="text-[10px] text-[#8FA4C8] mt-1.5">
                {completion < 50 ? "Lengkapi profil untuk pengalaman lebih personal 👆" : "Hampir lengkap! Isi sisa info profil kamu ✨"}
              </p>
            )}
          </div>
        )}

        {/* ── Profile Card ──────────────────────────────────── */}
        {user && !editingProfile && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-[#FF6A00] flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                {user.photo_url
                  ? <img src={user.photo_url} alt="Foto" className="w-full h-full object-cover" />
                  : user.full_name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#1A1A1A] text-lg">{user.full_name || t('settings_user_label')}</p>
                <p className="text-sm text-[#8FA4C8] mt-0.5">{user.email}</p>
                {user.job && <p className="text-xs text-[#8FA4C8] mt-0.5">💼 {user.job}{user.city ? ` · 📍 ${user.city}` : ""}</p>}
                {user.motivation && <p className="text-xs text-[#FF6A00] mt-1.5 italic">✨ {user.motivation}</p>}
                {user.role && <p className="text-xs font-semibold text-[#FF6A00] mt-1 uppercase">{user.role}</p>}
              </div>
              <button onClick={() => setEditingProfile(true)}
                className="w-9 h-9 rounded-full bg-[#F2F4F7] flex items-center justify-center hover:bg-[#E2E8F0] transition-colors flex-shrink-0">
                <Pencil className="w-4 h-4 text-[#8FA4C8]" />
              </button>
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
            <Link to={createPageUrl("Accounts")} className="text-xs font-semibold text-[#FF6A00] hover:opacity-80 transition-opacity">
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
                { key: "investment", label: "INVESTASI", icon: "📈" },
                { key: "cash", label: "CASH", icon: "💵" },
              ].map(group => {
                const groupAccounts = accounts.filter(a => a.type === group.key);
                return (
                  <div key={group.key}>
                    <p className="text-[9px] font-bold text-[#8FA4C8] uppercase tracking-widest mb-1.5">{group.label}</p>
                    <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
                      {groupAccounts.map(acc => (
                        <button key={acc.id}
                          onClick={() => { setEditAccount(acc); setShowAccountModal(true); }}
                          className="flex-shrink-0 bg-white border border-[#E2E8F0] rounded-xl px-2.5 py-2 text-left hover:border-[#F97316]/50 transition-all flex items-center gap-2 min-w-0"
                          style={{ maxWidth: 140 }}>
                          <AccountLogo logoUrl={acc.logo_url} icon={acc.icon || group.icon} bgColor={acc.color || "#FF6A00"} />
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-[#1A1A1A] truncate leading-tight">{acc.name}</p>
                            <p className="text-[10px] font-bold truncate" style={{ color: (acc.balance || 0) < 0 ? "#EF4444" : "#27AE60" }}>
                              {formatRupiah(acc.balance)}
                            </p>
                          </div>
                        </button>
                      ))}
                      <button
                        onClick={() => { setBottomSheetType(group.key); setShowAddBottomSheet(true); }}
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
              <Crown className="w-4 h-4 text-[#FF6A00]" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-[#1A1A1A]">Langganan</p>
              <p className="text-xs text-[#8FA4C8]">
                {user?.subscription_status === "active" ? "Premium aktif" : user?.subscription_status === "pending" ? "Menunggu konfirmasi" : "Paket Free"}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8FA4C8]" />
          </Link>

          <button onClick={() => setScreen("nana")}
            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#F8FAFC] transition-colors border-b border-[#F2F4F7]">
            <div className="w-8 h-8 rounded-xl bg-[#F3E5F5] flex items-center justify-center flex-shrink-0 text-lg">
              🤖
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-[#1A1A1A]">Preferensi Nana AI</p>
              <p className="text-xs text-[#8FA4C8]">Sesuaikan cara Nana berbicara</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8FA4C8]" />
          </button>

          <button onClick={() => setScreen("risk")}
            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#F8FAFC] transition-colors">
            <div className="w-8 h-8 rounded-xl bg-[#E8F5E9] flex items-center justify-center flex-shrink-0 text-lg">
              📊
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-[#1A1A1A]">Profil Risiko Investasi</p>
              <p className="text-xs text-[#8FA4C8]">Tentukan toleransi risiko kamu</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8FA4C8]" />
          </button>
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

      {showAccountModal && (
        <AccountModal
          account={editAccount}
          defaultType={!editAccount ? defaultAccountType : undefined}
          onClose={() => { setShowAccountModal(false); setEditAccount(null); }}
          onSave={(acc) => {
            if (editAccount?.id) {
              setAccounts(prev => prev.map(a => a.id === acc.id ? acc : a));
            } else {
              setAccounts(prev => [...prev, acc]);
            }
            setShowAccountModal(false);
            setEditAccount(null);
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