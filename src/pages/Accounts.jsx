import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Wallet, Plus, Pencil, Trash2, Star, CreditCard, Banknote, Smartphone, X, Check } from "lucide-react";

const ACCOUNT_TYPES = [
  { key: "bank", label: "Bank", icon: "🏦", color: "#1976D2" },
  { key: "cash", label: "Cash", icon: "💵", color: "#388E3C" },
  { key: "ewallet", label: "E-Wallet", icon: "📱", color: "#7B1FA2" },
  { key: "other", label: "Lainnya", icon: "💳", color: "#F57C00" },
];

const DEFAULT_ICONS = ["🏦", "💵", "📱", "💳", "🏧", "🐷", "💰", "🎯"];
const DEFAULT_COLORS = ["#FF6A00", "#1976D2", "#388E3C", "#7B1FA2", "#F57C00", "#E91E63", "#00BCD4", "#607D8B"];

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
    color: account?.color || "#FF6A00",
    institution: account?.institution || "",
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
          {/* Icon picker */}
          <div>
            <p className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2">Icon</p>
            <div className="flex gap-2 flex-wrap">
              {DEFAULT_ICONS.map(ic => (
                <button key={ic} onClick={() => setForm(f => ({ ...f, icon: ic }))}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${form.icon === ic ? "ring-2 ring-[#FF6A00] bg-[#FF6A00]/10" : "bg-[#F2F4F7]"}`}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
          {/* Name */}
          <div>
            <p className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5">Nama Rekening</p>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g., Rekening BCA, OVO, Dompet"
              className="w-full px-4 py-3 bg-[#F2F4F7] rounded-xl text-sm text-[#1A1A1A] outline-none focus:ring-2 focus:ring-[#FF6A00]/30"
            />
          </div>
          {/* Type */}
          <div>
            <p className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2">Jenis</p>
            <div className="grid grid-cols-2 gap-2">
              {ACCOUNT_TYPES.map(t => (
                <button key={t.key} onClick={() => setForm(f => ({ ...f, type: t.key, icon: f.icon || t.icon }))}
                  className={`py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                    form.type === t.key ? "bg-[#FF6A00] text-white" : "bg-[#F2F4F7] text-[#1A1A1A]"
                  }`}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>
          {/* Balance */}
          <div>
            <p className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5">Saldo Awal</p>
            <input
              type="number"
              value={form.balance}
              onChange={e => setForm(f => ({ ...f, balance: parseFloat(e.target.value) || 0 }))}
              className="w-full px-4 py-3 bg-[#F2F4F7] rounded-xl text-sm text-[#1A1A1A] outline-none focus:ring-2 focus:ring-[#FF6A00]/30"
            />
          </div>
          {/* Default toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#1A1A1A]">Rekening Utama</p>
              <p className="text-xs text-[#8FA4C8]">Digunakan sebagai default di transaksi baru</p>
            </div>
            <button onClick={() => setForm(f => ({ ...f, is_default: !f.is_default }))}
              className={`w-11 h-6 rounded-full transition-colors relative ${form.is_default ? "bg-[#FF6A00]" : "bg-[#E2E8F0]"}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.is_default ? "left-6" : "left-1"}`} />
            </button>
          </div>
        </div>
        <div className="px-5 pb-6 pt-2">
          <button onClick={handleSave} disabled={saving || !form.name.trim()}
            className="w-full py-3.5 bg-[#FF6A00] text-white rounded-2xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
            {account?.id ? "Simpan Perubahan" : "Buat Rekening"}
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

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      return base44.entities.Account.filter({ created_by: u.email });
    }).then(list => {
      setAccounts(list);
    }).finally(() => setLoading(false));
  }, []);

  async function handleDelete(id) {
    await base44.entities.Account.delete(id);
    setAccounts(prev => prev.filter(a => a.id !== id));
  }

  async function setDefault(acc) {
    await Promise.all(accounts.map(a => base44.entities.Account.update(a.id, { is_default: a.id === acc.id })));
    setAccounts(prev => prev.map(a => ({ ...a, is_default: a.id === acc.id })));
  }

  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);

  const typeLabel = { bank: "Bank", cash: "Cash", ewallet: "E-Wallet", other: "Lainnya" };

  return (
    <div className="min-h-screen bg-[#F2F4F7] pb-10">
      <div className="bg-[#0A0A0A] px-5 pt-10 pb-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-[#8FA4C8] text-sm font-medium">Multi-Rekening</p>
          <h1 className="text-white text-2xl font-bold mt-0.5">Rekening & Dompet</h1>
          <div className="mt-4 bg-white/10 rounded-2xl px-5 py-4">
            <p className="text-[#8FA4C8] text-xs">Total Saldo Semua Rekening</p>
            <p className="text-white text-3xl font-bold mt-0.5">{formatRupiah(totalBalance)}</p>
            <p className="text-[#8FA4C8] text-xs mt-1">{accounts.length} rekening aktif</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 mt-5 space-y-3">
        <button
          onClick={() => { setEditAccount(null); setShowModal(true); }}
          className="w-full bg-[#FF6A00] text-white py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Tambah Rekening Baru
        </button>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#F2F4F7] border-t-[#FF6A00] rounded-full animate-spin" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
            <Wallet className="w-12 h-12 text-[#E2E8F0] mx-auto mb-3" />
            <p className="text-[#1A1A1A] font-semibold">Belum ada rekening</p>
            <p className="text-[#8FA4C8] text-sm mt-1">Tambahkan rekening bank, e-wallet, atau cash kamu</p>
          </div>
        ) : (
          accounts.map(acc => (
            <div key={acc.id} className={`bg-white rounded-2xl shadow-sm p-4 border ${acc.is_default ? "border-[#FF6A00]/30" : "border-transparent"}`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: (acc.color || "#FF6A00") + "20" }}>
                  {acc.icon || "🏦"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-[#1A1A1A] text-sm">{acc.name}</p>
                    {acc.is_default && <span className="text-[10px] bg-[#FF6A00]/10 text-[#FF6A00] font-bold px-2 py-0.5 rounded-full">Utama</span>}
                  </div>
                  <p className="text-xs text-[#8FA4C8] mt-0.5">{typeLabel[acc.type] || acc.type}</p>
                  <p className="text-base font-bold mt-1" style={{ color: acc.color || "#1A1A1A" }}>{formatRupiah(acc.balance)}</p>
                </div>
                <div className="flex items-center gap-1">
                  {!acc.is_default && (
                    <button onClick={() => setDefault(acc)} className="p-2 rounded-xl hover:bg-amber-50 text-[#8FA4C8] hover:text-amber-500 transition-colors" title="Jadikan Utama">
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => { setEditAccount(acc); setShowModal(true); }} className="p-2 rounded-xl hover:bg-[#F2F4F7] text-[#8FA4C8] transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(acc.id)} className="p-2 rounded-xl hover:bg-red-50 text-[#8FA4C8] hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Info Card */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-[#FF6A00]/20">
          <p className="text-xs font-bold text-[#FF6A00] uppercase tracking-widest mb-2">💡 Tips</p>
          <p className="text-sm text-[#1A1A1A]">Pilih rekening saat mencatat transaksi untuk memantau saldo tiap rekening secara akurat.</p>
        </div>
      </div>

      {showModal && (
        <AccountModal
          account={editAccount}
          onClose={() => { setShowModal(false); setEditAccount(null); }}
          onSave={(acc) => {
            if (editAccount?.id) {
              setAccounts(prev => prev.map(a => a.id === acc.id ? acc : a));
            } else {
              setAccounts(prev => [...prev, acc]);
            }
            setShowModal(false);
            setEditAccount(null);
          }}
        />
      )}
    </div>
  );
}