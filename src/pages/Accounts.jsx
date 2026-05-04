import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Wallet, Plus, Pencil, Trash2, Star, X, Check, AlertTriangle, RefreshCw, Search, Users, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import AccountLogo from "@/components/ui/AccountLogo";
import AddAccountBottomSheet from "@/components/profile/AddAccountBottomSheet";


function formatRupiah(n) {
  if (n === undefined || n === null) return "Rp 0";
  return "Rp " + Number(n).toLocaleString("id-ID");
}

function AccountModal({ account, onClose, onSave }) {
  const [form, setForm] = useState({
    name: account?.name || "",
    type: account?.type || "bank",
    balance: account?.balance || 0,
    icon: account?.icon || "🏦",
    color: account?.color || "#F97316",
    logo_url: account?.logo_url || "",
    institution: account?.institution || "",
    is_default: account?.is_default || false,
  });
  const [saving, setSaving] = useState(false);
  const [defaultAccounts, setDefaultAccounts] = useState([]);
  const [search, setSearch] = useState("");
  const [showTemplates, setShowTemplates] = useState(!account?.id);

  useEffect(() => {
    if (!account?.id) {
      base44.entities.DefaultAccount.filter({ is_active: true }, "sort_order").then(list => {
        setDefaultAccounts(list || []);
      }).catch(() => {});
    }
  }, [account?.id]);

  function applyTemplate(da) {
    setForm(f => ({
      ...f,
      name: da.name,
      type: da.type || "bank",
      icon: da.icon || "🏦",
      color: da.color || "#F97316",
      logo_url: da.logo_url || "",
      institution: da.institution || da.name,
    }));
    setShowTemplates(false);
  }

  const filteredDefaults = defaultAccounts.filter(da =>
    da.name.toLowerCase().includes(search.toLowerCase()) ||
    (da.institution || "").toLowerCase().includes(search.toLowerCase())
  );

  async function handleSave() {
    if (!form.name.trim()) { toast.error("Pilih rekening terlebih dahulu"); return; }
    setSaving(true);
    const balance = form.balance || 0;
    if (account?.id) {
      const updated = await base44.entities.Account.update(account.id, form);
      // Jika saldo berubah, catat sebagai penyesuaian saldo
      const oldBalance = account.balance || 0;
      const diff = balance - oldBalance;
      if (diff !== 0) {
        await base44.entities.Transaction.create({
          account_id: account.id,
          amount: Math.abs(diff),
          type: diff > 0 ? "income" : "expense",
          category: "other",
          note: `Penyesuaian saldo ${form.name}`,
          date: new Date().toISOString().split("T")[0],
        });
      }
      onSave(updated);
    } else {
      const created = await base44.entities.Account.create(form);
      // Catat saldo awal sebagai transaksi income jika > 0
      if (balance > 0) {
        await base44.entities.Transaction.create({
          account_id: created.id,
          amount: balance,
          type: "income",
          category: "other",
          note: `Saldo awal ${form.name}`,
          date: new Date().toISOString().split("T")[0],
        });
      }
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

          {/* NEW ACCOUNT: template picker first */}
          {!account?.id && (
            <>
              {/* Selected preview or prompt */}
              {form.name ? (
                <div className="flex items-center gap-3 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl">
                  {form.logo_url ? (
                    <AccountLogo logoUrl={form.logo_url} size="w-10 h-10" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (form.color || "#F97316") + "20" }}>
                      <span className="text-sm">{form.icon || "🏦"}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#1A1A1A]">{form.name}</p>
                    <p className="text-[10px] text-[#8FA4C8]">{form.type === "bank" ? "Bank" : form.type === "ewallet" ? "E-Wallet" : form.type === "cash" ? "Cash" : "Lainnya"}</p>
                  </div>
                  <button onClick={() => { setForm(f => ({ ...f, name: "", logo_url: "", color: "#F97316", type: "bank" })); setShowTemplates(true); }}
                    className="text-xs text-[#F97316] font-semibold">Ganti</button>
                </div>
              ) : (
                <p className="text-xs text-[#8FA4C8] text-center py-1">Pilih institusi di bawah</p>
              )}

              {/* Template list */}
              {showTemplates && (
                <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-[#F2F4F7]">
                    <Search className="w-3.5 h-3.5 text-[#8FA4C8]" />
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Cari bank, e-wallet..."
                      className="flex-1 text-xs text-[#1A1A1A] outline-none bg-transparent"
                    />
                  </div>
                  <div className="max-h-52 overflow-y-auto divide-y divide-[#F2F4F7]">
                    {filteredDefaults.map(da => (
                      <button key={da.id} onClick={() => applyTemplate(da)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#F8FAFC] active:bg-[#F2F4F7] transition-colors text-left">
                        {da.logo_url ? (
                            <AccountLogo 
                              logoUrl={da.logo_url} 
                              size="w-8 h-8"
                              fallback={
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (da.color || "#F97316") + "20" }}>
                                  <span className="text-sm">{da.icon || "🏦"}</span>
                                </div>
                              }
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (da.color || "#F97316") + "20" }}>
                              <span className="text-sm">{da.icon || "🏦"}</span>
                            </div>
                          )}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#1A1A1A] truncate">{da.name}</p>
                          <p className="text-[10px] text-[#8FA4C8]">{da.type === "bank" ? "Bank" : da.type === "ewallet" ? "E-Wallet" : da.type === "cash" ? "Cash" : "Lainnya"}</p>
                        </div>
                      </button>
                    ))}
                    {filteredDefaults.length === 0 && (
                      <p className="text-xs text-[#8FA4C8] text-center py-4">Tidak ada hasil</p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* EDIT: show account preview */}
          {account?.id && (
            <div className="flex items-center gap-3 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl">
              {account.logo_url ? (
                <AccountLogo 
                  logoUrl={account.logo_url} 
                  size="w-10 h-10"
                  fallback={
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (account.color || "#F97316") + "20" }}>
                      <span className="text-sm">{account.icon || "🏦"}</span>
                    </div>
                  }
                />
              ) : (
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (account.color || "#F97316") + "20" }}>
                  <span className="text-sm">{account.icon || "🏦"}</span>
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-[#1A1A1A]">{account.name}</p>
                <p className="text-[10px] text-[#8FA4C8]">{account.type === "bank" ? "Bank" : account.type === "ewallet" ? "E-Wallet" : account.type === "cash" ? "Cash" : "Lainnya"}</p>
              </div>
            </div>
          )}

          {/* Balance input — always shown */}
          <div>
            <p className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5">
              {account?.id ? "Ubah Saldo" : "Saldo Awal"}
            </p>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8FA4C8] font-medium text-sm">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={form._balanceDisplay ?? (form.balance ? Number(form.balance).toLocaleString("id-ID") : "")}
                onChange={e => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  setForm(f => ({ ...f, balance: parseFloat(raw) || 0, _balanceDisplay: raw === "" ? "" : Number(raw).toLocaleString("id-ID") }));
                }}
                placeholder="0"
                className="w-full pl-10 pr-4 py-3 bg-[#F2F4F7] rounded-xl text-sm text-[#1A1A1A] outline-none focus:ring-2 focus:ring-[#F97316]/30 font-bold"
              />
            </div>
            {account?.id && (
              <p className="text-[10px] text-[#8FA4C8] mt-2">Saldo saat ini: <span className="font-bold text-[#1A1A1A]">{formatRupiah(account.balance)}</span></p>
            )}
          </div>

          {/* Default toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#1A1A1A]">Rekening Utama</p>
              <p className="text-xs text-[#8FA4C8]">Digunakan sebagai default di transaksi baru</p>
            </div>
            <button onClick={() => setForm(f => ({ ...f, is_default: !f.is_default }))}
              className={`w-11 h-6 rounded-full transition-colors relative ${form.is_default ? "bg-[#F97316]" : "bg-[#E2E8F0]"}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.is_default ? "left-6" : "left-1"}`} />
            </button>
          </div>
        </div>
        <div className="px-5 pb-6 pt-2">
          <button onClick={handleSave} disabled={saving || (!account?.id && !form.name.trim()) || (!account?.id && form.balance === 0 && !form._balanceDisplay)}
            className="w-full py-3.5 bg-[#F97316] text-white rounded-2xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
            {account?.id ? "Simpan Perubahan" : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}

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
      await Promise.all(txs.map(tx => base44.entities.Transaction.update(tx.id, { account_id: null })));
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
      const txs = await base44.entities.Transaction.filter({ account_id: acc.id });
      const income = txs.filter(tx => !tx.is_deleted && tx.type === 'income').reduce((s, tx) => s + (tx.amount || 0), 0);
      const expense = txs.filter(tx => !tx.is_deleted && tx.type === 'expense').reduce((s, tx) => s + (tx.amount || 0), 0);
      const savings = txs.filter(tx => !tx.is_deleted && tx.type === 'savings').reduce((s, tx) => s + (tx.amount || 0), 0);
      const newBalance = income - expense - savings;
      await base44.entities.Account.update(acc.id, { balance: newBalance });
      setAccounts(prev => prev.map(a => a.id === acc.id ? { ...a, balance: newBalance } : a));
      toast.success(`Saldo ${acc.name} disinkronkan: ${formatRupiah(newBalance)}`);
    } catch {
      toast.error('Gagal menyinkronkan saldo.');
    } finally {
      setSyncing(null);
    }
  }

  async function setDefault(acc) {
    await Promise.all(accounts.map(a => base44.entities.Account.update(a.id, { is_default: a.id === acc.id })));
    setAccounts(prev => prev.map(a => ({ ...a, is_default: a.id === acc.id })));
  }

  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);

  const typeLabel = { bank: "Bank", cash: "Cash", ewallet: "E-Wallet", other: "Lainnya" };

  return (
    <div className="min-h-screen bg-[#F2F4F7] pb-10">
      <div className="bg-gradient-to-b from-[#0A0A0A] to-[#0d0d0d] px-5 pt-10 pb-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-[#8FA4C8] text-sm font-medium">Multi-Rekening</p>
          <h1 className="text-white text-2xl font-bold mt-0.5">Rekening & Dompet</h1>
          <div className="mt-4 bg-white/10 rounded-2xl px-5 py-4 border border-white/5">
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
                                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (acc.color || "#FF6A00") + "20" }}>
                                    <span className="text-sm">{acc.icon || "🏦"}</span>
                                  </div>
                                }
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (acc.color || "#FF6A00") + "20" }}>
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
        <AccountModal
          account={editAccount}
          onClose={() => { setShowModal(false); setEditAccount(null); }}
          onSave={(acc) => {
            setAccounts(prev => prev.map(a => a.id === acc.id ? acc : a));
            setShowModal(false);
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