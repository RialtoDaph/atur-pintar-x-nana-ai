import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Wallet, Plus, Pencil, Trash2, Star, X, Check, AlertTriangle, RefreshCw, Search, Users, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import AccountLogo from "@/components/ui/AccountLogo";
import AddAccountBottomSheet from "@/components/profile/AddAccountBottomSheet";
import EditAccountModal from "@/components/profile/EditAccountModal";
import { recalculateAccountBalance } from "@/components/utils/accountSync";


function formatRupiah(n) {
  if (n === undefined || n === null) return "Rp 0";
  return "Rp " + Number(n).toLocaleString("id-ID");
}

// Legacy AccountModal removed — now uses EditAccountModal from @/components/profile/EditAccountModal.

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editAccount, setEditAccount] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteInfo, setDeleteInfo] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showAddBottomSheet, setShowAddBottomSheet] = useState(false);
  const [bottomSheetType, setBottomSheetType] = useState("bank");

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      return base44.entities.Account.filter({ created_by: u.email });
    }).then(list => {
      setAccounts(list);
    }).finally(() => setLoading(false));
  }, []);

  async function confirmDelete(acc) {
    if (acc.is_default && accounts.length > 1) {
      toast.error("Tidak bisa menghapus rekening utama saat masih ada rekening lain.");
      return;
    }
    const txs = await base44.entities.Transaction.filter({ account_id: acc.id });
    setDeleteTarget(acc);
    setDeleteInfo({ count: txs.length });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const txs = await base44.entities.Transaction.filter({ account_id: deleteTarget.id });
      // Batch updates to avoid rate-limit (5 at a time)
      const CHUNK = 5;
      for (let i = 0; i < txs.length; i += CHUNK) {
        await Promise.all(txs.slice(i, i + CHUNK).map(tx => base44.entities.Transaction.update(tx.id, { account_id: null })));
      }
      await base44.entities.Account.delete(deleteTarget.id);
      setAccounts(prev => prev.filter(a => a.id !== deleteTarget.id));
      toast.success(`Rekening "${deleteTarget.name}" berhasil dihapus.`);
    } catch (error) {
      toast.error("Gagal menghapus rekening.");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
      setDeleteInfo(null);
    }
  }

  async function syncBalance(acc) {
    setSyncing(acc.id);
    try {
      // Use shared utility — respects initial_balance and excludes recurring templates.
      const newBalance = await recalculateAccountBalance(acc.id);
      setAccounts(prev => prev.map(a => a.id === acc.id ? { ...a, balance: newBalance } : a));
      toast.success(`Saldo ${acc.name} disinkronkan: ${formatRupiah(newBalance)}`);
    } catch {
      toast.error('Gagal menyinkronkan saldo.');
    } finally {
      setSyncing(null);
    }
  }

  async function setDefault(acc) {
    try {
      // Only update accounts whose is_default state actually changes
      const toUpdate = accounts.filter(a => (a.id === acc.id) !== !!a.is_default);
      for (const a of toUpdate) {
        await base44.entities.Account.update(a.id, { is_default: a.id === acc.id });
      }
      setAccounts(prev => prev.map(a => ({ ...a, is_default: a.id === acc.id })));
      toast.success(`"${acc.name}" diset sebagai rekening utama`);
    } catch {
      toast.error("Gagal mengubah rekening utama.");
    }
  }

  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);

  const typeLabel = { bank: "Bank", cash: "Cash", ewallet: "E-Wallet", other: "Lainnya" };

  return (
    <div className="min-h-screen bg-[#F2F4F7] pb-10">
      <div className="bg-gradient-to-b from-[#0A0A0A] to-[#0d0d0d] px-5 pt-10 pb-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-[#8FA4C8] text-sm font-medium">Multi-Rekening</p>
          <h1 className="text-white text-2xl font-bold mt-0.5">Rekening & Dompet</h1>
          <div className="mt-4 bg-white/10 rounded-2xl px-5 py-4 border border-white/5" data-tour="accounts-page-header">
            <p className="text-[#8FA4C8] text-xs">Total Saldo Semua Rekening</p>
            <p className="text-white text-3xl font-bold mt-0.5">{formatRupiah(totalBalance)}</p>
            <p className="text-[#8FA4C8] text-xs mt-1">{accounts.length} rekening aktif</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 mt-5 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#F2F4F7] border-t-[#F97316] rounded-full animate-spin" />
          </div>
        ) : accounts.length === 0 ? (
          <>
            <button
              onClick={() => { setBottomSheetType("bank"); setShowAddBottomSheet(true); }}
              className="w-full bg-[#F97316] text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all duration-150"
              style={{boxShadow: '0 4px 16px rgba(249,115,22,0.4)'}}
            >
              <Plus className="w-4 h-4" /> Tambah Rekening Baru
            </button>
            <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
              <Wallet className="w-12 h-12 text-[#E2E8F0] mx-auto mb-3" />
              <p className="text-[#1A1A1A] font-semibold">Belum ada rekening</p>
              <p className="text-[#8FA4C8] text-sm mt-1">Tambahkan rekening bank, e-wallet, atau cash kamu</p>
            </div>
          </>
        ) : (
          <>
            {/* Group view with add buttons per type */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden p-4 space-y-4">
              {[
                { key: "bank", label: "BANK", icon: "🏦" },
                { key: "ewallet", label: "E-WALLET", icon: "📱" },
                { key: "investasi", label: "INVESTASI", icon: "📈" },
                { key: "cash", label: "CASH", icon: "💵" },
              ].map(group => {
                const groupAccounts = accounts.filter(a => a.type === group.key);
                return (
                  <div key={group.key}>
                    <p className="text-[9px] font-bold text-[#8FA4C8] uppercase tracking-widest mb-2">{group.label}</p>
                    <div className="space-y-2">
                      {groupAccounts.map(acc => (
                        <div key={acc.id} className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0] flex items-center gap-3 hover:border-[#F97316]/50 transition-all">
                          {acc.logo_url ? (
                              <AccountLogo 
                                logoUrl={acc.logo_url} 
                                size="w-10 h-10"
                                fallback={
                                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (acc.color || "#F97316") + "20" }}>
                                    <span className="text-sm">{acc.icon || "🏦"}</span>
                                  </div>
                                }
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (acc.color || "#F97316") + "20" }}>
                                <span className="text-sm">{acc.icon || "🏦"}</span>
                              </div>
                            )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-semibold text-[#1A1A1A]">{acc.name}</p>
                              {acc.is_default && <span className="text-[9px] bg-[#F97316]/10 text-[#F97316] font-bold px-1.5 py-0.5 rounded-full">Utama</span>}
                            </div>
                            <p className="text-[11px] font-bold mt-1" style={{ color: (acc.balance || 0) < 0 ? "#EF4444" : "#27AE60" }}>
                              {formatRupiah(acc.balance)}
                            </p>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <button onClick={() => syncBalance(acc)} disabled={syncing === acc.id} className="p-1.5 rounded-lg hover:bg-white text-[#8FA4C8] hover:text-blue-500 transition-colors" title="Sinkronkan">
                              <RefreshCw className={`w-3.5 h-3.5 ${syncing === acc.id ? 'animate-spin' : ''}`} />
                            </button>
                            <button onClick={() => { setEditAccount(acc); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-white text-[#8FA4C8] transition-colors">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => confirmDelete(acc)} className="p-1.5 rounded-lg hover:bg-white text-[#8FA4C8] hover:text-red-500 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {groupAccounts.length > 0 && (
                        <button
                          onClick={() => { setBottomSheetType(group.key); setShowAddBottomSheet(true); }}
                          className="w-full border border-dashed border-[#E2E8F0] rounded-xl px-3 py-2.5 flex items-center justify-center gap-1.5 hover:border-[#F97316] hover:bg-[#FFF7ED] transition-all">
                          <Plus className="w-3.5 h-3.5 text-[#8FA4C8]" />
                          <p className="text-[11px] font-medium text-[#8FA4C8]">Tambah {group.label}</p>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Info Card */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-[#F97316]/20">
         <p className="text-xs font-bold text-[#F97316] uppercase tracking-widest mb-2">💡 Tips</p>
          <p className="text-sm text-[#1A1A1A]">Pilih rekening saat mencatat transaksi untuk memantau saldo tiap rekening secara akurat.</p>
        </div>
      </div>

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

      {showModal && editAccount && (
        <EditAccountModal
          account={editAccount}
          onClose={() => { setShowModal(false); setEditAccount(null); }}
          onSave={(acc) => {
            setAccounts(prev => prev.map(a => a.id === acc.id ? acc : a));
            setShowModal(false);
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
              Menghapus rekening <span className="font-semibold">"{deleteTarget.name}"</span> akan mempengaruhi{" "}
              <span className="font-semibold text-red-500">{deleteInfo?.count || 0} transaksi</span> terkait.
              Transaksi tersebut tidak akan terhapus, tapi tidak lagi terhubung ke rekening manapun.
            </p>
            <div className="flex gap-2">
              <button onClick={() => { setDeleteTarget(null); setDeleteInfo(null); }}
                className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#4A5568] hover:bg-[#F2F4F7] transition-colors">
                Batal
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
                {deleting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}